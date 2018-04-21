'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const { emojify } = require('../CommonFunctions.js');

const dispositions = ['\\⚫\\⚫\\⚫\\⚫\\⚫', '\\⚪\\⚫\\⚫\\⚫\\⚫', '\\⚪\\⚪\\⚫\\⚫\\⚫', '\\⚪\\⚪\\⚪\\⚫\\⚫', '\\⚪\\⚪\\⚪\\⚪\\⚫', '\\⚪\\⚪\\⚪\\⚪\\⚪'];

/**
 * Generates enemy embeds
 */
class WeaponEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesisad
   * @param {Enhancement} weapon - The enhancement to send info on
   */
  constructor(bot, weapon) {
    super();
    if (weapon && typeof weapon !== 'undefined') {
      this.title = weapon.name;
      this.url = weapon.url || '';
      this.thumbnail = { url: weapon.thumbnail || '' };
      this.description = `${weapon.type} ${weapon.subtype ? `| ${weapon.subtype}` : ''}`;
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
          `**Rate:** ${weapon.primary.rate} ammo\\s\n` +
          `**Flight:**: ${weapon.primary.flight || '-'} m\\s\n` +
          `**Noise:** ${weapon.primary.noise || '-'}\n` +
          `**Accuracy:** ${weapon.primary.accuracy || '-'}\n` +
          `**Reload:** ${weapon.primary.reload || '-'}s\n` +
          `**Damage:** ${emojify(weapon.primary.damage) || '-'}\n` +
          `**Impact:** ${emojify(weapon.primary.impact) || '-'}\n` +
          `**Puncture:** ${emojify(weapon.primary.puncture) || '-'}\n` +
          `**Slash:** ${emojify(weapon.primary.slash) || '-'}\n` +
          `**Critical Chance:** ${weapon.primary.crit_chance || '-'}%\n` +
          `**Critical Multiplier:** ${weapon.primary.crit_mult || '-'}x\n` +
          `**Status Chance:** ${weapon.primary.status_chance || '-'}%`,
          inline: true,
        });
      } else {
        const things = [{
          name: 'Rate',
          value: `${String(weapon.rate || '-')} unit\\s`,
          inline: true,
        },
        {
          name: 'Damage',
          value: emojify(weapon.damage || '-'),
          inline: true,
        },
        {
          name: 'Critical Chance',
          value: `${weapon.crit_chance || '-'}%`,
          inline: true,
        },
        {
          name: 'Critical Multiplier',
          value: `${weapon.crit_mult || '-'}x`,
          inline: true,
        },
        {
          name: 'Status Chance',
          value: `${weapon.status_chance || '-'}%`,
          inline: true,
        },
        {
          name: 'Polarities',
          value: emojify(weapon.polarities.length ? weapon.polarities.join(' ') : '-'),
          inline: true,
        },
        {
          name: 'Stance Polarity',
          value: emojify(weapon.stancePolarity || '-'),
          inline: true,
        }];
        this.fields.push(...things);
      }

      if (weapon.secondary) {
        this.fields.push({
          name: 'Secondary Fire',
          value: (weapon.secondary.trigger ? `**Trigger:** ${weapon.secondary.trigger || '-'}\n` : `${
            weapon.secondary.pellet}` ? `**Projectile:** ${weapon.secondary.pellet.name}\n` : `${
              weapon.secondary.rate}` ? `**Rate:** ${weapon.secondary.rate}\n` : `${
                weapon.secondary.flight}` ? `**Flight:**: ${weapon.secondary.flight}m\\s\n` : `${
                  weapon.secondary.noise}` ? `**Noise:** ${weapon.secondary.noise}\n` : `${
                    weapon.secondary.accuracy}` ? `**Accuracy:** ${weapon.secondary.accuracy}\n` : `${
                      weapon.secondary.reload}` ? `**Reload:** ${weapon.secondary.reload}\n` : `${
                        weapon.secondary.damage}` ? `**Damage:** ${emojify(weapon.secondary.damage || '-')}\n` : `${
                          weapon.secondary.impact}` ? `**Impact:** ${weapon.secondary.impact}\n` : `${
                            weapon.secondary.puncture}` ? `**Puncture:** ${weapon.secondary.puncture}\n` : `${
                              weapon.secondary.slash}` ? `**Slash:** ${weapon.secondary.slash}\n` : `${
                                weapon.secondary.crit_chance}` ? `**Critical Chance:** ${weapon.secondary.crit_chance}%\n` : `${
                                  weapon.secondary.crit_mult}` ? `**Critical Multiplier:** ${weapon.secondary.crit_mult}x\n` : `${
                                    weapon.secondary.status_chance}` ? `**Status Chance:** ${weapon.secondary.status_chance}%` : '') || '-',
          inline: true,
        });
      }

      if (weapon.noise) {
        this.fields.push({
          name: 'Noise Level',
          value: String(weapon.noise),
          inline: true,
        });
      }

      if (weapon.projectile) {
        this.fields.push({
          name: 'Projectile',
          value: String(weapon.projectile),
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

      this.fields.push({
        name: 'IPS Damage Distribution',
        value: emojify(`impact ${String(weapon.impact || '-')}\npuncture ${String(weapon.puncture || '-')}\nslash ${String(weapon.slash || '-')}`),
        inline: true,
      });

      if (weapon.flight) {
        this.fields.push({
          name: 'Flight Speed',
          value: `${weapon.flight || '0'}m\\s`,
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
          value: String(weapon.ammo),
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
          value: `${weapon.reload || '-'}s`,
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
