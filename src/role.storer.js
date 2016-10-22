var Cache = require("cache"),
    Utilities = require("utilities"),

    Storer = {
        checkSpawn: (room) => {
            "use strict";

            var length = 0;
            
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
            if (Math.ceil(2 * length / 45) > _.filter(Cache.creepsInRoom("storer", room), (c) => !c.ticksToLive || c.ticksToLive >= 150).length) {
                Storer.spawn(room);
            }

            // Output storer count in the report.
            if (Math.ceil(2 * length / 45) > 0) {
                console.log("    Storers: " + Cache.creepsInRoom("storer", room).length + "/" + Math.ceil(2 * length / 45));
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
            if (Utilities.getAvailableEnergyInRoom(room) < 750) {
                return false;
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "storer"});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it.
            if (typeof name !== "number") {
                console.log("    Spawning new storer " + name);
                _.forEach(Cache.creepsInRoom({role: "worker"}, room), (creep) => {
                    creep.memory.completeTask = true;
                });
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creepsInRoom("storer", room)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled containers.
            _.forEach([].concat.apply([], [tasks.fillEnergy.fillStorageTasks, tasks.fillMinerals.fillStorageTasks]), (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(_.sum(task.object.store)) - _.reduce([].concat.apply([], [Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillMinerals", id: task.id})]), function(sum, c) {return sum + _.sum(c.carry);}, 0);
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
                var energy = (task.object.energy || _.sum(task.object.store) || 0) - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: task.type, id: task.id}), function(sum, c) {return sum + (c.carryCapacity - _.sum(c.carry));}, 0);
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

        }
    };

require("screeps-profiler").registerObject(Storer, "RoleStorer");
module.exports = Storer;
