'use strict';

exports.getEnergy = function (creep) {
  var spawn = Game.spawns.Spawn1;
  var target;

  var extensions = spawn.room.find(FIND_MY_STRUCTURES, {
    filter: {structureType: STRUCTURE_EXTENSION}
  }).filter(function (extension) {
    return extension.energy > 0;
  });

  extensions = _(extensions).sortBy('energy').reverse().value();

  if (extensions.length) {
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
      return;
    }

    if (creep.transferEnergy(extensions[0]) == ERR_NOT_IN_RANGE) {
      creep.moveTo(extensions[0], globalMoveToOptions);
    }
  }
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
