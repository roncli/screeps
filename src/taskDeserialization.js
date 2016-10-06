var TaskBuild = require("task.build"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskHarvest = require("task.harvest"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),
    TaskRepair = require("task.repair"),
    TaskUpgradeController = require("task.upgradeController"),
    deserialization = (creep, creepTasks) => {
        switch (creep.memory.currentTask.type) {
            case "build":
                creepTasks[creep.name] = TaskBuild.fromObj(creep);
                break;
            case "fillEnergy":
                creepTasks[creep.name] = TaskFillEnergy.fromObj(creep);
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
