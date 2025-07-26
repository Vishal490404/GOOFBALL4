import fs from 'fs/promises';
import { exec } from 'child_process';
import config from './config.js';
import path from 'path';

const USE_WINDOWS_SCHEDULER = false;

export async function setReminder(messageString, startTime) {
    try {
        const timeMatch = new Date(startTime);
        
        timeMatch.setTime(timeMatch.getTime() + 2 * config.time.utcOffset - config.time.reminderOffset + 5 * 60 * 1000);
        // console.log(timeMatch.toLocaleTimeString());
        
        const reminderObject = {
            time: timeMatch,
            message: messageString,
        };

        const reminderEntry = JSON.stringify(reminderObject, null, 2) + ',\n';
        await fs.appendFile(config.paths.reminderFile, reminderEntry);

        if (USE_WINDOWS_SCHEDULER) {
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
        } else {
            console.log(`Reminder saved for ${new Date(timeMatch)} (using node-schedule)`);
        }
    } catch (err) {
        console.error("Error saving reminder:", err.message);
        throw err;
    }
}
