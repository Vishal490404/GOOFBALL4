import fs from 'fs/promises';
import { exec } from 'child_process';
import config from './config.js';
import path from 'path';

const USE_WINDOWS_SCHEDULER = false;

export async function setReminder(messageString, startTime) {
    try {

        const contestTime = new Date(startTime);

        // reminder time = contest time - reminder offset
        const reminderTime = new Date(
            contestTime.getTime() - config.time.reminderOffset
        );

        const reminderObject = {
            time: reminderTime,
            message: messageString
        };

        let reminders = [];

        // Read existing reminders safely
        try {
            const fileData = await fs.readFile(config.paths.reminderFile, 'utf8');
            reminders = JSON.parse(fileData);
        } catch (err) {
            // If file does not exist or invalid JSON → start fresh
            reminders = [];
        }

        // Add new reminder
        reminders.push(reminderObject);

        // Save back as valid JSON
        await fs.writeFile(
            config.paths.reminderFile,
            JSON.stringify(reminders, null, 2)
        );

        if (USE_WINDOWS_SCHEDULER) {

            const schedule = "once";
            const taskCommand = path.join(config.paths.root, "runReminder.bat");
            const taskName = `Reminder_${reminderTime.getTime()}`;

            const cronTime = reminderTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            const schtasksCommand =
                `schtasks /create /tn "${taskName}" /tr "${taskCommand}" /sc ${schedule} /st ${cronTime} /f`;

            exec(schtasksCommand, (error, stdout, stderr) => {

                if (error) {
                    console.error(`Error creating task: ${error}`);
                    return;
                }

                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    return;
                }

                console.log(`Task created successfully for ${reminderTime.toLocaleString()}`);

            });

        } else {

            console.log(`Reminder saved for ${reminderTime.toLocaleString()} (using scheduler)`);

        }

    } catch (err) {

        console.error("Error saving reminder:", err.message);
        throw err;

    }
}


