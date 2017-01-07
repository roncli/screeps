var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskBuild = require("task.build"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskHarvest = require("task.harvest"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),
    TaskRepair = require("task.repair"),

    Worker = {
        checkSpawn: (room) => {
            "use strict";

            var roomName = room.name,
                supportRoom = Game.rooms[Memory.rooms[roomName].roomType.supportRoom],
                supportRoomName = supportRoom.name,
                containers = Cache.containersInRoom(room),
                workers = Cache.creepsInRoom("remoteWorker", room),
                max = 0;

            // If there are no spawns in the support room, or the room is unobservable, or there are no containers in the room, ignore the room.
            if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable || containers.length === 0) {
                return;
            }

            // Loop through containers to see if we have anything we need to spawn.
            _.forEach(containers, (container) => {
                var source = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0],
                    containerId = container.id;

                // If this container is for a mineral, skip it.
                if (source instanceof Mineral) {
                    return;
                }

                max += 1;

                if (_.filter(workers, (c) => (c.spawning || c.ticksToLive >= 150 + (Memory.lengthToContainer && Memory.lengthToContainer[containerId] && Memory.lengthToContainer[containerId][supportRoomName] ? Memory.lengthToContainer[containerId][supportRoomName] : 0) * 2) && c.memory.container === containerId).length === 0) {
                    Worker.spawn(room, supportRoom, containerId);
                }

                // Only 1 worker per room.
                return false;
            });

            // Output remote worker count in the report.
            if (Memory.log && (workers.length > 0 || max > 0)) {
                Cache.log.rooms[roomName].creeps.push({
                    role: "remoteWorker",
                    count: workers.length,
                    max: max
                });
            }
        },
        
        spawn: (room, supportRoom, id) => {
            "use strict";

            var body = [],
                roomName = room.name,
                supportRoomName = supportRoom.name,
                energy, units, secondUnits, remainder, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 2750.
            energy = Math.min(supportRoom.energyCapacityAvailable, 2750);
            units = Math.floor(energy / 200);
            secondUnits = Math.floor((energy - 1000) / 150);
            remainder = energy % 200;

            // Create the body based on the energy.
            for (count = 0; count < units && count < 5; count++) {
                body.push(WORK);
            }

            if (energy < 1000 && remainder >= 150) {
                body.push(WORK);
            }

            for (count = 0; count < units && count < 5; count++) {
                body.push(CARRY);
            }

            for (count = 0; count < secondUnits; count++) {
                body.push(CARRY);
                body.push(CARRY);
            }

            if (energy < 1000 && remainder >= 100 && remainder < 150) {
                body.push(CARRY);
            }

            if (energy > 1000 && (energy - 1000) % 150 >= 100) {
                body.push(CARRY);
            }

            for (count = 0; count < units && count < 5; count++) {
                body.push(MOVE);
            }

            for (count = 0; count < secondUnits; count++) {
                body.push(MOVE);
            }

            if (energy < 1000 && remainder >= 50) {
                body.push(MOVE);
            }

            if (energy > 1000 && (energy - 1000) % 150 >= 50) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "remoteWorker-" + roomName + "-" + Game.time.toFixed(0).substring(4), {role: "remoteWorker", home: roomName, supportRoom: supportRoomName, container: id});
            if (spawnToUse.room.name === supportRoomName) {
                Cache.spawning[spawnToUse.id] = typeof name !== "number";
            }

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInRoom("remoteWorker", room)), (c) => _.sum(c.carry) > 0 || (!c.spawning && c.ticksToLive > 150)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for 1-progress construction sites.
            _.forEach(creepsWithNoTask, (creep) => {
                var sites = _.filter(creep.room.find(FIND_MY_CONSTRUCTION_SITES), (c) => c.progressTotal === 1);
                
                if (sites.length > 0) {
                    var task = new TaskBuild(sites[0].id);
                    if (task.canAssign(creep)) {
                        creep.say("Build");
                        assigned.push(creep.name);
                    }
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check critical repairs.
            _.forEach(creepsWithNoTask, (creep) => {
                _.forEach(TaskRepair.getCriticalTasks(creep.room), (task) => {
                    if (_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id).length === 0) {
                        if (task.canAssign(creep)) {
                            creep.say("CritRepair");
                            assigned.push(creep.name);
                            return false;
                        }
                    }
                });
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for construction sites.
            _.forEach(creepsWithNoTask, (creep) => {
                var constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
                if (constructionSites.length > 0) {
                    var task = new TaskBuild(constructionSites[0].id);
                    if (task.canAssign(creep)) {
                        creep.say("Build");
                        assigned.push(creep.name);
                    }
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled containers.
            _.forEach([].concat.apply([], [tasks.fillEnergy.storageTasks, tasks.fillEnergy.containerTasks]), (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Container");
                            assigned.push(creep.name);
                            energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });

                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];
                }
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled storage for minerals.
            _.forEach(tasks.fillMinerals.storageTasks, (task) => {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Storage");
                        assigned.push(creep.name);
                    }
                });

                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled terminals for minerals.
            _.forEach(tasks.fillMinerals.terminalTasks, (task) => {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Terminal");
                        assigned.push(creep.name);
                    }
                });

                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for dropped resources in current room.
            _.forEach(creepsWithNoTask, (creep) => {
                if (creep.room.name !== room.name) {
                    return;
                }
                _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                    if (_.filter(task.resource.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                        return;
                    }
                    if (task.canAssign(creep)) {
                        creep.say("Pickup");
                        assigned.push(creep.name);
                        return false;
                    }
                });
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to get energy from containers.
            if (!room.unobservable) {
                _.forEach(creepsWithNoTask, (creep) => {
                    var task = new TaskCollectEnergy(creep.memory.container);

                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                    }
                });
            }

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to assign harvest task to remaining creeps.
            if (!room.unobservable) {
                _.forEach(creepsWithNoTask, (creep) => {
                    var task = new TaskHarvest(),
                        sources = Utilities.objectsClosestToObj(_.filter(room.find(FIND_SOURCES), (s) => s.energy > 0), creep);
                    
                    if (sources.length === 0) {
                        return false;
                    }

                    creep.memory.homeSource = sources[0].id;

                    if (task.canAssign(creep)) {
                        creep.say("Harvesting");
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

require("screeps-profiler").registerObject(Worker, "RoleRemoteWorker");
module.exports = Worker;
