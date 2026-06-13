import type { ChannelTree } from './tree';
import { findChannelName, findThreadParentId } from './tree';

export type ResolvedChannelRoute = {
  routeId: string;
  isThread: boolean;
  parentChannelId: string;
  threadId?: string;
  name: string;
  parentName?: string;
  type: number;
};

export function resolveChannelRouteFromTree(tree: ChannelTree, routeId: string): ResolvedChannelRoute {
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

  return {
    routeId,
    isThread: false,
    parentChannelId: routeId,
    name: findChannelName(tree, routeId) ?? routeId,
    type: 0,
  };
}

export function channelRef(guildId: string, resolved: ResolvedChannelRoute) {
  return { id: resolved.parentChannelId, guild: { id: guildId } };
}

export function threadRef(resolved: ResolvedChannelRoute) {
  return resolved.threadId ? { id: resolved.threadId } : undefined;
}

export function rejectThreadRoutes(resolved: ResolvedChannelRoute) {
  if (resolved.isThread) {
    throw new Response('This setting applies to the parent channel, not threads.', { status: 400 });
  }
}
