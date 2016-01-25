'use strict';

var utilities = require('utilities');

module.exports = function (creep) {
  var upgrader = _.filter(Game.creeps, {memory: {role: 'upgrader'}})[0];

  // move out of the way
  if (upgrader.memory.recharging) {
    creep.memory.status = 'waiting';
  }

  switch (creep.memory.status) {
  case 'loading':
    if (creep.carry.energy < creep.carryCapacity ||
        upgrader.memory.recharging) {
      // let other creeps get energy first
      if (utilities.wantEnergyCount() === 0) {
        utilities.getEnergy(creep);
      }

      return;
    }

    creep.memory.status = 'transporting';

  case 'transporting':
    if (creep.carry.energy > 0) {
      if (creep.transferEnergy(upgrader) == ERR_NOT_IN_RANGE) {
        creep.moveTo(upgrader);
      }
    } else {
      creep.memory.status = 'loading';
    }

    break;

  case 'waiting':
    // creep.dropEnergy();

    if (!upgrader.memory.recharging) {
      return creep.memory.status = 'loading';
    }

    if (creep.carry.energy > 0) {
      utilities.offloadEnergy(creep);
    } else {
      creep.moveTo(Game.flags.Waiting);
    }

    break;

  default:
    creep.memory.status = 'loading';

    break;
  }
};
