// notes for translators:
// - name fields must match the regex:
//   ^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$
export default {
  alerts: {
    name: 'тревоги',
    description: 'Показывает текущие Тревоги'
  },
  arbi: {
    name: 'арбитраж',
    description: 'Показывает текущий Арбитраж'
  },
  baro: {
    name: 'баро',
    description: 'Показывает текущие предложения Торговца Бездны'
  },
  conclave: {
    name: 'конклав',
    description: 'Показывает текущие испытания Конклава'
  },
  construction: {
    name: 'строительство',
    description: 'Покавает текущий прогресс строительства'
  },
  cycle: {
    name: 'цикл',
    description: 'Показывает текущий цикл локации'
  },
  darvo: {
    name: 'дарво',
    description: 'Показывает текущее предложение Дарво'
  },
  events: {
    name: 'события',
    description: 'Показывает текущие особые События'
  },
  fissures: {
    name: 'разрывы',
    description: 'Показывает текущие Разрывы Бездны'
  },
  invasions: {
    name: 'вторжения',
    description: 'Показывает текущие Вторжения'
  },
  news: {
    name: 'новости',
    description: 'Показывает последние Новости'
  },
  nightwave: {
    name: 'волна',
    description: 'Показывает текущие испытания Ночной Волны'
  },
  sales: {
    name: 'скидки',
    description: 'Показывает текущие Скидки'
  },
  outposts: {
    name: 'корабль_вр',
    description: 'Показывает текущее местоположения корабля ВР'
  },
  steelpath: {
    name: 'сталь',
    description: 'Показывает текущие предложения Тешина'
  },
  sortie: {
    name: 'вылазка',
    description: 'Показывает текущую Вылазку'
  },
  rooms: {
    name: 'каналы',
    description: 'Настройки вашего отдельного канала'
  },
  'rooms.create': {
    name: 'создать',
    description: 'Создаёт вам отдельный канал'
  },
  'rooms.destroy': {
    name: 'удалить',
    description: 'Удаляет ваш отдельный канал'
  },
  'rooms.hide': {
    name: 'скрыть',
    description: 'Скрывает ваш отдельный канал'
  },
  'rooms.show': {
    name: 'отобразить',
    description: 'Включает отображение вашего отдельного канала'
  },
  'rooms.lock': {
    name: 'закрыть',
    description: 'Закрывает для других ваш отдельный канал'
  },
  'rooms.unlock': {
    name: 'открыть',
    description: 'Открывает для других ваш отдельный канал'
  },
  'rooms.lurkable': {
    name: 'lurkable',
    description: 'Make your private room lurkable'
  },
  'rooms.rename': {
    name: 'переименовать',
    description: 'Переименовыват ваш отдельный канал'
  },
  'rooms.invite': {
    name: 'пригласить',
    description: 'Приглашает пользователя в ваш отдельный канал'
  },
  'rooms.block': {
    name: 'заблокировать',
    description: 'Блокирует пользователя доступ в ваш отдельный канал'
  },
  'rooms.resize': {
    name: 'изменить',
    description: 'Изменяет размер вашего отдельного канала'
  },
  templates: {
    name: 'шаблоны',
    description: 'Управление шаблонами каналов'
  },
  'templates.add': {
    name: 'добавить',
    description: 'Добавляет канал как шаблон для создания других каналов'
  },
  'templates.delete': {
    name: 'удалить_шаблон',
    description: 'Удаляет канал из списка шаблонов каналов'
  },
  'templates.list': {
    name: 'список',
    description: 'Показывает список сохранённых шаблонов'
  },
  'templates.set': {
    name: 'выбрать_шаблон',
    description: 'Выбрать шаблон для канала'
  },
  'templates.clear': {
    name: 'сбросить',
    description: 'Сбросить шаблон канала'
  },
  'templates.tc': {
    name: 'сделать_шаблоном',
    description: 'Канал будет использовать в качестве шаблона (голосовой канал)'
  },
  'templates.fmt': {
    name: 'шаблон',
    description: 'Template string. Supports replacing $username with originator\'s username'
  },
  about: {
    name: 'справка',
    description: 'Показывает информацию о боте!'
  },
  ping: {
    name: 'ping',
    description: 'Показывает скорость ответа некоторых сайтов и бота'
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
    name: 'arcane',
    description: 'Look up an Arcane from Warframe'
  },
  warframe: {
    name: 'warframe',
    description: 'Look up a Warframe'
  },
  weapon: {
    name: 'weapon',
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
    name: 'щиты',
    description: 'Calculate Enemy Shield amounts'
  },
  'calc.armor': {
    name: 'броня',
    description: 'Calculate Enemy Armor amounts'
  },
  'calc.health': {
    name: 'здоровье',
    description: 'Calculate Enemy Health amounts'
  },
  settings: {
    name: 'настройки',
    description: 'Interact with Settings'
  },
  'settings.platform': {
    name: 'platform',
    description: 'Set the platform for the channel'
  },
  'settings.set': {
    name: 'выбрать_шаблон',
    description: 'Set a setting'
  },
  'settings.clear': {
    name: 'сбросить',
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
    name: 'tracking',
    description: 'Configure tracking options'
  },
  'tracking.manage': {
    name: 'manage',
    description: 'Manage tracking settings'
  },
  'tracking.custom': {
    name: 'custom',
    description: 'Set up custom trackings and pings'
  },
  'tracking.custom.add': {
    name: 'добавить',
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
  'tracking.custom.clear-prepend': {
    name: 'clear-prepend',
    description: 'Clear prepend for specified "remove" trackables. Won\'t remove them from tracking.'
  },
  cc: {
    name: 'cc',
    description: 'Manage custom commands'
  },
  'cc.add': {
    name: 'добавить',
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
    name: 'список',
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