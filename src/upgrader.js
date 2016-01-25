'use strict';

var utilities = require('utilities');

module.exports = function (creep) {
  var spawn = Game.spawns.Spawn1;
  var controller = spawn.room.controller;

  var status = creep.upgradeController(controller);

  if (status !== 0) {
    creep.moveTo(controller, utilities.globalMoveToOptions);
  }
};
