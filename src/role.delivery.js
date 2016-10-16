var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskBuild = require("task.build"),
    TaskHarvest = require("task.harvest"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),
    TaskRepair = require("task.repair"),

    Delivery = {
        checkSpawn: (room) => {
            "use strict";

            var num = 0, max = 0;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // Loop through the room deliveries to see if we need to spawn a creep.
            if (Memory.maxCreeps.delivery) {
                _.forEach(Memory.maxCreeps.delivery[room.name], (value, toId) => {
                    var count = _.filter(Game.creeps, (c) => c.memory.role === "delivery" && c.memory.deliver === room.name && c.memory.home === toId).length;

                    num += count;
                    max += value.maxCreeps;

                    if (count < value.maxCreeps) {
                        Delivery.spawn(room, toId);
                    }
                });
            }

            // Output delivery count in the report.
            if (max > 0) {
                console.log("    Deliveries: " + num + "/" + max);
            }        
        },
        
        spawn: (room, id) => {
            "use strict";

            var body = [],
                energy, count, spawnToUse, name;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 3300.
            energy = Math.min(Utilities.getAvailableEnergyInRoom(room), 3300);

            // If we're not at 3300 and energy is not at capacity, bail.
            if (energy < 3300 && energy !== Utilities.getEnergyCapacityInRoom(room)) {
                return;
            }

            // Create the body based on the energy.
            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(WORK);
            }

            if (energy % 200 >= 150) {
                body.push(WORK);
            }

            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(CARRY);
            }

            if (energy % 200 >= 100 && energy % 200 < 150) {
                body.push(CARRY);
            }

            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(MOVE);
            }

            if (energy % 200 >= 50) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];
            name = spawnToUse.createCreep(body, undefined, {role: "delivery", deliver: room.name, home: id});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new delivery " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            // Check for repairs under 2500 if we're not in the home room.
            _.forEach(Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.role === "delivery" && c.memory.deliver === room.name)), (creep) => {
                _.forEach(TaskRepair.getDeliveryTasks(creep.room), (task) => {
                    if (Utilities.creepsWithTask(Cache.creepsInRoom("all", creep.room), {type: "repair", id: task.id}).length === 0) {
                        if (task.canAssign(creep)) {
                            creep.say("CritRepair");
                            return false;
                        }
                    }
                });
            });

            // Check for construction sites if we're not in the home room.
            _.forEach(_.filter(Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.role === "delivery" && c.memory.deliver === room.name)), (c) => c.room.name !== c.memory.deliver), (creep) => {
                if (Cache.constructionSitesInRoom(creep.room).length > 0) {
                    var task = new TaskBuild(Cache.constructionSitesInRoom(creep.room)[0].id);
                    if (task.canAssign(creep)) {
                        creep.say("Build");
                    }
                }
            });

            // Check for unfilled links.
            if (tasks.fillEnergy.fillLinkTask) {
                _.forEach(_.filter(Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.role === "delivery" && c.memory.deliver === room.name)), (c) => c.carry[RESOURCE_ENERGY] && c.carry[RESOURCE_ENERGY] > 0), (creep) => {
                    if (tasks.fillEnergy.fillLinkTask.canAssign(creep)) {
                        creep.say("Link");
                    }
                });
            }

            // Check for unfilled containers.
            _.forEach([].concat.apply([], [tasks.fillEnergy.fillStorageTasks, tasks.fillMinerals.fillStorageTasks, tasks.fillEnergy.fillContainerTasks]), (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(_.sum(task.object.store)) - _.reduce([].concat.apply([], [Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillMinerals", id: task.id})]), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.role === "delivery" && c.memory.deliver === room.name)), task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Container");
                            energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });

            // Check for dropped resources in current room.
            _.forEach(Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.role === "delivery")), (creep) => {
                _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                    if (_.filter(Game.creeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                        return;
                    }
                    if (task.canAssign(creep)) {
                        creep.say("Pickup");
                        return false;
                    }
                });
            });

            // Attempt to assign harvest task to remaining creeps.
            _.forEach(Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.role === "delivery" && c.memory.deliver === room.name)), (creep) => {
                var task = new TaskHarvest();
                if (task.canAssign(creep)) {
                    creep.say("Harvesting");
                }
            });

            // Rally remaining creeps.
            _.forEach(TaskRally.getDeliveryTasks(Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.role === "delivery" && c.memory.deliver === room.name))), (task) => {
                task.canAssign(task.creep);
            });
        }
    };

require("screeps-profiler").registerObject(Delivery, "RoleDelivery");
module.exports = Delivery;
