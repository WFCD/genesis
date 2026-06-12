import Worker from './notifications/Worker';

const worker = await new Worker();
await worker.start();
