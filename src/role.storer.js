var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskMine = require("task.mine"),

    Storer = {
        checkSpawn: (room) => {
            "use strict";

            var max = 0,
                count, capacity, adjustment;
            
            // If there are no spawns or containers in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0 || Cache.containersInRoom(room).length === 0) {
                return;
            }

            // If we don't have a storer for this container, spawn one.
            if (_.filter(Cache.creepsInRoom("storer", room), (c) => c.memory.container === container.id).length === 0) {
                Storer.spawn(room, container.id);
            }

            // Output storer count in the report.
            console.log("    Storers: " + Cache.creepsInRoom("storer", room).length + "/" + max);        
        },
        
        spawn: (room, id) => {
            "use strict";

            var body = [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY],
                structures, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the spawns and extensions in the room.
            structures = [].concat.apply([], [Cache.spawnsInRoom(room), Cache.extensionsInRoom(room)]);

            // Fail if any of the structures aren't full.
            if (_.filter(structures, (s) => s.energy !== s.energyCapacity).length !== 0) {
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

            var creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creepsInRoom("storer", room));

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled containers.
            tasks = TaskFillEnergy.getFillStorageTasks(room);
            if (tasks.length > 0) {
                console.log("    Unfilled Storage: " + tasks.length);
            }
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(task.object.store[RESOURCE_ENERGY]) - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Storage");
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

            // Attempt to get energy from containers.
            _.forEach(TaskCollectEnergy.getStorerTasks(room), (task) => {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                    }
                });
            });

        }
    };

require("screeps-profiler").registerObject(Storer, "RoleStorer");
module.exports = Storer;
