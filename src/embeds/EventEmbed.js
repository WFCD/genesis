import BaseEmbed from './BaseEmbed.js';

/**
 * Generates daily deal embeds
 */
export default class EventEmbed extends BaseEmbed {
  /**
   * @param {WorldState.Event} event - The deal to be included in the embed
   * @param {string} platform - The platform the event is for
   * @param {I18n} i18n internationalization template
   * @param {string} locale locality
   */
  constructor(event, { platform, i18n, locale }) {
    super(locale);

    this.setColor(0xfdec96);
    if (event) {
      this.setTitle(`[${platform.toUpperCase()}] ${event.description}`);
      this.setFields([]);
      this.setDescription(event.tooltip);

      if (event.victimNode) {
        if (event.faction) {
          const faction = i18n` by attacking the ${event.faction}`;
          const node = i18n` at ${event.node}`;
          this.setFields([
            {
              name: '\u200B',
              value: i18n`Defend ${event.victimNode}${event.faction ? faction : ''}${event.node ? node : ''}.`,
            },
          ]);
        } else {
          this.setFields([
            {
              name: event.victimNode,
              value: i18n`Fight for ${event.affiliatedWith}`,
            },
          ]);
        }
      }
      if (event.rewards?.length > 0) {
        this.setFields([
          {
            name: i18n`Rewards`,
            value: event.rewards
              ? event.rewards
                  .filter(Boolean)
                  .map((reward) => reward?.asString)
                  .join('; ')
              : i18n`No Rewards`,
          },
        ]);
      }
      if (event.maximumScore && event.currentScore) {
        this.setFields([
          {
            name: i18n`Progress`,
            value: `${Number(event.currentScore / event.maximumScore).toFixed(2)}%`,
          },
        ]);
      } else {
        if (event.maximumScore) {
          this.setFields([{ name: i18n`Completion Score`, value: String(event.maximumScore) }]);
        }
        if (event.currentScore) {
          this.setFields([{ name: i18n`Current Score`, value: String(event.currentScore) }]);
        }
      }

      if (event.affiliatedWith) {
        const jobString = event.jobs
          .map((job) => {
            const rewards =
              job.rewardPool.length > 0
                ? job.rewardPool.map((reward) => `* ${reward}`).join('\n')
                : i18n`No Clear Reward`;

            const rewardsFmtd = i18n`\nWith \`\`\`\n${rewards}\`\`\` as reward${job.rewardPool.length > 1 ? 's' : ''}.`;
            return i18n`**${job.type}**\nEnemies lvls ${job.enemyLevels[0]} - ${
              job.enemyLevels[1]
            }\nGranting ${job.standingStages.join(', ')} base standing per stage.${
              job.rewardPool.length > 0 ? rewardsFmtd : ''
            }`;
          })
          .join('\n');
        this.setFields([{ name: i18n`Jobs from ${event.affiliatedWith}`, value: jobString }]);
      }

      if (event.health && event.health !== '0.00') {
        this.setFooter({ text: i18n`${event.health}% Remaining` });
      }
    } else {
      this.setTitle('No Current Events');
    }
  }
}
