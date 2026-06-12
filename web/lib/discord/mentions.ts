export type MentionKind = 'role' | 'user' | 'channel';

export type ActiveMention =
  | { kind: 'channel'; query: string; start: number; end: number }
  | { kind: 'at'; query: string; start: number; end: number };

export type MentionSuggestion = {
  kind: MentionKind;
  id: string;
  label: string;
  insert: string;
  hint?: string;
};

export function formatRoleMention(id: string) {
  return `<@&${id}>`;
}

export function formatUserMention(id: string) {
  return `<@${id}>`;
}

export function formatChannelMention(id: string) {
  return `<#${id}>`;
}

export function getActiveMention(text: string, cursor: number): ActiveMention | null {
  const before = text.slice(0, cursor);
  const channelMatch = before.match(/#([^\s#@<>]*)$/);
  if (channelMatch) {
    return {
      kind: 'channel',
      query: channelMatch[1],
      start: cursor - channelMatch[0].length,
      end: cursor,
    };
  }

  const atMatch = before.match(/@([^\s#@<>]*)$/);
  if (atMatch) {
    return {
      kind: 'at',
      query: atMatch[1],
      start: cursor - atMatch[0].length,
      end: cursor,
    };
  }

  return null;
}

export function insertMention(text: string, start: number, end: number, insert: string) {
  const next = `${text.slice(0, start)}${insert}${text.slice(end)}`;
  const cursor = start + insert.length;
  return { value: next, cursor };
}

export function filterRoleSuggestions(
  roles: Array<{ id: string; name: string }>,
  query: string,
  limit = 12
): MentionSuggestion[] {
  const needle = query.trim().toLowerCase();
  return roles
    .filter((role) => !needle || role.name.toLowerCase().includes(needle))
    .slice(0, limit)
    .map((role) => ({
      kind: 'role',
      id: role.id,
      label: role.name,
      insert: formatRoleMention(role.id),
      hint: 'Role',
    }));
}

export function filterChannelSuggestions(
  channels: Array<{ id: string; name: string }>,
  query: string,
  limit = 12
): MentionSuggestion[] {
  const needle = query.trim().toLowerCase();
  return channels
    .filter((channel) => !needle || channel.name.toLowerCase().includes(needle))
    .slice(0, limit)
    .map((channel) => ({
      kind: 'channel',
      id: channel.id,
      label: `#${channel.name}`,
      insert: formatChannelMention(channel.id),
      hint: 'Channel',
    }));
}

export function mapMemberSuggestions(members: Array<{ id: string; name: string }>, limit = 12): MentionSuggestion[] {
  return members.slice(0, limit).map((member) => ({
    kind: 'user',
    id: member.id,
    label: member.name,
    insert: formatUserMention(member.id),
    hint: 'User',
  }));
}
