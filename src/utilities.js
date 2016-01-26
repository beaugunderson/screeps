'use strict';

var DESIRED_WALL_HITS = 10000;

var globalMoveToOptions = exports.globalMoveToOptions = {
  reusePath: 0
};

exports.creepsNeedingHealing = function () {
  var spawn = Game.spawns.Spawn1;
  var room = spawn.room;

  return room.find(FIND_MY_CREEPS, {
    filter: creep => creep.hits < creep.hitsMax});
};

exports.structuresNeedingRepair = function () {
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
    return rampart.hits < DESIRED_WALL_HITS;
  });

  var walls = room.find(FIND_STRUCTURES, {
    filter: {structureType: STRUCTURE_WALL}
  }).filter(function (wall) {
    return wall.hits < DESIRED_WALL_HITS;
  });

  var roads = room.find(FIND_STRUCTURES, {
    filter: {structureType: STRUCTURE_ROAD}
  }).filter(road => road.hits < road.hitsMax);

  return damaged
    .concat(ramparts)
    .concat(walls)
    .concat(roads);
};

exports.wantEnergyCount = function () {
  var count = 0;

  _.forEach(Game.creeps, function (creep) {
    if (creep.memory.role !== 'mule' &&
        creep.memory.status === 'loading') {
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

var recharge = exports.recharge = function (creep) {
  var spawn = Game.spawns.Spawn1;

  creep.transferEnergy(spawn);

  var status = spawn.renewCreep(creep);

  if (status == ERR_NOT_IN_RANGE) {
    if (creep.carry.energy) {
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

exports.getEnergy = function (creep, options) {
  if (!options) {
    options = {force: false};
  }

  if (!options.force && rechargeCount() > 0) {
    return;
  }

  var spawn = Game.spawns.Spawn1;
  var target;

  var extensions = spawn.room.find(FIND_MY_STRUCTURES, {
    filter: {structureType: STRUCTURE_EXTENSION}
  }).filter(function (extension) {
    return extension.energy > 0;
  });

  extensions = _(extensions).sortBy('energy').reverse().value();

  if (extensions.length &&
      extensions[0].energy > spawn.energy) {
    target = extensions[0];
  } else {
    target = spawn;
  }

  if (target.transferEnergy(creep) == ERR_NOT_IN_RANGE) {
    creep.moveTo(target, globalMoveToOptions);
  }
};

exports.offloadEnergy = function (creep) {
  var spawn = Game.spawns.Spawn1;

  if (spawn.energy < spawn.energyCapacity) {
    if (creep.transferEnergy(spawn) == ERR_NOT_IN_RANGE) {
      creep.moveTo(spawn, globalMoveToOptions);
    }
  } else {
    var extensions = Game.spawns.Spawn1.room.find(FIND_MY_STRUCTURES, {
      filter: {structureType: STRUCTURE_EXTENSION}
    }).filter(function (extension) {
      return extension.energy < extension.energyCapacity;
    });

    if (!extensions.length) {
      return recharge(creep);
    }

    if (creep.transferEnergy(extensions[0]) == ERR_NOT_IN_RANGE) {
      creep.moveTo(extensions[0], globalMoveToOptions);
    }
  }
};
