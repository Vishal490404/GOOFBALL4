import { initializeScheduler } from './scheduler.js';

console.log(`Service started at: ${new Date().toLocaleString()}`);

initializeScheduler();

const heartbeatInterval = 5 * 60 * 1000; // 5 mins
setInterval(() => {
    console.log(`Heartbeat: Service still running at ${new Date().toLocaleString()}`);
    process.stdout.write('');
}, heartbeatInterval);

setInterval(() => {}, 60000);

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('exit', (code) => {
    console.log(`Process is about to exit with code: ${code}`);
});

process.on('SIGINT', () => {
    console.log('Service interrupted. Shutting down gracefully...');
    process.exit(0);
});

console.log("Service is now running. Press Ctrl+C to stop.");
