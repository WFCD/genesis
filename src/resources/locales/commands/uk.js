// notes for translators:
// - name fields must match the regex:
//   ^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$
export default {
  alerts: {
    name: 'виклики',
    description: 'Отримати дані про виклики'
  },
  arbi: {
    name: 'арбітраж',
    description: 'Отримати дані про арбітраж'
  },
  archons: {
    name: 'архонти',
    description: 'Отримати дані про архонтові лови'
  },
  baro: {
    name: 'баро',
    description: 'Отримати дані про оферти Торговця із Порожнечі'
  },
  conclave: {
    name: 'конклав',
    description: 'Отримати дані про поточні випробування Конклаву'
  },
  construction: {
    name: 'будівництво',
    description: 'Отримати дані про поступ будівництва'
  },
  cycle: {
    name: 'цикл',
    description: 'Отримати дані про поточний цикл часу локацій'
  },
  darvo: {
    name: 'дарво',
    description: 'Отримати дані про розпродаж у Дарво'
  },
  events: {
    name: 'події',
    description: 'Отримати дані про поточні події'
  },
  fissures: {
    name: 'прориви',
    description: 'Отримати дані про поточні прориви Порожнечі'
  },
  invasions: {
    name: 'вторгнення',
    description: 'Отримати дані про поточні вторгнення'
  },
  news: {
    name: 'новини',
    description: 'Показати поточні новини'
  },
  nightwave: {
    name: 'нічна_хвиля',
    description: 'Отримати дані про поточні випробування Нічної Хвилі'
  },
  sales: {
    name: 'знижки',
    description: 'Отримати дані про поточні знижки'
  },
  outposts: {
    name: 'аномалія_свідомих',
    description: 'Отримати дані про розміщення мюрекса свідомих'
  },
  steelpath: {
    name: 'шлях_сталі',
    description: 'Отримати дані відзнак «Шляху сталі»'
  },
  sortie: {
    name: 'вилазка',
    description: 'Отримати дані про активну вилазку'
  },
  rooms: {
    name: 'кімната',
    description: 'Керування особистою кімнатою'
  },
  'rooms.create': {
    name: 'створити',
    description: 'Створити особисту кімнату'
  },
  'rooms.destroy': {
    name: 'знищити',
    description: 'Знищити особисту кімнату'
  },
  'rooms.hide': {
    name: 'приховати',
    description: 'Приховати особисту кімнату'
  },
  'rooms.show': {
    name: 'показати',
    description: 'Показати особисту кімнату'
  },
  'rooms.lock': {
    name: 'зачинити',
    description: 'Закрити доступ до особистої кімнати'
  },
  'rooms.unlock': {
    name: 'відчинити',
    description: 'Відкрити доступ до особистої кімнати'
  },
  'rooms.lurkable': {
    name: 'lurkable',
    description: 'Make your private room lurkable'
  },
  'rooms.rename': {
    name: 'перейменувати',
    description: 'Змінити назву приватної кімнати'
  },
  'rooms.invite': {
    name: 'запросити',
    description: 'Запросити когось до приватної кімнати'
  },
  'rooms.block': {
    name: 'заблокувати',
    description: 'Заблокувати доступ до приватної кімнати'
  },
  'rooms.resize': {
    name: 'змінити',
    description: 'Змінити розмір приватної кімнати'
  },
  templates: {
    name: 'шаблон',
    description: 'Керування шаблонами каналів'
  },
  'templates.add': {
    name: 'додати',
    description: 'Додати канал у вигляді шаблону каналів.'
  },
  'templates.delete': {
    name: 'видалити',
    description: 'Видалення каналу як шаблону каналів'
  },
  'templates.list': {
    name: 'список',
    description: 'Список усіх налаштованих шаблонів'
  },
  'templates.set': {
    name: 'встановити',
    description: 'Встановлює шаблон для каналу'
  },
  'templates.clear': {
    name: 'очистити',
    description: 'Очистити чинний шаблон каналу'
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
    name: 'налаштування',
    description: 'Interact with Settings'
  },
  'settings.platform': {
    name: 'platform',
    description: 'Set the platform for the channel'
  },
  'settings.set': {
    name: 'встановити',
    description: 'Set a setting'
  },
  'settings.clear': {
    name: 'очистити',
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
    name: 'мова',
    description: 'Встановити мову для сервера'
  },
  'settings.language.str': {
    name: 'value',
    description: 'Яку мову ви бажаєте використовувати на сервері?'
  },
  'settings.ephemerate': {
    name: 'видимість_повідомлень',
    description: 'Змінити видимість повідомлень від команд (типове значення параметра — True)'
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
    name: 'додати',
    description: 'Comma-separated list of trackables to add. See website.'
  },
  'tracking.custom.remove': {
    name: 'видалити',
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
    name: 'кк',
    description: 'Керування користувацькими командами'
  },
  'cc.add': {
    name: 'додати',
    description: 'Додавання користувацьких команд'
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
    name: 'видалити',
    description: 'Видаляє користувацьку команду'
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