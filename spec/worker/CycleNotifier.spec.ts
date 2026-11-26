import { expect } from 'chai';

import { resolveCambionCycleType, resolveCetusCycleType } from '../../packages/worker/notifications/worldstate/CycleNotifier';

const CETUS_DAY_MS = 6000000;
const CETUS_NIGHT_MS = 3000000;

const cycle = (state, expiry, extra = {}) => ({
  state,
  expiry: new Date(expiry).toISOString(),
  activation: new Date(expiry - 60000).toISOString(),
  ...extra,
});

describe('CycleNotifier phase resolution', () => {
  it('previews cetus.day from the end of night', () => {
    const nightExpiry = Date.now() + 60_000;
    const resolved = resolveCetusCycleType({
      data: cycle('night', nightExpiry, { isDay: false }),
      dirty: false,
    });

    expect(resolved.type).to.equal('cetus.day');
    expect(resolved.clone.isDay).to.equal(true);
    expect(resolved.clone.id).to.equal(`cetusCycleday${nightExpiry + CETUS_DAY_MS}`);
  });

  it('notifies cetus.day when day activates, same claim id as the preview', () => {
    const nightExpiry = Date.now() + 60_000;
    const dayExpiry = nightExpiry + CETUS_DAY_MS;
    const preview = resolveCetusCycleType({
      data: cycle('night', nightExpiry, { isDay: false }),
      dirty: false,
    });
    const activated = resolveCetusCycleType({
      data: cycle('day', dayExpiry, { isDay: true, activation: new Date(nightExpiry).toISOString() }),
      dirty: true,
    });

    expect(activated.type).to.equal('cetus.day');
    expect(activated.clone.isDay).to.equal(true);
    expect(activated.clone.id).to.equal(preview.clone.id);
  });

  it('notifies cetus.night when night activates, not the following day', () => {
    const nightExpiry = Date.now() + CETUS_NIGHT_MS;
    const resolved = resolveCetusCycleType({
      data: cycle('night', nightExpiry, { isDay: false }),
      dirty: true,
    });

    expect(resolved.type).to.equal('cetus.night');
    expect(resolved.clone.id).to.equal(`cetusCyclenight${nightExpiry}`);
  });

  it('previews cambion.fass from the end of vome', () => {
    const vomeExpiry = Date.now() + 90_000;
    const resolved = resolveCambionCycleType({
      data: cycle('vome', vomeExpiry),
      dirty: false,
    });

    expect(resolved.type).to.equal('cambion.fass');
    expect(resolved.clone.id).to.equal(`cambionCyclefass${vomeExpiry + CETUS_DAY_MS}`);
  });

  it('notifies cambion.fass when fass activates', () => {
    const fassExpiry = Date.now() + CETUS_DAY_MS;
    const resolved = resolveCambionCycleType({
      data: cycle('fass', fassExpiry),
      dirty: true,
    });

    expect(resolved.type).to.equal('cambion.fass');
    expect(resolved.clone.state).to.equal('fass');
  });

  it('stays quiet mid-cycle', () => {
    const expiry = Date.now() + 30 * 60_000;
    expect(resolveCetusCycleType({ data: cycle('day', expiry, { isDay: true }), dirty: false })).to.equal(undefined);
    expect(resolveCambionCycleType({ data: cycle('fass', expiry), dirty: false })).to.equal(undefined);
  });
});
