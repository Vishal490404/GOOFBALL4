import fs from "fs/promises";
import config from "./config.js";

/*
Send error message to admin number
*/
async function messageAdmin(sock, errString) {
try {
if (!config.notification.helpNumber) {
console.log("Admin number not configured.");
return;
}


if (!sock) {
  console.log("Socket not available to send admin message.");
  return;
}

await sock.sendMessage(config.notification.helpNumber, {
  text: errString
});


} catch (err) {
console.error("Failed to send admin message:", err);
}
}

/*
Delete reminder file before creating new reminders
*/
async function checkFileAndDelete() {
try {
await fs.stat(config.paths.reminderFile);
await fs.unlink(config.paths.reminderFile);
return true;

} catch (err) {


if (err.code === "ENOENT") {
  // file does not exist → nothing to delete
  return true;
}

console.log("Error handling reminder file:", err);
return false;


}
}

/*
Sleep utility for delays
*/
function sleep(ms) {
return new Promise((resolve) => {
setTimeout(resolve, ms);
});
}

export { messageAdmin, checkFileAndDelete, sleep };

