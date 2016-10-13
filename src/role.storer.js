var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskCollectMinerals = require("task.collectMinerals"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals"),

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
                if (!Memory.lengthToStorage[container.id]) {
                    Memory.lengthToStorage[container.id] = PathFinder.search(container.pos, {pos: room.storage.pos, range: 1}, {swampCost: 1}).path.length;
                }
                length += Memory.lengthToStorage[container.id];
            });

            // If we don't have a storer for each container, spawn one.
            if (Math.ceil(2 * length / 45) > _.filter(Cache.creepsInRoom("storer", room), (c) => !c.ticksToLive || c.ticksToLive >= 150).length) {
                Storer.spawn(room);
            }

            // Output storer count in the report.
            console.log("    Storers: " + Cache.creepsInRoom("storer", room).length + "/" + Math.ceil(2 * length / 45));        
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

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new storer " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room) => {
            "use strict";

            var creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creepsInRoom("storer", room)),
                assigned = [],
                tasks;

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled containers.
            tasks = [].concat.apply([], [TaskFillEnergy.getFillStorageTasks(room), TaskFillMinerals.getFillStorageTasks(room)]);
            if (tasks.length > 0) {
                console.log("    Unfilled Storage: " + tasks.length);
            }
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(_.sum(task.object.store)) - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: task.type, id: task.id}), function(sum, c) {return sum + _.sum(c.carry);}, 0);
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
            _.forEach(_.sortBy([].concat.apply([], [TaskCollectEnergy.getStorerTasks(room), TaskCollectMinerals.getStorerTasks(room)]), (t) => -_.sum(t.object.store)), (task) => {
                if (!_.sum(task.object.store)) {
                    return;
                }
                var energy = _.sum(task.object.store) - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: task.type, id: task.id}), function(sum, c) {return sum + (c.carryCapacity - _.sum(c.carry));}, 0);
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
