var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskBuild = require("task.build"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskHarvest = require("task.harvest"),
    TaskRally = require("task.rally"),
    TaskRepair = require("task.repair"),
    TaskUpgradeController = require("task.upgradeController"),

    Worker = {
        checkSpawn: (room) => {
            "use strict";

            var count, sources, adjustment;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // If there are no energy sources, ignore the room.
            sources = Utilities.objectsClosestToObj(Cache.energySourcesInRoom(room), Cache.spawnsInRoom(room)[0]);
            if (sources.length === 0) {
                return;
            }

            // Determine the max creep adjustment to use.
            // adjustment = Math.max((5000 - Utilities.getEnergyCapacityInRoom(room)) / 5000, 0.1);
            adjustment = 1;

            if (!Memory.sources || !Memory.sources[sources[0].id] || !Memory.sources[sources[0].id].empty) {
                // Initialize.
                if (!Memory.sources) {
                    Memory.sources = {};
                }

                if (!Memory.sources[sources[0].id]) {
                    Memory.sources[sources[0].id] = {};
                }

                // Count the empty squares around the source.
                Memory.sources[sources[0].id].empty = Utilities.getEmptyPosAroundPos(sources[0].pos);
            }

            // If we have less than max workers, spawn a worker.
            count = _.filter(Cache.creepsInRoom("worker", room), (c) => c.memory.home === sources[0].id).length;
            if (count < Math.ceil(Memory.sources[sources[0].id].empty * adjustment)) {
                Worker.spawn(room, sources[0].id);
            }

            // Output worker count in the report.
            console.log("    Workers: " + count + "/" + Math.ceil(Memory.sources[sources[0].id].empty * adjustment));        
        },
        
        spawn: (room) => {
            "use strict";

            var body = [],
                structures, energy, count, spawnToUse, name;

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
            name = spawnToUse.createCreep(body, undefined, {role: "worker", home: Utilities.objectsClosestToObj(Cache.energySourcesInRoom(room), Cache.spawnsInRoom(room)[0])[0].id});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new worker " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room) => {
            "use strict";

            var creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creepsInRoom("worker", room)),
                assigned = [],
                tasks;

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for critical controllers to upgrade.
            _.forEach(TaskUpgradeController.getCriticalTasks(room), (task) => {
                console.log("    Controller is critical, TTL: " + task.controller.ticksToDowngrade);
                if (Utilities.creepsWithTask(Cache.creepsInRoom("worker", room), {type: "upgradeController", room: task.room}).length === 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, room.controller), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("CritCntrlr");
                            assigned.push(creep.name);
                            return false;
                        }
                    });
                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];
                }
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled extensions.
            tasks = TaskFillEnergy.getFillExtensionTasks(room);
            if (tasks.length > 0) {
                console.log("    Unfilled extensions: " + tasks.length);
            }
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Extension");
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

            // Check for unfilled spawns.
            tasks = TaskFillEnergy.getFillSpawnTasks(room);
            if (tasks.length > 0) {
                console.log("    Unfilled spawns: " + tasks.length);
            }
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
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

            // Check for unfilled towers.
            tasks = TaskFillEnergy.getFillTowerTasks(room);
            if (tasks.length > 0) {
                console.log("    Unfilled towers: " + tasks.length);
            }
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Tower");
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

            // Check for critical repairs.
            tasks = TaskRepair.getCriticalTasks(room);
            if (tasks.length > 0) {
                console.log("    Critical repairs required: " + tasks.length);
                _.forEach(_.take(tasks, 5), (task) => {
                    console.log("      " + task.structure.pos.x + "," + task.structure.pos.y + " " + task.structure.hits + "/" + task.structure.hitsMax + " " + (100 * task.structure.hits / task.structure.hitsMax).toFixed(3) + "%");
                });
            }
            _.forEach(tasks, (task) => {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.structure), (creep) => {
                    if (Utilities.creepsWithTask(Cache.creepsInRoom("worker", room), {type: "repair", id: task.id}).length === 0) {
                        if (task.canAssign(creep)) {
                            creep.say("CritRepair");
                            assigned.push(creep.name);
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for construction sites.
            tasks = TaskBuild.getTasks(room);
            if (tasks.length > 0) {
                console.log("    Construction sites: " + tasks.length.toString());
            }
            _.forEach(tasks, (task) => {
                var progressMissing = task.constructionSite.progressTotal - task.constructionSite.progress - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "build", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (progressMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.constructionSite), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Build");
                            assigned.push(creep.name);
                            progressMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            if (progressMissing <= 0) {
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

            // Check for repairs.
            tasks = TaskRepair.getTasks(room);
            if (tasks.length > 0) {
                console.log("    Repairs required: " + tasks.length);
                _.forEach(_.take(tasks, 5), (task) => {
                    console.log("      " + task.structure.pos.x + "," + task.structure.pos.y + " " + task.structure.hits + "/" + task.structure.hitsMax + " " + (100 * task.structure.hits / task.structure.hitsMax).toFixed(3) + "%");
                });
            }
            _.forEach(tasks, (task) => {
                var hitsMissing = task.structure.hitsMax - task.structure.hits - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "repair", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0) * 100,
                    assigned = false;
                
                if (hitsMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.structure), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Repair");
                            assigned.push(creep.name);
                            hitsMissing -= (creep.carry[RESOURCE_ENERGY] || 0) * 100;
                            assigned = true;
                            if (hitsMissing <= 0) {
                                return false;
                            }
                        }
                    });
                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];

                    return assigned;
                }
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for controllers to upgrade.
            _.forEach(TaskUpgradeController.getTasks(room), (task) => {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, room.controller), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Controller");
                        assigned.push(creep.name);
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            });
            
            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to assign harvest task to remaining creeps.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskHarvest();
                if (task.canAssign(creep)) {
                    creep.say("Harvesting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to get energy from containers.
            _.forEach(TaskCollectEnergy.getTasks(room), (task) => {
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

            // Rally remaining creeps.
            _.forEach(TaskRally.getHarvesterTasks(creepsWithNoTask), (task) => {
                task.canAssign(task.creep);
                assigned.push(creep.name);
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        }
    };

require("screeps-profiler").registerObject(Worker, "RoleWorker");
module.exports = Worker;
