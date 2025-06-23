// notes for translators:
// - name fields must match the regex:
//   ^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$
export default {
  alerts: {
    name: 'uyarılar',
    description: 'Get WorldState Alerts'
  },
  arbi: {
    name: 'arbi',
    description: 'Get WorldState Arbitrations'
  },
  archons: {
    name: 'archons',
    description: 'Get current Archon Hunt'
  },
  baro: {
    name: 'baro',
    description: 'Get Current Void Trader Inventory'
  },
  conclave: {
    name: 'conclave',
    description: 'Get Current Conclave Challenges'
  },
  construction: {
    name: 'inşaat',
    description: 'Get Construction Progress'
  },
  cycle: {
    name: 'döngü',
    description: 'Get current Time Cycle'
  },
  darvo: {
    name: 'darvo',
    description: 'Get Darvo\'s Deals'
  },
  events: {
    name: 'etkinlikler',
    description: 'Get Active Events'
  },
  fissures: {
    name: 'çatlaklar',
    description: 'Get WorldState Fissures'
  },
  invasions: {
    name: 'istilalar',
    description: 'Get WorldState Invasions'
  },
  news: {
    name: 'haberler',
    description: 'Get Current news'
  },
  nightwave: {
    name: 'nightwave',
    description: 'Get Current Nightwave Challenges'
  },
  sales: {
    name: 'satışlar',
    description: 'Get Current Sales'
  },
  outposts: {
    name: 'karakollar',
    description: 'Get Current Sentient Outposts'
  },
  steelpath: {
    name: 'steelpath',
    description: 'Get Current Steel Path Offerings'
  },
  sortie: {
    name: 'sortie',
    description: 'Get Sortie Information'
  },
  rooms: {
    name: 'odalar',
    description: 'Manage your private room'
  },
  'rooms.create': {
    name: 'oluştur',
    description: 'Create your own room'
  },
  'rooms.destroy': {
    name: 'destroy',
    description: 'Destroy your room'
  },
  'rooms.hide': {
    name: 'gizle',
    description: 'Hide your private room'
  },
  'rooms.show': {
    name: 'göster',
    description: 'Show your private room'
  },
  'rooms.lock': {
    name: 'kilitle',
    description: 'Lock your private room'
  },
  'rooms.unlock': {
    name: 'kilidi_aç',
    description: 'Unlock your private room'
  },
  'rooms.lurkable': {
    name: 'lurkable',
    description: 'Make your private room lurkable'
  },
  'rooms.rename': {
    name: 'yeniden_adlandır',
    description: 'Rename your private room'
  },
  'rooms.invite': {
    name: 'davet',
    description: 'Hide your private room'
  },
  'rooms.block': {
    name: 'engelle',
    description: 'Block someone from your private room'
  },
  'rooms.resize': {
    name: 'yeniden_boyutlandır',
    description: 'resize private room'
  },
  templates: {
    name: 'şablonlar',
    description: 'Manage channel templates'
  },
  'templates.add': {
    name: 'ekle',
    description: 'Add a channel as a template channel.'
  },
  'templates.delete': {
    name: 'sil',
    description: 'Delete a channel from you template channels'
  },
  'templates.list': {
    name: 'liste',
    description: 'List all configured templates'
  },
  'templates.set': {
    name: 'ayarla',
    description: 'Set the template for a template channel'
  },
  'templates.clear': {
    name: 'temizle',
    description: 'clear existing template pattern on a channel'
  },
  'templates.tc': {
    name: 'şablon_kanalı',
    description: 'Channel to use as a template (should be a voice channel)'
  },
  'templates.fmt': {
    name: 'şablon',
    description: 'Template string. Supports replacing $username with originator\'s username'
  },
  about: {
    name: 'hakkında',
    description: 'Tell me about the bot!'
  },
  ping: {
    name: 'ping',
    description: 'ping some stuff'
  },
  whereis: {
    name: 'nerede',
    description: 'Display where something drops from'
  },
  query: {
    name: 'sorgu',
    description: 'What are you looking for?'
  },
  whatsin: {
    name: 'icindeki_nedir',
    description: 'Get various pieces of information'
  },
  'whatsin.query': {
    name: 'sorgu',
    description: 'Relic Identifier (i.e. A1)'
  },
  pc: {
    // pricecheck
    name: 'pc',
    description: 'Price check an item'
  },
  platform: {
    name: 'platform',
    description: 'Platform to operate on'
  },
  patchnotes: {
    name: 'yama_notları',
    description: 'Include patchnotes? (default false)'
  },
  lookup: {
    name: 'lookup',
    description: 'Get various pieces of information'
  },
  arcane: {
    name: 'arcane',
    description: 'Look up an Arcane from Warframe'
  },
  warframe: {
    name: 'warframe',
    description: 'Look up a Warframe'
  },
  weapon: {
    name: 'silah',
    description: 'Look up a weapon'
  },
  riven: {
    name: 'riven',
    description: 'Look up a Riven'
  },
  mod: {
    name: 'mod',
    description: 'Look up a Mod'
  },
  companion: {
    name: 'companion',
    description: 'Look up a companion'
  },
  lfg: {
    name: 'lfg',
    description: 'Make an LFG post'
  },
  'lfg.place': {
    name: 'place',
    description: 'Where do you want to group up?'
  },
  'lfg.place.custom': {
    name: 'place_custom',
    description: 'Specific area you want to go to'
  },
  'lfg.time': {
    name: 'time',
    description: 'How long do you want to farm for?'
  },
  'lfg.members': {
    name: 'üyeler',
    description: 'How many people do you need?'
  },
  'lfg.for': {
    name: 'for',
    description: 'What are you farming for?'
  },
  'lfg.for.custom': {
    name: 'for_custom',
    description: 'Custom thing you want to farm for'
  },
  'lfg.duration': {
    name: 'duration',
    description: 'How long are you willing to wait?'
  },
  'lfg.type': {
    name: 'tip',
    description: 'What kind of post?'
  },
  calc: {
    name: 'calc',
    description: 'Get Warframe Worldstate Information'
  },
  'calc.shields': {
    name: 'shields',
    description: 'Calculate Enemy Shield amounts'
  },
  'calc.armor': {
    name: 'armor',
    description: 'Calculate Enemy Armor amounts'
  },
  'calc.health': {
    name: 'health',
    description: 'Calculate Enemy Health amounts'
  },
  settings: {
    name: 'ayarlar',
    description: 'Interact with Settings'
  },
  'settings.platform': {
    name: 'platform',
    description: 'Set the platform for the channel'
  },
  'settings.set': {
    name: 'ayarla',
    description: 'Set a setting'
  },
  'settings.clear': {
    name: 'temizle',
    description: 'Clear certain settings'
  },
  'settings.get': {
    name: 'get',
    description: 'Get all the settings'
  },
  'settings.get.channel': {
    name: 'channel',
    description: 'Should be a text channel'
  },
  'settings.diag': {
    name: 'diag',
    description: 'Run diagnostics for the guild'
  },
  'settings.lfg': {
    name: 'lfg',
    description: 'Set LFG Channel for a Platform'
  },
  'settings.lfg.channel': {
    name: 'channel',
    description: 'Channel to set LFG to post in'
  },
  'settings.allow_custom': {
    name: 'allow_custom',
    description: 'Set allowance of custom commands'
  },
  'settings.allow_custom.bool': {
    name: 'value',
    description: 'Should this channel allow custom commands?'
  },
  'settings.allow_inline': {
    name: 'allow_inline',
    description: 'Set allowance of inline commands'
  },
  'settings.allow_inline.bool': {
    name: 'value',
    description: 'Should this channel allow inline commands?'
  },
  'settings.language': {
    name: 'language',
    description: 'Set a language for the server'
  },
  'settings.language.str': {
    name: 'value',
    description: 'What language do you want to use for this server?'
  },
  'settings.ephemerate': {
    name: 'ephemerate',
    description: 'Set whether or not messages from slash commands will be public (True by default)'
  },
  'settings.elevated_roles': {
    name: 'elevated_roles',
    description: 'Set elevated roles'
  },
  'settings.elevated_roles.str': {
    name: 'value',
    description: 'What roles are elevated?'
  },
  'settings.allow_rooms': {
    name: 'allow_rooms',
    description: 'Set whether or not to allow custom rooms to be created'
  },
  'settings.allow_rooms.bool': {
    name: 'value',
    description: 'Allow private rooms?'
  },
  'settings.auto_locked': {
    name: 'auto_locked',
    description: 'Set whether or not to default private rooms to be locked (Default True)'
  },
  'settings.auto_locked.bool': {
    name: 'value',
    description: 'Lock private rooms?'
  },
  'settings.auto_text': {
    name: 'auto_text',
    description: 'Set whether or not to default private rooms to have text channels (Default False)'
  },
  'settings.auto_text.bool': {
    name: 'value',
    description: 'Make rooms with text?'
  },
  'settings.auto_shown': {
    name: 'auto_shown',
    description: 'Set whether or not to default private rooms should be visible (Default false)'
  },
  'settings.auto_shown.bool': {
    name: 'value',
    description: 'Make rooms visible?'
  },
  'settings.temp_channel': {
    name: 'temp_channel',
    description: 'Set the channel for creating threads in for private rooms'
  },
  'settings.temp_channel.channel': {
    name: 'value',
    description: 'Should be a text channel'
  },
  'settings.temp_category': {
    name: 'temp_category',
    description: 'Set the temporary category for private/auto-generated rooms'
  },
  'settings.temp_category.channel': {
    name: 'value',
    description: 'Should be a category'
  },
  'syndicate': {
    name: 'syndicate',
    description: 'Get current syndicate information for a given syndicate'
  },
  tracking: {
    name: 'tracking',
    description: 'Configure tracking options'
  },
  'tracking.manage': {
    name: 'manage',
    description: 'Manage tracking settings'
  },
  'tracking.manage.channel': {
    name: 'channel',
    description: 'Channel (text-based) that this should apply to.'
  },
  'tracking.manage.thread': {
    name: 'thread',
    description: 'Thread channel wherein to send messages'
  },
  'tracking.custom': {
    name: 'custom',
    description: 'Set up custom trackings and pings'
  },
  'tracking.custom.add': {
    name: 'ekle',
    description: 'Comma-separated list of trackables to add. See website.'
  },
  'tracking.custom.remove': {
    name: 'remove',
    description: 'Comma-separated list of trackables to remove. See website.'
  },
  'tracking.custom.prepend': {
    name: 'prepend',
    description: 'Requires \'add\' to be specified. Ignored on remove.'
  },
  'tracking.custom.channel': {
    name: 'channel',
    description: 'Channel (text-based) that this should apply to.'
  },
  'tracking.custom.thread': {
    name: 'thread',
    description: 'Thread channel wherein to send messages'
  },
  'tracking.custom.clear-prepend': {
    name: 'clear-prepend',
    description: 'Clear prepend for specified "remove" trackables. Won\'t remove them from tracking.'
  },
  cc: {
    name: 'kk',
    description: 'Manage custom commands'
  },
  'cc.add': {
    name: 'ekle',
    description: 'Add a custom command'
  },
  'cc.add.call': {
    name: 'call',
    description: 'Sets the command call for the new custom command'
  },
  'cc.add.response': {
    name: 'response',
    description: 'Set what the call will respond to'
  },
  'cc.remove': {
    name: 'remove',
    description: 'Remove a custom command by name'
  },
  'cc.remove.call': {
    name: 'call',
    description: 'Which call to remove?'
  },
  'cc.list': {
    name: 'liste',
    description: 'List all subcommands for the guild'
  },
  '8ball': {
    name: '8top',
    description: 'Get your 8Ball question answered!'
  },
  '8ball.question': {
    name: 'soru',
    description: 'What do you want the all-knowing machine to answer?'
  },
  corgi: {
    name: 'corgi',
    description: 'Get a corgi picture!'
  },
  hug: {
    name: 'sarıl',
    description: 'Get a hug <3'
  },
  joke: {
    name: 'şaka',
    description: 'Ask Genesis for a joke!'
  },
  fashion: {
    name: 'fashionframe',
    description: 'Get a random Warframe fashion image'
  },
  memeframe: {
    name: 'memeframe',
    description: 'Get a Warframe meme'
  },
  memes: {
    name: 'meme',
    description: 'Get a meme from r/dankmemes'
  }
};