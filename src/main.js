'use strict';

var utilities = require('utilities');

var roles = {
  harvester: require('harvester'),
  builder: require('builder'),
  upgrader: require('upgrader'),
  mule: require('mule')
};

// function spawnCreep(spawn, role) {
//   spawn.createCreep([
//     WORK,
//     WORK,
//     CARRY,
//     CARRY,
//     CARRY,
//     MOVE,
//     MOVE,
//     MOVE
//   ],
//   null,
//   {
//     role: role
//   });
// }

function defendRoom() {
  var room = Game.spawns.Spawn1.room;
  var hostiles = room.find(FIND_HOSTILE_CREEPS);

  // TODO: add heal, repair
  if (hostiles.length > 0) {
    Game.notify('Enemies spotted in room');

    var towers = room.find(FIND_MY_STRUCTURES,
      {filter: {structureType: STRUCTURE_TOWER}});

    towers.forEach(tower => tower.attack(hostiles[0]));
  }
}

var TICKS_LOW = 300;
var TICKS_MEDIUM = 700;
var TICKS_HIGH = 1000;

function rechargeIfNeeded(creep) {
  if (creep.ticksToLive <= TICKS_LOW) {
    creep.memory.recharging = true;
  } else if (creep.ticksToLive >= TICKS_HIGH) {
    creep.memory.recharging = false;
  }

  if (creep.memory.recharging) {
    return utilities.recharge(creep);
  }
}

// function counts() {
//   _(Game.creeps)
//   .groupBy(function (creep) {
//     return creep.memory.role;
//   })
//   .forEach(function (group, key) {
//     console.log(key, group.length);
//   })
//   .value();
// }

function pickupDroppedEnergy(creep) {
  if (creep.carry.energy < creep.carryCapacity &&
      !creep.memory.recharging) {
    var target = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);

    if (target) {
      creep.pickup(target);
    }
  }
}

module.exports.loop = function () {
  // counts();

  defendRoom();

  var lowestCreep = _.sortBy(Game.creeps, function (creep) {
    return creep.ticksToLive;
  })[0];

  _.forEach(Game.creeps, function (creep) {
    if (creep === lowestCreep && rechargeIfNeeded(lowestCreep)) {
      return;
    }

    if (creep.ticksToLive >= TICKS_MEDIUM) {
      creep.memory.recharging = false;
    }

    // TODO: this uses lots of CPU
    pickupDroppedEnergy(creep);

    if (rechargeIfNeeded(creep)) {
      return;
    }

    if (roles[creep.memory.role]) {
      roles[creep.memory.role](creep);
    }
  });
};
