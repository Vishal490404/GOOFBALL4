# Coding Contest WhatsApp Notifier

This project is a WhatsApp bot that notifies users about upcoming coding contests from various platforms. It fetches contest data from clist.by API and sends notifications to specified WhatsApp numbers or groups.

## Features

- Fetches coding contest data from clist.by
- Sends daily updates for today's and tomorrow's contests
- Sends reminders 30 minutes before each contest
- Supports multiple coding platforms (Codeforces, CodeChef, LeetCode, AtCoder, and more)
- Works with Windows Task Scheduler for automated reminders
- Easily manage WhatsApp groups using group IDs

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```env
   CLIST_USERNAME=your_username
   CLIST_API_KEY=your_api_key
   HELP_NUMBER=your_number@s.whatsapp.net
   ```

4. Run the application:

   ```bash
   npm run dev
   ```

5. Scan the QR code with WhatsApp to authenticate

## Running Automatically

### Daily Updates

1. Set up a Windows Task Scheduler task to run `runTask.bat` daily at your preferred time.

### Contest Reminders

The application automatically creates reminder tasks when it runs.

## Files

- `app.js` - Main application that sends daily contest updates
- `getContestDetails.js` - Fetches and processes contest data
- `reminderService.js` - Creates reminder entries and schedules tasks
- `sendReminder.js` - Sends reminders before contests
- `ids.js` - Contains WhatsApp IDs to send messages to
- `config.js` - Application configuration
- `utility.js` - Common utility functions
- `getGID.js` - Utility to fetch WhatsApp group IDs and information
- `runReminder.bat` - Batch file to run reminders
- `runTask.bat` - Batch file to run daily tasks

## WhatsApp Integration

The application uses the [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) library for WhatsApp Web API integration. Key features include:

- **Authentication**: QR code-based login with session persistence
- **Group Management**: Fetch and manage WhatsApp groups
- **Automated Messaging**: Send scheduled messages to groups or individuals

## Troubleshooting

- **QR Code Issues**: If authentication fails, delete the `auth_info_baileys` folder and restart the application
- **Task Scheduler**: Ensure the working directory is set correctly in task settings
- **Reminders Not Working**: Check the `reminderFile.txt` file for any issues with scheduled reminders

## Contributing

Feel free to submit issues or pull requests to improve the project.

