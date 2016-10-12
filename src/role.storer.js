var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskFillEnergy = require("task.fillEnergy"),

    Storer = {
        checkSpawn: (room) => {
            "use strict";

            var max = 0,
                count, capacity, adjustment;
            
            // If there are no spawns or containers in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0 || Cache.containersInRoom(room).length === 0) {
                return;
            }

            // If we don't have a storer for each container, spawn one.
            if (Cache.containersInRoom(room).length > _.filter(Cache.creepsInRoom("storer", room), (c) => c.ticksToLive && c.ticksToLive >= 150).length) {
                Storer.spawn(room);
            }

            // Output storer count in the report.
            console.log("    Storers: " + Cache.creepsInRoom("storer", room).length + "/" + Cache.containersInRoom(room).length);        
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
            tasks = TaskFillEnergy.getFillStorageTasks(room);
            if (tasks.length > 0) {
                console.log("    Unfilled Storage: " + tasks.length);
            }
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(_.sum(task.object.store)) - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + _.sum(c.carry);}, 0);
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
            _.forEach(TaskCollectEnergy.getStorerTasks(room), (task) => {
                if (!task.object.store[RESOURCE_ENERGY]) {
                    return;
                }
                var energy = _.sum(task.object.store) - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "collectEnergy", id: task.id}), function(sum, c) {return sum + (c.carryCapacity - _.sum(c.carry));}, 0);
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
