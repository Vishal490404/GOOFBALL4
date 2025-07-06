import fs from 'fs/promises';
import { IDS } from "./ids.js";
import config from "./config.js";
import { connectionLogic } from "./app.js";
import { messageAdmin } from './utility.js';

async function getReminders(sock) {
    const ids = IDS;
    try {

        const remindersData = await fs.readFile(config.paths.reminderFile, 'utf-8');
        
        if (!remindersData.trim()) {
            console.log("No reminders found in file.");
            process.exit(0);
        }
        
        const remindersJson = `[${remindersData.replace(/,\s*$/, '')}]`;
        const reminders = JSON.parse(remindersJson);
        
        const currentTime = new Date();
        currentTime.setTime(currentTime.getTime() + config.time.utcOffset);
        
        const timeWindow = 5 * 60 * 1000; 
        const twoMinsLater = new Date(currentTime.getTime() + timeWindow);
        const twoMinsBefore = new Date(currentTime.getTime() - timeWindow);
        
        const remindersToSend = reminders.filter(reminder => {
            const reminderTime = new Date(reminder.time);
            return reminderTime >= twoMinsBefore && reminderTime <= twoMinsLater;
        });
        console.log(remindersToSend);
        
        if (remindersToSend.length > 0) {
            let message = `🛑 *REMINDER* 🛑\n\n`;

            remindersToSend.forEach(element => {
                message += element.message;
            });

            // await Promise.all(ids.map(id => sock.sendMessage(id, { text: message })));
            for (const id of ids) {
                try {
                    await sock.sendMessage(id, { text: message });
                    console.log(`Reminder sent to: ${id}`);
                } catch (error) {
                    console.error(`Failed to send reminder to: ${id}`, error);
                }
            }
            console.log("Reminder Sent Successfully");
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
            
            process.exit(0);
        } else {
            console.log("No reminders due within the next 5 minutes.");
            process.exit(0);
        }
    } catch (error) {
        console.error("Error processing reminders:", error);
        return messageAdmin(sock, `Error in sendReminder.js: ${error.message}`);
    }
}

connectionLogic(getReminders(sock))
// getReminders()





