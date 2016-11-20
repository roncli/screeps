var Cache = require("cache"),
    Utilities = require("utilities"),

    Storer = {
        checkSpawn: (room) => {
            "use strict";

            var length = 0,
                max;
            
            // If there are no spawns, containers, or storages in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0 || Cache.containersInRoom(room).length === 0 || !room.storage) {
                return;
            }

            // Init road length cache.
            if (!Memory.lengthToStorage) {
                Memory.lengthToStorage = {};
            }

            // Determine the number storers needed.
            _.forEach(Cache.containersInRoom(room), (container) => {
                var closest = Utilities.objectsClosestToObj([].concat.apply([], [Cache.energySourcesInRoom(room), Cache.mineralsInRoom(room)]), container)[0];

                if (!Memory.lengthToStorage[container.id]) {
                    // Since minerals produce up to half as much as sources, count the length for half.
                    if (closest instanceof Mineral) {
                        Memory.lengthToStorage[container.id] = PathFinder.search(container.pos, {pos: room.storage.pos, range: 1}, {swampCost: 1}).path.length / 2;
                    } else {
                        Memory.lengthToStorage[container.id] = PathFinder.search(container.pos, {pos: room.storage.pos, range: 1}, {swampCost: 1}).path.length;
                    }
                }

                // Do not count completely mined up minerals.
                if (closest instanceof Mineral && closest.mineralAmount === 0) {
                    return;
                }

                length += Memory.lengthToStorage[container.id];
            });

            // If we don't have a storer for each container, spawn one.
            max = Math.ceil(2 * length / 30) + 1;
            if (_.filter(Cache.creepsInRoom("storer", room), (c) => c.spawning || c.ticksToLive >= 300).length < max) {
                Storer.spawn(room);
            }

            // Output storer count in the report.
            if (max > 0) {
                Cache.log.rooms[room.name].creeps.push({
                    role: "storer",
                    count: Cache.creepsInRoom("storer", room).length,
                    max: max
                });
            }        
        },
        
        spawn: (room) => {
            "use strict";

            var body = [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY],
                spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Fail under 750 energy.
            if (room.energyAvailable < 750) {
                return false;
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "storer", home: room.name});
            Cache.spawning[spawnToUse.id] = true;

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInRoom("storer", room)), (c) => _.sum(c.carry) > 0 || (!c.spawning && c.ticksToLive > 150)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled extensions.
            _.forEach(_.sortBy(creepsWithNoTask, (c) => c.pos.getRangeTo(Cache.spawnsInRoom(room)[0])), (creep) => {
                _.forEach(_.sortBy(tasks.fillEnergy.fillExtensionTasks, (t) => t.object.pos.getRangeTo(creep)), (task) => {
                    var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(Cache.creepsInRoom("all", room), (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                    if (energyMissing > 0) {
                        if (task.canAssign(creep)) {
                            creep.say("Extension");
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

            // Check for unfilled spawns.
            _.forEach(tasks.fillEnergy.fillSpawnTasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(Cache.creepsInRoom("all", room), (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Spawn");
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

            // Check for unfilled containers.
            _.forEach([].concat.apply([], [tasks.fillEnergy.fillStorageTasks, tasks.fillMinerals.fillStorageTasks]), (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(Game.creeps, (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
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

            // Attempt to get energy from containers.
            _.forEach(_.sortBy([].concat.apply([], [tasks.collectEnergy.storerTasks, tasks.collectMinerals.storerTasks]), (t) => -(t.object.energy || _.sum(t.object.store) || 0)), (task) => {
                if (!task.object.energy && !_.sum(task.object.store)) {
                    return;
                }
                var energy = (task.object.energy || _.sum(task.object.store) || 0) - _.reduce(_.filter(Game.creeps, (c) => c.memory.currentTask && c.memory.currentTask.type === task.type && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carryCapacity - _.sum(c.carry));}, 0);
                if (energy > 0) {
                    _.forEach(creepsWithNoTask, (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Collecting");
                            assigned.push(creep.name);
                            energy -= (creep.carryCapacity - _.sum(creep.carry));
                            if (energy <= 0) {
                                return false;
                            }
                        }
                    });
                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];
                }
            });

            // As a last resort, get energy from containers.
            _.forEach(tasks.collectEnergy.tasks, (task) => {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
    };

require("screeps-profiler").registerObject(Storer, "RoleStorer");
module.exports = Storer;
