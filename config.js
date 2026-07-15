import path from "path";
import { fileURLToPath } from "url";
import { configDotenv } from "dotenv";

configDotenv({
  path: ".env",
  override: true
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {

  api: {
    clist: {
      username: process.env.CLIST_USERNAME,
      apiKey: process.env.CLIST_API_KEY,
      baseUrl: process.env.CLIST_API_URL
    }
  },

  paths: {
    root: __dirname,

    // WhatsApp auth session folder
    authInfo: path.join(__dirname, "auth_info_baileys"),

    // QR code for login
    qrCodeFile: path.join(__dirname, "qr_code.png"),

    // reminder storage
    reminderFile: path.join(__dirname, "reminderFile.txt")
  },

  time: {
    // IST offset
    utcOffset: 5.5 * 60 * 60 * 1000,

    // reminder before contest (30 min)
    reminderOffset: 30 * 60 * 1000
  },

  platforms: {
    hosts: [
      "codechef.com",
      "codeforces.com",
      "leetcode.com",
      "atcoder.jp"
    ],

    icons: {
      "codeforces.com": "🏆",
      "leetcode.com": "💡",
      "codechef.com": "👨‍🍳",
      "atcoder.jp": "👨🏽‍💻",
      "topcoder.com": "🥇",
      "default": "👨🏽‍💻"
    }
  },

  notification: {
    helpNumber: process.env.HELP_NUMBER
  }
};
