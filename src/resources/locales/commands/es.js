// notes for translators:
// - name fields must match the regex:
//   ^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$
export default {
  alerts: {
    name: 'alertas',
    description: 'Obtener alertas de WorldState'
  },
  arbi: {
    name: 'arbitramientos',
    description: 'Obtener arbitramientos de WorldState'
  },
  archons: {
    name: 'arcontes',
    description: 'Obtén la cacería del arconte actual'
  },
  baro: {
    name: 'baro',
    description: 'Obtén el inventario actual del vendedor del vacío'
  },
  conclave: {
    name: 'conclave',
    description: 'Obtén los desafíos actuales del cónclave'
  },
  construction: {
    name: 'construcción',
    description: 'Get Construction Progress'
  },
  cycle: {
    name: 'ciclo',
    description: 'Get current Time Cycle'
  },
  darvo: {
    name: 'darvo',
    description: 'Get Darvo\'s Deals'
  },
  events: {
    name: 'eventos',
    description: 'Get Active Events'
  },
  fissures: {
    name: 'fisuras',
    description: 'Get WorldState Fissures'
  },
  invasions: {
    name: 'invasiones',
    description: 'Get WorldState Invasions'
  },
  news: {
    name: 'noticias',
    description: 'Get Current news'
  },
  nightwave: {
    name: 'onda nocturna',
    description: 'Get Current Nightwave Challenges'
  },
  sales: {
    name: 'ofertas',
    description: 'Get Current Sales'
  },
  outposts: {
    name: 'outposts',
    description: 'Get Current Sentient Outposts'
  },
  steelpath: {
    name: 'camino de acero',
    description: 'Get Current Steel Path Offerings'
  },
  sortie: {
    name: 'incursion',
    description: 'Get Sortie Information'
  },
  rooms: {
    name: 'salas',
    description: 'Manage your private room'
  },
  'rooms.create': {
    name: 'crear',
    description: 'Create your own room'
  },
  'rooms.destroy': {
    name: 'destruir',
    description: 'Destroy your room'
  },
  'rooms.hide': {
    name: 'ocultar',
    description: 'Hide your private room'
  },
  'rooms.show': {
    name: 'mostrar',
    description: 'Show your private room'
  },
  'rooms.lock': {
    name: 'bloquear',
    description: 'Lock your private room'
  },
  'rooms.unlock': {
    name: 'desbloquear',
    description: 'Unlock your private room'
  },
  'rooms.lurkable': {
    name: 'lurkable',
    description: 'Make your private room lurkable'
  },
  'rooms.rename': {
    name: 'renombrar',
    description: 'Rename your private room'
  },
  'rooms.invite': {
    name: 'invitar',
    description: 'Hide your private room'
  },
  'rooms.block': {
    name: 'block',
    description: 'Block someone from your private room'
  },
  'rooms.resize': {
    name: 'resize',
    description: 'resize private room'
  },
  templates: {
    name: 'templates',
    description: 'Manage channel templates'
  },
  'templates.add': {
    name: 'add',
    description: 'Add a channel as a template channel.'
  },
  'templates.delete': {
    name: 'delete',
    description: 'Delete a channel from you template channels'
  },
  'templates.list': {
    name: 'list',
    description: 'List all configured templates'
  },
  'templates.set': {
    name: 'set',
    description: 'Set the template for a template channel'
  },
  'templates.clear': {
    name: 'clear',
    description: 'clear existing template pattern on a channel'
  },
  'templates.tc': {
    name: 'template_channel',
    description: 'Channel to use as a template (should be a voice channel)'
  },
  'templates.fmt': {
    name: 'template',
    description: 'Template string. Supports replacing $username with originator\'s username'
  },
  about: {
    name: 'about',
    description: 'Tell me about the bot!'
  },
  ping: {
    name: 'ping',
    description: 'ping some stuff'
  },
  whereis: {
    name: 'donde',
    description: 'Display where something drops from'
  },
  query: {
    name: 'consulta',
    description: 'What are you looking for?'
  },
  whatsin: {
    name: 'whatsin',
    description: 'Get various pieces of information'
  },
  'whatsin.query': {
    name: 'consulta',
    description: 'Relic Identifier (i.e. A1)'
  },
  pc: {
    // pricecheck
    name: 'pc',
    description: 'Price check an item'
  },
  platform: {
    name: 'plataforma',
    description: 'Platform to operate on'
  },
  patchnotes: {
    name: 'notas de parche',
    description: 'Include patchnotes? (default false)'
  },
  lookup: {
    name: 'búsqueda',
    description: 'Get various pieces of information'
  },
  arcane: {
    name: 'arcano',
    description: 'Look up an Arcane from Warframe'
  },
  warframe: {
    name: 'warframe',
    description: 'Look up a Warframe'
  },
  weapon: {
    name: 'arma',
    description: 'Look up a weapon'
  },
  riven: {
    name: 'agrietado',
    description: 'Look up a Riven'
  },
  mod: {
    name: 'mod',
    description: 'Look up a Mod'
  },
  companion: {
    name: 'compañero',
    description: 'Look up a companion'
  },
  lfg: {
    name: 'lfg',
    description: 'Make an LFG post'
  },
  'lfg.place': {
    name: 'lugar',
    description: 'Where do you want to group up?'
  },
  'lfg.place.custom': {
    name: 'place_custom',
    description: 'Specific area you want to go to'
  },
  'lfg.time': {
    name: 'tiempo',
    description: 'How long do you want to farm for?'
  },
  'lfg.members': {
    name: 'miembros',
    description: 'How many people do you need?'
  },
  'lfg.for': {
    name: 'para',
    description: 'What are you farming for?'
  },
  'lfg.for.custom': {
    name: 'for_custom',
    description: 'Custom thing you want to farm for'
  },
  'lfg.duration': {
    name: 'duración',
    description: 'How long are you willing to wait?'
  },
  'lfg.type': {
    name: 'tipo',
    description: 'What kind of post?'
  },
  calc: {
    name: 'calc',
    description: 'Get Warframe Worldstate Information'
  },
  'calc.shields': {
    name: 'escudos',
    description: 'Calculate Enemy Shield amounts'
  },
  'calc.armor': {
    name: 'armadura',
    description: 'Calculate Enemy Armor amounts'
  },
  'calc.health': {
    name: 'salud',
    description: 'Calculate Enemy Health amounts'
  },
  settings: {
    name: 'ajustes',
    description: 'Interact with Settings'
  },
  'settings.platform': {
    name: 'plataforma',
    description: 'Set the platform for the channel'
  },
  'settings.set': {
    name: 'set',
    description: 'Set a setting'
  },
  'settings.clear': {
    name: 'clear',
    description: 'Clear certain settings'
  },
  'settings.get': {
    name: 'get',
    description: 'Get all the settings'
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
    name: 'add',
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
    name: 'cc',
    description: 'Manage custom commands'
  },
  'cc.add': {
    name: 'add',
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
    name: 'list',
    description: 'List all subcommands for the guild'
  },
  '8ball': {
    name: '8ball',
    description: 'Get your 8Ball question answered!'
  },
  '8ball.question': {
    name: 'question',
    description: 'What do you want the all-knowing machine to answer?'
  },
  corgi: {
    name: 'corgi',
    description: 'Get a corgi picture!'
  },
  hug: {
    name: 'hug',
    description: 'Get a hug <3'
  },
  joke: {
    name: 'joke',
    description: 'Ask Genesis for a joke!'
  },
  fashion: {
    name: 'fashion',
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