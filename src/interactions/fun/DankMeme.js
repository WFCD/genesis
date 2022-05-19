import Reddit from './Reddit.js';
import { cmds } from '../../resources/index.js';

export default class DankMeme extends Reddit {
  static enabled = true;
  static subreddit = 'dankmemes';
  static command = cmds.memes;
}
