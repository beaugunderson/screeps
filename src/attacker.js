'use strict';

var utilities = require('utilities');

module.exports = function (creep) {
  var flag = Game.flags.Attack.pos;
  var mainRoom = Game.spawns.Spawn1.room;

  if (mainRoom.name === flag.roomName) {
    creep.memory.status = 'guarding';
  } else {
    creep.memory.status = 'attacking';
  }

  if (creep.room.name !== flag.roomName) {
    return creep.moveTo(flag);
  }

  switch (creep.memory.status) {
  case 'attacking':
    var hostileCreep = flag.findClosestByRange(FIND_HOSTILE_CREEPS);
    var hostileStructure = flag.findClosestByRange(FIND_STRUCTURES, {
      filter: function (structure) {
        return structure.structureType !== STRUCTURE_ROAD &&
               structure.structureType !== STRUCTURE_WALL &&
               !structure.my;
      }
    });

    var hostile = hostileCreep || hostileStructure;

    if (creep.attack(hostile) === ERR_NOT_IN_RANGE) {
      creep.moveTo(hostile, utilities.globalMoveToOptions);
    }

    break;

  case 'guarding':
    var hostiles = mainRoom.find(FIND_HOSTILE_CREEPS);

    if (hostiles.length) {
      if (creep.attack(hostiles[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(hostiles[0], utilities.globalMoveToOptions);
      }
    } else {
      creep.moveTo(flag);
    }

    break;

  default:
    creep.memory.status = 'attacking';

    break;
  }
};
