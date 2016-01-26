'use strict';

var utilities = require('utilities');

function build(creep, options) {
  if (!options) {
    options = {
      move: true
    };
  }

  var constructionTargets = creep.room.find(FIND_CONSTRUCTION_SITES);

  if (constructionTargets.length) {
    if (creep.build(constructionTargets[0]) == ERR_NOT_IN_RANGE) {
      if (options.move) {
        creep.moveTo(constructionTargets[0], utilities.globalMoveToOptions);
      }
    }

    return;
  }

  var towersNeedingEnergy = creep.room.find(FIND_MY_STRUCTURES, {
    filter: function (structure) {
      return structure.structureType === STRUCTURE_TOWER &&
             structure.energy < structure.energyCapacity;
    }
  });

  if (towersNeedingEnergy.length) {
    if (creep.transferEnergy(towersNeedingEnergy[0]) == ERR_NOT_IN_RANGE) {
      if (options.move) {
        creep.moveTo(towersNeedingEnergy[0], utilities.globalMoveToOptions);
      }
    }

    return;
  }

  var repairTargets = utilities.structuresNeedingRepair();

  if (repairTargets.length) {
    if (creep.repair(repairTargets[0]) == ERR_NOT_IN_RANGE) {
      if (options.move) {
        creep.moveTo(repairTargets[0], utilities.globalMoveToOptions);
      }
    }

    return;
  }
}

module.exports = function (creep) {
  switch (creep.memory.status) {
  case 'loading':
    if (creep.carry.energy < creep.carryCapacity) {
      utilities.getEnergy(creep);

      build(creep, {move: false});

      return;
    }

    creep.memory.status = 'building';

  case 'building':
    if (creep.carry.energy > 0) {
      build(creep);
    } else {
      creep.memory.status = 'loading';
    }

    break;

  default:
    creep.memory.status = 'building';

    break;
  }
};
