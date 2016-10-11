var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHeal = require("task.heal"),
    TaskRangedAttack = require("task.rangedAttack"),
    TaskRepair = require("task.repair"),

    Tower = {
        assignTasks: (room) => {
            "use strict";

            var tasks;

            // Find hostiles to attack.
            tasks = TaskRangedAttack.getTasks(room);
            if (tasks.length > 0) {
                _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                    tower.attack(tasks[0].enemy);
                });
                return;
            }

            // Check for critical repairs.
            tasks = TaskRepair.getCriticalTasks(room);
            if (tasks.length > 0) {
                _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                    tower.repair(tasks[0].structure);
                });
                return;
            }

            // Check for repairs.
            tasks = TaskRepair.getTasks(room);
            if (tasks.length > 0) {
                if (tasks[0].structure.hits < 25000) {
                    _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                        tower.repair(tasks[0].structure);
                    });
                    return;
                }
            }

            // Check for heals.
            tasks = TaskHeal.getTasks(room);
            if (tasks.length > 0) {
                _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                    tower.heal(tasks[0].ally);
                });
                return;
            }
        }
    };

require("screeps-profiler").registerObject(Tower, "RoleTower");
module.exports = Tower;
