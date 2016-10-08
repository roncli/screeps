var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskBuild = require("task.build"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskHarvest = require("task.harvest"),
    TaskRally = require("task.rally"),
    TaskRepair = require("task.repair"),
    TaskUpgradeController = require("task.upgradeController"),

    Collector = {
        checkSpawn: (room) => {
            var max = 0,
                count, sources, capacity, adjustment;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // If there is only one energy source, ignore the room.
            sources = Utilities.objectsClosestToObj(Cache.energySourcesInRoom(room), Cache.spawnsInRoom(room)[0]);
            if (sources.length <= 1) {
                return;
            }

            // Determine the max creep adjustment to use.
            adjustment = Math.max((2500 - Utilities.getEnergyCapacityInRoom(room)) / 2500, 0.1);

            //  Loop through sources to see if we have anything we need to spawn.
            _.forEach(sources, (source, index) => {
                // Skip the first index.
                if (index === 0) {
                    return;
                }

                if (!Memory.sources || !Memory.sources[source.id] || !Memory.sources[source.id].empty) {
                    // Initialize.
                    if (!Memory.sources) {
                        Memory.sources = {};
                    }
                    
                    if (!Memory.sources[source.id]) {
                        Memory.sources[source.id] = {};
                    }

                    // Count the empty squares around the source.
                    Memory.sources[source.id].empty = Utilities.getEmptyPosAroundPos(source.pos);
                }

                max += Math.ceil(Memory.sources[source.id].empty * adjustment);

                // If we have less than max collectors, spawn a collector.
                count = _.filter(Cache.creepsInRoom("collector", room), (c) => c.memory.home === source.id).length;
                if (count < Math.ceil(Memory.sources[source.id].empty * adjustment)) {
                    Collector.spawn(room, source.id);
                }
            });

            // Output collector count in the report.
            console.log("    Collectors: " + Cache.creepsInRoom("collector", room).length + "/" + max);        
        },
        
        spawn: (room, id) => {
            var body = [],
                structures, energy, count;

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
            name = spawnToUse.createCreep(body, undefined, {role: "collector", home: id});
            Cache.spawning[spawnToUse.id] = true;

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("    Spawning new collector " + name);
                return true;
            }

            return false;
        },

        assignTasks: (room) => {
            var tasks;

            // Check for unfilled containers.
            tasks = TaskFillEnergy.getFillContainerTasks(room);
            if (tasks.length > 0) {
                console.log("    Unfilled containers: " + tasks.length);
            }
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(task.object.store[RESOURCE_ENERGY]) - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("collector", room)), task.object), (creep) => {
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

            // Check for critical controllers to upgrade.
            _.forEach(TaskUpgradeController.getCriticalTasks(room), (task) => {
                if (Utilities.creepsWithTask(Cache.creepsInRoom("collector", room), {type: "upgradeController", room: task.room}).length === 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("collector", room)), room.controller), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("CritCntrlr");
                            return false;
                        }
                    });
                }
            });

            // Check for unfilled extensions.
            tasks = TaskFillEnergy.getFillExtensionTasks(room);
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("collector", room)), task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Extension");
                            energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });

            // Check for unfilled spawns.
            tasks = TaskFillEnergy.getFillSpawnTasks(room);
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("collector", room)), task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Spawn");
                            energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });

            // Check for unfilled towers.
            tasks = TaskFillEnergy.getFillTowerTasks(room);
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("collector", room)), task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Tower");
                            energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });
            
            // Check for critical repairs.
            tasks = TaskRepair.getCriticalTasks(room);
            if (tasks.length > 0) {
                // Repair with tower if possible.
                // TODO: Break this out into a role & task.
                if (Cache.hostilesInRoom(room).length === 0) {
                    _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                        towerFired = true;
                        tower.repair(tasks[0].structure);
                    });
                }
            }
            _.forEach(tasks, (task) => {
                _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("collector", room)), task.structure), (creep) => {
                    if (Utilities.creepsWithTask(Cache.creepsInRoom("collector", room), {type: "repair", id: task.id}).length === 0) {
                        if (task.canAssign(creep)) {
                            creep.say("CritRepair");
                            return false;
                        }
                    }
                });
            });

            // Check for construction sites.
            tasks = TaskBuild.getTasks(room);
            _.forEach(tasks, (task) => {
                var progressMissing = task.constructionSite.progressTotal - task.constructionSite.progress - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "build", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (progressMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("collector", room)), task.constructionSite), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Build");
                            progressMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            if (progressMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });

            // Check for repairs.
            tasks = TaskRepair.getTasks(room);
            _.forEach(tasks, (task) => {
                var hitsMissing = task.structure.hitsMax - task.structure.hits - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("all", room), {type: "repair", id: task.id}), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0) * 100,
                    assigned = false;

                if (hitsMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("collector", room)), task.structure), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Repair");
                            hitsMissing -= (creep.carry[RESOURCE_ENERGY] || 0) * 100;
                            assigned = true;
                            if (hitsMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
                
                return assigned;
            });

            // Check for controllers to upgrade.
            _.forEach(TaskUpgradeController.getTasks(room), (task) => {
                _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("collector", room)), room.controller), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Controller");
                    }
                });
            });

            // Attempt to assign harvest task to remaining creeps.
            _.forEach(Utilities.creepsWithNoTask(Cache.creepsInRoom("collector", room)), (creep) => {
                task = new TaskHarvest();
                if (task.canAssign(creep)) {
                    creep.say("Harvesting");
                }
            });

            // Rally remaining creeps.
            _.forEach(TaskRally.getHarvesterTasks(Utilities.creepsWithNoTask(Cache.creepsInRoom("collector", room))), (task) => {
                task.canAssign(task.creep);
            });
        }
    };

require("screeps-profiler").registerObject(Collector, "RoleCollector");
module.exports = Collector;
