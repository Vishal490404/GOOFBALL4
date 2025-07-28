import fs from 'fs/promises';
import config from './config.js';


async function messageAdmin(sock, errString) {
    try {
        // console.log("Hello");
        // console.log(config.notification.helpNumber);
        
        return await sock.sendMessage(config.notification.helpNumber, { text: errString });
    } catch (err) {
        console.error("Failed to send error message:", err);
         
    }
}


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


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { messageAdmin, checkFileAndDelete,sleep }