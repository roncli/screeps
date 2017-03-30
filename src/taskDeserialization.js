var Cache = require("cache"),
    TaskAttack = require("task.attack"),
    TaskBuild = require("task.build"),
    TaskClaim = require("task.claim"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskCollectMinerals = require("task.collectMinerals"),
    TaskDismantle = require("task.dismantle"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals"),
    TaskHarvest = require("task.harvest"),
    TaskHeal = require("task.heal"),
    TaskMeleeAttack = require("task.meleeAttack"),
    TaskMine = require("task.mine"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),
    TaskRepair = require("task.repair"),
    TaskReserve = require("task.reserve"),
    TaskUpgradeController = require("task.upgradeController"),
    
    deserialization = (creep) => {
        "use strict";

        switch (creep.memory.currentTask.type) {
            case "attack":
                Cache.creepTasks[creep.name] = TaskAttack.fromObj(creep);
                break;
            case "build":
                Cache.creepTasks[creep.name] = TaskBuild.fromObj(creep);
                break;
            case "claim":
                Cache.creepTasks[creep.name] = TaskClaim.fromObj(creep);
                break;
            case "collectEnergy":
                Cache.creepTasks[creep.name] = TaskCollectEnergy.fromObj(creep);
                break;
            case "collectMinerals":
                Cache.creepTasks[creep.name] = TaskCollectMinerals.fromObj(creep);
                break;
            case "dismantle":
                Cache.creepTasks[creep.name] = TaskDismantle.fromObj(creep);
                break;
            case "fillEnergy":
                Cache.creepTasks[creep.name] = TaskFillEnergy.fromObj(creep);
                break;
            case "fillMinerals":
                Cache.creepTasks[creep.name] = TaskFillMinerals.fromObj(creep);
                break;
            case "harvest":
                Cache.creepTasks[creep.name] = TaskHarvest.fromObj(creep);
                break;
            case "heal":
                Cache.creepTasks[creep.name] = TaskHeal.fromObj(creep);
                break;
            case "meleeAttack":
                Cache.creepTasks[creep.name] = TaskMeleeAttack.fromObj(creep);
                break;
            case "mine":
                Cache.creepTasks[creep.name] = TaskMine.fromObj(creep);
                break;
            case "pickupResource":
                Cache.creepTasks[creep.name] = TaskPickupResource.fromObj(creep);
                break;
            case "rally":
                Cache.creepTasks[creep.name] = TaskRally.fromObj(creep);
                break;
            case "rangedAttack":
                Cache.creepTasks[creep.name] = TaskRangedAttack.fromObj(creep);
                break;
            case "repair":
                Cache.creepTasks[creep.name] = TaskRepair.fromObj(creep);
                break;
            case "reserve":
                Cache.creepTasks[creep.name] = TaskReserve.fromObj(creep);
                break;
            case "upgradeController":
                Cache.creepTasks[creep.name] = TaskUpgradeController.fromObj(creep);
                break;
        }
    };

if (Memory.profiling) {
    require("screeps-profiler").registerObject(deserialization, "TaskDeserialization");
}
module.exports = deserialization;
