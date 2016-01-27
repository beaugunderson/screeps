'use strict';

var DESIRED_WALL_HITS = 10000;

var globalMoveToOptions = exports.globalMoveToOptions = {
  reusePath: 0
};

exports.creepsNeedingHealing = function (room) {
  return room.find(FIND_MY_CREEPS, {
    filter: creep => creep.hits < creep.hitsMax});
};

exports.structuresNeedingRepair = function (room) {
  var damaged = room.find(FIND_MY_STRUCTURES, {
    filter: s => {
      return s.structureType !== STRUCTURE_RAMPART &&
             s.hits < s.hitsMax / 2;
    }
  });

  var ramparts = room.find(FIND_MY_STRUCTURES, {
    filter: s => {
      return s.structureType === STRUCTURE_RAMPART &&
             s.hits < DESIRED_WALL_HITS;
    }
  });

  var wallsAndRoads = room.find(FIND_STRUCTURES, {
    filter: s => {
      return (s.structureType === STRUCTURE_WALL &&
              s.hits < DESIRED_WALL_HITS) ||
             (s.structureType === STRUCTURE_ROAD &&
              s.hits < s.hitsMax);
    }
  });

  return damaged
    .concat(ramparts)
    .concat(wallsAndRoads);
};

exports.wantEnergyCount = function () {
  var count = 0;

  _.forEach(Game.creeps, function (creep) {
    if (creep.memory.role !== 'mule' &&
        creep.memory.status === 'loading' &&
        creep.carry.energy < creep.carryCapacity) {
      count++;
    }

    if (creep.memory.recharging) {
      count++;
    }
  });

  return count;
};

var rechargeCount = exports.rechargeCount = function () {
  var count = 0;

  _.forEach(Game.creeps, function (creep) {
    if (creep.memory.recharging) {
      count++;
    }
  });

  return count;
};

// TODO: specify spawn as a parameter
var recharge = exports.recharge = function (creep) {
  var spawn = Game.spawns.Spawn1;

  creep.transferEnergy(spawn);

  var status = spawn.renewCreep(creep);

  if (status == ERR_NOT_IN_RANGE) {
    if (creep.memory.recharging && creep.carry.energy) {
      creep.dropEnergy();
    }

    creep.moveTo(spawn, globalMoveToOptions);

    return true;
  } else if (status == ERR_FULL) {
    creep.memory.recharging = false;

    return false;
  }

  return true;
};

function isEnergyHolder(structure) {
  return structure.structureType === STRUCTURE_STORAGE ||
         structure.structureType === STRUCTURE_EXTENSION ||
         structure.structureType === STRUCTURE_SPAWN;
}

exports.getEnergy = function (creep, options) {
  if (!options) {
    options = {force: false};
  }

  if (!options.force && rechargeCount() > 0) {
    return;
  }

  var loadTarget;

  var loadTargets = creep.room.find(FIND_MY_STRUCTURES, {
    filter: s => isEnergyHolder(s) && s.energy > 0});

  // TODO: heuristics for choosing?
  // loadTargets = _(loadTargets).sortBy('energy').reverse().value();

  if (loadTargets.length > 1) {
    loadTarget = creep.pos.findClosestByPath(loadTargets);
  } else {
    loadTarget = loadTargets[0];
  }

  if (loadTarget.transferEnergy(creep) == ERR_NOT_IN_RANGE) {
    creep.moveTo(loadTarget, globalMoveToOptions);
  }
};

exports.offloadEnergy = function (creep) {
  var offloadTarget;

  var offloadTargets = creep.room.find(FIND_MY_STRUCTURES, {
    filter: s => isEnergyHolder(s) && s.energy < s.energyCapacity});

  if (offloadTargets.length) {
    if (offloadTargets.length > 1) {
      offloadTarget = creep.pos.findClosestByPath(offloadTargets);
    } else {
      offloadTarget = offloadTargets[0];
    }

    if (creep.transferEnergy(offloadTarget) == ERR_NOT_IN_RANGE) {
      creep.moveTo(offloadTarget, globalMoveToOptions);
    }

    return;
  }

  recharge(creep);
};
