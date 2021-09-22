'use strict';

/**
 * Simple Build struct
 * @typedef {Object} SimpleBuild
 * @property {string} title Build title
 * @property {string} id Build identifier
 * @property {string} body build description, supports markdown
 * @property {string} [url] URL to link to for the build
 * @property {User} [owner] User that owns (created) this build
 * @property {string} [ownerId] Id of owner
 * @property {boolean} [isPublic] whether or not this is a public build
 */

/**
 * Full build
 * @typedef {Object} FullBuild
 * @property {string} title Build title
 * @property {string} id Build identifier
 * @property {string} [warframe]
 * @property {string} [primus] primary weapon unique id
 * @property {string} [secondary] secondary weapon unique id
 * @property {string} [melee] melee weapon unique id
 * @property {string} [heavy] heavy weapon unique id
 * @property {string} [archwing] archwing unique id
 * @property {string} [archgun] archgun unique id
 * @property {string} [focus] operator focus school name
 * @property {string} [prism] amp prism id
 * @property {string} [necramech] necramech unique Id
 * @property {Array<string>} [mods] List of mod Ids
 * @property {User} [owner] User that owns (created) this build
 */

const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const typecheck = val => (typeof val === 'undefined' ? null : val);

/**
 * Build object
 */
module.exports = class Build {
  /**
   * @type {WorldStateClient}
   */
  #ws;
  /**
   * @type {string}
   */
  #id;
  /**
   * @type {string}
   */
  #title;
  /**
   * @type {string}
   */
  #body;
  /**
   * @type {string}
   */
  #url;
  /**
   * @type {Discord.User}
   */
  #owner;
  /**
   * @type {boolean}
   */
  #isPublic;
  /**
   * @type {ItemResolvable}
   */
  #warframe;
  /**
   * @type {ItemResolvable}
   */
  #primary;
  /**
   * @type {ItemResolvable}
   */
  #secondary;
  /**
   * @type {ItemResolvable}
   */
  #melee;
  /**
   * @type {ItemResolvable}
   */
  #heavy;
  /**
   * @type {ItemResolvable}
   */
  #archwing;
  /**
   * @type {ItemResolvable}
   */
  #archgun;
  /**
   * @type {string}
   */
  #focus;
  /**
   * @type {ItemResolvable}
   */
  #prism;
  /**
   * @type {ItemResolvable}
   */
  #necramech;
  #mods;

  get title() {
    return this.#title;
  }

  set title(value) {
    this.#title = value;
  }

  get body() {
    return this.#body;
  }

  set body(value) {
    this.#body = value;
  }

  get url() {
    return this.#url;
  }

  set url(value) {
    this.#url = value;
  }

  get id() {
    return this.#id;
  }

  get owner() {
    return this.#owner;
  }

  get isPublic() {
    return this.#isPublic;
  }

  get warframe() {
    return this.#warframe;
  }

  set warframe(value) {
    this.#warframe = this.#resolve(value, 'warframe');
  }

  get primary() {
    return this.#primary;
  }

  set primary(value) {
    this.#primary = this.#resolve(value, 'weapon');
  }

  get secondary() {
    return this.#secondary;
  }

  set secondary(value) {
    this.#secondary = this.#resolve(value, 'weapon');
  }

  get melee() {
    return this.#melee;
  }

  set melee(value) {
    this.#melee = this.#resolve(value, 'weapon');
  }

  get heavy() {
    return this.#heavy;
  }

  set heavy(value) {
    this.#heavy = this.#resolve(value, 'weapon');
  }

  get archwing() {
    return this.#archwing;
  }

  set archwing(value) {
    this.#archwing = this.#resolve(value, 'warframe');
  }

  get archgun() {
    return this.#archgun;
  }

  set archgun(value) {
    this.#archgun = this.#resolve(value, 'weapon');
  }

  get focus() {
    return this.#focus;
  }

  set focus(value) {
    this.#focus = value;
  }

  get prism() {
    return this.#prism;
  }

  set prism(value) {
    this.#prism = this.#resolve(value, 'weapon');
  }

  get necramech() {
    return this.#necramech;
  }

  set necramech(value) {
    this.#necramech = this.#resolve(value, 'warframe');
  }

  get mods() {
    return this.#mods;
  }

  set mods(value) {
    this.#mods = this.#resolve(value, 'mods');
  }

  static focii = [{
    name: 'Madurai',
    value: 'madurai',
  }, {
    name: 'Vazarin',
    value: 'vazarin',
  }, {
    name: 'Naramon',
    value: 'naramon',
  }, {
    name: 'Unairu',
    value: 'unairu',
  }, {
    name: 'Zenurik',
    value: 'zenurik',
  }];

  /**
   * Make an Id
   * @param {number} len desired length of the id
   * @returns {string}
   */
  static makeId(len = 8) {
    const tokens = [];
    for (let i = 0; i < len; i += 1) {
      tokens.push(possible.charAt(Math.floor(Math.random() * possible.length)));
    }
    return tokens.join('');
  }

  /**
   * Build Resolvable
   * @typedef {SimpleBuild|Build|FullBuild} BuildResolvable
   */

  /**
   * Construct a build from data
   * @param {BuildResolvable} data build data
   * @param {WorldStateClient} ws worldstate client
   */
  constructor(data, ws) {
    this.#ws = ws;

    this.#id = data.id || data.build_id;
    this.#title = data.title;
    this.#body = data.body;
    this.#url = data.url || data.image;
    this.#owner = data.owner || data.owner_id || data.ownerId;
    this.#isPublic = data.isPublic || data.is_public;
    this.#warframe = this.#resolve(data.warframe, 'warframe');
    this.#primary = this.#resolve(data.primary || data.primus, 'weapon');
    this.#secondary = this.#resolve(data.secondary, 'weapon');
    this.#melee = this.#resolve(data.melee, 'weapon');
    this.#heavy = this.#resolve(data.heavy, 'weapon');
    this.#archwing = this.#resolve(data.archwing, 'warframe');
    this.#archgun = this.#resolve(data.archgun, 'weapon');
    this.#focus = data.focus;
    this.#prism = this.#resolve(data.prism, 'weapon');
    this.#necramech = this.#resolve(data.necramech, 'warframe');
    this.#mods = this.#resolve(data.mods, 'mods');
  }

  /**
   * Represents something resolvable to a Warframe Item
   * @typedef {Object|string|Array<ItemResolvable>|Array<string>} ItemResolvable
   * @property {string} [id] if this is an object, this will be the id of the item
   */

  /**
   * Resolve a thing from a thing resolveable
   * @param {ItemResolvable} item item resolvable to resolve
   * @param {string} type type of item
   * @returns {Object|{id}|*}
   */
  #resolve (item, type) {
    if (!item) return null;
    if (item.uniqueName) return item;
    switch (type) {
      case 'weapon':
        return this.#ws.weapon(item)?.[0];
      case 'warframe':
        return this.#ws.warframe(item)?.[0];
      case 'mods':
        if (Array.isArray(item)) {
          return item.map(m => this.#resolve(m, 'mods'));
        }
        return this.#ws.mod(item);
    }
    return null;
  }

  /**
   * Return a serialized json object
   * @returns {FullBuild}
   */
  toJson() {
    return {
      id: this.#id,
      title: typecheck(this.#title) || '',
      body: typecheck(this.#body) || '',
      image: typecheck(this.#url) || 'https://cdn.warframestat.us/genesis/img/outage.png',
      owner_id: this.#owner?.id || this.ownerId || this.owner_id,
      is_public: (typeof this.#isPublic === 'undefined' ? false : this.#isPublic) ? '1' : '0',
      warframe: this.#warframe?.uniqueName || this.#warframe,
      primus: this.#primary?.uniqueName || this.#primary,
      secondary: this.#secondary?.uniqueName || this.#secondary,
      melee: this.#melee?.uniqueName || this.#melee,
      heavy: this.#heavy?.uniqueName || this.#heavy,
      archwing: this.#archwing?.uniqueName || this.#archwing,
      archgun: this.#archgun?.uniqueName || this.#archgun,
      focus: typecheck(this.#focus),
      prism: typecheck(this.#prism?.uniqueName || this.#prism),
      necramech: typecheck(this.#necramech?.uniqueName || this.#necramech),
      mods: this.#mods?.map(m => m.name) || null,
    };
  }
};
