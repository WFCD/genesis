import { cmds } from '../../resources/index.js';

import Reddit from './Reddit.js';

export default class DankMeme extends Reddit {
  static enabled = true;
  static subreddit = 'dankmemes';
  static command = cmds.memes;
}
