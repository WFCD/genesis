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
});
