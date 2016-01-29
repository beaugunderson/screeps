'use strict';

var utilities = require('utilities');

function balanceSources(room) {
  var sources = room.find(FIND_SOURCES);
  var count = 0;

  _(Game.creeps)
    .filter({memory: {role: 'harvester'}})
    .forEach(creep => {
      creep.memory.sourceId = sources[count++ % sources.length].id;
    })
    .value();
}

module.exports = function (creep) {
  if (!creep.memory.sourceId) {
    balanceSources(creep.room);
  }

  switch (creep.memory.status) {
  case 'harvesting':
    if (creep.carry.energy < creep.carryCapacity) {
      var source = Game.getObjectById(creep.memory.sourceId);

      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, utilities.globalMoveToOptions);
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
