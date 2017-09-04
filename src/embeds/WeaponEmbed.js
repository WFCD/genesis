'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const dispositions = ['\\⚫\\⚫\\⚫\\⚫\\⚫', '\\⚪\\⚫\\⚫\\⚫\\⚫', '\\⚪\\⚪\\⚫\\⚫\\⚫', '\\⚪\\⚪\\⚪\\⚫\\⚫', '\\⚪\\⚪\\⚪\\⚪\\⚫', '\\⚪\\⚪\\⚪\\⚪\\⚪'];

/**
 * Generates enemy embeds
 */
class WeaponEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Enhancement} weapon - The enhancement to send info on
   */
  constructor(bot, weapon) {
    super();
    if (weapon && typeof weapon !== 'undefined') {
      this.title = weapon.name;
      this.url = weapon.url || '';
      this.thumbnail = { url: weapon.thumbnail || '' };
      this.description = `${weapon.type} ${weapon.subtype ? `| ${weapon.subtype}` : ''}`;
      this.footer = { text: `Drops from: ${weapon.location}` };
      this.color = weapon.color;
      this.fields = [];

      if (weapon.color) {
        this.color = weapon.color;
      }

      if (weapon.primary) {
        this.fields.push({
          name: 'Primary Fire',
          value: `**Trigger:** ${weapon.primary.trigger}\n` +
          `**Projectile:** ${weapon.primary.projectile}\n` +
          `**Rate:** ${weapon.primary.rate}\n` +
          `**Flight:**: ${weapon.primary.flight || '-'}\n` +
          `**Noise:** ${weapon.primary.noise}\n` +
          `**Accuracy:** ${weapon.primary.accuracy}\n` +
          `**Reload:** ${weapon.primary.reload}\n` +
          `**Damage:** ${weapon.primary.damage}\n` +
          `**Impact:** ${weapon.primary.impact}\n` +
          `**Puncture:** ${weapon.primary.puncture}\n` +
          `**Slash:** ${weapon.primary.slash}\n` +
          `**Critical Chance:** ${weapon.primary.crit_chance}\n` +
          `**Critical Multiplier:** ${weapon.primary.crit_mult}\n` +
          `**Status Chance:** ${weapon.primary.status_chance}`,
          inline: true,
        });
      } else {
        const things = [{
          name: 'Rate',
          value: String(weapon.rate),
          inline: true,
        },
        {
          name: 'Damage',
          value: weapon.damage,
          inline: true,
        },
        {
          name: 'Critical Chance',
          value: weapon.crit_chance,
          inline: true,
        },
        {
          name: 'Critical Multiplier',
          value: weapon.crit_mult,
          inline: true,
        },
        {
          name: 'Status Chance',
          value: weapon.status_chance,
          inline: true,
        },
        {
          name: 'Polarities',
          value: weapon.polarities,
          inline: true,
        }];
        this.fields.push(...things);
      }

      if (weapon.secondary) {
        this.fields.push({
          name: 'Secondary Fire',
          value: `**Trigger:** ${weapon.secondary.trigger}\n` +
          `**Projectile:** ${weapon.secondary.projectile}\n` +
          `**Rate:** ${weapon.secondary.rate}\n` +
          `**Flight:**: ${weapon.secondary.flight || '-'}\n` +
          `**Noise:** ${weapon.secondary.noise}\n` +
          `**Accuracy:** ${weapon.secondary.accuracy}\n` +
          `**Reload:** ${weapon.secondary.reload}\n` +
          `**Damage:** ${weapon.secondary.damage}\n` +
          `**Impact:** ${weapon.secondary.impact}\n` +
          `**Puncture:** ${weapon.secondary.puncture}\n` +
          `**Slash:** ${weapon.secondary.slash}\n` +
          `**Critical Chance:** ${weapon.secondary.crit_chance}\n` +
          `**Critical Multiplier:** ${weapon.secondary.crit_mult}\n` +
          `**Status Chance:** ${weapon.secondary.status_chance}`,
          inline: true,
        });
      }

      if (weapon.noise) {
        this.fields.push({
          name: 'Noise Level',
          value: weapon.noise,
          inline: true,
        });
      }

      if (weapon.projectile) {
        this.fields.push({
          name: 'Projectile',
          value: weapon.projectile,
          inline: true,
        });
      }
      if (weapon.trigger) {
        this.fields.push({
          name: 'Trigger Type',
          value: weapon.trigger,
          inline: true,
        });
      }
      if (weapon.impact) {
        this.fields.push({
          name: 'Impact',
          value: weapon.impact,
          inline: true,
        });
      }
      if (weapon.puncture) {
        this.fields.push({
          name: 'Puncture',
          value: weapon.puncture,
          inline: true,
        });
      }
      if (weapon.slash) {
        this.fields.push({
          name: 'Slash',
          value: weapon.slash,
          inline: true,
        });
      }
      if (weapon.flight) {
        this.fields.push({
          name: 'Flight Speed',
          value: weapon.flight,
          inline: true,
        });
      }
      if (weapon.magazine) {
        this.fields.push({
          name: 'Magazine Size',
          value: String(weapon.magazine),
          inline: true,
        });
      }
      if (weapon.ammo) {
        this.fields.push({
          name: 'Ammo Max',
          value: weapon.ammo,
          inline: true,
        });
      }
      if (weapon.accuracy) {
        this.fields.push({
          name: 'Accuracy',
          value: String(weapon.accuracy),
          inline: true,
        });
      }
      if (weapon.reload) {
        this.fields.push({
          name: 'Reload Speed',
          value: weapon.reload || '-',
          inline: true,
        });
      }
      if (weapon.riven_disposition) {
        this.fields.push({
          name: 'Riven Disposition',
          value: dispositions[weapon.riven_disposition],
          inline: true,
        });
      }
    } else {
      this.title = 'Invalid Query';
      this.color = 0xff6961;
      this.footer = undefined;
    }
  }
}

module.exports = WeaponEmbed;
