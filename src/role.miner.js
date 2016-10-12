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

            //  Loop through containers to see if we have anything we need to spawn.
            _.forEach(Cache.containersInRoom(room), (container) => {
                max += 1;

                // If we don't have a miner for this container, spawn one.
                if (_.filter(Cache.creepsInRoom("miner", room), (c) => c.ticksToLive >= 150 && c.memory.container === container.id).length === 0) {
                    Miner.spawn(room, container.id);
                }
            });

            // Output miner count in the report.
            console.log("    Miners: " + Cache.creepsInRoom("miner", room).length + "/" + max);        
        },
        
        spawn: (room, id) => {
            "use strict";

            var body = [MOVE, WORK, WORK, WORK, WORK, WORK],
                spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Fail under 550 energy.
            if (Utilities.getAvailableEnergyInRoom(room) < 550) {
                return false;
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
