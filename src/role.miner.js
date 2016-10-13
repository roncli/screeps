var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskMine = require("task.mine"),

    Miner = {
        checkSpawn: (room) => {
            "use strict";

            var max = 0;

            // If there are no spawns or containers in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0 || Cache.containersInRoom(room).length === 0) {
                return;
            }

            // Loop through containers to see if we have anything we need to spawn.
            _.forEach(Cache.containersInRoom(room), (container) => {
                max += 1;

                // If we don't have a miner for this container, spawn one.
                if (_.filter(Cache.creepsInRoom("miner", room), (c) => (!c.ticksToLive || c.ticksToLive >= 150) && c.memory.container === container.id).length === 0) {
                    Miner.spawn(room, container.id);
                }
            });

            // Output miner count in the report.
            console.log("    Miners: " + Cache.creepsInRoom("miner", room).length + "/" + max);        
        },
        
        spawn: (room, id) => {
            "use strict";

            var body = [MOVE, WORK, WORK, WORK, WORK, WORK],
                energy, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the energy available, limiting to 4450.
            energy = Math.min(Utilities.getAvailableEnergyInRoom(room), 4450);

            // Fail under 550 energy.
            if (energy < 550) {
                return false;
            }

            // Do something different for minerals.
            if (Utilities.objectsClosestToObj([].concat.apply([], [Cache.energySourcesInRoom(room), Cache.mineralsInRoom(room)]), Cache.getObjectById(id))[0] instanceof Mineral) {
                body = [];

                // Create the body based on the energy.
                for (count = 0; count < Math.floor(energy / 550); count++) {
                    body.push(MOVE);
                }

                if (energy % 550 >= 50) {
                    body.push(MOVE);
                }

                for (count = 0; count < Math.floor(energy / 550); count++) {
                    body.push(WORK);
                    body.push(WORK);
                    body.push(WORK);
                    body.push(WORK);
                    body.push(WORK);
                }

                if (energy % 550 >= 150) {
                    body.push(WORK);
                }

                if (energy % 550 >= 250) {
                    body.push(WORK);
                }

                if (energy % 550 >= 350) {
                    body.push(WORK);
                }

                if (energy % 550 >= 450) {
                    body.push(WORK);
                }
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "miner", container: id});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new miner " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room) => {
            "use strict";

            var creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creepsInRoom("miner", room));

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to assign harvest task to remaining creeps.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskMine();
                if (task.canAssign(creep)) {
                    creep.say("Mining");
                }
            });
        }
    };

require("screeps-profiler").registerObject(Miner, "RoleMiner");
module.exports = Miner;
