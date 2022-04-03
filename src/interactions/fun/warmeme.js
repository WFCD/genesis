import Reddit from './Reddit.js';

export default class warmeme extends Reddit {
  static enabled = true;
  static subreddit = 'memeframe';
  static command = {
    name: 'memeframe',
    description: 'Get a Warframe meme',
  };
}
