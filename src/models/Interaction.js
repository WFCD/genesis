'use strict';

module.exports = class Interaction {
  static enabled = false;
  static command = {
    name: 'Interaction',
    description: 'Base interaction class',
    options: [],
  };
  static commandHandler;
  static buttonHandler;
  static msgComponentHandler;
  static selectMenuHandler;
};
