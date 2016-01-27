'use strict';

var utilities = require('utilities');

module.exports = function (creep) {
  var controller = creep.room.controller;

  var status = creep.upgradeController(controller);

  if (status !== OK) {
    creep.moveTo(controller, utilities.globalMoveToOptions);
  }
};
