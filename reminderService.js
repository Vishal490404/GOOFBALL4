import fs from 'fs/promises';
import { exec } from 'child_process';

const utcOffset = 5.5 * 60 * 60 * 1000;
export async function setReminder(messageString, startTime) {
    try {
        const timeMatch = new Date(startTime);
        timeMatch.setTime(timeMatch.getTime() +  utcOffset - 1800000);

        const reminderObject = {
            time: timeMatch,
            message: messageString,
        };

        const reminderEntry = JSON.stringify(reminderObject, null, 2) + ',\n';
        await fs.appendFile('reminderFile.txt', reminderEntry);

        const schedule = "once";
        const taskCommand = "C:/Users/desai/OneDrive/Desktop/GOOFBALL4/runReminder.bat";
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
            // console.log(`Task created successfully: ${stdout}`);
        });
    } catch (err) {
        console.error("Error saving reminder:", err.message);
        throw err;
    }
}





