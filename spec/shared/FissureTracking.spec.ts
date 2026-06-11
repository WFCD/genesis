import { expect } from 'chai';

import {
  fissureNodeSlug,
  fissureNodeTypeKey,
  fissureTypeKey,
  FISSURE_NODE_TRACKABLE_PATTERN,
} from '#shared/utilities/FissureTracking';
import { termToTrackable } from '#shared/utilities/CommonFunctions';

describe('FissureTracking', () => {
  it('slugifies Omnia node names', () => {
    expect(fissureNodeSlug('Circulus (Lua)')).to.equal('circulus_lua');
    expect(fissureNodeSlug('Cambire (Deimos)')).to.equal('cambire_deimos');
    expect(fissureNodeSlug('Tuvul Commons')).to.equal('tuvul_commons');
  });

  it('builds tier×mission type keys', () => {
    expect(
      fissureTypeKey({
        missionTypeKey: 'Void Cascade',
        tierNum: 6,
        isHard: true,
      })
    ).to.equal('fissures.sp.t6.voidcascade');
  });

  it('builds node-based tracking keys', () => {
    expect(
      fissureNodeTypeKey({
        nodeKey: 'Yuvarium (Lua)',
        tierNum: 6,
        isHard: false,
      })
    ).to.equal('fissures.node.yuvarium_lua');
    expect(
      fissureNodeTypeKey({
        node: 'Circulus (Lua)',
        tierNum: 6,
        isHard: true,
      })
    ).to.equal('fissures.sp.node.circulus_lua');
  });

  it('accepts custom node trackables', () => {
    const term = 'fissures.node.circulus_lua';
    expect(FISSURE_NODE_TRACKABLE_PATTERN.test(term)).to.equal(true);
    expect(termToTrackable(term)).to.deep.equal({ events: [term], items: [] });
  });
});
