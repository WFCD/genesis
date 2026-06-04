import type { User } from 'discord.js';

import type WorldStateClient from '#shared/utilities/WorldStateClient';

type WsItem = { uniqueName?: string };

type ItemResolvable = string | WsItem | ItemResolvable[] | undefined;

export type SimpleBuild = {
  title: string;
  id: string;
  body: string;
  url?: string;
  owner?: User | string;
  ownerId?: string;
  isPublic?: boolean;
};

export type BuildData = SimpleBuild & {
  build_id?: string;
  image?: string;
  owner_id?: string;
  is_public?: boolean | string;
  warframe?: ItemResolvable;
  primary?: ItemResolvable;
  primus?: ItemResolvable;
  secondary?: ItemResolvable;
  melee?: ItemResolvable;
  heavy?: ItemResolvable;
  archwing?: ItemResolvable;
  archgun?: ItemResolvable;
  archmelee?: ItemResolvable;
  focus?: string;
  prism?: ItemResolvable;
  necramech?: ItemResolvable;
  necragun?: ItemResolvable;
  necramelee?: ItemResolvable;
  mods?: ItemResolvable | string;
};

export type BuildResolvable = SimpleBuild | Build | BuildData;

const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const typecheck = <T>(val: T | undefined) => (typeof val === 'undefined' ? undefined : val);

type ModInput = {
  target: string;
  mods?: ItemResolvable[];
};

class Mod {
  #target: string;

  #mods: WsItem[];

  #ws: WorldStateClient;

  constructor({ target, mods }: ModInput, ws: WorldStateClient) {
    this.#target = target;
    this.#mods =
      mods?.flat()?.map((mod) => {
        if (mod && typeof mod === 'object' && 'uniqueName' in mod && mod.uniqueName) return mod as WsItem;
        return ws.mod(String(mod)) as WsItem;
      }) ?? [];
    this.#ws = ws;
  }

  serialize() {
    return {
      target: this.#target,
      mods: this.#mods
        .flat()
        .map((mod) => mod.uniqueName)
        .filter((m) => m),
    };
  }

  get mods() {
    return this.#mods;
  }

  get target() {
    return this.#target;
  }
}

/** Warframe build with equipment slots and mod loadouts. */
export default class Build {
  #ws: WorldStateClient;

  #id: string;

  #title: string;

  #body: string;

  #url: string;

  #owner: User | string;

  #isPublic: boolean | string | undefined;

  #warframe: WsItem | undefined;

  #primary: WsItem | undefined;

  #secondary: WsItem | undefined;

  #melee: WsItem | undefined;

  #heavy: WsItem | undefined;

  #archwing: WsItem | undefined;

  #archgun: WsItem | undefined;

  #archmelee: WsItem | undefined;

  #focus: string | undefined;

  #prism: WsItem | undefined;

  #necramech: WsItem | undefined;

  #necramelee: WsItem | undefined;

  #necragun: WsItem | undefined;

  #mods: Mod[] | WsItem | undefined;

  get title() {
    return this.#title;
  }

  set title(value: string) {
    this.#title = value;
  }

  get body() {
    return this.#body;
  }

  set body(value: string) {
    this.#body = value;
  }

  get url() {
    return this.#url;
  }

