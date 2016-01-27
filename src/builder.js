'use strict';

var utilities = require('utilities');

function getTowers(room) {
  return room.find(FIND_MY_STRUCTURES, {
    filter: {structureType: STRUCTURE_TOWER}});
}

function construct(creep, options) {
  var constructionTargets = creep.room.find(FIND_CONSTRUCTION_SITES);

  if (constructionTargets.length) {
    if (creep.build(constructionTargets[0]) == ERR_NOT_IN_RANGE) {
      if (options.move) {
        creep.moveTo(constructionTargets[0], utilities.globalMoveToOptions);
      }
    }

    return true;
  }
}

function fillTowers(creep, towers, options) {
  var towersNeedingEnergy = _.filter(towers, t => t.energy < t.energyCapacity);

  if (towersNeedingEnergy.length) {
    if (creep.transferEnergy(towersNeedingEnergy[0]) == ERR_NOT_IN_RANGE) {
      if (options.move) {
        creep.moveTo(towersNeedingEnergy[0], utilities.globalMoveToOptions);
      }
    }

    return true;
  }
}

function repair(creep, options) {
  var repairTargets = utilities.structuresNeedingRepair(creep.room);

  if (repairTargets.length) {
    if (creep.repair(repairTargets[0]) == ERR_NOT_IN_RANGE) {
      if (options.move) {
        creep.moveTo(repairTargets[0], utilities.globalMoveToOptions);
      }
    }

    return true;
  }
}

function build(creep, options) {
  if (!options) {
    options = {
      move: true
    };
  }

  var towers = getTowers(creep.room);
  var anyTowersHaveEnergy = _.filter(towers, t => t.energy >= 10);

  // if there are towers with energy then let them repair things while we
  // do construction
  if (anyTowersHaveEnergy) {
    if (construct(creep, options)) {
      return;
    }
  }

  if (fillTowers(creep, towers, options)) {
    return;
  }

  repair(creep, options);
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
