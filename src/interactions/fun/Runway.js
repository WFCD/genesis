import Reddit from './Reddit.js';
import { cmds } from '../../resources/index.js';

export default class Runway extends Reddit {
  static enabled = true;
  static subreddit = 'warframerunway';
  static command = cmds.fashion;
}
