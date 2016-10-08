var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskHarvest = require("task.harvest"),
    TaskRally = require("task.rally"),

    Delivery = {
        checkSpawn: (room) => {
            var num = 0, max = 0,
                count, sources, capacity;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // Loop through the room deliveries to see if we need to spawn a creep.
            if (Memory.maxCreeps.delivery) {
                _.forEach(Memory.maxCreeps.delivery[room.name], (value, toId) => {
                    var count = _.filter(Game.creeps, (c) => c.memory.role === "delivery" && c.memory.deliver === room.name && c.memory.home === toId);

                    num += count;
                    max += value.maxCreeps;

                    if (count < value.maxCreeps) {
                        Delivery.spawn(room, toId);
                    }
                });
            }

            // Output delivery count in the report.
            console.log("    Deliveries: " + num + "/" + max);        
        },
        
        spawn: (room, id) => {
            var body = [],
                structures, energy, count;

            // Fail if all the spawns are busy.
            if (_.filter(Cache.spawnsInRoom(room), (s) => !s.spawning).length === 0) {
                return false;
            }

            // Get the spawns and extensions in the room.
            structures = [].concat.apply([], [Cache.spawnsInRoom(room), Cache.extensionsInRoom(room)]);

            // Fail if any of the structures aren't full.
            if (_.filter(structures, (s) => s.energy !== s.energyCapacity).length !== 0) {
                return false;
            }

            // Get the total energy in the room.
            energy = Utilities.getAvailableEnergyInRoom(room);

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

            if (energy % 100 >= 100 && energy % 200 < 150) {
                body.push(CARRY);
            }

            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(MOVE);
            }

            if (energy % 200 >= 50) {
                body.push(MOVE);
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning)[0];
            name = spawnToUse.createCreep(body, undefined, {role: "delivery", deliver: room.name, home: id});

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new delivery " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room, creepTasks) => {
            var tasks;

            // Check for unfilled containers.
            tasks = TaskFillEnergy.getFillContainerTasks(room);
            if (tasks.length > 0) {
                console.log("    Unfilled containers: " + tasks.length);
            }
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(task.object.store[RESOURCE_ENERGY]) - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.role === "delivery" && c.memory.deliver === room.name)), task.object), (creep) => {
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("Container");
                            energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });

            // Attempt to assign harvest task to remaining creeps.
            _.forEach(Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.role === "delivery" && c.memory.deliver === room.name)), (creep) => {
                task = new TaskHarvest();
                if (task.canAssign(creep, creepTasks)) {
                    creep.say("Harvesting");
                }
            });

            // Rally remaining creeps.
            _.forEach(TaskRally.getHarvesterTasks(Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.role === "delivery" && c.memory.deliver === room.name))), (task) => {
                task.canAssign(task.creep, creepTasks);
            });
        }
    };

require("screeps-profiler").registerObject(Delivery, "RoleDelivery");
module.exports = Delivery;
