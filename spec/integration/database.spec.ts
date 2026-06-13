import { expect } from 'chai';

import { getTestDatabase, isTestMariaDbEnabled } from '../helpers/testDatabase';

const describeDb = isTestMariaDbEnabled() ? describe : describe.skip;

const TEST_GUILD_ID = '999000000000000002';
const TEST_CHANNEL_ID = '999000000000000001';
const REFRESH_TEST_GUILD_ID = '999000000000000099';
const REFRESH_TEST_CHANNEL_ID = '999000000000000098';

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

  describe('worker cache jobs', () => {
    beforeEach(async () => {
      await getTestDatabase().workerCache.clearAllJobs();
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
      const jobs = (await db.workerCache.fetchPendingJobs(['en'], 'worker_en')).filter(
        (job) => job.guild_id === TEST_GUILD_ID
      );

      expect(jobs.map((job) => job.scope).sort()).to.deep.equal(['guild', 'pings']);
    });

    it('keeps shared jobs until all workers ack', async () => {
      const db = getTestDatabase();
      const previousCluster = process.env.WORKER_CLUSTER;
      process.env.WORKER_CLUSTER = 'worker_a,worker_b';

      await db.workerCache.enqueueGuild(TEST_GUILD_ID);
      let jobs = (await db.workerCache.fetchPendingJobs(['en'], 'worker_a')).filter(
        (job) => job.guild_id === TEST_GUILD_ID
      );
      expect(jobs).to.have.length(1);

      await db.workerCache.ackJob(jobs[0].id, 'worker_a');
      jobs = (await db.workerCache.fetchPendingJobs(['en'], 'worker_a')).filter(
        (job) => job.guild_id === TEST_GUILD_ID
      );
      expect(jobs).to.have.length(0);

      jobs = (await db.workerCache.fetchPendingJobs(['en'], 'worker_b')).filter(
        (job) => job.guild_id === TEST_GUILD_ID
      );
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
        id: REFRESH_TEST_CHANNEL_ID,
        guild: { id: REFRESH_TEST_GUILD_ID },
      });
      await db.channels.setChannelSetting({ id: REFRESH_TEST_CHANNEL_ID }, 'language', 'de');

      const locales = await db.workerCache.getGuildLocales(REFRESH_TEST_GUILD_ID);
      expect(locales).to.include('de');

      await db.workerCache.enqueueGuildRefresh(REFRESH_TEST_GUILD_ID, 'all');
      const jobs = (await db.workerCache.fetchPendingJobs(['de'], 'worker_de')).filter(
        (job) => job.guild_id === REFRESH_TEST_GUILD_ID
      );
      const scopes = jobs.map((job) => job.scope).sort();

      expect(scopes).to.deep.equal(['guild', 'pings', 'trackables']);
      expect(jobs.find((job) => job.scope === 'trackables')?.locale).to.equal('de');
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

  describe('notification messages', () => {
    beforeEach(async () => {
      await getTestDatabase().notificationMessages.clearAll();
    });

    it('enqueues, fetches due rows, and purges on delete', async () => {
      const db = getTestDatabase();
      const expiresAt = new Date(Date.now() - 60_000);

      await db.notificationMessages.enqueue({
        channelId: TEST_CHANNEL_ID,
        messageId: '111222333444555666',
        webhookId: '777888999000111222',
        webhookToken: 'test-token',
        trackableType: 'fissures.node',
        eventId: 'fissures.node,abc',
        expiresAt,
      });

      const due = await db.notificationMessages.fetchDue(10);
      expect(due).to.have.length(1);
      expect(due[0].trackable_type).to.equal('fissures.node');

      await db.notificationMessages.deleteByIds([due[0].id]);
      expect(await db.notificationMessages.fetchDue(10)).to.have.length(0);
    });

    it('marks failed rows and purges after max attempts', async () => {
      const db = getTestDatabase();

      await db.notificationMessages.enqueue({
        channelId: TEST_CHANNEL_ID,
        messageId: '111222333444555667',
        webhookId: '777888999000111223',
        webhookToken: 'test-token-2',
        trackableType: 'invasion',
        expiresAt: new Date(Date.now() - 60_000),
      });

      const [row] = await db.notificationMessages.fetchDue(1);
      await db.notificationMessages.markFailed(row.id, 'Unknown Webhook');
      await db.notificationMessages.markFailed(row.id, 'Unknown Webhook');
      await db.notificationMessages.markFailed(row.id, 'Unknown Webhook');
      await db.notificationMessages.purgeFailed(3);

      expect(await db.notificationMessages.fetchDue(10)).to.have.length(0);
    });
  });
});
