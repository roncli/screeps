var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskRally = require("task.rally"),

    Storer = {
        checkSpawn: (room) => {
            "use strict";

            var supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom],
                max = 0, foundFirstSource = false,
                links;

            // If there are no spawns in the support room, or the room is unobservable, or there are no containers in the room, ignore the room.
            if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable || Cache.containersInRoom(room).length === 0) {
                return;
            }

            // Loop through containers to see if we have anything we need to spawn.
            _.forEach(Cache.containersInRoom(room), (container) => {
                var count = 0,
                    source, length, linkToUse;

                // If this container is for a mineral, bail if there are no minerals left.  If it's not a mineral, start counter at -1 since it has a worker on it already.
                if ((source = Utilities.objectsClosestToObj([].concat.apply([], [Cache.energySourcesInRoom(room), Cache.mineralsInRoom(room)]), container)[0]) instanceof Mineral) {
                    if (source.mineralAmount === 0) {
                        return;
                    }
                } else {
                    // If this is the first source, don't count the worker.
                    count = foundFirstSource ? 0 : -1;
                    foundFirstSource = true;
                }

                // Calculate the length the storers need to travel.
                length = Memory.lengthToContainer[container.id][supportRoom.name];
                if (Cache.linksInRoom(supportRoom).length > 1) {
                    if (!Memory.lengthToLink) {
                        Memory.lengthToLink = {};
                    }
                    if (!Memory.lengthToLink[container.id]) {
                        Memory.lengthToLink[container.id] = {};
                    }
                    if (!Memory.lengthToLink[container.id][supportRoom.name]) {
                        links = Cache.linksInRoom(supportRoom);
                        _.remove(links, (l) => l.id === Utilities.objectsClosestToObjByPath(Cache.linksInRoom(supportRoom), Cache.spawnsInRoom(supportRoom)[0])[0].id);
                        Memory.lengthToLink[container.id][supportRoom.name] = PathFinder.search(Utilities.objectsClosestToObjByPath(links, container)[0].pos, {pos: container.pos, range: 1}, {swampCost: 1, maxOps: 100000}).path.length;
                    }
                    length = Memory.lengthToLink[container.id][supportRoom.name];
                }

                // Calculate number of storers needed.
                count += Math.max(Math.ceil(length / 20), 0);
                max += count;

                // If we don't have enough remote storers for this container, spawn one.
                if (_.filter(Cache.creepsInRoom("remoteStorer", room), (c) => (c.spawning || c.ticksToLive >= 150) && c.memory.container === container.id).length < count) {
                    Storer.spawn(room, supportRoom, container.id);
                }
            });

            if (max > 0) {
                console.log("    Remote Storers: " + Cache.creepsInRoom("remoteStorer", room).length + "/" + max);
            }
        },
        
        spawn: (room, supportRoom, id) => {
            "use strict";

            var body = [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY],
                spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Fail under 750 energy.
            if (Utilities.getAvailableEnergyInRoom(supportRoom) < 750) {
                return false;
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.sortBy(_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]), (s) => s.room.name === supportRoom.name ? 0 : 1)[0];
            name = spawnToUse.createCreep(body, undefined, {role: "remoteStorer", home: room.name, supportRoom: supportRoom.name, container: id});
            if (spawnToUse.room.name === supportRoom.name) {
                Cache.spawning[spawnToUse.id] = true;
            }

            // If successful, log it.
            if (typeof name !== "number") {
                console.log("    Spawning new remote storer " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInRoom("remoteStorer", room)), (c) => _.sum(c.carry) > 0 || (!c.spawning && c.ticksToLive > 150)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled links.
            if (tasks.fillEnergy.fillLinkTask) {
                _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === c.memory.supportRoom && c.carry[RESOURCE_ENERGY] && c.carry[RESOURCE_ENERGY] > 0), (creep) => {
                    if (tasks.fillEnergy.fillLinkTask.canAssign(creep)) {
                        creep.say("Link");
                        assigned.push(creep.name);
                    }
                });
            }

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled storage.
            _.forEach([].concat.apply([], [tasks.fillEnergy.fillStorageTasks, tasks.fillMinerals.fillStorageTasks]), (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce([].concat.apply([], [Utilities.creepsWithTask(Game.creeps, {type: "fillEnergy", id: task.id}), Utilities.creepsWithTask(Game.creeps, {type: "fillMinerals", id: task.id})]), function(sum, c) {return sum + _.sum(c.carry);}, 0);
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
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

            // Check for unfilled containers.
            _.forEach(tasks.fillEnergy.fillContainerTasks, (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce([].concat.apply([], [Utilities.creepsWithTask(Game.creeps, {type: "fillEnergy", id: task.id}), Utilities.creepsWithTask(Game.creeps, {type: "fillMinerals", id: task.id})]), function(sum, c) {return sum + _.sum(c.carry);}, 0);
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
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

            // Rally remaining creeps.
            _.forEach(creepsWithNoTask, (creep) => {
                if (_.sum(creep.carry) > 0) {
                    var task = new TaskRally(creep.memory.supportRoom);
                } else {
                    var task = new TaskRally(creep.memory.home);
                }
                task.canAssign(creep);
            });
        }
    };

require("screeps-profiler").registerObject(Storer, "RoleRemoteStorer");
module.exports = Storer;
