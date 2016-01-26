'use strict';

var utilities = require('utilities');

module.exports = function (creep) {
  var attackFlag = Game.flags.Attack.pos;
  var guardFlag = Game.flags.Guard.pos;
  var spawn = Game.spawns.Spawn1;
  var mainRoom = spawn.room;

  if (creep.getActiveBodyparts(ATTACK) === 0) {
    creep.memory.status = 'guarding';
  }

  if (mainRoom.name === attackFlag.roomName) {
    creep.memory.status = 'guarding';

    if (spawn.memory.war) {
      creep.memory.recharging = true;
    }
  } else if (creep.getActiveBodyparts(ATTACK) > 0 &&
             spawn.memory.war) {
    creep.memory.status = 'attacking';
  }

  if (creep.room.name !== attackFlag.roomName &&
      spawn.memory.war) {
    return creep.moveTo(attackFlag);
  }

  switch (creep.memory.status) {
  case 'attacking':
    var healer = attackFlag.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: c => c.getActiveBodyparts(HEAL) > 0});

    var hostileCreep = attackFlag.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: c => c.getActiveBodyparts(ATTACK) > 0});

    var hostileStructure = attackFlag.findClosestByRange(FIND_STRUCTURES, {
      filter: function (structure) {
        return structure.structureType !== STRUCTURE_ROAD &&
               structure.structureType !== STRUCTURE_WALL &&
               structure.structureType !== STRUCTURE_CONTROLLER &&
               !structure.my;
      }
    });

    var docileCreep = attackFlag.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: c => c.getActiveBodyparts(ATTACK) === 0});

    var hostile = healer || hostileCreep || hostileStructure || docileCreep;

    if (hostile) {
      if (creep.attack(hostile) === ERR_NOT_IN_RANGE) {
        creep.moveTo(hostile, utilities.globalMoveToOptions);
      }
    } else {
      spawn.memory.war = false;

      creep.memory.status = 'guarding';
    }

    break;

  case 'guarding':
    var hostiles = mainRoom.find(FIND_HOSTILE_CREEPS);

    if (hostiles.length) {
      if (creep.attack(hostiles[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(hostiles[0], utilities.globalMoveToOptions);
      }
    } else {
      creep.moveTo(guardFlag);
    }

    break;

  default:
    creep.memory.status = 'attacking';

    break;
  }
};
