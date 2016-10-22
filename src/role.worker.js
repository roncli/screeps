var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHarvest = require("task.harvest"),
    TaskRally = require("task.rally"),

    Worker = {
        checkSpawn: (room) => {
            "use strict";

            var count, sources, max;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // If there are no energy sources, ignore the room.
            sources = Utilities.objectsClosestToObj(Cache.energySourcesInRoom(room), Cache.spawnsInRoom(room)[0]);
            if (sources.length === 0) {
                return;
            }

            // If we have less than max workers, spawn a worker.
            count = _.filter(Cache.creepsInRoom("worker", room), (c) => c.memory.home === sources[0].id).length;
            max = room.storage && room.storage.store[RESOURCE_ENERGY] < 500000 ? 2 : 3;
            if (count < max) {
                Worker.spawn(room, sources[0].id);
            }

            // Output worker count in the report.
            console.log("    Workers: " + count + "/" + max);        
        },
        
        spawn: (room) => {
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
            name = spawnToUse.createCreep(body, undefined, {role: "worker", home: Utilities.objectsClosestToObj(Cache.energySourcesInRoom(room), Cache.spawnsInRoom(room)[0])[0].id});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it.
            if (typeof name !== "number") {
                console.log("    Spawning new worker " + name);
                _.forEach(Cache.creepsInRoom({role: "worker"}, room), (creep) => {
                    delete creep.memory.currentTask;
                });
                return true;
            }

            return false;
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = Utilities.creepsWithNoTask(_.filter(Game.creeps, (c) => c.memory.home === Utilities.objectsClosestToObj(Cache.energySourcesInRoom(room), Cache.spawnsInRoom(room)[0])[0].id)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for critical controllers to upgrade.
            _.forEach(tasks.upgradeController.criticalTasks, (task) => {
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
            _.forEach(_.sortBy(creepsWithNoTask, (c) => c.pos.getRangeTo(Cache.spawnsInRoom(room)[0])), (creep) => {
                _.forEach(_.sortBy(tasks.fillEnergy.fillExtensionTasks, (t) => t.object.pos.getRangeTo(creep)), (task) => {
                    var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
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
            _.forEach(tasks.fillEnergy.fillTowerTasks, (task) => {
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
            _.forEach(tasks.repair.criticalTasks, (task) => {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.structure), (creep) => {
                    if (Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "repair", id: task.id}).length === 0) {
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
            _.forEach(tasks.build.tasks, (task) => {
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
            _.forEach(tasks.repair.tasks, (task) => {
                var hitsMissing = task.structure.hitsMax - task.structure.hits - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "repair", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0) * 100,
                    taskAssigned = false;
                
                if (hitsMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.structure), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Repair");
                            assigned.push(creep.name);
                            hitsMissing -= (creep.carry[RESOURCE_ENERGY] || 0) * 100;
                            taskAssigned = true;
                            if (hitsMissing <= 0) {
                                return false;
                            }
                        }
                    });
                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];

                    return taskAssigned;
                }
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for controllers to upgrade.
            _.forEach(tasks.upgradeController.tasks, (task) => {
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

            // Attempt to get energy from containers.
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

            // If there are no containers in the room, attempt to assign harvest task to remaining creeps.
            if (Cache.containersInRoom(room).length === 0 && !room.storage) {
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
            }

            // Rally remaining creeps.
            _.forEach(TaskRally.getHarvesterTasks(creepsWithNoTask), (task) => {
                task.canAssign(task.creep);
            });
        }
    };

require("screeps-profiler").registerObject(Worker, "RoleWorker");
module.exports = Worker;
