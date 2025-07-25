import { initializeScheduler } from './scheduler.js';

console.log(`Service started at: ${new Date().toLocaleString()}`);

initializeScheduler();

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
