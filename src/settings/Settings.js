'use strict';

const MongoClient = require('mongodb').MongoClient;
const rewardTypes = require('warframe-worldstate-parser').Reward.TYPES;

const SETTINGS_COLLECTION = 'users';

// Array of reward types
const rewardTypeArray = Object.keys(rewardTypes).map(k =>
   rewardTypes[k]
);

/**
 * Describes a settings object for storing command and bot response settings
 */
class Settings {

  /**
   * Create a new user database instance
   *
   * @constructor
   * @param {string} mongoURL MongoDB url
   * @param {Logger} logger Simple logger to debug and log errors
   * @param {CommandHandler} commandHandler CommandHandler to fetch get command settings for.
   */
  constructor(mongoURL, logger, commandHandler) {
    this.mongoURL = mongoURL;
    this.logger = logger;
    this.commandHandler = commandHandler;

    this.DEFAULT_SETTINGS = {
      platform: 'PC',
      language: 'english',
      guild: '',
      items: [
        'alerts',
        'invasions',
        'news',
        'sorties',
        'fissures',
        'baro',
        'darvo',
        'enemies',
        'other',
        'conclave.weeklies',
        'conclave.dailies',
        'syndicate.arbiters',
        'syndicate.suda',
        'syndicate.loka',
        'syndicate.perrin',
        'syndicate.veil',
        'syndicate.meridian',
        'all',
      ].concat(rewardTypeArray),
      blacklistCommands: [],
      override: false,
      respondInChannel: true,
    };
  }

