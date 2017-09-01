'use strict';

const FetchCache = require('json-fetch-cache');

const allDataCache = new FetchCache('http://drops.warframestat.us/data/all.json', 7200000);

/**
 * Copy of #formatData from https://github.com/WFCD/warframe-drop-data/blob/gh-pages/index.html
 * @param {Object} data unformatted json data
 * @returns {Array.<JSON>}
 */
function formatData(data) {
  const newData = [];
  // mission rewards
  // planets
  Object.keys(data.missionRewards).forEach((planetName) => {
    // locations
    Object.keys(data.missionRewards[planetName]).forEach((locationName) => {
      const location = data.missionRewards[planetName][locationName];
      if (Array.isArray(location.rewards)) {
        const placeName = `${planetName}/${locationName} (${location.gameMode})`;
        location.rewards.forEach((reward) => {
          newData.push({
            place: placeName,
            item: reward.itemName,
            rarity: reward.rarity,
            chance: reward.chance,
          });
        });
      } else {
        Object.keys(location.rewards).forEach((key) => {
          const placeName = `${planetName}/${locationName} (${location.gameMode}), Rotation ${key}`;
          location.rewards[key].forEach((reward) => {
            newData.push({
              place: placeName,
              item: reward.itemName,
              rarity: reward.rarity,
              chance: reward.chance,
            });
          });
        });
      }
    });
  });
  // blueprint locations
  data.blueprintLocations.forEach((blueprint) => {
    blueprint.enemies.forEach((enemy) => {
      newData.push({
        place: enemy.enemyName,
        item: blueprint.blueprintName,
        rarity: enemy.rarity,
        chance: (((enemy.enemyBlueprintDropChance / 100) *
         (enemy.chance / 100)) * 100).toFixed(2),
      });
    });
  });

  // mod locations
  data.modLocations.forEach((mod) => {
    mod.enemies.forEach((enemy) => {
      newData.push({
        place: enemy.enemyName,
        item: mod.modName,
        rarity: enemy.rarity,
        chance: (((enemy.enemyModDropChance / 100) * (enemy.chance / 100)) * 100).toFixed(2),
      });
    });
  });

  // relics
  data.relics.forEach((relic) => {
    relic.rewards.forEach((item) => {
      newData.push({
        place: `${relic.tier} ${relic.relicName} ${relic.state}`,
        item: item.itemName,
        rarity: item.rarity,
        chance: item.chance,
      });
    });
  });

  // sortie rewards
  data.sortieRewards.forEach((sortie) => {
    newData.push({
      place: 'Sorties',
      item: sortie.itemName,
      rarity: sortie.rarity,
      chance: sortie.chance,
    });
  });

  // transient rewards
  data.transientRewards.forEach((objective) => {
    objective.rewards.forEach((reward) => {
      let rotation = '';
      if (reward.rotation) {
        rotation = ` ${reward.rotation}`;
      }
      newData.push({
        place: `${objective.objectiveName}${rotation}`,
        item: reward.itemName,
        rarity: reward.rarity,
        chance: reward.chance,
      });
    });
  });
  return newData;
}

class DropCache {
  constructor(logger = console) {
    this.logger = logger;
    allDataCache.getDataJson()
      .then((data) => {
        this.data = data;
        this.readyData = formatData(data);
      })
      .catch(this.logger.error);
  }

  getData() {
    return allDataCache.getDataJson()
      .then((data) => {
        if (!this.data || this.data !== data) {
          this.data = data;
          this.readyData = formatData(data);
        }
        return this.readyData;
      })
      .catch(this.logger.error);
  }
}

module.exports = DropCache;
