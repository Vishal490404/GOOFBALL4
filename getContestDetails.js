import axios from "axios";
import { config } from "dotenv";
config();

const hostList = [
    "codechef.com",
    "codeforces.com",
    "geeksforgeeks.org",
    "leetcode.com",
    "topcoder.com",
    "atcoder.jp",
    "adventofcode.com",
    "facebook.com/hackercup"
];

const now = new Date();
const utcOffset = 5.5 * 60 * 60 * 1000;
let nowString = new Date(now)
nowString.setDate(nowString.getDate() + 2)
nowString.setHours(5.5,30,0,0)
nowString = nowString.toISOString()
// Indian GMT
// console.log(nowString);

const start = new Date();
// console.log(start)
start.setDate(start.getDate());

start.setHours(5.5, 30, 0, 0);
// console.log(now)
const startString = start.toISOString();
// console.log((startString));

// console.log(nowString);




export async function fetchData() {
    try {
        const url = `${process.env.API_URL}/contest/?username=${process.env.API_USERNAME}&api_key=${process.env.API_KEY}&start__gt=${startString}&order_by=start`;
        // console.log("Request URL:", url);

        const response = await axios.get(url);

        // console.log(response.data.meta.total_count);

        
        if (response.data.objects.length > 0) {
            const clean_data = response.data.objects
            // console.log(clean_data)
            const filtered_data = clean_data.filter((obj) => {
                const startDate = new Date(obj.start);
                const today = new Date(now);
                const dayaftertomorrow = new Date(now)
                today.setHours(5.5,30,0,0)
                dayaftertomorrow.setHours(5.5,30,0,0)

                dayaftertomorrow.setDate(today.getDate() + 2)
                startDate.setTime(startDate.getTime() + utcOffset)
                // if (hostList.includes(obj.host) && (startDate < dayaftertomorrow)){
                //     // console.log(obj)
                //     console.log(obj.start)
                //     console.log(startDate,today, dayaftertomorrow);
                // }
                
                return hostList.includes(obj.host) && (startDate < dayaftertomorrow)
            })
            // console.log(filtered_data);
            return createMessage(filtered_data)
            
        } else {
            console.log("Today no contests, Chill!");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}




function createMessage(filtered_data) {
    // filtered_data = []
    const todayDate = new Date();
    const tomorrowDate = new Date(todayDate)
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    
    const formattedDate = todayDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
    const dayOfWeek = todayDate.toLocaleDateString("en-IN", { weekday: "long" });
    
    const formattedDateTomo = tomorrowDate.toLocaleDateString("en-IN",{
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    })
    const dayOfWeekTomo = tomorrowDate.toLocaleDateString("en-IN", { weekday: "long" });

    const formatContest = (contest) => {
        const startTime = new Date(new Date(contest.start).getTime() + utcOffset).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
        let platformIcon = '🚀';
        if (contest.host.includes('codeforces')) platformIcon = '🏆';
        else if (contest.host.includes('leetcode')) platformIcon = '💡';
        else if (contest.host.includes('codechef')) platformIcon = '👨‍🍳';
        else if (contest.host.includes('topcoder')) platformIcon = '🥇';
        
        return ` ${platformIcon} *${contest.event}*\n ⏰ ${startTime}\n 🔗 [${contest.host}](${contest.href})\n\n`;
    };

    const TodayContests = filtered_data.filter((obj) => {
        const dateInObj = new Date(obj.start);
        return todayDate.getDate() === dateInObj.getDate() &&
               todayDate.getMonth() === dateInObj.getMonth() &&
               todayDate.getFullYear() === dateInObj.getFullYear();
    });

    const TomorrowContests = filtered_data.filter((obj) => {
        const dateInObj = new Date(obj.start);
        const tomorrow = new Date(todayDate);
        tomorrow.setDate(todayDate.getDate() + 1);
        return tomorrow.getDate() === dateInObj.getDate() &&
               tomorrow.getMonth() === dateInObj.getMonth() &&
               tomorrow.getFullYear() === dateInObj.getFullYear();
    });

    let messageToSend = `
*Hello Chefs!👨‍🍳*
Here are the daily contest updates:

*Today* (${dayOfWeek}, ${formattedDate}):
`;

    if (TodayContests.length > 0) {
        TodayContests.forEach(contest => {
            messageToSend += formatContest(contest);
        });
    } else {
        messageToSend += "No contests today. Rest up!🍹 And don't forget to practice \n\n";
    }
    messageToSend += '────────────────\n\n'
    messageToSend += `*Tomorrow* (${dayOfWeekTomo}, ${formattedDateTomo}):
`;

    if (TomorrowContests.length > 0) {
        TomorrowContests.forEach(contest => {
            messageToSend += formatContest(contest);
        });
    } else {
        messageToSend += "No contests tomorrow. Rest up!🍬 And don't forget to practice\n";
    }

    messageToSend += "────────────────\n";
    messageToSend += "*Happy Coding!*";

    return messageToSend;
}

// const ans = await fetchData();
// console.log(ans);

// createMessage()


// {
//     duration: 10800,
//     end: '2024-11-30T17:35:00',
//     event: 'Rayan Programming Contest 2024 - Selection (Codeforces Round 989, Div. 1 + Div. 2)',     
//     host: 'codeforces.com',
//     href: 'https://codeforces.com/contests/2034',
//     id: 54832948,
//     n_problems: null,
//     n_statistics: null,
//     parsed_at: null,
//     problems: null,
//     resource: 'codeforces.com',
//     resource_id: 1,
//     start: '2024-11-30T14:35:00'
//   }