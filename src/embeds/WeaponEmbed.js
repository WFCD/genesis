'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { emojify } = require('../CommonFunctions.js');

const dispositions = ['\\⚫\\⚫\\⚫\\⚫\\⚫', '\\⚪\\⚫\\⚫\\⚫\\⚫', '\\⚪\\⚪\\⚫\\⚫\\⚫', '\\⚪\\⚪\\⚪\\⚫\\⚫', '\\⚪\\⚪\\⚪\\⚪\\⚫', '\\⚪\\⚪\\⚪\\⚪\\⚪'];

const mapDamage = attacks => (attacks?.map((a, index) => {
  const damage = Object.entries(a.damage)
    .map(([key, value]) => emojify(`\u2003${key} ${value}`))
    .join('\n');
  return `**${a.name || `Attack ${index + 1}`}**\n${damage}`;
}) || [])
  .join('\n');

module.exports = class WeaponEmbed extends BaseEmbed {
  constructor(weapon, { i18n, locale }) {
    super(locale);
    if (weapon && typeof weapon !== 'undefined') {
      this.title = weapon.name;
      this.url = weapon.wikiaUrl || '';
      this.thumbnail = { url: weapon.wikiaThumbnail || '' };
      this.description = `${weapon.type} • ${weapon.masteryReq} ${emojify('mastery_rank')}`;
      this.color = weapon.color || 0x7C0A02;
      this.fields = [];

      if (weapon.color) {
        this.color = weapon.color;
      }

      this.fields.push({
        name: i18n`Rate`,
        value: `${String((weapon.fireRate || 0).toFixed(0) || '-')} unit\\s`,
        inline: true,
      }, ...(weapon.attacks ? [{
        name: 'Damage',
        value: mapDamage(weapon.attacks),
        inline: false,
      }] : []), {
        name: i18n`Critical Chance`,
        value: `${((weapon.criticalChance) * 100).toFixed(2) || '-'}%`,
        inline: true,
      },
      {
        name: i18n`Critical Multiplier`,
        value: `${(weapon.criticalMultiplier || 0).toFixed(2) || '-'}x`,
        inline: true,
      },
      {
        name: i18n`Status Chance`,
        value: `${((weapon.procChance || 0) * 100).toFixed(2) || '-'}%`,
        inline: true,
      },
      {
        name: i18n`Polarities`,
        value: emojify(weapon.polarities && weapon.polarities.length ? weapon.polarities.join(' ') : '-'),
        inline: true,
      });
      if (weapon.stancePolarity) {
        this.fields.push({
          name: i18n`Stance Polarity`,
          value: emojify(weapon.stancePolarity || '-'),
          inline: true,
        });
      }

      if (weapon.secondary) {
        const values = [];
        if (weapon.secondary.trigger) {
          values.push(i18n`**Trigger:** ${weapon.secondary.trigger || '-'}`);
        }
        if (weapon.secondary.shot_type) {
          values.push(i18n`**Projectile:** ${weapon.secondary.shot_type}`);
        }
        if (weapon.secondary.rate) {
          values.push(i18n`**Rate:** ${weapon.secondary.rate}`);
        }
        if (weapon.secondary.flight) {
          values.push(i18n`**Flight:**: ${weapon.secondary.flight}m\\s`);
        }
        if (weapon.secondary.noise) {
          values.push(i18n`**Noise:** ${weapon.secondary.noise}`);
        }
        if (weapon.secondary.accuracy) {
          values.push(i18n`**Accuracy:** ${weapon.secondary.accuracy}`);
        }
        if (weapon.secondary.reload) {
          values.push(i18n`**Reload:** ${weapon.secondary.reload}`);
        }
        if (weapon.secondary.damage) {
          values.push(i18n`**Damage:** ${emojify(weapon.secondary.damage || '-')}`);
        }
        if (weapon.secondary.impact) {
          values.push(i18n`**Impact:** ${weapon.secondary.impact}`);
        }
        if (weapon.secondary.puncture) {
          values.push(i18n`**Puncture:** ${weapon.secondary.puncture}`);
        }
        if (weapon.secondary.slash) {
          values.push(i18n`**Slash:** ${weapon.secondary.slash}`);
        }
        if (weapon.secondary.crit_chance) {
          values.push(i18n`**Critical Chance:** ${(weapon.secondary.crit_chance || 0).toFixed(2) || '-'}%`);
        }
        if (weapon.secondary.crit_mult) {
          values.push(i18n`**Critical Multiplier:** ${(weapon.secondary.crit_mult || 0).toFixed(2) || '-'}x`);
        }
        if (weapon.secondary.status_chance) {
          values.push(i18n`**Status Chance:** ${((weapon.secondary.status_chance || 0) * 100).toFixed(2) || '-'}%`);
        }

        this.fields.push({
          name: weapon.secondary.name || i18n`Secondary Fire`,
          value: values.join('\n') || '--',
          inline: true,
        });
      }

      if (weapon.noise) {
        this.fields.push({
          name: i18n`Noise Level`,
          value: String(weapon.noise),
          inline: true,
        });
      }

      if (weapon.projectile) {
        this.fields.push({
          name: i18n`Projectile`,
          value: String(weapon.projectile),
          inline: true,
        });
      }
      if (weapon.trigger) {
        this.fields.push({
          name: i18n`Trigger Type`,
          value: weapon.trigger,
          inline: true,
        });
      }

      if (weapon.flight) {
        this.fields.push({
          name: i18n`Flight Speed`,
          value: `${weapon.flight || '0'}m\\s`,
          inline: true,
        });
      }
      if (weapon.magazineSize) {
        this.fields.push({
          name: i18n`Magazine Size`,
          value: String(weapon.magazineSize),
          inline: true,
        });
      }
      if (weapon.ammo) {
        this.fields.push({
          name: i18n`Ammo Max`,
          value: String(weapon.ammo),
          inline: true,
        });
      }
      if (weapon.accuracy) {
        this.fields.push({
          name: i18n`Accuracy`,
          value: String(weapon.accuracy),
          inline: true,
        });
      }
      if (weapon.reload) {
        this.fields.push({
          name: i18n`Reload Speed`,
          value: `${(weapon.reloadTime || 0).toFixed(1) || '-'}s`,
          inline: true,
        });
      }
      if (weapon.disposition) {
        this.fields.push({
          name: i18n`Riven Disposition`,
          value: `${dispositions[weapon.disposition]} (${Number(weapon.omegaAttenuation).toFixed(2)})`,
          inline: true,
        });
      }
    } else {
      this.title = i18n`Invalid Query`;
      this.color = 0xff6961;
      this.footer = undefined;
    }
  }
};
