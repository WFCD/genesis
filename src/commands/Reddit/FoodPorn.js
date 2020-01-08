'use strict';

class FoodPorn extends require('./BaseReddit') {
  constructor(bot) {
    super(bot, 'reddit.fun.foodporn', 'foodporn', 'Generates a random food porn item from r/foodporn', 'FUN', 'FoodPorn');
    this.enabled = true;
  }
}

module.exports = FoodPorn;
