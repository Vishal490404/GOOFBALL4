import {
  DisconnectReason,
  useMultiFileAuthState,
  makeWASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys";

import { fetchData } from "./getContestDetails.js";
import { IDS } from "./ids.js";
import pino from "pino";
import QRCode from "qrcode";
import config from "./config.js";
import { messageAdmin, sleep } from "./utility.js";
import NodeCache from "node-cache";
import https from "https";

const logger = pino({ level: "silent" });

export const groupCache = new NodeCache({
  stdTTL: 5 * 60,
  useClones: false
});

async function connectionLogic(functionToExecute) {

  try {

    const { state, saveCreds } = await useMultiFileAuthState(config.paths.authInfo);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
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
      syncFullHistory: false
    });

    sock.ev.on("connection.update", async (update) => {

      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        await QRCode.toFile(config.paths.qrCodeFile, qr);
        console.log("QR Code saved to:", config.paths.qrCodeFile);
      }

      if (connection === "close") {

        const reason = lastDisconnect?.error?.output?.statusCode;

        console.log("Connection closed. Reason:", reason);

        if (reason === DisconnectReason.loggedOut) {

          console.log("Logged out. Please scan QR again.");
          await messageAdmin(sock, "Bot logged out. Please re-authenticate.");

        } else {

          console.log("Reconnecting in 5 seconds...");
          setTimeout(() => connectionLogic(functionToExecute), 5000);

        }

      }

      if (connection === "open") {

        console.log("Connected to WhatsApp successfully");

        if (typeof functionToExecute === "function") {
          await functionToExecute(sock);
        }

      }

    });

    sock.ev.on("messaging-history.set", ({ chats, contacts, messages }) => {

      console.log(
        `History synced: ${chats.length} chats | ${contacts.length} contacts | ${messages.length} messages`
      );

    });

    sock.ev.on("messages.upsert", async ({ type, messages }) => {

      if (!messages) return;

      for (const message of messages) {

        const jid = message.key?.remoteJid;

        if (!jid) continue;

        if (jid === "status@broadcast") {
          console.log(`Status update from ${message.pushName || "unknown"}`);
        }

        if (jid.endsWith("@g.us")) {
          console.log("Group message detected →", jid);
        }

      }

    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("lid-mapping.update", () => {
      console.log("LID mapping updated");
    });

  } catch (error) {

    console.error("Error in connection logic:", error);
    setTimeout(() => connectionLogic(functionToExecute), 5000);

  }

}

async function safeSend(sock, id, payload) {

  let attempts = 0;
  let sent = false;

  while (!sent && attempts < 3) {

    try {

      await sock.sendMessage(id, { text: payload });
      sent = true;

    } catch (err) {

      attempts++;
      console.log(`Retry ${attempts} for ${id}...`);
      await sleep(4000);

    }

  }

  return sent;

}

async function moveFurther(sock) {

  try {

    const payload = await fetchData(sock);

    const ids = [
      ...IDS.filter(id => id.endsWith("@g.us")),
      ...IDS.filter(id => !id.endsWith("@g.us"))
    ];

    for (const id of ids) {

      if (id.endsWith("@g.us")) {

        const metadata = await sock.groupMetadata(id);
        groupCache.set(id, metadata);

      }

    }

    if (payload && payload.length > 0) {

      let successCount = 0;

      for (const id of ids) {

        const isGroup = id.endsWith("@g.us");
        const groupInfo = isGroup ? groupCache.get(id) : null;

        const sent = await safeSend(sock, id, payload);

        if (sent) {

          if (isGroup && groupInfo) {
            console.log(`Message sent to group: ${groupInfo.subject}`);
          } else {
            console.log(`Message sent to: ${id}`);
          }

          successCount++;

        } else {

          console.error(`Failed to send message to: ${id}`);

        }

        await sleep(5000);

      }

      if (successCount > 0) {

        console.log(`Contest updates sent successfully to ${successCount} recipients.`);

      } else {

        await messageAdmin(sock, "Failed to send messages to any recipients.");

      }

    } else {

      console.log("No contests found today.");

    }

  } catch (error) {

    console.error("Error in moveFurther:", error);
    await messageAdmin(sock, `Error in app.js: ${error.message}`);

  }

}

export { connectionLogic, moveFurther };
