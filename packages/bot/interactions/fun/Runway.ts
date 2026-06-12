import { cmds } from '#shared/resources/index';

import Reddit from './Reddit';

export default class Runway extends Reddit {
  static enabled = false;
  static subreddit = 'warframerunway';
  static command = cmds.fashion;
}
