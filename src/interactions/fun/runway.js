import Reddit from './Reddit.js';

export default class Runway extends Reddit {
  static enabled = true;
  static subreddit = 'warframerunway';
  static command = {
    name: 'fashion',
    description: 'Get a random Warframe fashion image',
  };
}
