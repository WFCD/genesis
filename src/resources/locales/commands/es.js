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
    description: 'Consigue el progreso de la construcción'
  },
  cycle: {
    name: 'ciclo',
    description: 'Obtener ciclo de tiempo actual'
  },
  darvo: {
    name: 'darvo',
    description: 'Ofertas de Darvo'
  },
  events: {
    name: 'eventos',
    description: 'Obtener eventos activos'
  },
  fissures: {
    name: 'fisuras',
    description: 'Obtener fisuras de WorldState'
  },
  invasions: {
    name: 'invasiones',
    description: 'Obtener Invasiones de WorldState'
  },
  news: {
    name: 'noticias',
    description: 'Obtener noticias actuales'
  },
  nightwave: {
    name: 'onda nocturna',
    description: 'Obtén los desafíos actuales de Onda Nocturna'
  },
  sales: {
    name: 'ofertas',
    description: 'Obtener ofertas actuales'
  },
  outposts: {
    name: 'outposts',
    description: 'Obtener salidas actuales de concientes'
  },
  steelpath: {
    name: 'camino de acero',
    description: 'Obtén ofertas actuales en la Ruta del Acero'
  },
  sortie: {
    name: 'incursion',
    description: 'Obtener información de la incursión'
  },
  rooms: {
    name: 'salas',
    description: 'Administra tu sala privada'
  },
  'rooms.create': {
    name: 'crear',
    description: 'Crea tu propia sala'
  },
  'rooms.destroy': {
    name: 'destruir',
    description: 'Elimine su sala'
  },
  'rooms.hide': {
    name: 'ocultar',
    description: 'Esconde tu sala privada'
  },
  'rooms.show': {
    name: 'mostrar',
    description: 'Mostrar tu sala privada'
  },
  'rooms.lock': {
    name: 'bloquear',
    description: 'Bloquea tu sala privada'
  },
  'rooms.unlock': {
    name: 'desbloquear',
    description: 'Desbloquea tu sala privada'
  },
  'rooms.lurkable': {
    name: 'lurkable',
    description: 'Haz que tu sala privada sea acechable'
  },
  'rooms.rename': {
    name: 'renombrar',
    description: 'Renombrar tu sala privada'
  },
  'rooms.invite': {
    name: 'invitar',
    description: 'Hide your private room'
  },
  'rooms.block': {
    name: 'block',
    description: 'Bloquea a alguien de tu sala privada'
  },
  'rooms.resize': {
    name: 'resize',
    description: 'redimensionar sala privada'
  },
  templates: {
    name: 'templates',
    description: 'Administrar plantillas de canal'
  },
  'templates.add': {
    name: 'añadir',
    description: 'Añadir un canal como un canal de plantilla.'
  },
  'templates.delete': {
    name: 'borrar',
    description: 'Eliminar un canal de tus canales de plantillas'
  },
  'templates.list': {
    name: 'lista',
    description: 'Listar todas las plantillas configuradas'
  },
  'templates.set': {
    name: 'poner',
    description: 'Establecer la plantilla para un canal de plantilla'
  },
  'templates.clear': {
    name: 'limpiar',
    description: 'borrar patrón de plantilla existente en un canal'
  },
  'templates.tc': {
    name: 'canal_plantilla',
    description: 'Canal a usar como plantilla (debe ser un canal de voz)'
  },
  'templates.fmt': {
    name: 'plantilla',
    description: 'Cadena de plantilla. Soporta reemplazar $username con el nombre de usuario del creador'
  },
  about: {
    name: 'acerca de',
    description: '¡Cuéntame sobre el bot!'
  },
  ping: {
    name: 'ping',
    description: 'ping de algunas cosas'
  },
  whereis: {
    name: 'donde',
    description: 'Mostrar donde algo cae'
  },
  query: {
    name: 'consulta',
    description: '¿Qué estás buscando?'
  },
  whatsin: {
    name: 'qué hay',
    description: 'Obtener varias piezas de información'
  },
  'whatsin.query': {
    name: 'consulta',
    description: 'Identificador de Reliquia (por ejemplo, A1)'
  },
  pc: {
    // pricecheck
    name: 'pc',
    description: 'Comprobar precio de un artículo'
  },
  platform: {
    name: 'plataforma',
    description: 'Plataforma en la que operar'
  },
  patchnotes: {
    name: 'notas de parche',
    description: '¿Incluye notas de parche? (por defecto falso)'
  },
  lookup: {
    name: 'búsqueda',
    description: 'Obtener varias piezas de información'
  },
  arcane: {
    name: 'arcano',
    description: 'Mira un Arcano desde un Warframe'
  },
  warframe: {
    name: 'warframe',
    description: 'Buscar un warframe'
  },
  weapon: {
    name: 'arma',
    description: 'Mira un arma'
  },
  riven: {
    name: 'agrietado',
    description: 'Buscar un agrietado'
  },
  mod: {
    name: 'mod',
    description: 'Buscar un Mod'
  },
  companion: {
    name: 'compañero',
    description: 'Buscar un compañero'
  },
  lfg: {
    name: 'lfg',
    description: 'Crear un post de LFG'
  },
  'lfg.place': {
    name: 'lugar',
    description: '¿Dónde quieres agruparte?'
  },
  'lfg.place.custom': {
    name: 'ubicar_personalizado',
    description: 'Área específica a la que quieres ir'
  },
  'lfg.time': {
    name: 'tiempo',
    description: '¿Durante cuánto tiempo quieres farmear?'
  },
  'lfg.members': {
    name: 'miembros',
    description: '¿Cuántas personas necesitas?'
  },
  'lfg.for': {
    name: 'para',
    description: '¿Para qué está usted farmeando?'
  },
  'lfg.for.custom': {
    name: 'para _personalizado',
    description: 'Algo personalizado para lo que quieres recolectar'
  },
  'lfg.duration': {
    name: 'duración',
    description: '¿Cuánto tiempo estás dispuesto a esperar?'
  },
  'lfg.type': {
    name: 'tipo',
    description: '¿Qué tipo de post?'
  },
  calc: {
    name: 'calc',
    description: 'Obtener información mundial de un Warframe'
  },
  'calc.shields': {
    name: 'escudos',
    description: 'Calcular cantidades de Escudo Enemigo'
  },
  'calc.armor': {
    name: 'armadura',
    description: 'Calcular cantidades de armadura enemiga'
  },
  'calc.health': {
    name: 'salud',
    description: 'Calcular cantidades de salud del enemigo'
  },
  settings: {
    name: 'ajustes',
    description: 'Interactuar con ajustes'
  },
  'settings.platform': {
    name: 'plataforma',
    description: 'Set the platform for the channel'
  },
  'settings.set': {
    name: 'poner',
    description: 'Set a setting'
  },
  'settings.clear': {
    name: 'limpiar',
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
    name: 'añadir',
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
    name: 'añadir',
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
    name: 'lista',
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