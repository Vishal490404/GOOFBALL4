# WhatsApp Coding Contest Notification Bot

A Node.js application that sends automated WhatsApp notifications about upcoming coding contests from various platforms. It helps competitive programmers stay updated with contest schedules and never miss a coding competition.

## Features

- **Contest Notifications**: Automatically sends daily notifications about upcoming coding contests
- **WhatsApp Integration**: Uses Baileys library to interact with WhatsApp Web
- **Reminder System**: Sets reminders for contests
- **Scheduled Jobs**: Uses node-schedule to run contest notifications at specified times

## Prerequisites

- Node.js (v14 or newer)
- NPM (v6 or newer)
- A WhatsApp account for the bot
- API keys for coding contest platforms (if applicable)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Vishal490404/GOOFBALL4.git
   cd GOOFBALL4
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```env
   CLIST_USERNAME=your_username
   CLIST_API_KEY=your_api_key
   CLIST_API_URL=https://api.example.com
   HELP_NUMBER=your_whatsapp_number
   ```

## Usage

### Starting the Service

To start the WhatsApp notification service:

```bash
npm start
```

This will launch the service through `startService.js` and initiate the WhatsApp connection.

### Running Contest Notifications

To manually trigger contest notifications:

```bash
npm run contest
```

This executes `runContestNotifications.js` to fetch and send contest information.

### Development Mode

For development with auto-restart:

```bash
npm run dev
```

## Project Structure

- `app.js` - Main application logic and WhatsApp connection handling
- `config.js` - Configuration settings and environment variables
- `getContestDetails.js` - Fetches contest information from APIs
- `reminderService.js` - Manages contest reminders
- `scheduler.js` - Handles scheduled jobs for notifications
- `sendReminder.js` - Sends reminder messages via WhatsApp
- `startService.js` - Entry point for the service
- `utility.js` - Utility functions
- `runContestNotifications.js` - Script to manually trigger notifications

## Authentication

On first run, the application will generate a QR code. Scan this code with your WhatsApp to authenticate the session. Authentication data is stored in the `auth_info_baileys` directory for subsequent runs.