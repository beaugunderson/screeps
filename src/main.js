'use strict';

var utilities = require('utilities');

var ROLES = {
  attacker: require('attacker'),
  builder: require('builder'),
  explorer: require('explorer'),
  harvester: require('harvester'),
  mule: require('mule'),
  upgrader: require('upgrader')
};

var TICKS_CRITICAL = 200;
var TICKS_LOW = 300;
// var TICKS_MEDIUM = 700;
var TICKS_HIGH = 1000;

var ROLE_ORDER = {
  attacker: 3,
  builder: 1,
  explorer: 3,
  harvester: 0,
  mule: 2,
  upgrader: 1
};

function doTowers(room) {
  var towers = room.find(FIND_MY_STRUCTURES,
    {filter: {structureType: STRUCTURE_TOWER}});

  var hostiles = room.find(FIND_HOSTILE_CREEPS);

  if (hostiles.length) {
    Game.notify('Enemies spotted in room');

    towers.forEach(tower => tower.attack(hostiles[0]));

    return;
  }

  var damaged = utilities.creepsNeedingHealing(room);

  if (damaged.length) {
    towers.forEach(tower => tower.heal(damaged[0]));

    return;
  }

  var repairTargets = utilities.structuresNeedingRepair(room);

  if (repairTargets.length) {
    towers.forEach(tower => tower.repair(repairTargets[0]));

    return;
  }
}

function pickupDroppedEnergy(creep) {
  if (creep.carry.energy === creep.carryCapacity ||
      creep.memory.recharging) {
    return;
  }

  var energy = creep.pos.findInRange(FIND_DROPPED_ENERGY, 1);

  if (energy.length) {
    creep.pickup(energy[0]);
  }
}

function getCreepToRecharge(roomCreeps) {
  var creeps = _(roomCreeps)
    .filter(c => c.ticksToLive < TICKS_LOW || c.memory.recharging)
    .sortBy(c => ROLE_ORDER[c.memory.role])
    .value();

  if (creeps.length) {
    return creeps[0];
  }
}

function updateRechargeStatus(creep) {
  if (creep.ticksToLive <= TICKS_LOW) {
    creep.memory.recharging = true;
  } else if (creep.ticksToLive >= TICKS_HIGH &&
             !(Memory.war && creep.memory.role === 'attacker')) {
    creep.memory.recharging = false;
  }

  return creep.memory.recharging;
}

function shouldRecharge(creep, creepToRecharge) {
  return creep === creepToRecharge ||
         (creep.memory.role === 'attacker' && Memory.war);
}

function doRoom(room) {
  doTowers(room);

  var roomCreeps = _.filter(Game.creeps, {room: room});
  var creepToRecharge = getCreepToRecharge(roomCreeps);

  _.forEach(roomCreeps, creep => {
    if (updateRechargeStatus(creep) &&
        shouldRecharge(creep, creepToRecharge) &&
        utilities.recharge(creep)) {
      return;
    }

    // TODO: this uses lots of CPU
    pickupDroppedEnergy(creep);

    if (ROLES[creep.memory.role]) {
      ROLES[creep.memory.role](creep);
    }
  });
}

function notifyCritical() {
  var critical = _.filter(Game.creeps, c => c.ticksToLive < TICKS_CRITICAL);

  if (critical.length) {
    Game.notify(`${critical.length} creep(s) going critical`);
  }
}

module.exports.loop = function () {
  notifyCritical();

  _.forEach(Game.rooms, doRoom);
};
