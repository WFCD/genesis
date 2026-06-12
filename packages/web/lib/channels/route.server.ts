import 'server-only';

import { fetchDiscordChannelNode, fetchGuildChannelNodes } from '@/lib/discord';

import type { ResolvedChannelRoute } from './route';
import { buildChannelTree, findChannelName, findThreadParentId, THREAD_CHANNEL_TYPES } from './tree';

export async function resolveChannelRoute(routeId: string, guildId?: string): Promise<ResolvedChannelRoute | null> {
  const node = await fetchDiscordChannelNode(routeId);
  if (node) {
    const isThread = THREAD_CHANNEL_TYPES.has(node.type);
    if (isThread && !node.parentId) return null;

    return {
      routeId,
      isThread,
      parentChannelId: isThread ? node.parentId! : routeId,
      threadId: isThread ? routeId : undefined,
      name: node.name,
      type: node.type,
    };
  }

  if (!guildId) return null;

  try {
    const tree = buildChannelTree(await fetchGuildChannelNodes(guildId));
    const parentChannelId = findThreadParentId(tree, routeId);
    if (parentChannelId) {
      return {
        routeId,
        isThread: true,
        parentChannelId,
        threadId: routeId,
        name: findChannelName(tree, routeId) ?? routeId,
        parentName: findChannelName(tree, parentChannelId) ?? parentChannelId,
        type: 11,
      };
    }

    const name = findChannelName(tree, routeId);
    if (name) {
      return {
        routeId,
        isThread: false,
        parentChannelId: routeId,
        name,
        type: 0,
      };
    }
  } catch {
    return null;
  }

  return null;
}
