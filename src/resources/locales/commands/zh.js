// notes for translators:
// - name fields must match the regex:
//   ^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$
export default {
  alerts: {
    name: '警报',
    description: '获取世界状态'
  },
  arbi: {
    name: '仲裁',
    description: '获取仲裁任务'
  },
  baro: {
    name: '奸商',
    description: '获取奸商本期物品'
  },
  conclave: {
    name: '武形秘仪',
    description: '获取当前武形秘仪挑战'
  },
  construction: {
    name: '建造状态',
    description: '获取当前建造进度'
  },
  cycle: {
    name: '周期',
    description: '获取当前周期'
  },
  darvo: {
    name: 'darvo',
    description: '获取 Darvo 的每日特惠'
  },
  events: {
    name: '事件',
    description: '获取当前事件'
  },
  fissures: {
    name: '虚空裂缝',
    description: '获取裂缝任务'
  },
  invasions: {
    name: '入侵',
    description: '获取入侵任务'
  },
  news: {
    name: '新闻',
    description: '获取当前新闻'
  },
  nightwave: {
    name: '午夜电波',
    description: '获取当前夜波挑战'
  },
  sales: {
    name: '促销',
    description: '获取当前促销'
  },
  outposts: {
    name: 'sentient 异常任务',
    description: '获取当前Sentient前哨信息'
  },
  steelpath: {
    name: '钢铁之路',
    description: '获取钢铁之路物品'
  },
  sortie: {
    name: '突击',
    description: '获取突击任务信息'
  },
  rooms: {
    name: 'rooms',
    description: 'Manage your private room'
  },
  'rooms.create': {
    name: 'create',
    description: 'Create your own room'
  },
  'rooms.destroy': {
    name: 'destroy',
    description: 'Destroy your room'
  },
  'rooms.hide': {
    name: 'hide',
    description: 'Hide your private room'
  },
  'rooms.show': {
    name: 'show',
    description: 'Show your private room'
  },
  'rooms.lock': {
    name: 'lock',
    description: 'Lock your private room'
  },
  'rooms.unlock': {
    name: 'unlock',
    description: 'Unlock your private room'
  },
  'rooms.lurkable': {
    name: 'lurkable',
    description: 'Make your private room lurkable'
  },
  'rooms.rename': {
    name: 'rename',
    description: 'Rename your private room'
  },
  'rooms.invite': {
    name: 'invite',
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
    name: 'whereis',
    description: 'Display where something drops from'
  },
  query: {
    name: 'query',
    description: 'What are you looking for?'
  },
  whatsin: {
    name: 'whatsin',
    description: 'Get various pieces of information'
  },
  'whatsin.query': {
    name: 'query',
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
    name: 'patchnotes',
    description: 'Include patchnotes? (default false)'
  },
  lookup: {
    name: 'lookup',
    description: 'Get various pieces of information'
  },
  arcane: {
    name: '赋能',
    description: '查找赋能'
  },
  warframe: {
    name: '战甲',
    description: '查询战甲'
  },
  weapon: {
    name: '武器',
    description: '寻找武器'
  },
  riven: {
    name: '紫卡',
    description: '查找紫卡'
  },
  mod: {
    name: 'mod',
    description: '查找mod'
  },
  companion: {
    name: '同伴',
    description: '查找同伴'
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
    name: 'members',
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
    name: 'type',
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
    name: 'settings',
    description: 'Interact with Settings'
  },
  'settings.platform': {
    name: 'platform',
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
  tracking: {
    name: '追踪',
    description: '配置追踪选项'
  },
  'tracking.manage': {
    name: '管理',
    description: '管理追踪设置'
  },
  'tracking.custom': {
    name: '自定义追踪',
    description: '设置自定义追踪和提及'
  },
  'tracking.custom.add': {
    name: 'add',
    description: '以逗号分隔的要添加的跟踪列表。请查看网站。'
  },
  'tracking.custom.remove': {
    name: '移除',
    description: '以逗号分隔的要添加的跟踪列表。请查看网站。'
  },
  'tracking.custom.prepend': {
    name: 'prepend',
    description: 'Requires \'add\' to be specified. Ignored on remove.'
  },
  'tracking.custom.channel': {
    name: 'channel',
    description: 'Channel (text-based) that this should apply to.'
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
    name: '移除',
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
  }
};