import { scheduleJob, scheduledJobs, cancelJob } from 'node-schedule';
import { connectionLogic } from './app.js';
import { moveFurther } from './app.js';

let whatsAppSocket = null;

export async function initializeWhatsAppConnection() {
    console.log("Initializing persistent WhatsApp connection...");
    
    const onConnectionEstablished = async (sock) => {
        whatsAppSocket = sock;
        console.log("WhatsApp connection established and ready for use");
        return sock;
    };
    
    await connectionLogic(onConnectionEstablished);
}

export function getWhatsAppSocket() {
    if (!whatsAppSocket) {
        console.log("Warning: WhatsApp socket is null, connection may have been lost");
    }
    return whatsAppSocket;
}

export function startConnectionHealthCheck() {
    setInterval(async () => {
        console.log("Performing WhatsApp connection health check...");
        
        if (!whatsAppSocket) {
            console.log("WhatsApp socket is null, attempting to reconnect...");
            await initializeWhatsAppConnection();
        } else {
            console.log("WhatsApp connection is active");
        }
    }, 5 * 60 * 1000);
}

export function scheduleContestNotifications() {
    const dailyJob = scheduleJob('contest-notifications', '0 0 5 * * *', async () => {
        console.log(`Running scheduled contest notifications at ${new Date().toLocaleString()}`);
        
        try {
            if (whatsAppSocket) {
                await moveFurther(whatsAppSocket);
            } else {
                console.log("WhatsApp connection not found, reinitializing...");
                await initializeWhatsAppConnection();
            }
        } catch (error) {
            console.error("Error in scheduled contest notifications:", error);
        }
    });
    
    console.log("Contest notifications scheduled to run at 5 AM daily");
    return dailyJob;
}

export function scheduleContestReminders() {
    const reminderJob = scheduleJob('contest-reminders', '*/30 * * * *', async () => {
        console.log(`Checking for upcoming contest reminders at ${new Date().toLocaleString()}`);
        
        try {
            const { getReminders } = await import('./sendReminder.js');
            
            if (whatsAppSocket) {
                await getReminders();
            } else {
                console.log("WhatsApp connection not found for reminders, reinitializing...");
                await initializeWhatsAppConnection();
                setTimeout(async () => {
                    if (whatsAppSocket) {
                        const { getReminders } = await import('./sendReminder.js');
                        await getReminders();
                    }
                }, 5000);
            }
        } catch (error) {
            console.error("Error in scheduled contest reminders:", error);
        }
    });
    
    console.log("Contest reminders scheduled to run every 5 minutes");
    return reminderJob;
}

export function initializeScheduler() {
    initializeWhatsAppConnection().then(() => {
        scheduleContestNotifications();
        scheduleContestReminders();
        startConnectionHealthCheck();
        
        console.log("Scheduling system initialized successfully");
    }).catch(error => {
        console.error("Failed to initialize scheduler:", error);
    });
}