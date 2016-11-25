var Cache = require("cache"),
    Tower = {
        assignTasks: (room, tasks) => {
            "use strict";

            var filteredTasks;

            // Find hostiles to attack.
            if (tasks.rangedAttack.tasks.length > 0) {
                _.forEach(Cache.towersInRoom(room), (tower) => {
                    tower.attack(tasks.rangedAttack.tasks[0].enemy);
                });
                return;
            }

            // Check for critical repairs.
            if (tasks.repair.criticalTasks.length > 0) {
                _.forEach(Cache.towersInRoom(room), (tower) => {
                    tower.repair(tasks.repair.criticalTasks[0].structure);
                });
                return;
            }

            // Check for heals.
            if (tasks.heal.tasks.length > 0) {
                _.forEach(Cache.towersInRoom(room), (tower) => {
                    tower.heal(tasks.heal.tasks[0].ally);
                });
                return;
            }

            // Check for repairs under 2500 hits.
            filteredTasks = _.filter(tasks.repair.tasks, (t) => t.structure.hits < 2500);
            if (filteredTasks.length > 0) {
                _.forEach(Cache.towersInRoom(room), (tower) => {
                    tower.repair(filteredTasks[0].structure);
                });
                return;
            }
        }
    };

require("screeps-profiler").registerObject(Tower, "RoleTower");
module.exports = Tower;
