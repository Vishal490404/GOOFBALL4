import fs from 'fs/promises';
import { exec } from 'child_process';
import config from './config.js';
import path from 'path';

/**
 * Sets a reminder for a contest by saving it to a file and scheduling a task
 * @param {string} messageString - The message for the reminder
 * @param {string} startTime - ISO string of the contest start time
 * @returns {Promise<void>}
 */
export async function setReminder(messageString, startTime) {
    try {
        const timeMatch = new Date(startTime);
        timeMatch.setTime(timeMatch.getTime() + config.time.utcOffset - config.time.reminderOffset);

        const reminderObject = {
            time: timeMatch,
            message: messageString,
        };

        const reminderEntry = JSON.stringify(reminderObject, null, 2) + ',\n';
        await fs.appendFile(config.paths.reminderFile, reminderEntry);

        const schedule = "once";
        const taskCommand = path.join(config.paths.root, "runReminder.bat");
        const taskName = `Reminder_${timeMatch.getTime()}`;

        const cronTime = timeMatch.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12 : false
        })

        // console.log(cronTime, timeMatch);
        
        const schtasksCommand = `schtasks /create /tn "${taskName}" /tr "${taskCommand}" /sc ${schedule} /st ${cronTime} /f`;

        exec(schtasksCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error creating task: ${error}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log(`Task created successfully for ${new Date(timeMatch).toLocaleString()}`);
        });
    } catch (err) {
        console.error("Error saving reminder:", err.message);
        throw err;
    }
}





