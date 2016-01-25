'use strict';

var utilities = require('utilities');

function structuresNeedingRepair() {
  var spawn = Game.spawns.Spawn1;
  var room = spawn.room;

  var damaged = room.find(FIND_MY_STRUCTURES, {
    filter: function (structure) {
      return structure.structureType !== STRUCTURE_RAMPART &&
        structure.hits < structure.hitsMax / 2;
    }
  });

  var ramparts = room.find(FIND_MY_STRUCTURES, {
    filter: {structureType: STRUCTURE_RAMPART}
  }).filter(function (rampart) {
    return rampart.hits < 1000;
  });

  var walls = room.find(FIND_STRUCTURES, {
    filter: {structureType: STRUCTURE_WALL}
  }).filter(function (wall) {
    return wall.hits < 2500;
  });

  return damaged
    .concat(ramparts)
    .concat(walls);
}

function build(creep, options) {
  if (!options) {
    options = {
      move: true
    };
  }

  var repairTargets = structuresNeedingRepair();
  var constructionTargets = creep.room.find(FIND_CONSTRUCTION_SITES);

  if (repairTargets.length) {
    if (creep.repair(repairTargets[0]) == ERR_NOT_IN_RANGE) {
      if (options.move) {
        creep.moveTo(repairTargets[0]);
      }
    }
  } else if (constructionTargets.length) {
    if (creep.build(constructionTargets[0]) == ERR_NOT_IN_RANGE) {
      if (options.move) {
        creep.moveTo(constructionTargets[0]);
      }
    }
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
