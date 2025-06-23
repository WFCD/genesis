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
    name: 'onda_nocturna',
    description: 'Obtén los desafíos actuales de Onda Nocturna'
  },
  sales: {
    name: 'ofertas',
    description: 'Obtener ofertas actuales'
  },
  outposts: {
    name: 'puesto_avanzado',
    description: 'Obtener salidas actuales de concientes'
  },
  steelpath: {
    name: 'camino_de_acero',
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
    name: 'cerrar',
    description: 'Bloquea tu sala privada'
  },
  'rooms.unlock': {
    name: 'abrir',
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
    name: 'bloquear',
    description: 'Bloquea a alguien de tu sala privada'
  },
  'rooms.resize': {
    name: 'cambiar_tamaño',
    description: 'redimensionar sala privada'
  },
  templates: {
    name: 'plantilla',
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
    name: 'acerca_de',
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
    name: 'qué_hay',
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
    name: 'notas_de_parche',
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
    name: 'para_personalizado',
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
    description: 'Establecer la plataforma para el canal'
  },
  'settings.set': {
    name: 'poner',
    description: 'Establecer un ajuste'
  },
  'settings.clear': {
    name: 'limpiar',
    description: 'Borrar ciertos ajustes'
  },
  'settings.get': {
    name: 'get',
    description: 'Obtener todos los ajustes'
  },
  'settings.get.channel': {
    name: 'canal',
    description: 'Debe ser un canal de texto'
  },
  'settings.diag': {
    name: 'diag',
    description: 'Ejecutar diagnóstico para el gremio'
  },
  'settings.lfg': {
    name: 'lfg',
    description: 'Establecer canal LFG para una plataforma'
  },
  'settings.lfg.channel': {
    name: 'canal',
    description: 'Canal en el que colocar LFG'
  },
  'settings.allow_custom': {
    name: 'permitir_personalizar',
    description: 'Establecer permiso de comandos personalizados'
  },
  'settings.allow_custom.bool': {
    name: 'valor',
    description: '¿Este canal debería permitir comandos personalizados?'
  },
  'settings.allow_inline': {
    name: 'permitir_enlínea',
    description: 'Establecer permisos de comandos en línea'
  },
  'settings.allow_inline.bool': {
    name: 'valor',
    description: '¿Este canal debería permitir comandos en línea?'
  },
  'settings.language': {
    name: 'idioma',
    description: 'Establecer un idioma para el servidor'
  },
  'settings.language.str': {
    name: 'valor',
    description: '¿Qué idioma quieres usar para este servidor?'
  },
  'settings.ephemerate': {
    name: 'efímero',
    description: 'Si los mensajes de los comandos de barra slash serán públicos (Verdadero de forma predeterminada)'
  },
  'settings.elevated_roles': {
    name: 'roles_elevados',
    description: 'Establecer roles elevados'
  },
  'settings.elevated_roles.str': {
    name: 'valor',
    description: '¿Qué roles se elevan?'
  },
  'settings.allow_rooms': {
    name: 'permitir_salas',
    description: 'Establecer si permitir o no crear salas personalizadas'
  },
  'settings.allow_rooms.bool': {
    name: 'valor',
    description: '¿Permitir salas privadas?'
  },
  'settings.auto_locked': {
    name: 'auto_bloqueado',
    description: 'Establecer si se bloquean o no las salas privadas por defecto (True)'
  },
  'settings.auto_locked.bool': {
    name: 'valor',
    description: '¿Bloquear salas privadas?'
  },
  'settings.auto_text': {
    name: 'auto_texto',
    description: 'Establecer si las salas privadas por defecto tienen canales de texto (Falso por defecto)'
  },
  'settings.auto_text.bool': {
    name: 'valor',
    description: '¿Hacer salas con texto?'
  },
  'settings.auto_shown': {
    name: 'auto_mostrado',
    description: 'Establecer si las salas privadas por defecto deben ser visibles (por defecto falso)'
  },
  'settings.auto_shown.bool': {
    name: 'valor',
    description: '¿Hacer visibles las salas?'
  },
  'settings.temp_channel': {
    name: 'canales_temporales',
    description: 'Establecer el canal en el que crear hilos para salas privadas'
  },
  'settings.temp_channel.channel': {
    name: 'valor',
    description: 'Debe ser un canal de texto'
  },
  'settings.temp_category': {
    name: 'categoria_temporal',
    description: 'Establecer la categoría temporal para salas privadas o autogeneradas'
  },
  'settings.temp_category.channel': {
    name: 'valor',
    description: 'Debe ser una categoría'
  },
  'syndicate': {
    name: 'sindicato',
    description: 'Obtener información de sindicato actual para un sindicato determinado'
  },
  tracking: {
    name: 'seguimiento',
    description: 'Configurar opciones de seguimiento'
  },
  'tracking.manage': {
    name: 'administrar',
    description: 'Administrar ajustes de seguimiento'
  },
  'tracking.manage.channel': {
    name: 'canal',
    description: 'Canal (basado en texto) al que debería aplicarse esto.'
  },
  'tracking.manage.thread': {
    name: 'hilo',
    description: 'Hilo de canal en donde enviar mensajes'
  },
  'tracking.custom': {
    name: 'personalizado',
    description: 'Configurar seguimiento y pings personalizados'
  },
  'tracking.custom.add': {
    name: 'añadir',
    description: 'Lista separada por comas de seguimientos para añadir. Ver sitio web.'
  },
  'tracking.custom.remove': {
    name: 'eliminar',
    description: 'Lista separada por comas de seguimiento para eliminar. Ver sitio web.'
  },
  'tracking.custom.prepend': {
    name: 'anteponer',
    description: 'Requiere \'añadir\' para ser especificado. Ignorado al eliminar.'
  },
  'tracking.custom.channel': {
    name: 'canal',
    description: 'Canal (basado en texto) al que debería aplicarse esto.'
  },
  'tracking.custom.thread': {
    name: 'hilo',
    description: 'Hilo de canal en donde enviar mensajes'
  },
  'tracking.custom.clear-prepend': {
    name: 'borrar_anteponer',
    description: 'Elimina el preajuste para el seguimiento "remover" especificado. No los eliminará del seguimiento.'
  },
  cc: {
    name: 'cc',
    description: 'Administrar comandos personalizados'
  },
  'cc.add': {
    name: 'añadir',
    description: 'Añadir un comando personalizado'
  },
  'cc.add.call': {
    name: 'llamar',
    description: 'Establece la llamada de comando para el nuevo comando personalizado'
  },
  'cc.add.response': {
    name: 'respuesta',
    description: 'Establecer a qué responderá la llamada'
  },
  'cc.remove': {
    name: 'eliminar',
    description: 'Eliminar un comando personalizado por nombre'
  },
  'cc.remove.call': {
    name: 'llamar',
    description: '¿Qué llamada a eliminar?'
  },
  'cc.list': {
    name: 'lista',
    description: 'Listar todos los subcomandos de la guild'
  },
  '8ball': {
    name: 'bola8',
    description: '¡Obtén respuesta a tu pregunta de bola 8!'
  },
  '8ball.question': {
    name: 'pregunta',
    description: '¿Qué quieres que responda la máquina de todo el conocimiento?'
  },
  corgi: {
    name: 'corgi',
    description: '¡Obtén una foto de corgi!'
  },
  hug: {
    name: 'abrazo',
    description: 'Consigue un abrazo <3'
  },
  joke: {
    name: 'broma',
    description: '¡Pídele a Génesis una broma!'
  },
  fashion: {
    name: 'moda',
    description: 'Obtén una imagen aleatoria de moda Warframe'
  },
  memeframe: {
    name: 'memeframe',
    description: 'Consigue un meme de Warframe'
  },
  memes: {
    name: 'meme',
    description: 'Obtener un meme de r/dankmemes'
  }
};