'use strict';

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

function rechargeIfNeeded(creep) {
  if (creep.ticksToLive <= 300) {
    creep.memory.recharging = true;
  } else if (creep.ticksToLive >= 900) {
    creep.memory.recharging = false;
  }

  if (creep.memory.recharging) {
    return recharge(creep);
  }
}

function recharge(creep) {
  var spawn = Game.spawns.Spawn1;

  creep.transferEnergy(spawn);

  var status = spawn.renewCreep(creep);

  if (status == ERR_NOT_IN_RANGE) {
    if (creep.energy) {
      creep.dropEnergy();
    }

    creep.moveTo(spawn);

    return true;
  } else if (status == ERR_FULL) {
    creep.memory.recharging = false;

    return false;
  }

  return true;
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

  var lowestCreep = _.sortBy(Game.creeps, function (creep) {
    return creep.ticksToLive;
  })[0];

  _.forEach(Game.creeps, function (creep) {
    if (creep === lowestCreep && rechargeIfNeeded(lowestCreep)) {
      return;
    }

    creep.memory.recharging = false;

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
