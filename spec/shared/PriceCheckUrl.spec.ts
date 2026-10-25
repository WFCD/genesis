import { expect } from 'chai';

import { buildPriceCheckUrl, genesisUserAgent } from '#shared/utilities/WorldStateClient';

describe('pricecheck UA', () => {
  it('identifies genesis with version and urls', () => {
    expect(genesisUserAgent).to.match(
      /^genesis\/\d+\.\d+\.\d+ \(\+https:\/\/genesis\.warframestat\.us; https:\/\/github\.com\/WFCD\/genesis\)$/
    );
  });

  it('sends an encoded UA query arg', () => {
    const url = buildPriceCheckUrl('nikana prime', { ranks: '0,10', rank: 3, language: 'en' });
    const parsed = new URL(url);

    expect(parsed.pathname).to.equal('/pricecheck/attachment/nikana%20prime/');
    expect(parsed.searchParams.get('UA')).to.equal(genesisUserAgent);
    expect(parsed.searchParams.get('ranks')).to.equal('0,10');
    expect(parsed.searchParams.get('rank')).to.equal('3');
    const encodedUa = new URLSearchParams({ UA: genesisUserAgent }).toString();
    expect(parsed.search).to.include(encodedUa);
    expect(parsed.search).to.not.match(/[?&]UA=genesis\//);
  });
});
