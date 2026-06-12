import { cmds } from '#shared/resources/index';

import Reddit from './Reddit';

export default class WarMeme extends Reddit {
  static enabled = false;
  static subreddit = 'memeframe';
  static command = cmds.memeframe;
}
