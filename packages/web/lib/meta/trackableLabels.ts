const SEGMENT_LABELS: Record<string, string> = {
  alchemy: 'Alchemy',
  anger: 'Anger',
  announcements: 'Announcements',
  archonhunt: 'Archon Hunt',
  arbiters: 'Arbiters of Hexis',
  arena: 'Arena',
  assassins: 'Syndicate Assassins',
  assault: 'Assault',
  assassination: 'Assassination',
  alerts: 'Alerts',
  arbitration: 'Arbitration',
  aura: 'Aura Mods',
  baro: "Baro Ki'Teer",
  bear: 'Bear',
  cambion: 'Cambion Drift',
  cameron: 'Cameron',
  catalyst: 'Catalysts',
  catalysts: 'Catalysts',
  capture: 'Capture',
  cetus: 'Cetus',
  clantech: 'Clan Tech',
  cold: 'Cold Period',
  conclave: 'Conclave',
  connor: 'Connor',
  corpus: 'Corpus',
  credits: 'Credits',
  darvo: 'Darvo',
  danielle: 'Danielle',
  day: 'Day',
  deals: 'Deals',
  dailies: 'Dailies',
  daily: 'Daily',
  defection: 'Defection',
  defense: 'Defense',
  departed: 'Departed',
  detonite: 'Detonite Injector',
  digitalextremes: 'Digital Extremes',
  disruption: 'Disruption',
  drew: 'Drew',
  duviri: 'Duviri',
  earth: 'Earth',
  elite: 'Elite',
  enemies: 'Enemies',
  envy: 'Envy',
  exilus: 'Exilus Mods',
  excavation: 'Excavation',
  extermination: 'Extermination',
  fass: 'Fass Period',
  fear: 'Fear',
  featured: 'Featured',
  fieldron: 'Fieldron',
  fissures: 'Fissures',
  forma: 'Forma',
  forum: 'Forum',
  george: 'George',
  glen: 'Glen',
  grineer: 'Grineer',
  helen: 'Helen',
  hijack: 'Hijack',
  infested: 'Infested',
  infestedsalvage: 'Infested Salvage',
  interception: 'Interception',
  invasions: 'Invasions',
  items: 'Items',
  joy: 'Joy',
  kavatGene: 'Kavat Imprint',
  kubrowEgg: 'Kubrow Egg',
  kuva: 'Kuva',
  live: 'Live',
  loka: 'New Loka',
  maciej: 'Maciej',
  marcus: 'Marcus',
  megan: 'Megan',
  meridian: 'Steel Meridian',
  mobiledefense: 'Mobile Defense',
  mutagen: 'Mutagen Mass',
  mutalist: 'Mutalist Alad V',
  necralisk: 'Necralisk',
  news: 'News',
  night: 'Night',
  nightwave: 'Nightwave',
  nitain: 'Nitain Extract',
  node: 'Node',
  operations: 'Operations',
  orokinCell: 'Orokin Cell',
  orphix: 'Orphix',
  ostrons: 'Ostrons',
  outposts: 'Outposts',
  oxium: 'Oxium',
  pablo: 'Pablo',
  perrin: 'Perrin Sequence',
  popular: 'Popular',
  primeaccess: 'Prime Access',
  quote: 'Quote',
  reactor: 'Reactors',
  rebecca: 'Rebecca',
  reply: 'Reply',
  rescue: 'Rescue',
  retweet: 'Retweet',
  riven: 'Rivens',
  rss: 'RSS',
  sabotage: 'Sabotage',
  sanctuaryonslaught: 'Sanctuary Onslaught',
  saske: 'Saske',
  skirmish: 'Skirmish',
  sorties: 'Sorties',
  sorrow: 'Sorrow',
  solaris: 'Orb Vallis',
  sp: 'Steel Path',
  spy: 'Spy',
  staff: 'Staff',
  steelpath: 'Steel Path',
  steve: 'Steve',
  streams: 'Streams',
  survival: 'Survival',
  syncrasis: 'Syncrasis',
  syndicate: 'Syndicate',
  suda: 'Cephalon Suda',
  synthula: 'Synthula',
  taylor: 'Taylor',
  tellurium: 'Tellurium',
  traces: 'Traces',
  tweet: 'Tweet',
  twitch: 'Twitch',
  twitter: 'Twitter',
  updates: 'Updates',
  vauban: 'Vauban',
  vandal: 'Vandal Parts',
  veil: 'Red Veil',
  vome: 'Vome Period',
  volatile: 'Volatile',
  warm: 'Warm Period',
  weapon: 'Weapons',
  weeklies: 'Weeklies',
  weekly: 'Weekly',
  workshop: 'Workshop',
  wraith: 'Wraith Parts',
};

const PLATFORM_LABELS: Record<string, string> = {
  pc: 'PC',
  ps4: 'PlayStation',
  xb1: 'Xbox',
  switch: 'Nintendo Switch',
};

const TIER_LABELS: Record<string, string> = {
  t1: 'Lith',
  t2: 'Meso',
  t3: 'Neo',
  t4: 'Axi',
  t5: 'Requiem',
  t6: 'Steel Path',
};

const MISSION_LABELS: Record<string, string> = {
  exterminate: 'Exterminate',
  survival: 'Survival',
  defense: 'Defense',
  mobiledefense: 'Mobile Defense',
  rescue: 'Rescue',
  sabotage: 'Sabotage',
  spy: 'Spy',
  capture: 'Capture',
  disruption: 'Disruption',
  excavation: 'Excavation',
  assassination: 'Assassination',
  hive: 'Hive',
  voidcascade: 'Void Cascade',
  voidflood: 'Void Flood',
  voidarmageddon: 'Void Armageddon',
};

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeSegment(segment: string) {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (TIER_LABELS[segment]) return TIER_LABELS[segment];
  if (MISSION_LABELS[segment]) return MISSION_LABELS[segment];
  if (PLATFORM_LABELS[segment]) return PLATFORM_LABELS[segment];

  if (segment.startsWith('de_')) {
    return `DE ${titleCase(segment.slice(3))}`;
  }

  const tierMatch = segment.match(/^t(\d)$/i);
  if (tierMatch) return TIER_LABELS[`t${tierMatch[1]}`] ?? `Tier ${tierMatch[1]}`;

  const spaced = segment
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

  return titleCase(spaced);
}

function formatNotificationKey(key: string) {
  const separator = key.includes(',') ? ',' : key.includes('.') ? '.' : null;
  if (!separator) return humanizeSegment(key);
  return key.split(separator).map(humanizeSegment).join(' · ');
}

/** Turn internal trackable keys into readable labels. */
export function formatTrackableLabel(key: string) {
  return formatNotificationKey(key);
}

/** Turn ping target keys (dot- or comma-separated) into readable labels. */
export function formatPingableLabel(key: string) {
  return formatNotificationKey(key);
}
