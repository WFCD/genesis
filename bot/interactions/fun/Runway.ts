import { cmds } from '#shared/resources/index';

import Reddit from './Reddit';

export default class Runway extends Reddit {
  static enabled = true;
  static subreddit = 'warframerunway';
  static command = cmds.fashion;
}
