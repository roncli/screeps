var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskMine = require("task.mine"),
    TaskRally = require("task.rally"),

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
                var source;
                
                // If this container is for a mineral, check to make sure it has resources.
                if ((source = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0]) instanceof Mineral) {
                    if (source.mineralAmount === 0) {
                        return;
                    }
                }

                max += 1;

                // If we don't have a miner for this container, spawn one.
                if (_.filter(Cache.creepsInRoom("miner", room), (c) => (c.spawning || c.ticksToLive >= 150) && c.memory.container === container.id).length === 0) {
                    Miner.spawn(room, container.id);
                }
            });

            // Output miner count in the report.
            if (max > 0) {
                Cache.log.rooms[room.name].creeps.push({
                    role: "miner",
                    count: Cache.creepsInRoom("miner", room).length,
                    max: max
                });
            }        
        },
        
        spawn: (room, id) => {
            "use strict";

            var body = [MOVE, WORK, WORK, WORK, WORK, WORK], workCount = 0, canBoost = false,
                energy, count, spawnToUse, name, labToBoostWith;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the energy available, limiting to 4450.
            energy = Math.min(room.energyCapacityAvailable, 4450);

            // Do something different for minerals.
            if (Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), Cache.getObjectById(id))[0] instanceof Mineral) {
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
                    workCount += 5;
                }

                if (energy % 550 >= 150) {
                    body.push(WORK);
                    workCount++;
                }

                if (energy % 550 >= 250) {
                    body.push(WORK);
                    workCount++;
                }

                if (energy % 550 >= 350) {
                    body.push(WORK);
                    workCount++;
                }

                if (energy % 550 >= 450) {
                    body.push(WORK);
                    workCount++;
                }
            }

            if (workCount > 0 && room.storage && Cache.labsInRoom(room).length > 0 && (Math.max(room.storage.store[RESOURCE_UTRIUM_OXIDE], room.storage.store[RESOURCE_UTRIUM_ALKALIDE], room.storage.store[RESOURCE_CATALYZED_UTRIUM_ALKALIDE])) >= 30 * workCount) {
                canBoost = !!(labToBoostWith = Utilities.getLabToBoostWith(room)[0]);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "miner-" + room.name + "-" + Game.time.toFixed(0).substring(4), {role: "miner", home: room.name, container: id, labs: canBoost ? [labToBoostWith.id] : []});
            Cache.spawning[spawnToUse.id] = typeof name !== "number";

            if (typeof name !== "number" && canBoost) {
                // Set the lab to be in use.
                labToBoostWith.creepToBoost = name;
                labToBoostWith.resource = (room.storage.store[RESOURCE_CATALYZED_UTRIUM_ALKALIDE] >= 30 * workCount) ? RESOURCE_CATALYZED_UTRIUM_ALKALIDE : ((room.storage.store[RESOURCE_UTRIUM_ALKALIDE] >= 30 * workCount) ? RESOURCE_UTRIUM_ALKALIDE : RESOURCE_UTRIUM_OXIDE);
                labToBoostWith.amount = 30 * workCount;
                room.memory.labsInUse.push(labToBoostWith);

                // If anything is coming to fill the lab, stop it.
                _.forEach(_.filter(Cache.creepsInRoom("all", room), (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && c.memory.currentTask.id === labToBoostWith.id), (creep) => {
                    delete creep.memory.currentTask;
                });
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

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creepsInRoom("miner", room)),
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

require("screeps-profiler").registerObject(Miner, "RoleMiner");
module.exports = Miner;
