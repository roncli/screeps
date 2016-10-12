var Cache = require("cache"),
    TaskBuild = require("task.build"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskCollectMinerals = require("task.collectMinerals"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals"),
    TaskHarvest = require("task.harvest"),
    TaskHeal = require("task.heal"),
    TaskMine = require("task.mine"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),
    TaskRepair = require("task.repair"),
    TaskUpgradeController = require("task.upgradeController"),
    
    deserialization = (creep) => {
        "use strict";

        switch (creep.memory.currentTask.type) {
            case "build":
                Cache.creepTasks[creep.name] = TaskBuild.fromObj(creep);
                break;
            case "collectEnergy":
                Cache.creepTasks[creep.name] = TaskCollectEnergy.fromObj(creep);
                break;
            case "collectMinerals":
                Cache.creepTasks[creep.name] = TaskCollectMinerals.fromObj(creep);
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
            case "upgradeController":
                Cache.creepTasks[creep.name] = TaskUpgradeController.fromObj(creep);
                break;
        }
    };

require("screeps-profiler").registerObject(deserialization, "TaskDeserialization");
module.exports = deserialization;
