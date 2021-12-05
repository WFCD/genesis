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
 * @property {string} [archmelee] archmelee unique id
 * @property {string} [focus] operator focus school name
 * @property {string} [prism] amp prism id
 * @property {string} [necramech] necramech unique Id
 * @property {string} [necragun] necragun unique Id
 * @property {string} [necramelee] necramelee unique Id
 * @property {Array<string>} [mods] List of mod Ids
 * @property {User} [owner] User that owns (created) this build
 */

/**
 * Build Resolvable
 * @typedef {SimpleBuild|Build|FullBuild} BuildResolvable
 */

const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const typecheck = val => (typeof val === 'undefined' ? undefined : val);

/**
 * Build Mod
 * @typedef {Object} BuildMod
 * @property {string} target one of the build parts
 * @property {Array<ItemResolvable>} mods for that build part
 */
class Mod {
  /**
   * Mod Target
   * @type {string}
   */
  #target;
  /**
   * List of mod objects
   * @type Array<ItemResolvable>
   */
  #mods;

  /**
   * @type {WorldStateClient}
   */
  #ws;

  constructor({ target, mods }, ws) {
    this.#target = target;
    this.#mods = mods?.flat()?.map((mod) => {
      if (mod.uniqueName) return mod;
      return ws.mod(mod);
    });
    this.#ws = ws;
  }

  serialize() {
    return {
      target: this.#target,
      mods: this.#mods.flat().map(mod => mod.uniqueName).filter(m => m),
    };
  }

  /**
   * Get the list of mods
   * @returns {Array<BuildResolvable>}
   */
  get mods() {
    return this.#mods;
  }

  /**
   * Target
   * @returns {string}
   */
  get target() {
    return this.#target;
  }
}

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
   * @type {ItemResolvable}
   */
  #archmelee;
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
  #necramelee;
  #necragun;
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

  get primus() {
    return this.#primary;
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

  get archmelee() {
    return this.#archmelee;
  }

  set archmelee(value) {
    this.#archmelee = this.#resolve(value, 'weapon');
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

  get necragun() {
    return this.#necragun;
  }

  set necragun(value) {
    this.#necragun = this.#necragun(value, 'weapon');
  }

  get necramelee() {
    return this.#necramelee;
  }

  set necramelee(value) {
    this.#necramelee = this.#resolve(value, 'weapon');
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
    this.#archmelee = this.#resolve(data.archmelee, 'weapon');
    this.#focus = data.focus;
    this.#prism = this.#resolve(data.prism, 'weapon');
    this.#necramech = this.#resolve(data.necramech, 'warframe');
    this.#necragun = this.#resolve(data.necragun, 'weapon');
    this.#necramelee = this.#resolve(data.necramelee, 'weapon');
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
    if (!item) return undefined;
    if (item.uniqueName) return item;
    switch (type) {
      case 'weapon':
        return this.#ws.weapon(item)?.[0];
      case 'warframe':
        return this.#ws.warframe(item)?.[0];
      case 'mods':
        if (Array.isArray(item)) {
          return item.map((m) => {
            if (m.target) {
              return new Mod({
                target: m.target,
                mods: m.mods?.map(sub => (sub.uniqueName ? sub : this.#ws.mod(sub))) || [],
              }, this.#ws);
            }
            return this.#ws.mod(m.mods);
          });
        }
        try {
          return this.#resolve(JSON.parse(item), 'mods');
        } catch (ignored) {
          return this.#ws.mod(item);
        }
    }
    return undefined;
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
      warframe: typecheck(this.#warframe?.uniqueName || this.#warframe),
      primus: typecheck(this.#primary?.uniqueName || this.#primary),
      secondary: typecheck(this.#secondary?.uniqueName || this.#secondary),
      melee: typecheck(this.#melee?.uniqueName || this.#melee),
      heavy: typecheck(this.#heavy?.uniqueName || this.#heavy),
      archwing: typecheck(this.#archwing?.uniqueName || this.#archwing),
      archgun: typecheck(this.#archgun?.uniqueName || this.#archgun),
      focus: typecheck(this.#focus),
      prism: typecheck(this.#prism?.uniqueName || this.#prism),
      necramech: typecheck(this.#necramech?.uniqueName || this.#necramech),
      necramelee: typecheck(this.#necramelee?.uniqueName || this.#necramelee),
      mods: this.#mods?.map(m => m.serialize()) || [],
    };
  }
};
