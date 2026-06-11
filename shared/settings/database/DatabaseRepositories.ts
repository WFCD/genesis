import type ChannelSettingsRepository from './repositories/ChannelSettingsRepository';
import type BlacklistRepository from './repositories/BlacklistRepository';
import type BuildRepository from './repositories/BuildRepository';
import type CustomCommandRepository from './repositories/CustomCommandRepository';
import type DynamicVoiceRepository from './repositories/DynamicVoiceRepository';
import type GuildRepository from './repositories/GuildRepository';
import type NotificationsRepository from './repositories/NotificationsRepository';
import type PermissionsRepository from './repositories/PermissionsRepository';
import type PrivateRoomRepository from './repositories/PrivateRoomRepository';
import type PromocodeRepository from './repositories/PromocodeRepository';
import type RatioRepository from './repositories/RatioRepository';
import type StatisticsRepository from './repositories/StatisticsRepository';
import type StreamRepository from './repositories/StreamRepository';
import type TrackingRepository from './repositories/TrackingRepository';
import type WelcomeRepository from './repositories/WelcomeRepository';
import type WorkerCacheRepository from './repositories/WorkerCacheRepository';

/** Repository handles grouped by interaction domain. Grows as mixins migrate. */
export interface DatabaseRepositories {
  channels: ChannelSettingsRepository;
  tracking: TrackingRepository;
  notifications: NotificationsRepository;
  privateRooms: PrivateRoomRepository;
  dynamicVoice: DynamicVoiceRepository;
  blacklist: BlacklistRepository;
  welcome: WelcomeRepository;
  ratio: RatioRepository;
  streams: StreamRepository;
  customCommands: CustomCommandRepository;
  builds: BuildRepository;
  promocodes: PromocodeRepository;
  permissions: PermissionsRepository;
  statistics: StatisticsRepository;
  guilds: GuildRepository;
  workerCache: WorkerCacheRepository;
}
