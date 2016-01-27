'use strict';

var utilities = require('utilities');

module.exports = function (creep) {
  var exploreFlag = Game.flags.Explore.pos;
  var spawn = Game.spawns.Spawn1;
  var mainRoom = spawn.room;

  if (mainRoom.name === exploreFlag.roomName) {
    creep.memory.status = 'loading';
  } else if (creep.carry.energy === creep.carryCapacity) {
    creep.memory.status = 'exploring';
  }

  switch (creep.memory.status) {
  case 'exploring':
    if (creep.carry.energy) {
      if (creep.room.name !== exploreFlag.roomName) {
        return creep.moveTo(exploreFlag);
      }

      var constructionTargets = creep.room.find(FIND_CONSTRUCTION_SITES);

      if (constructionTargets.length) {
        if (creep.build(constructionTargets[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(constructionTargets[0], utilities.globalMoveToOptions);
        }

        return;
      }

      var controller = creep.room.controller;

      if (controller) {
        var status;

        if (!controller.my) {
          status = creep.claimController(controller);
        } else {
          status = creep.upgradeController(controller);
        }

        if (status == ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller, utilities.globalMoveToOptions);
        }
      }

      return;
    }

    creep.memory.status = 'loading';

  case 'loading':
    if (creep.room.name !== exploreFlag.roomName) {
      return creep.moveTo(exploreFlag);
    }

    if (creep.carry.energy < creep.carryCapacity) {
      utilities.getEnergy(creep);
    }

    // TODO recharge to max

    break;

  default:
    creep.memory.status = 'loading';

    break;
  }
};
