import { expect } from 'chai';

import { getTestDatabase, isTestMariaDbEnabled } from '../helpers/testDatabase';

const describeDb = isTestMariaDbEnabled() ? describe : describe.skip;

const TEST_GUILD_ID = '999000000000000002';
const TEST_CHANNEL_ID = '999000000000000001';

describeDb('Database integration (MariaDB)', () => {
  it('tracks items and events for a channel (thread_id = 0)', async () => {
    const db = getTestDatabase();

    await db.guilds.addGuildTextChannel({
      id: TEST_CHANNEL_ID,
      guild: { id: TEST_GUILD_ID },
    });

    const channel = { id: TEST_CHANNEL_ID };
    await db.tracking.setTrackables(channel, {
      items: ['forma', 'nitain'],
      events: ['invasion'],
    });

    const items = await db.tracking.getTrackedItems(channel);
    const events = await db.tracking.getTrackedEventTypes(channel);

    expect(items.sort()).to.deep.equal(['forma', 'nitain']);
    expect(events).to.deep.equal(['invasion']);
  });

  it('persists channel settings via ON DUPLICATE KEY UPDATE', async () => {
    const db = getTestDatabase();
    const channel = { id: TEST_CHANNEL_ID, guild: { id: TEST_GUILD_ID } };

    await db.channels.setChannelSetting(channel, 'language', 'de');
    const settings = await db.channels.getSettings(channel, ['language']);

    expect(settings.language).to.equal('de');
  });

  it('upserts and deletes per-locale worker cache jobs', async () => {
    const db = getTestDatabase();

    await db.workerCache.enqueueTrackables(TEST_GUILD_ID, 'en', ['cetus.day', 'baro']);
    let jobs = await db.workerCache.fetchPendingJobs(['en'], 'worker_en');
    expect(jobs).to.have.length(1);
    expect(jobs[0].guild_id).to.equal(TEST_GUILD_ID);
    expect(jobs[0].types).to.deep.equal(['cetus.day', 'baro']);

    await db.workerCache.enqueueTrackables(TEST_GUILD_ID, 'en', ['sorties']);
    jobs = await db.workerCache.fetchPendingJobs(['en'], 'worker_en');
    expect(jobs).to.have.length(1);
    expect(jobs[0].types).to.deep.equal(['sorties']);

    await db.workerCache.deleteJob(jobs[0].id);
    jobs = await db.workerCache.fetchPendingJobs(['en'], 'worker_en');
    expect(jobs).to.have.length(0);
  });

  it('queues guild and ping jobs on the global locale', async () => {
    const db = getTestDatabase();

    await db.workerCache.enqueueGuild(TEST_GUILD_ID);
    await db.workerCache.enqueuePings(TEST_GUILD_ID);
    const jobs = await db.workerCache.fetchPendingJobs(['en'], 'worker_en');

    expect(jobs.map((job) => job.scope).sort()).to.deep.equal(['guild', 'pings']);
    await Promise.all(jobs.map((job) => db.workerCache.deleteJob(job.id)));
  });

  it('keeps shared jobs until all workers ack', async () => {
    const db = getTestDatabase();
    const previousCluster = process.env.WORKER_CLUSTER;
    process.env.WORKER_CLUSTER = 'worker_a,worker_b';

    await db.workerCache.enqueueGuild(TEST_GUILD_ID);
    let jobs = await db.workerCache.fetchPendingJobs(['en'], 'worker_a');
    expect(jobs).to.have.length(1);

    await db.workerCache.ackJob(jobs[0].id, 'worker_a');
    jobs = await db.workerCache.fetchPendingJobs(['en'], 'worker_a');
    expect(jobs).to.have.length(0);

    jobs = await db.workerCache.fetchPendingJobs(['en'], 'worker_b');
    expect(jobs).to.have.length(1);

    await db.workerCache.ackJob(jobs[0].id, 'worker_b');
    expect(await db.workerCache.countAcks(jobs[0].id)).to.equal(2);
    await db.workerCache.deleteJob(jobs[0].id);

    if (previousCluster === undefined) {
      delete process.env.WORKER_CLUSTER;
    } else {
      process.env.WORKER_CLUSTER = previousCluster;
    }
  });

  it('queues per-guild refresh jobs by scope', async () => {
    const db = getTestDatabase();

    await db.guilds.addGuildTextChannel({
      id: TEST_CHANNEL_ID,
      guild: { id: TEST_GUILD_ID },
    });
    await db.channels.setChannelSetting({ id: TEST_CHANNEL_ID }, 'language', 'de');

    await db.workerCache.enqueueGuildRefresh(TEST_GUILD_ID, 'all');
    const jobs = await db.workerCache.fetchPendingJobs(['de'], 'worker_de');
    const scopes = jobs.map((job) => job.scope).sort();

    expect(scopes).to.deep.equal(['guild', 'pings', 'trackables']);
    expect(jobs.find((job) => job.scope === 'trackables')?.locale).to.equal('de');
    await Promise.all(jobs.map((job) => db.workerCache.deleteJob(job.id)));
  });

  it('bumps and reads worker cache refresh stamps', async () => {
    const db = getTestDatabase();
    const before = await db.workerCache.getRefreshStamps();

    await db.workerCache.bumpRefreshStamp('pings');
    const afterPings = await db.workerCache.getRefreshStamps();
    expect(afterPings.pings).to.be.greaterThan(before.pings);

    await db.workerCache.bumpRefreshStamp('all');
    const afterAll = await db.workerCache.getRefreshStamps();
    expect(afterAll.pings).to.be.greaterThanOrEqual(afterPings.pings);
    expect(afterAll.trackables).to.be.greaterThan(before.trackables);
    expect(afterAll.guild).to.be.greaterThan(before.guild);
  });
});
