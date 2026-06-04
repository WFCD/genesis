import { cmds } from '#shared/resources/index';

import Reddit from './Reddit';

export default class WarMeme extends Reddit {
  static enabled = true;
  static subreddit = 'memeframe';
  static command = cmds.memeframe;
}
