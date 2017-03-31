var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskMine = require("task.mine"),
    TaskRally = require("task.rally"),

    Miner = {
        checkSpawn: (room) => {
            "use strict";

            var roomName = room.name,
                containers = Cache.containersInRoom(room),
                max = 0,
                miners;

            // If there are no spawns or containers in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0 || containers.length === 0) {
                return;
            }
            
            miners = Cache.creeps[roomName] && Cache.creeps[roomName].miner || [];

            // Loop through containers to see if we have anything we need to spawn.
            _.forEach(containers, (container) => {
                var containerId = container.id,
                    source;

                if (!Memory.containerSource[containerId]) {
                    Memory.containerSource[containerId] = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0].id;
                }

                source = Game.getObjectById(Memory.containerSource[containerId]);
                
                // If this container is for a mineral, check to make sure it has resources and we're in our own room and it's high enough level.
                if (source instanceof Mineral && source.mineralAmount === 0 && (!room.controller || (room.controller.my && room.controller.level >= 6))) {
                    return;
                }

                max += 1;

                // If we don't have a miner for this container, spawn one.
                if (_.filter(miners, (c) => (c.spawning || c.ticksToLive >= 150) && c.memory.container === containerId).length === 0) {
                    Miner.spawn(room, containerId);
                }
            });

            // Output miner count in the report.
            if (Memory.log && (miners.length > 0 || max > 0)) {
                Cache.log.rooms[roomName].creeps.push({
                    role: "miner",
                    count: miners.length,
                    max: max
                });
            }        
        },
        
        spawn: (room, id) => {
            "use strict";

            var spawns = Cache.spawnsInRoom(room),
                body = [MOVE, WORK, WORK, WORK, WORK, WORK],
                storage = room.storage,
                roomName = room.name,
                energy, units, remainder, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the energy available, limiting to 4500.
            energy = Math.min(room.energyCapacityAvailable, 4500);
            units = Math.floor(energy / 450);
            remainder = energy % 450;

            // Do something different for minerals.
            if (Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), Game.getObjectById(id))[0] instanceof Mineral) {
                body = [];

                // Create the body based on the energy.
                for (count = 0; count < units; count++) {
                    body.push(MOVE);
                }

                if (remainder >= 50) {
                    body.push(MOVE);
                }

                for (count = 0; count < units; count++) {
                    body.push(WORK);
                    body.push(WORK);
                    body.push(WORK);
                    body.push(WORK);
                }

                if (remainder >= 150) {
                    body.push(WORK);
                }

                if (remainder >= 250) {
                    body.push(WORK);
                }

                if (remainder >= 350) {
                    body.push(WORK);
                }
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "miner-" + roomName + "-" + Game.time.toFixed(0).substring(4), {role: "miner", home: roomName, container: id});
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var roomName = room.name,
                creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].miner || []),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If not yet boosted, go get boosts.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
                var task = new TaskRally(creep.memory.labs[0]);
                task.canAssign(creep);
                assigned.push(creep.name);
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to assign mine tasks.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskMine();
                if (task.canAssign(creep)) {
                    creep.say("Mining");
                }
            });
        }
    };

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Miner, "RoleMiner");
}
module.exports = Miner;
