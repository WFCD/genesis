export namespace WorldState {
  export enum Faction {
    CORPUS = "Corpus",
    GRINEER = "Grineer",
    INFESTATION = "Infestation",
    OROKIN = "Orokin",
    SENTIENT = "Sentient",
    STALKER = "Stalker",
    TENNO = "Tenno",
    NEUTRAL = "Neutral",
    WILD = "Wild",
    CORRUPTED = "Corrupted"
  }

  export enum Syndicate {
    ARBITERS = "Arbiters of Hexis",
    CEPHALON = "Cephalon Suda",
    LOKA = "New Loka",
    MERIDIAN = "Steel Meridian",
    PERRIN = "Perrin Sequence",
    VEIL = "Red Veil",
    SIMARIS = "Cephalon Simaris",
    ENTRATI = "Entrati",
    SOLARIS = "Solaris United",
    VENTKIDS = "Ventkids",
    NECRALOID = "Necraloid",
    OSTRON = "Ostron",
    QUILLS = "Quills",
  }

  export interface CountedItem {
    count: number;
    type: string;
    key: string;
  }

  export interface WorldState {
    timestamp: string;
    news: News[];
    events: Event[];
    alerts: Alert[];
    sortie: Sortie;
    syndicateMissions: SyndicateMission[];
    fissures: Fissure[];
    globalUpgrades: GlobalUpgrade[];
    flashSales: FlashSale[];
    invasions: Invasion[];
    darkSectors: DarkSector[];
    voidTrader: VoidTrader;
    voidTraders: VoidTrader[];
    dailyDeals: DailyDeal[];
    simaris: Simaris;
    conclaveChallenges: ConclaveChallenge[];
    persistentEnemies: PersistentEnemy[];
    earthCycle: EarthCycle;
    cetusCycle: CetusCycle;
    vallisCycle: VallisCycle;
    cambionCycle: CambionCycle;
    nightwave: Nightwave;
    dailyMods: DailyMod[];
    sorties: Sortie[];
    constructionProgress: ConstructionProgress[];
  }

  export interface SyndicateMission {
    id: string;
    activation: string;
    expiry: string;
    startString: string;
    nodes: string[];
    jobs: Job[];
    eta: string;
    active: boolean;
    syndicate: Syndicate;
    syndicateKey: Syndicate;
  }

  export interface CambionCycle {
    id: string;
    expiry: string;
    activation: string;
    state: string;
    active: 'fass' | 'vome';
    bounty: SyndicateMission;
  }

  export interface PersistentEnemy {
    agentType: string;
    locationTag: string;
    level: number;
    rank: number;
    healthPercent: number;
    isDiscovered: boolean;
    lastDiscoveredAt: string;
    lastDiscoveredTime: number;
    isUsingTicketing: boolean;
    count: number;
    region: string;
    regionId: string;
    fleeDamage: number;
  }

  export interface Job {
    rewardPool: string[];
    type: string;
    enemyLevels: [number,number];
    standingStages: number[];
  }

  export interface News {
    id: string;
    message: string;
    link: string;
    date: string;
  }
  export interface Event {
    id: string;
    activation: string;
    expiry: string;
    description: string;
    tooltip: string;
    node: string;
    faction?: Faction;
    maximumScore?: number;
    currentScore?: number;
    smallInterval?: number;
    largeInterval?: number;
    victimNode?: string;
    affiliatedWith: string;
    rewards: Reward[];
    jobs: Job[];
    health: number;
  }

  export interface Reward {
    items: string[];
    countedItems: CountedItem[];
    count: number;
    type: string;
    asString: string;
    itemString: string;
    /** url */
    thumbnail: string;
    color: number;
    credits: number;
  }
  export interface Invasion {
    id: string;
    node: string;
    desc: string;
    attackingFaction: string;
    defendingFaction: string;
    attacker: {
      reward: Reward;
      faction: Faction;
      factionKey: Faction;
    };
    defender: {
      reward: Reward;
      faction: Faction;
      factionKey: Faction;
    };
    activation: string;
    count: number;
    completion: number;
    goal: number;
    tag: string;
    vsInfestation: boolean;
    eta: string;
  }

  export interface Alert {
    id: string;
    activation: string;
    expiry: string;
    mission: Mission;
    reward: Reward;
    eta: string;
    faction: Faction;
    description: string;
  }

  export interface Mission {
    reward: Reward;
    node: string;
    faction: Faction;
    type: string;
    minEnemyLevel: number;
    maxEnemyLevel: number;
  }

  export interface Arbitration {
    node: string;
    type: string;
    /** date timestamp */
    expiry: number;
  }
}

