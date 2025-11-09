import { DisconnectReason, useMultiFileAuthState, makeWASocket, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import { fetchData } from "./getContestDetails.js";
import { IDS } from "./ids.js";
import pino from 'pino';
import QRCode from 'qrcode';
import config from './config.js';
import { messageAdmin, sleep } from './utility.js';
import NodeCache from "node-cache";
import https from 'https';
import path from 'path';
// import { Memory_Store } from './memory-store.js';

const logger = pino({ level: 'error' });

export const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

// export const store = Memory_Store;

// const storeFilePath = path.join(config.paths.root, 'baileys_store.json');
// store.readFromFile(storeFilePath);

// setInterval(() => {
//     store.writeToFile(storeFilePath);
// }, 10_000);

async function connectionLogic(functionToExecute) {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(config.paths.authInfo);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version: version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            logger,
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            cachedGroupMetadata: async (jid) => groupCache.get(jid),
            options: {
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            },
            syncFullHistory: true
        });
        
        // store.bind(sock.ev);

        // sock.ev.on('chats.upsert', () => {
        //     console.log(`Got ${store.chats.all().length} chats`);
        // });

        // sock.ev.on('contacts.upsert', () => {
        //     console.log(`Got ${Object.values(store.contacts).length} contacts`);
        // });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;
            
            if (qr) {
                await QRCode.toFile(config.paths.qrCodeFile, qr);
                console.log(`QR Code saved to: ${config.paths.qrCodeFile}`);
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                console.log(`Connection closed due to ${lastDisconnect?.error}`);
                
                if (statusCode === DisconnectReason.loggedOut) {
                    console.log("Logged out. Please re-authenticate.");
                    return messageAdmin(sock, "Logged out. Please re-authenticate.");
                } else if (statusCode === DisconnectReason.connectionClosed || 
                           statusCode === DisconnectReason.connectionLost) {
                    console.log("Connection Closed or Lost, reconnecting...");
                    connectionLogic(functionToExecute);
                } else if (statusCode === DisconnectReason.connectionReplaced) {
                    console.log("Connection Replaced, please restart the application.");
                    await messageAdmin(sock, "Connection replaced. Please restart the application.");
                     
                } else if (statusCode === DisconnectReason.restartRequired) {
                    console.log("Restart required, restarting...");
                    connectionLogic(functionToExecute);
                } else if (statusCode === DisconnectReason.timedOut) {
                    console.log("Connection timed out, reconnecting...");
                    connectionLogic(functionToExecute);
                } else {
                    console.log("Reconnecting...");
                    connectionLogic(functionToExecute);
                }
            } else if (connection === 'open') {
                console.log("Connected!");
                if (typeof functionToExecute === 'function') {
                    return await functionToExecute(sock);
                } else {
                    console.log("No function to execute after connection. Socket is ready.");
                }
            }
            
            if (receivedPendingNotifications) {
                console.log("Waiting for new messages...");
            }
        });
        sock.ev.on('messaging-history.set', ({ chats, contacts, messages, isLatest }) => {
            console.log(`Received ${chats.length} chats, ${contacts.length} contacts, ${messages.length} messages (latest: ${isLatest})`);
            
            // console.log(`Total chats in store: ${store.chats.all().length}`);
            // console.log(`Total contacts in store: ${Object.values(store.contacts).length}`);
        });
        
        sock.ev.on('messages.upsert', async ({ type, messages }) => {
            if (!messages) return;
            
            console.log(`Received ${messages.length} new messages of type: ${type}`);
            
            for (let message of messages) {
                if (message.key && message.key.remoteJid === 'status@broadcast') {
                    if (message.message?.protocolMessage) return;
                    console.log(`Received status from ${message.pushName || 'unknown'}`);
                } else if (type === 'notify') {
                    const jid = message.key.remoteJid;
                    // const chatMessages = store.messages[jid];
                    
                //     if (chatMessages) {
                //         console.log(`This chat has ${chatMessages.length} stored messages`);
                //     }
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);
    } catch (error) {
        console.error("Error in connection logic:", error);
         
    }
}


async function moveFurther(sock) {
    try {
        const payload = await fetchData(sock);
        const ids = IDS;
        for(const id of ids){
            if(id.endsWith('@g.us')) {
                const metadata = await sock.groupMetadata(id)
                groupCache.set(id, metadata)
            } 
        }
        if (payload && payload.length > 0) {
            let successCount = 0;
            for (const id of ids) {
                try {
                    const isGroup = id.endsWith('@g.us');
                    const groupInfo = isGroup ? groupCache.get(id) : null;
                    await sock.sendMessage(id, { text: payload });
                    sleep(10000);
                    if (isGroup && groupInfo) {
                        console.log(`Message sent to group: ${groupInfo.subject} (${id})`);
                    } else {
                        console.log(`Message sent to: ${id}`);
                    }
                    successCount++;
                } catch (error) {
                    console.error(`Failed to send message to: ${id}`, error);
                }
            }

            if (successCount > 0) {
                console.log(`Contest updates sent successfully to ${successCount} recipients.`);
            } else {
                await messageAdmin(sock, "Failed to send messages to any recipients");
            }
             
        } else {
            console.log("No contests to notify about or empty payload received.");
            await messageAdmin(sock, "No contests found or empty payload received");
             
        }
    } catch (error) {
        await messageAdmin(sock, `Error in app.js: ${error.message}`);
         
    }
}



export { connectionLogic, moveFurther };