  /**
   * Add new channel to the database
   * If the channel didn't exist before, true is passed to the promise resolve
   *
   * @param   {string}          chatID ID of the channel
   * @returns {Promise<boolean>} Status of channel being added to database
   */
  add(chatID) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoURL, (connectErr, db) => {
        if (connectErr) {
          reject(connectErr);
        } else {
          const c = db.collection(SETTINGS_COLLECTION);

          const filter = {
            chatID,
          };

          const update = {
            $setOnInsert: this.DEFAULT_SETTINGS,
          };

          const options = {
            upsert: true,
          };

          c.findOneAndUpdate(filter, update, options, (dbFindErr, r) => {
            db.close();
            if (dbFindErr) {
              reject(dbFindErr);
            } else if (!r.value) {
              // New user was added
              resolve(true);
            } else {
              // Existing user
              resolve(false);
            }
          });
        }
      });
    });
  }

  /**
   * Remove channel from database
   *
   * @param   {string}          chatID ID of the channel
   * @returns {Promise<string>} Status of the chat being removed from the database
   */
  remove(chatID) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoURL, (err, db) => {
        if (err) {
          reject(err);
        } else {
          const c = db.collection(SETTINGS_COLLECTION);

          const query = {
            chatID,
          };

          c.deleteOne(query, (deleteErr, result) => {
            db.close();
            if (deleteErr) {
              reject(deleteErr);
            } else {
              resolve(result);
            }
          });
        }
      });
    });
  }

  /**
   * Returns an channel's settings, adds the user to the database
   * if it doesn't exist when insert is true
   *
   * @param {string} chatID ID of the channel
   * @param {Object} projection Query projection
   * @param {boolean} insert True to insert a non-existent channel
   * @returns {Promise<Array<string>>} Array of settings strings
   */
  getSettings(chatID, projection, insert) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoURL, (err, db) => {
        if (err) {
          reject(err);
        } else {
          const c = db.collection(SETTINGS_COLLECTION);
          // eslint-disable-next-line no-underscore-dangle, no-param-reassign
          projection._id = false;

          const filter = {
            chatID,
          };

          if (insert) {
            const update = {
              $setOnInsert: this.DEFAULT_SETTINGS,
            };

            const options = {
              upsert: true,
              projection,
              returnOriginal: false,
            };

            c.findOneAndUpdate(filter, update, options, (updateErr, r) => {
              db.close();
              if (updateErr) {
                this.logger.error(updateErr);
              } else {
                resolve(r.value);
              }
            });
          } else {
            c.find(filter).limit(1).project(projection).next((filterErr, doc) => {
              db.close();
              if (filterErr) {
                reject(filterErr);
              } else {
                resolve(doc);
              }
            });
          }
        }
      });
    });
  }

  /**
   * Returns an user's tracked items, creating a new entry if needed.
   * Convenience method
   *
   * @param   {string}                 chatID   ID of the channel
   * @returns {Promise<Array<string>>} promise with an array of strings
   *                                   correlating to the tracked items for this channel
   */
  getTrackedItems(chatID) {
    return new Promise((resolve, reject) => {
      this.getSettings(chatID, { items: true }, true)
        .then((res) => {
          resolve(res.items);
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Track/untrack an item for an channel
   *
   * @param   {string}          chatID ID of the channel
   * @param   {string}          item   Item to track/untrack
   * @param   {boolean}         value  True to track, false to untrack
   * @returns {Promise<string>} The status of the operation
   */
  setItemTrack(chatID, item, value) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoURL, (err, db) => {
        if (err) {
          reject(err);
        } else {
          const c = db.collection(SETTINGS_COLLECTION);
          let update;
          const query = {
            chatID,
          };

          if (value) {
            // Add a new tracked item
            if (item === 'all') {
              update = {
                $set: {
                  items: this.DEFAULT_SETTINGS.items,
                },
              };
            } else if (item === 'rewards') {
              let itemsToSet = [];
              this.getTrackedItems(chatID)
                .then((trackedItems) => {
                  itemsToSet = itemsToSet.concat(trackedItems);
                  rewardTypeArray.forEach((trackableItem) => {
                    if (itemsToSet.indexOf(trackableItem) === -1) {
                      itemsToSet.push(trackableItem);
                    }
                  });
                })
                .catch(error => this.logger.error(error));

              update = {
                $set: {
                  items: itemsToSet,
                },
              };
            } else {
              update = {
                $addToSet: {
                  items: item,
                },
              };
            }
          }

          // Remove a tracked item
          if (item === 'all') {
            update = {
              $set: { items: [] },
            };
          } else {
            update = {
              $pull: {
                items: item,
              },
            };
          }

          c.updateOne(query, update, (updateErr, r) => {
            db.close();
            if (updateErr) {
              reject(updateErr);
            } else {
              resolve(`Updated: ${r}`);
            }
          });
        }
      });
    });
  }

  /**
   * Returns an channel's platform, or the default if the channel is not in the database.
   * Convenience method
   *
   * @param   {string}          chatID ID of the channel
   * @returns {Promise<string>} promise with a string correlating to the platform for this channel
   */
  getPlatform(chatID) {
    return new Promise((resolve, reject) => {
      this.getSettings(chatID, { platform: true }, false)
        .then((res) => {
          if (res) {
            resolve(res.platform);
          } else {
            resolve(this.DEFAULT_SETTINGS.platform);
          }
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Change an channel's platform
   *
   * @param   {string}          chatId   channel id
   * @param   {string}          platform New platform
   * @returns {Promise<string>} The status of the operation
   */
  setPlatform(chatId, platform) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoURL, (err, db) => {
        if (err) {
          reject(err);
        } else {
          const c = db.collection(SETTINGS_COLLECTION);
          const query = { chadID: chatId };
          const update = {
            $set: {
              platform,
            },
          };

          c.updateOne(query, update, (updateError, r) => {
            db.close();
            if (updateError) {
              reject(updateError);
            } else {
              resolve(r);
            }
          });
        }
      });
    });
  }

  /**
   * Stop tracking everything for an channel
   * Equivalent to untracking alerts, invasions and news
   *
   * @param {string}   chatId   ID of the channel
   * @returns {Promise<string>} [[Description]]
   */
  stopTrack(chatId) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoURL, (err, db) => {
        if (err) {
          reject(err);
        } else {
          const c = db.collection(SETTINGS_COLLECTION);

          const query = { chadID: chatId };

          const update = {
            $pullAll: {
              items: ['alerts', 'invasions', 'news'],
            },
          };

          c.updateOne(query, update, (updateErr, r) => {
            db.close();
            if (updateErr) {
              reject(updateErr);
            } else {
              resolve(r);
            }
          });
        }
      });
    });
  }

  /**
   * Sets the language for the channel
   *
   * @param   {string}          chatId ID of the channel
   * @param   {string}          lang Language to set for the channel
   * @returns {Promise<string>} The status of the operation
   */
  setLanguage(chatId, lang) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoURL, (err, db) => {
        if (err) {
          reject(err);
        } else if (lang !== null && typeof lang !== 'undefined') {
          const c = db.collection(SETTINGS_COLLECTION);
          const query = { chatID: chatId };
          const update = {
            $set: {
              language: lang,
            },
          };

          c.updateOne(query, update, (updateError, r) => {
            db.close();
            if (updateError) {
              reject(updateError);
            } else {
              resolve(r);
            }
          });
        }
      });
    });
  }

  /**
   * Returns an channel's lanuage, or the default if the channel is not in the database.
   * Convenience method
   *
   * @param {string}   chatId   ID of the channel
   * @returns {Promise<string>} promise with a string correlating to the language for this channel
   */
  getLanguage(chatId) {
    return new Promise((resolve, reject) => {
      this.getSettings(chatId, { language: true }, false)
        .then((res) => {
          if (res) {
            resolve(res.language);
          } else {
            resolve(this.DEFAULT_SETTINGS.language);
          }
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Set the value for the override for this channel
   * @param   {string}          chatId Chat identifier for the channel to have the setting changed.
   * @param   {boolean}         value  true if override is enabled,
   *                                   false if override is disabled (default)
   * @returns {Promise<string>} The status of the operation
   */
  setOverride(chatId, value) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoURL, (err, db) => {
        if (err) {
          reject(err);
        } else {
          const c = db.collection(SETTINGS_COLLECTION);
          const query = { chatID: chatId };
          const update = { $set: { override: value } };

          c.updateOne(query, update, (updateError, r) => {
            db.close();
            if (updateError) {
              reject(updateError);
            } else {
              resolve(r);
            }
          });
        }
      });
    });
  }

  /**
   * Returns whether or not the override is enabled
   *
   * @param   {string}                 chatId   ID of the user
   * @returns {Promise<Array<string>>} promise with an array of strings
   *                                   correlating to the tracked items for this channel
   */
  getOverride(chatId) {
    return new Promise((resolve, reject) => {
      this.getSettings(chatId, { override: true }, true)
        .then((res) => {
          if (res) {
            resolve(res.override);
          } else {
            resolve(this.DEFAULT_SETTINGS.override);
          }
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Set the value for the responding in for this channel for permissions/blacklist changes
   * @param   {string}          chatId Chat identifier for the channel to have the setting changed.
   * @param   {boolean}         value  true if responding in chat is enabled,
   *                                   false if responding in chat is disabled (default)
   * @returns {Promise<string>} The status of the operation
   */
  setRespond(chatId, value) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoURL, (err, db) => {
        if (err) {
          reject(err);
        } else {
          const c = db.collection(SETTINGS_COLLECTION);
          const query = { chatID: chatId };
          const update = {
            $set: {
              respondInChannel: value,
            },
          };

          c.updateOne(query, update, (updateError, r) => {
            db.close();
            if (updateError) {
              reject(updateError);
            } else {
              resolve(r);
            }
          });
        }
      });
    });
  }

  /**
   * Returns whether or not the override is enabled
   *
   * @param   {string}                 chatID   ID of the user
   * @returns {Promise<Array<string>>} promise with an array of strings
   *                                   correlating to the tracked items for this channel
   */
  getRespond(chatID) {
    return new Promise((resolve, reject) => {
      this.getSettings(chatID, { respondInChannel: true }, true)
        .then((res) => {
          if (res) {
            resolve(res.respondInChannel);
          } else {
            resolve(this.DEFAULT_SETTINGS.respondInChannel);
          }
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Blacklist/unblacklist an item for an channel
   *
   * @param   {string}          chatId    ID of the channel
   * @param   {string}          commandID commandID to blacklist/unblacklist, or all
   * @param   {boolean}         value     True to blacklist, false to unblacklist
   * @returns {Promise<string>} The status of the operation
   */
  setBlacklistCommand(chatId, commandID, value) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoURL, (err, db) => {
        if (err) {
          reject(err);
        } else {
          const c = db.collection(SETTINGS_COLLECTION);
          let update;
          const query = { chatID: chatId };

          if (value) {
            // Add a new tracked item
            if (commandID === 'all') {
              update = {
                $set: {
                  blacklistCommands: this.commandHandler.getBlacklistableCommands(),
                },
              };
            } else {
              update = {
                $addToSet: {
                  blacklistCommands: commandID,
                },
              };
            }
          }
          if (!value) {
            this.logger.debug(`${value}: Attempting to remove from blacklist`);
            // Remove a tracked item
            if (commandID === 'all') {
              update = {
                $set: { blacklistCommands: [] },
              };
            } else {
              update = {
                $pull: {
                  blacklistCommands: commandID,
                },
              };
            }
          }

          c.updateOne(query, update, (updateErr, r) => {
            db.close();
            if (updateErr) {
              reject(updateErr);
            } else {
              resolve(`Updated: ${r}`);
            }
          });
        }
      });
    });
  }

  /**
   * Returns an channels's tracked items, creating a new entry if needed.
   * Convenience method
   *
   * @param   {string}                 chatId   ID of the channel
   * @returns {Promise<Array<string>>} promise with an array of strings
   *                                            correlating to the tracked items for this channel
   */
  getBlacklistedCommands(chatId) {
    return new Promise((resolve, reject) => {
      this.getSettings(chatId, { blacklistCommands: true }, true)
        .then((res) => {
          resolve(res.blacklistCommands);
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Broadcast a message to all the channels matching a query
   * The callback is passed a different chat ID every time
   *
   * @param   {Object}                 query Query
   * @returns {Promise<Array<string>>} a chat id to send a broadcast to
   */
  broadcast(query) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.mongoURL, (err, db) => {
        if (err) {
          reject(err);
        } else {
          const projection = {
            chatID: true,
            _id: false,
          };

          const c = db.collection(SETTINGS_COLLECTION);

          const cursor = c.find(query).project(projection);

          cursor.each((cursorError, channel) => {
            if (cursorError) {
              reject(cursorError);
            } else if (channel !== null) {
              resolve(channel.chatID);
            } else {
              db.close();
            }
          });
        }
      });
    });
  }
}

module.exports = Settings;
