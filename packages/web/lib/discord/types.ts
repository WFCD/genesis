export type DiscordGuildInfo = {
  id: string;
  name: string;
  iconUrl: string | null;
  ownerId: string;
  createdAt: string;
  memberCount: number | null;
  presenceCount: number | null;
  verificationLevel: number;
  textChannelCount: number;
  voiceChannelCount: number;
  emojiCount: number;
  roleCount: number;
  inDatabase: boolean;
  registeredChannelCount: number;
};

export type DiscordGuildInfoError = { error: string; status: number };
