'use strict';

var utilities = require('utilities');

function balanceSources() {
  var sources = Game.spawns.Spawn1.room.find(FIND_SOURCES);
  var count = 0;

  _.forEach(Game.creeps, function (creep) {
    if (creep.memory.role !== 'harvester') {
      return;
    }

    count++;

    creep.memory.sourceId = sources[count % sources.length].id;
  });
}

module.exports = function (creep) {
  if (!creep.memory.sourceId) {
    balanceSources();
  }

  switch (creep.memory.status) {
  case 'harvesting':
    if (creep.carry.energy < creep.carryCapacity) {
      var source = Game.getObjectById(creep.memory.sourceId);

      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      }

      return;
    }

    creep.memory.status = 'offloading';

  case 'offloading':
    if (creep.carry.energy > 0) {
      utilities.offloadEnergy(creep);
    } else {
      creep.memory.status = 'harvesting';
    }

    break;

  default:
    creep.memory.status = 'harvesting';

    break;
  }
};
