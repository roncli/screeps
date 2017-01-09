var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskMine = require("task.mine"),
    TaskRally = require("task.rally"),

    Miner = {
        checkSpawn: (room) => {
            "use strict";

            var containers = Cache.containersInRoom(room),
                max = 0,
                sources, miners;

            // If there are no spawns or containers in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0 || containers.length === 0) {
                return;
            }
            
            sources = [].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]);
            miners = Cache.creepsInRoom("miner", room);

            // Loop through containers to see if we have anything we need to spawn.
            _.forEach(containers, (container) => {
                var source = Utilities.objectsClosestToObj(sources, container)[0],
                    containerId = container.id;
                
                // If this container is for a mineral, check to make sure it has resources.
                if (source instanceof Mineral && source.mineralAmount === 0) {
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
                Cache.log.rooms[room.name].creeps.push({
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
                workCount = 0,
                storage = room.storage,
                canBoost = false,
                roomName = room.name,
                energy, units, remainder, count, spawnToUse, name, labToBoostWith;

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
                    workCount += 4;
                }

                if (remainder >= 150) {
                    body.push(WORK);
                    workCount++;
                }

                if (remainder >= 250) {
                    body.push(WORK);
                    workCount++;
                }

                if (remainder >= 350) {
                    body.push(WORK);
                    workCount++;
                }
            }

            if (workCount > 0 && storage && Cache.labsInRoom(room).length > 0 && (Math.max(storage.store[RESOURCE_UTRIUM_OXIDE] || 0, storage.store[RESOURCE_UTRIUM_ALKALIDE] || 0, storage.store[RESOURCE_CATALYZED_UTRIUM_ALKALIDE] || 0)) >= 30 * workCount) {
                canBoost = !!(labToBoostWith = Utilities.getLabToBoostWith(room)[0]);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "miner-" + roomName + "-" + Game.time.toFixed(0).substring(4), {role: "miner", home: roomName, container: id, labs: canBoost ? [labToBoostWith.id] : []});
            Cache.spawning[spawnToUse.id] = typeof name !== "number";

            if (typeof name !== "number" && canBoost) {
                // Set the lab to be in use.
                labToBoostWith.creepToBoost = name;
                labToBoostWith.resource = (storage.store[RESOURCE_CATALYZED_UTRIUM_ALKALIDE] >= 30 * workCount) ? RESOURCE_CATALYZED_UTRIUM_ALKALIDE : ((storage.store[RESOURCE_UTRIUM_ALKALIDE] >= 30 * workCount) ? RESOURCE_UTRIUM_ALKALIDE : RESOURCE_UTRIUM_OXIDE);
                labToBoostWith.amount = 30 * workCount;
                room.memory.labsInUse.push(labToBoostWith);

                // If anything is coming to fill the lab, stop it.
                _.forEach(_.filter(Cache.creepsInRoom("all", room), (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && c.memory.currentTask.id === labToBoostWith.id), (creep) => {
                    delete creep.memory.currentTask;
                });
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
