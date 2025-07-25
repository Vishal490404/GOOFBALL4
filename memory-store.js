import pkg from '@adiwajshing/baileys';
const { makeInMemoryStore } = pkg;
import pino from 'pino';

const logger = pino().child({ level: 'fatal', stream: 'store' });
const Memory_Store = makeInMemoryStore({ logger });

export { Memory_Store };
