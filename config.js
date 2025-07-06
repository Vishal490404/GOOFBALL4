import path from 'path';
import { fileURLToPath } from 'url';
import { configDotenv } from 'dotenv';

configDotenv({
  path: '.env',
  override: true
});

// console.log(process.env);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// console.log(process.env.HELP_NUMBER);

// Config object
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
    reminderFile: path.join(__dirname, 'reminderFile.txt'),
    authInfo: path.join(__dirname, 'auth_info_baileys'),
    qrCodeFile: path.join(__dirname, 'qr_code.png')
  },
  
  time: {
    utcOffset: 5.5 * 60 * 60 * 1000,
    reminderOffset: 30 * 60 * 1000
  },
  
  platforms: {
    hosts: [
      "codechef.com",
      "codeforces.com",
      "leetcode.com",
      "atcoder.jp"
      // Uncomment to add more platforms
      // "geeksforgeeks.org",
      // "topcoder.com",
      // "adventofcode.com",
      // "facebook.com/hackercup"
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
// Remember to fix the time imports