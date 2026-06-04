import { cmds } from '#shared/resources/index';

import Reddit from './Reddit';

export default class DankMeme extends Reddit {
  static enabled = true;
  static subreddit = 'dankmemes';
  static command = cmds.memes;
}
