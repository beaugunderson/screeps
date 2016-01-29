'use strict';

var DESIRED_WALL_HITS = 10000;

var DEFINITIONS = {
  A: ATTACK,
  C: CARRY,
  H: HEAL,
  M: MOVE,
  R: RANGED_ATTACK,
  T: TOUGH,
  W: WORK
};

var COSTS = {};

COSTS[ATTACK] = 80;
COSTS[CARRY] = 50;
COSTS[HEAL] = 250;
COSTS[MOVE] = 50;
COSTS[RANGED_ATTACK] = 150;
COSTS[TOUGH] = 10;
COSTS[WORK] = 100;

var globalMoveToOptions = exports.globalMoveToOptions = {
  reusePath: 2
};

// TODO: add caching to the find* functions?
var findAllStructures = exports.findAllStructures = function (room, filter) {
  return room.find(FIND_STRUCTURES, {filter: filter});
};

var findMyStructures = exports.findMyStructures = function (room, filter) {
  return room.find(FIND_MY_STRUCTURES, {filter: filter});
};

var findMyCreeps = exports.findMyCreeps = function (room, filter) {
  return room.find(FIND_MY_CREEPS, {filter: filter});
};

exports.spawn = function (spawn, definition, role) {
  var pieces = _.map(definition, piece => DEFINITIONS[piece]);

  var cost = _(pieces)
    .map(piece => COSTS[piece])
    .sum();

  console.log('cost:', cost);

  return spawn.createCreep(pieces, null, {role: role});
};

exports.creepsNeedingHealing = function (room) {
  return findMyCreeps(room, creep => creep.hits < creep.hitsMax);
};

function damagedStructure(structure) {
  return structure.structureType !== STRUCTURE_RAMPART &&
         structure.hits < structure.hitsMax;
}

function damagedRampart(structure) {
  return structure.structureType === STRUCTURE_RAMPART &&
         structure.hits < DESIRED_WALL_HITS;
}

function damagedWallOrRoad(structure) {
  return (structure.structureType === STRUCTURE_WALL &&
          structure.hits < DESIRED_WALL_HITS) ||
         (structure.structureType === STRUCTURE_ROAD &&
          structure.hits < structure.hitsMax);
}

exports.structuresNeedingRepair = function (room) {
  var damaged = findMyStructures(room, damagedStructure);

  if (damaged.length) {
    return damaged;
  }

  var ramparts = findMyStructures(room, damagedRampart);

  if (ramparts.length) {
    return ramparts;
  }

  var wallsAndRoads = findAllStructures(room, damagedWallOrRoad);

  if (wallsAndRoads.length) {
    return wallsAndRoads;
  }
};

var wantEnergyCount = exports.wantEnergyCount = function (room) {
  return _.filter(Game.creeps, creep => {
    return creep.room === room &&
           (creep.memory.recharging ||
            (creep.memory.role !== 'mule' &&
             creep.memory.status === 'loading' &&
             creep.carry.energy < creep.carryCapacity));
  }).length;
};

var rechargeCount = exports.rechargeCount = function (room) {
  return _.filter(Game.creeps,
    {room: room, memory: {recharging: true}}).length;
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

function availableStorage(room) {
  var storages = room.find(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_STORAGE && s.store.energy > 1000});

  if (storages.length) {
    return storages[0];
  }
}

var transferToOrMove = exports.transferToOrMove = function (creep, target, options) {
  if (!options) {
    options = {move: true};
  }

  if (creep.transferEnergy(target) == ERR_NOT_IN_RANGE) {
    if (options.move) {
      creep.moveTo(target, globalMoveToOptions);
    }
  }
};

var transferFromOrMove = exports.transferFromOrMove = function (creep, target) {
  if (target.transferEnergy(creep) == ERR_NOT_IN_RANGE) {
    creep.moveTo(target, globalMoveToOptions);
  }
};

var closestOrOnly = exports.closestOrOnly = function (position, targets) {
  if (!targets.length) {
    return;
  }

  if (targets.length > 1) {
    // CPU: findClosestByRange would be faster
    return position.findClosestByPath(targets);
  }

  return targets[0];
};

var hasEnergy = exports.hasEnergy = function (s) {
  return s.energy > 0 || (s.store && s.store.energy > 0);
};

var hasCapacity = exports.hasCapacity = function (s) {
  return s.energy < s.energyCapacity ||
         (s.store && s.store.energy < s.storeCapacity);
};

exports.getEnergy = function (creep, options) {
  if (!options) {
    options = {
      force: false,
      filter: isEnergyHolder,
      waitIfNoStorage: false
    };
  }

  var storage = availableStorage(creep.room);

  if (storage) {
    return transferFromOrMove(creep, storage);
  }

  if (options.waitIfNoStorage && wantEnergyCount(creep.room) > 0) {
    return;
  }

  if (rechargeCount(creep.room) > 0 && !options.force) {
    return;
  }

  var loadTargets = creep.room.find(FIND_MY_STRUCTURES, {
    filter: s => options.filter(s) && hasEnergy(s)});
  var loadTarget = closestOrOnly(creep.pos, loadTargets);

  if (loadTarget) {
    transferFromOrMove(creep, loadTarget);
  }
};

exports.offloadEnergy = function (creep) {
  var offloadTargets = creep.room.find(FIND_MY_STRUCTURES, {
    filter: s => isEnergyHolder(s) && hasCapacity(s)});
  var offloadTarget = closestOrOnly(creep.pos, offloadTargets);

  if (offloadTarget) {
    return transferToOrMove(creep, offloadTarget);
  }

  recharge(creep);
};
