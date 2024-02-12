import { cmds } from '../../resources/index.js';

import Reddit from './Reddit.js';

export default class Runway extends Reddit {
  static enabled = true;
  static subreddit = 'warframerunway';
  static command = cmds.fashion;
}
