var Tower = {
    assignTasks: (room, tasks) => {
        "use strict";

        var filteredTasks;

        // Find hostiles to attack.
        if (tasks.rangedAttack.tasks.length > 0) {
            _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                tower.attack(tasks.rangedAttack.tasks[0].enemy);
            });
            return;
        }

        // Check for critical repairs.
        if (tasks.repair.criticalTasks.length > 0) {
            _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                tower.repair(tasks.repair.criticalTasks[0].structure);
            });
            return;
        }

        // Check for repairs under 25000 hits.
        filteredTasks = _.filter(tasks.repair.tasks, (t) => t.structure.hits < 25000);
        if (filteredTasks.length > 0) {
            _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                tower.repair(filteredTasks[0].structure);
            });
            return;
        }

        // Check for heals.
        if (tasks.heal.tasks.length > 0) {
            _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                tower.heal(tasks.heal.tasks[0].ally);
            });
            return;
        }
    }
};

require("screeps-profiler").registerObject(Tower, "RoleTower");
module.exports = Tower;
