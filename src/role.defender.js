var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),

    Defender = {
        checkSpawn: (room) => {
            "use strict";

            var num = 0, max = 0;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // Loop through the room defenders to see if we need to spawn a creep.
            if (Memory.maxCreeps.defender) {
                _.forEach(Memory.maxCreeps.defender[room.name], (value, toRoom) => {
                    var count = _.filter(Game.creeps, (c) => c.memory.role === "defender" && c.memory.home === room.name && c.memory.defend === toRoom).length;

                    num += count;
                    max += value.maxCreeps;

                    if (count < value.maxCreeps) {
                        Defender.spawn(room, toRoom);
                    }
                });
            }

            // Output defender count in the report.
            console.log("    Defenders: " + num + "/" + max);        
        },
        
        spawn: (room, toRoom) => {
            "use strict";

            var body = [],
                energy, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 2900.
            energy = Math.min(Utilities.getAvailableEnergyInRoom(room), 2900);

            // If we're not at 2900 and energy is not at capacity, bail.
            if (energy < 2900 && energy !== Utilities.getEnergyCapacityInRoom(room)) {
                return;
            }

            // Create the body based on the energy.
            for (count = 0; count < Math.floor(energy / 650); count++) {
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
            }

            if (energy % 650 >= 350 && energy % 650 < 450) {
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
            }

            for (count = 0; count < Math.floor(energy / 650); count++) {
                body.push(RANGED_ATTACK);
            }

            if (energy % 650 >= 200) {
                body.push(RANGED_ATTACK);
            }

            for (count = 0; count < Math.floor(energy / 650); count++) {
                body.push(HEAL);
            }

            if (energy % 650 >= 450) {
                body.push(HEAL);
            }

            for (count = 0; count < Math.floor(energy / 650); count++) {
                body.push(MOVE);
                body.push(MOVE);
                body.push(MOVE);
                body.push(MOVE);
            }

            if (energy % 650 >= 50) {
                body.push(MOVE);
            }

            if ((energy % 650 >= 100 && energy % 650 < 200) || (energy % 650 >= 250 && energy % 650 < 450) || (energy % 650 >= 500)) {
                body.push(MOVE);
            }

            if ((energy % 650 >= 150 && energy % 650 < 200) || (energy % 650 >= 300 && energy % 650 < 450) || (energy % 650 >= 550)) {
                body.push(MOVE);
            }

            if ((energy % 650 >= 400 && energy % 650 < 450) || (energy % 650 >= 600)) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "defender", home: room.name, defending: toRoom});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new defender " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.role === "defender" && c.memory.home === room.name && !c.memory.currentTask)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If the creeps are not in the room, rally them.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.defending), (creep) => {
                var task = TaskRally.getRoamerTask(creep);
                if (task.canAssign(creep)) {
                    assigned.push(creep.name);
                };
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }
            
            // Find hostiles to attack.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = TaskRangedAttack.getDefenderTask(creep);
                if (task && task.canAssign(creep)) {
                    creep.say("Die!", true);
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Find allies to heal.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = TaskHeal.getDefenderTask(creep);
                if (task && task.canAssign(creep)) {
                    creep.say("Heal");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Rally the troops!
            _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === c.memory.defending), (creep) => {
                var task = TaskRally.getRoamerTask(creep);
                if (task.canAssign(creep)) {
                    assigned.push(creep.name);
                };
            });
        }
    };

require("screeps-profiler").registerObject(Defender, "RoleDefender");
module.exports = Defender;
