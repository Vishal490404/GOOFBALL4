import fs from 'fs/promises';
import { IDS } from "./ids.js";
import config from "./config.js";
import { connectionLogic } from "./app.js";
import { messageAdmin, sleep } from './utility.js';
import { groupCache } from './app.js';
import { getWhatsAppSocket } from './scheduler.js';

export async function getReminders() {

    const sock = getWhatsAppSocket();

    if (!sock) {
        console.log("No active WhatsApp connection found. Creating temporary connection...");
        return connectionLogic(getRemindersWithSocket);
    }

    return getRemindersWithSocket(sock);
}

async function getRemindersWithSocket(sock) {

    const ids = IDS;

    try {

        let remindersData;

        try {
            remindersData = await fs.readFile(config.paths.reminderFile, 'utf-8');
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log("Reminder file not found. Maybe no contests today!");
                return;
            }
            console.error("Error reading reminder file:", error);
            return messageAdmin(sock, `Error reading reminder file: ${error.message}`);
        }

        if (!remindersData.trim()) {
            console.log("No reminders found in file.");
            return;
        }

        let reminders;

        try {
            reminders = JSON.parse(remindersData);
        } catch (err) {
            console.error("Invalid JSON in reminder file:", err);
            return messageAdmin(sock, "Reminder file format invalid");
        }

        const currentTime = new Date();

        console.log("Current Server Time:", currentTime.toISOString());

        // ✅ MAIN LOGIC: ONLY 10 MIN BEFORE
        const remindersToSend = reminders.filter(reminder => {

            // ✅ Ensure IST is handled properly
            const reminderTime = new Date(reminder.time);

            if (isNaN(reminderTime)) {
                console.log("Invalid reminder time:", reminder.time);
                return false;
            }

            const diff = reminderTime - currentTime;

            console.log(
                "Reminder check →",
                reminder.message.split("\n")[0],
                "| Contest Time:",
                reminderTime.toISOString(),
                "| Diff (ms):",
                diff
            );

            // ✅ Send only if between 9–10 minutes before
            return diff > 9 * 60 * 1000 && diff <= 10 * 60 * 1000;
        });

        if (remindersToSend.length === 0) {
            console.log("No reminders due in the 10-minute window.");
            return;
        }

        let message = `🛑 *REMINDER* 🛑\n\n`;

        remindersToSend.forEach(reminder => {
            message += reminder.message;
        });

        // Cache group metadata
        for (const id of ids) {
            if (id.endsWith('@g.us')) {
                const metadata = await sock.groupMetadata(id);
                groupCache.set(id, metadata);
            }
        }

        let successCount = 0;

        for (const id of ids) {
            try {

                const isGroup = id.endsWith('@g.us');
                const groupInfo = isGroup ? groupCache.get(id) : null;

                await sock.sendMessage(id, { text: message });

                await sleep(10000);

                if (isGroup && groupInfo) {
                    console.log(`Message sent to group: ${groupInfo.subject}`);
                } else {
                    console.log(`Message sent to: ${id}`);
                }

                successCount++;

            } catch (error) {
                console.error(`Failed to send message to: ${id}`, error);
            }
        }

        if (successCount > 0) {
            console.log(`Reminder sent successfully to ${successCount} recipients.`);
        } else {
            await messageAdmin(sock, "Failed to send reminders to any recipients");
        }

        // ✅ Remove sent reminders (so it runs only once)
        const remainingReminders = reminders.filter(r => {
            return !remindersToSend.some(sent => sent.time === r.time);
        });

        await fs.writeFile(
            config.paths.reminderFile,
            JSON.stringify(remainingReminders, null, 2),
            'utf-8'
        );

    } catch (error) {
        console.error("Error processing reminders:", error);
        return messageAdmin(sock, `Error in sendReminder.js: ${error.message}`);
    }
}

export { getRemindersWithSocket };
