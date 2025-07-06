import fs from 'fs/promises';
import config from './config.js';

/**
 * Sends a message to the admin/help number when there's an error
 * @param {Object} sock - WhatsApp socket connection
 * @param {string} errString - Error message to send
 * @returns {Promise<Object>} Message sending result
 */
async function messageAdmin(sock, errString) {
    try {
        // console.log("Hello");
        // console.log(config.notification.helpNumber);
        
        return await sock.sendMessage(config.notification.helpNumber, { text: errString });
    } catch (err) {
        console.error("Failed to send error message:", err);
        process.exit(25);
    }
}


/**
 * Checks if the reminder file exists and deletes it if it does
 * @returns {Promise<boolean>} Returns true if successful or if file doesn't exist
 */
async function checkFileAndDelete() {
    try {
        await fs.stat(config.paths.reminderFile);
        await fs.unlink(config.paths.reminderFile);
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') {
            return true;
        }   
        console.log("Something went wrong:", err);
        return false;
    }
}

export { messageAdmin, checkFileAndDelete }