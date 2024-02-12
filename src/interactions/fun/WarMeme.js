import { cmds } from '../../resources/index.js';

import Reddit from './Reddit.js';

export default class WarMeme extends Reddit {
  static enabled = true;
  static subreddit = 'memeframe';
  static command = cmds.memeframe;
}
