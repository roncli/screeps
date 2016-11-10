var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskMine = require("task.mine"),
    TaskRally = require("task.rally"),

    Miner = {
        checkSpawn: (room) => {
            "use strict";

            var supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom],
                max = 0;

            // If there are no spawns in the support room, or the room is unobservable, or there are no containers in the room, ignore the room.
            if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable || Cache.containersInRoom(room).length === 0) {
                return;
            }

            // Init road length cache.
            if (!Memory.lengthToContainer) {
                Memory.lengthToContainer = {};
            }

            // Loop through containers to see if we have anything we need to spawn.
            _.forEach(Cache.containersInRoom(room), (container) => {
                var source;

                // Calculate path length from container to support room's storage.
                if (!Memory.lengthToContainer[container.id]) {
                    Memory.lengthToContainer[container.id] = {};
                }
                if (!Memory.lengthToContainer[container.id][supportRoom.name]) {
                    Memory.lengthToContainer[container.id][supportRoom.name] = PathFinder.search(container.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}).path.length;
                }

                // If this container is for a mineral, check to make sure it has resources.
                if ((source = Utilities.objectsClosestToObj([].concat.apply([], [Cache.energySourcesInRoom(room), Cache.mineralsInRoom(room)]), container)[0]) instanceof Mineral) {
                    if (source.mineralAmount === 0) {
                        return;
                    }
                }

                max += 1;

                // If we don't have a remote miner for this container, spawn one.
                if (_.filter(Cache.creepsInRoom("remoteMiner", room), (c) => (c.spawning || c.ticksToLive >= 150 + Memory.lengthToContainer[container.id][supportRoom.name] * 3) && c.memory.container === container.id).length === 0) {
                    Miner.spawn(room, supportRoom, container.id);
                }
            });

            // Output miner count in the report.
            if (max > 0) {
                console.log("    Remote Miners: " + Cache.creepsInRoom("remoteMiner", room).length + "/" + max);
            }        
        },
        
        spawn: (room, supportRoom, id) => {
            "use strict";

            var body = [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK],
                energy, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the energy available, limiting to 4450.
            energy = Math.min(Utilities.getAvailableEnergyInRoom(supportRoom), 4450);

            // Fail under 650 energy.
            if (energy < 650) {
                return false;
            }

            // Do something different for minerals.
            if (Utilities.objectsClosestToObj([].concat.apply([], [Cache.energySourcesInRoom(room), Cache.mineralsInRoom(room)]), Cache.getObjectById(id))[0] instanceof Mineral) {
                // If we're not at 4450 and energy is not at capacity, bail.
                if (energy < 4450 && energy !== Utilities.getEnergyCapacityInRoom(supportRoom)) {
                    return;
                }

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
            spawnToUse = _.sortBy(_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]), (s) => s.room.name === supportRoom.name ? 0 : 1)[0];
            name = spawnToUse.createCreep(body, undefined, {role: "remoteMiner", home: room.name, supportRoom: supportRoom.name, container: id});
            if (spawnToUse.room.name === supportRoom.name) {
                Cache.spawning[spawnToUse.id] = true;
            }

            // If successful, log it.
            if (typeof name !== "number") {
                console.log("    Spawning new remote miner " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creepsInRoom("remoteMiner", room)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to assign mine tasks.
            if (!room.unobservable) {
                _.forEach(creepsWithNoTask, (creep) => {
                    var task = new TaskMine();
                    if (task.canAssign(creep)) {
                        creep.say("Mining");
                        assigned.push(creep.name);
                    }
                });
            }

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Rally remaining creeps.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskRally(creep.memory.home);
                task.canAssign(creep);
            });
        }
    };

require("screeps-profiler").registerObject(Miner, "RoleRemoteMiner");
module.exports = Miner;
