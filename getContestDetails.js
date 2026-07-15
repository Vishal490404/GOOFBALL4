import ical from "node-ical";
import { setReminder } from "./reminderService.js";
import { checkFileAndDelete, messageAdmin } from "./utility.js";
import config from "./config.js";

const CALENDAR_URL =
"https://calendar.google.com/calendar/ical/c_9b0d1c817227b09044b85582eb3c10e6a7f4be060a77d15c39bf1fa6f0603d85%40group.calendar.google.com/public/basic.ics";

function detectPlatform(name) {
    const n = name.toLowerCase();
    if (n.includes("codeforces")) return "codeforces.com";
    if (n.includes("leetcode")) return "leetcode.com";
    if (n.includes("codechef")) return "codechef.com";
    if (n.includes("atcoder")) return "atcoder.jp";
    return "unknown";
}

function extractLink(event) {

    if (event.url) return event.url;

    if (event.description) {
        const match = event.description.match(/https?:\/\/[^\s]+/);
        if (match) return match[0];
    }

    return "";
}

function formatDate(date) {

    return date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Kolkata"
    });

}

function formatContest(contest) {

    const startTime = new Date(contest.start).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata"
    });

    const durationHours = Math.floor(contest.duration / 3600);
    const durationMinutes = Math.floor((contest.duration % 3600) / 60);

    const durationStr =
        durationHours > 0
            ? durationHours + "h" + (durationMinutes > 0 ? " " + durationMinutes + "m" : "")
            : durationMinutes + "m";

    const platformIcon =
        config.platforms.icons[contest.host] || config.platforms.icons.default;

    return (
        platformIcon + " *" + contest.event + "*\n" +
        "⏰ *Time:* " + startTime.toLowerCase() + "\n" +
        "⏳ *Duration:* " + durationStr + "\n" +
        "🔗 " + contest.href + "\n\n"
    );
}

function createMessage(contests) {

    const todayDate = new Date();
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(todayDate.getDate() + 1);

    const todayContests = contests.filter((c) => {

        const d = new Date(c.start);

        return (
            d.getDate() === todayDate.getDate() &&
            d.getMonth() === todayDate.getMonth() &&
            d.getFullYear() === todayDate.getFullYear()
        );

    });

    const tomorrowContests = contests.filter((c) => {

        const d = new Date(c.start);

        return (
            d.getDate() === tomorrowDate.getDate() &&
            d.getMonth() === tomorrowDate.getMonth() &&
            d.getFullYear() === tomorrowDate.getFullYear()
        );

    });

    let message = `*✨ Hello Chefs! 👨‍🍳 ✨*\n\n`;

    message += `*Today* (${formatDate(todayDate)}):\n`;

    if (todayContests.length > 0) {

        todayContests.forEach((contest) => {

            const contestMessage = formatContest(contest);

            setReminder(contestMessage, contest.start)
              .catch(err => console.error("Reminder error:", err.message));

            message += contestMessage;

        });

    } else {

        message += "No contests today. Rest up!🍹 And don't forget to practice\n\n";

    }

    message += "────────────────\n\n";

    message += `*Tomorrow* (${formatDate(tomorrowDate)}):\n`;

    if (tomorrowContests.length > 0) {

        tomorrowContests.forEach((contest) => {

            message += formatContest(contest);

        });

    } else {

        message += "No contests tomorrow. Rest up!🍹 And don't forget to practice\n";

    }

    message += "\n────────────────\n";
    message += "*Happy Coding and may your submissions be Accepted!😉*";

    return message;

}

export async function fetchData(sock) {

    try {

        const events = await ical.async.fromURL(CALENDAR_URL);
        const contests = [];

        for (const key in events) {

            const event = events[key];

            if (event.type === "VEVENT") {

                const start = new Date(event.start);
                const end = new Date(event.end);

                contests.push({
                    event: event.summary,
                    start: start,
                    duration: (end - start) / 1000,
                    href: extractLink(event),
                    host: detectPlatform(event.summary)
                });

            }

        }

        contests.sort((a, b) => new Date(a.start) - new Date(b.start));

        if (await checkFileAndDelete()) {

            return createMessage(contests);

        } else {

            await messageAdmin(sock, "Error clearing reminder file");
            return "";

        }

    } catch (error) {

        await messageAdmin(sock, "Calendar fetch error: " + error.message);
        return "";

    }

}
