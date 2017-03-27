var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskCollectMinerals = require("task.collectMinerals"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),

    Storer = {
        checkSpawn: (room) => {
            "use strict";

            var supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom],
                containers = Cache.containersInRoom(room),
                roomName = room.name,
                storers = Cache.creeps[roomName] && Cache.creeps[roomName].remoteStorer || [],
                max = 0,
                foundFirstSource = false;

            // If there are no spawns in the support room, or the room is unobservable, or there are no containers in the room, ignore the room.
            if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable || containers.length === 0) {
                return;
            }

            // Loop through containers to see if we have anything we need to spawn.
            _.forEach(containers, (container) => {
                var count = 0,
                    id = container.id,
                    source, length;

                if (!Memory.containerSource[id]) {
                    Memory.containerSource[id] = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0].id;
                }

                source = Game.getObjectById(Memory.containerSource[id]);
                
                // If this container is for a mineral, bail if there are no minerals left.  If it's not a mineral, start counter at -1 since it has a worker on it already.
                if (source instanceof Mineral) {
                    if (source.mineralAmount === 0) {
                        return;
                    }
                } else {
                    // If this is the first source, don't count the worker.
                    count = foundFirstSource ? 0 : -1;
                    foundFirstSource = true;
                }

                // Calculate the length the storers need to travel.
                length = Memory.lengthToContainer[id][supportRoom.name];

                // Calculate number of storers needed.
                count += Math.max(Math.ceil(length / [18, 18, 18, 18, 30, 44, 54, 58, 58][supportRoom.controller.level]), 0);
                max += count;

                // If we don't have enough remote storers for this container, spawn one.
                if (_.filter(storers, (c) => (c.spawning || c.ticksToLive >= 150 + length * 2) && c.memory.container === id).length < count) {
                    Storer.spawn(room, supportRoom, id);
                }
            });

            if (Memory.log && (storers.length > 0 || max > 0)) {
                Cache.log.rooms[roomName].creeps.push({
                    role: "remoteStorer",
                    count: storers.length,
                    max: max
                });
            }
        },
        
        spawn: (room, supportRoom, id) => {
            "use strict";

            var roomName = room.name,
                supportRoomName = supportRoom.name,
                body = [], spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            switch (supportRoom.controller.level) {
                case 3:
                    body =  [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                    break;
                case 4:
                    body =  [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                    break;
                case 5:
                    body =  [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                    break;
                case 6:
                    body =  [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                    break;
                case 7:
                case 8:
                    body =  [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                    break;
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "remoteStorer-" + roomName + "-" + Game.time.toFixed(0).substring(4), {role: "remoteStorer", home: roomName, supportRoom: supportRoomName, container: id});
            if (spawnToUse.room.name === supportRoomName) {
                Cache.spawning[spawnToUse.id] = typeof name !== "number";
            }

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var roomName = room.name,
                creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteStorer || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for dropped resources in current room.
            _.forEach(creepsWithNoTask, (creep) => {
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

            // Check for unfilled storage.
            _.forEach(tasks.fillEnergy.storageTasks, (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
                if (energyMissing > 0) {
                    _.forEach(creepsWithNoTask, (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Storage");
                            assigned.push(creep.name);
                            energyMissing -= _.sum(creep.carry);
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

            // Check for unfilled containers.
            _.forEach(tasks.fillEnergy.containerTasks, (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
                if (energyMissing > 0) {
                    _.forEach(creepsWithNoTask, (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Container");
                            assigned.push(creep.name);
                            energyMissing -= _.sum(creep.carry);
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

            // Attempt to get energy from containers.
            if (!room.unobservable) {
                _.forEach(creepsWithNoTask, (creep) => {
                    var container = Game.getObjectById(creep.memory.container),
                        task;
                    
                    if (!container) {
                        return;
                    }
                    
                    if (container.store[RESOURCE_ENERGY]) {
                        task = new TaskCollectEnergy(creep.memory.container);
                    } else if (_.sum(container.store) > 0) {
                        task = new TaskCollectMinerals(creep.memory.container);
                    }

                    if (!task) {
                        return;
                    }

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

            // Rally remaining creeps.
            _.forEach(creepsWithNoTask, (creep) => {
                var task;
                if (_.sum(creep.carry) > 0) {
                    task = new TaskRally(creep.memory.supportRoom);
                } else {
                    task = new TaskRally(creep.memory.home);
                }
                task.canAssign(creep);
            });
        }
    };

require("screeps-profiler").registerObject(Storer, "RoleRemoteStorer");
module.exports = Storer;
