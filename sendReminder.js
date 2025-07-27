import fs from 'fs/promises';
import { IDS } from "./ids.js";
import config from "./config.js";
import { connectionLogic } from "./app.js";
import { messageAdmin } from './utility.js';
import { groupCache } from './app.js';
import { getWhatsAppSocket } from './scheduler.js';

export async function getReminders() {
    const sock = getWhatsAppSocket();
    
    if (!sock) {
        console.log("No active WhatsApp connection found. Creating a temporary connection...");
        return connectionLogic(getRemindersWithSocket);
    }
    
    return getRemindersWithSocket(sock);
}

async function getRemindersWithSocket(sock) {
    const ids = IDS;
    try {
        const remindersData = await fs.readFile(config.paths.reminderFile, 'utf-8');

        if (!remindersData.trim()) {
            console.log("No reminders found in file.");
            return;
        }

        const remindersJson = `[${remindersData.replace(/,\s*$/, '')}]`;
        const reminders = JSON.parse(remindersJson);

        const currentTime = new Date();
        currentTime.setTime(currentTime.getTime() + config.time.utcOffset);

        const timeWindow = 30 * 60 * 1000; // 30 mins
        const twoMinsLater = new Date(currentTime.getTime() + timeWindow);
        // don't check for last 30 mins no need
        // const twoMinsBefore = new Date(currentTime.getTime() - timeWindow);
        console.log(twoMinsBefore, twoMinsLater);
        // for(let i = 0; i < reminders.length; i++){
        //     console.log(new Date(reminders[i].time));
            
        // }
        const remindersToSend = reminders.filter(reminder => {
            const reminderTime = new Date(reminder.time);
            console.log(reminderTime)
            
            return reminderTime <= twoMinsLater;
        });
        // console.log(remindersToSend);

        if (remindersToSend.length > 0) {
            let message = `🛑 *REMINDER* 🛑\n\n`;

            remindersToSend.forEach(element => {
                message += element.message;
            });
            for (const id of ids) {
                if (id.endsWith('@g.us')) {
                    const metadata = await sock.groupMetadata(id)
                    groupCache.set(id, metadata)
                }
            }
            // console.log(remindersToSend);
            
            // await Promise.all(ids.map(id => sock.sendMessage(id, { text: message })));
            let successCount = 0;
            for (const id of ids) {
                try {
                    const isGroup = id.endsWith('@g.us');
                    const groupInfo = isGroup ? groupCache.get(id) : null;
                    await sock.sendMessage(id, { text: message });
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
            const remainingReminders = reminders.filter(reminder =>
                !remindersToSend.includes(reminder)
            );

            if (remainingReminders.length > 0) {
                const updatedData = remainingReminders
                    .map(reminder => JSON.stringify(reminder, null, 2) + ',\n')
                    .join('');
                await fs.writeFile(config.paths.reminderFile, updatedData, 'utf-8');
            } else {
                await fs.writeFile(config.paths.reminderFile, '', 'utf-8');
            }

        } else {
            console.log("No reminders due within the next 5 minutes.");
        }
    } catch (error) {
        console.error("Error processing reminders:", error);
        return messageAdmin(sock, `Error in sendReminder.js: ${error.message}`);
    }
}


export { getRemindersWithSocket };





