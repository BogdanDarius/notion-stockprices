import { triggerEvent } from './handler';

addEventListener('scheduled', (event) => event.waitUntil(triggerEvent()));
