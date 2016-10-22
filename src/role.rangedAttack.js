var Cache = require("cache"),
    Utilities = require("utilities"),

    Ranged = {
        checkSpawn: (room) => {
            "use strict";

            var count;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // If we have less than max ranged attackers, spawn a ranged attacker.
            count = Cache.creepsInRoom("rangedAttack", room).length;
            if (count < Memory.maxCreeps.rangedAttack) {
                Ranged.spawn(room);
            }

            // Output ranged attacker count in the report.
            if (Memory.maxCreeps.rangedAttack > 0) {
                console.log("    Ranged Attackers: " + count + "/" + Memory.maxCreeps.rangedAttack);
            }        
        },
        
        spawn: (room) => {
            "use strict";

            var body = [],
                energy, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 1850.
            energy = Math.min(Utilities.getAvailableEnergyInRoom(room), 1850);

            // If we're not at 1850 and energy is not at capacity, bail.
            if (energy < 1850 && energy !== Utilities.getEnergyCapacityInRoom(room)) {
                return;
            }

            // Create the body based on the energy.
            for (count = 0; count < Math.floor(energy / 350); count++) {
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
            }

            if (energy % 350 >= 150 && energy % 350 < 250) {
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
                body.push(TOUGH);
            }

            for (count = 0; count < Math.floor(energy / 350); count++) {
                body.push(MOVE);
                body.push(MOVE);
                body.push(MOVE);
            }

            if (energy % 350 >= 50) {
                body.push(MOVE);
            }

            if (energy % 350 >= 100) {
                body.push(MOVE);
            }

            if ((energy % 350 >= 200 && energy % 350 < 250) || (energy % 350 >= 300)) {
                body.push(MOVE);
            }

            for (count = 0; count < Math.floor(energy / 350); count++) {
                body.push(RANGED_ATTACK);
            }

            if (energy % 350 >= 250) {
                body.push(RANGED_ATTACK);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "rangedAttack"});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it.
            if (typeof name !== "number") {
                console.log("    Spawning new ranged attacker " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            // Find hostiles to attack.
            _.forEach(tasks.rangedAttack.tasks, (task) => {
                _.forEach(Utilities.creepsWithNoTask(Cache.creepsInRoom("rangedAttack", room)), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Die!", true);
                    }
                });
            });

            // Rally the troops!
            _.forEach(tasks.rally.attackerTasks, (task) => {
                _.forEach(Utilities.creepsWithNoTask(Cache.creepsInRoom("rangedAttack", room)), (creep) => {
                    task.canAssign(creep);
                });
            });
        }
    };

require("screeps-profiler").registerObject(Ranged, "RoleRangedAttack");
module.exports = Ranged;