  set url(value: string) {
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

  set warframe(value: ItemResolvable) {
    this.#warframe = this.#resolveItem(value, 'warframe');
  }

  get primary() {
    return this.#primary;
  }

  set primary(value: ItemResolvable) {
    this.#primary = this.#resolveItem(value, 'weapon');
  }

  get primus() {
    return this.#primary;
  }

  get secondary() {
    return this.#secondary;
  }

  set secondary(value: ItemResolvable) {
    this.#secondary = this.#resolveItem(value, 'weapon');
  }

  get melee() {
    return this.#melee;
  }

  set melee(value: ItemResolvable) {
    this.#melee = this.#resolveItem(value, 'weapon');
  }

  get heavy() {
    return this.#heavy;
  }

  set heavy(value: ItemResolvable) {
    this.#heavy = this.#resolveItem(value, 'weapon');
  }

  get archwing() {
    return this.#archwing;
  }

  set archwing(value: ItemResolvable) {
    this.#archwing = this.#resolveItem(value, 'warframe');
  }

  get archgun() {
    return this.#archgun;
  }

  set archgun(value: ItemResolvable) {
    this.#archgun = this.#resolveItem(value, 'weapon');
  }

  get archmelee() {
    return this.#archmelee;
  }

  set archmelee(value: ItemResolvable) {
    this.#archmelee = this.#resolveItem(value, 'weapon');
  }

  get focus() {
    return this.#focus;
  }

  set focus(value: string) {
    this.#focus = value;
  }

  get prism() {
    return this.#prism;
  }

  set prism(value: ItemResolvable) {
    this.#prism = this.#resolveItem(value, 'weapon');
  }

  get necramech() {
    return this.#necramech;
  }

  set necramech(value: ItemResolvable) {
    this.#necramech = this.#resolveItem(value, 'warframe');
  }

  get necragun() {
    return this.#necragun;
  }

  set necragun(value: ItemResolvable) {
    this.#necragun = this.#resolveItem(value, 'weapon');
  }

  get necramelee() {
    return this.#necramelee;
  }

  set necramelee(value: ItemResolvable) {
    this.#necramelee = this.#resolveItem(value, 'weapon');
  }

  get mods(): Mod[] | WsItem | undefined {
    return this.#mods;
  }

  set mods(value: ItemResolvable) {
    this.#mods = this.#resolveMods(value);
  }

  static focii = [
    { name: 'Madurai', value: 'madurai' },
    { name: 'Vazarin', value: 'vazarin' },
    { name: 'Naramon', value: 'naramon' },
    { name: 'Unairu', value: 'unairu' },
    { name: 'Zenurik', value: 'zenurik' },
  ];

  static makeId(len = 8) {
    const tokens = [];
    for (let i = 0; i < len; i += 1) {
      tokens.push(possible.charAt(Math.floor(Math.random() * possible.length)));
    }
    return tokens.join('');
  }

  constructor(data: BuildData | BuildResolvable, ws: WorldStateClient) {
    const row = data as BuildData;
    this.#ws = ws;

    this.#id = row.id || row.build_id;
    this.#title = row.title;
    this.#body = row.body;
    this.#url = row.url || row.image;
    this.#owner = row.owner || row.owner_id || row.ownerId;
    this.#isPublic = row.isPublic || row.is_public;
    this.#warframe = this.#resolveItem(row.warframe, 'warframe');
    this.#primary = this.#resolveItem(row.primary || row.primus, 'weapon');
    this.#secondary = this.#resolveItem(row.secondary, 'weapon');
    this.#melee = this.#resolveItem(row.melee, 'weapon');
    this.#heavy = this.#resolveItem(row.heavy, 'weapon');
    this.#archwing = this.#resolveItem(row.archwing, 'warframe');
    this.#archgun = this.#resolveItem(row.archgun, 'weapon');
    this.#archmelee = this.#resolveItem(row.archmelee, 'weapon');
    this.#focus = row.focus;
    this.#prism = this.#resolveItem(row.prism, 'weapon');
    this.#necramech = this.#resolveItem(row.necramech, 'warframe');
    this.#necragun = this.#resolveItem(row.necragun, 'weapon');
    this.#necramelee = this.#resolveItem(row.necramelee, 'weapon');
    this.#mods = this.#resolveMods(row.mods);
  }

  #resolveItem(item: ItemResolvable, type: 'weapon' | 'warframe'): WsItem | undefined {
    if (!item) return undefined;
    if (typeof item === 'object' && !Array.isArray(item) && 'uniqueName' in item && item.uniqueName) {
      return item as WsItem;
    }
    if (type === 'weapon') {
      return this.#ws.weapon(String(item))?.[0] as WsItem | undefined;
    }
    return this.#ws.warframe(String(item))?.[0] as WsItem | undefined;
  }

  #resolveMods(item: ItemResolvable): Mod[] | WsItem | undefined {
    if (!item) return undefined;
    if (Array.isArray(item)) {
      return item.map((m) => {
        if (m && typeof m === 'object' && 'target' in m) {
          const modRow = m as ModInput;
          return new Mod(
            {
              target: modRow.target,
              mods:
                modRow.mods?.map((sub) =>
                  sub && typeof sub === 'object' && 'uniqueName' in sub && sub.uniqueName
                    ? (sub as WsItem)
                    : (this.#ws.mod(String(sub)) as WsItem)
                ) || [],
            },
            this.#ws
          );
        }
        return this.#ws.mod(String((m as ModInput).mods)) as WsItem;
      }) as unknown as Mod[];
    }
    try {
      return this.#resolveMods(JSON.parse(String(item)));
    } catch {
      return this.#ws.mod(String(item)) as WsItem;
    }
  }

  toJson() {
    const ownerId =
      (typeof this.#owner === 'object' && this.#owner && 'id' in this.#owner ? this.#owner.id : undefined) ||
      (typeof this.#owner === 'string' ? this.#owner : undefined);
    return {
      id: this.#id,
      title: typecheck(this.#title) || '',
      body: typecheck(this.#body) || '',
      image: typecheck(this.#url) || 'https://cdn.warframestat.us/genesis/img/outage.png',
      owner_id: ownerId,
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
      mods: Array.isArray(this.#mods) ? this.#mods.map((m) => (m instanceof Mod ? m.serialize() : m)) : [],
    };
  }
}
