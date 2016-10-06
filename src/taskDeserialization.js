var TaskBuild = require("task.build"),
    TaskFillExtension = require("task.fillExtension"),
    TaskFillSpawn = require("task.fillSpawn"),
    TaskFillTower = require("task.fillTower"),
    TaskHarvest = require("task.harvest"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),
    TaskRepair = require("task.repair"),
    TaskUpgradeController = require("task.upgradeController"),
    deserialization = (creep) => {
        switch (creep.memory.currentTask.type) {
            case "build":
                creepTasks[creep.name] = TaskBuild.fromObj(creep);
                break;
            case "fillExtension":
                creepTasks[creep.name] = TaskFillExtension.fromObj(creep);
                break;
            case "fillSpawn":
                creepTasks[creep.name] = TaskFillSpawn.fromObj(creep);
                break;
            case "fillTower":
                creepTasks[creep.name] = TaskFillTower.fromObj(creep);
                break;
            case "harvest":
                creepTasks[creep.name] = TaskHarvest.fromObj(creep);
                break;
            case "heal":
                creepTasks[creep.name] = TaskHeal.fromObj(creep);
                break;
            case "rally":
                creepTasks[creep.name] = TaskRally.fromObj(creep);
                break;
            case "rangedAttack":
                creepTasks[creep.name] = TaskRangedAttack.fromObj(creep);
                break;
            case "repair":
                creepTasks[creep.name] = TaskRepair.fromObj(creep);
                break;
            case "upgradeController":
                creepTasks[creep.name] = TaskUpgradeController.fromObj(creep);
                break;
        }
    };

module.exports = deserialization;
