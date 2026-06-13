export type GuildChannelNode = {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  position: number;
  threads: GuildChannelNode[];
};

export type ChannelCategoryGroup = {
  id: string;
  name: string;
  position: number;
  channels: GuildChannelNode[];
};

export type ChannelTree = {
  categories: ChannelCategoryGroup[];
  uncategorized: GuildChannelNode[];
};

const TEXT_CHANNEL_TYPES = new Set([0, 5, 15]);
export const THREAD_CHANNEL_TYPES = new Set([10, 11, 12]);
const CATEGORY_TYPE = 4;

const withThreads = (channel: Omit<GuildChannelNode, 'threads'>, threads: GuildChannelNode[]): GuildChannelNode => ({
  ...channel,
  threads: threads.filter((thread) => thread.parentId === channel.id).sort((a, b) => a.name.localeCompare(b.name)),
});

export function buildChannelTree(nodes: GuildChannelNode[] | Array<Omit<GuildChannelNode, 'threads'>>): ChannelTree {
  const normalized = nodes.map((node) => ('threads' in node ? node : { ...node, threads: [] }));

  const categories = normalized.filter((node) => node.type === CATEGORY_TYPE).sort((a, b) => a.position - b.position);

  const textChannels = normalized
    .filter((node) => TEXT_CHANNEL_TYPES.has(node.type))
    .sort((a, b) => a.position - b.position);

  const threads = normalized
    .filter((node) => THREAD_CHANNEL_TYPES.has(node.type))
    .sort((a, b) => a.name.localeCompare(b.name));

  const categoryMap = new Map<string, ChannelCategoryGroup>(
    categories.map((category) => [
      category.id,
      { id: category.id, name: category.name, position: category.position, channels: [] },
    ])
  );

  const uncategorized: GuildChannelNode[] = [];

  textChannels.forEach((channel) => {
    const withChildren = withThreads(channel, threads);
    if (channel.parentId && categoryMap.has(channel.parentId)) {
      categoryMap.get(channel.parentId)!.channels.push(withChildren);
    } else {
      uncategorized.push(withChildren);
    }
  });

  return {
    categories: Array.from(categoryMap.values()),
    uncategorized,
  };
}

function findInChannels(channels: GuildChannelNode[], channelId: string) {
  for (const channel of channels) {
    if (channel.id === channelId) return channel.name;
    const thread = channel.threads.find((entry) => entry.id === channelId);
    if (thread) return thread.name;
  }
  return undefined;
}

export function findChannelName(tree: ChannelTree, channelId: string) {
  return (
    findInChannels(
      tree.categories.flatMap((category) => category.channels),
      channelId
    ) ?? findInChannels(tree.uncategorized, channelId)
  );
}

export function countTextChannels(tree: ChannelTree) {
  return tree.categories.reduce((sum, category) => sum + category.channels.length, 0) + tree.uncategorized.length;
}

export function countThreads(tree: ChannelTree) {
  const allChannels = [...tree.categories.flatMap((category) => category.channels), ...tree.uncategorized];
  return allChannels.reduce((sum, channel) => sum + channel.threads.length, 0);
}

export function findThreadParentId(tree: ChannelTree, threadId: string) {
  const allChannels = [...tree.categories.flatMap((category) => category.channels), ...tree.uncategorized];
  for (const channel of allChannels) {
    if (channel.threads.some((thread) => thread.id === threadId)) return channel.id;
  }
  return undefined;
}
