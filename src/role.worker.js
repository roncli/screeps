var Cache = require("cache"),
    TaskBuild = require("task.build"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskHarvest = require("task.harvest"),
    TaskRepair = require("task.repair"),
    TaskUpgradeController = require("task.upgradeController"),

    Worker = {
        checkSpawn: (room) => {
            var count;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // If we have less than max workers, spawn a worker.
            count = Cache.creepsInRoom("worker", room).length;
            if (count < Memory.maxCreeps.worker) {
                if (Worker.spawn(room)) {
                    count++;
                }
            }

            // Output worker count in the report.
            console.log("Workers: " + count.toString() + "/" + Memory.maxCreeps.worker.toString());        
        },
        
        spawn: (room) => {
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
            energy = _.sumBy(structures, (s) => s.energy);

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
            name = spawnToUse.createCreep(body, undefined, {role: "worker"});

            // If successful, log it, and set spawning to true so it's not used this turn.
            if (typeof name !== "number") {
                console.log("Spawning new worker " + name);
                spawnToUse.spawning = true;
                return true;
            }

            return false;
        },

        assignTasks: (room) => {
            // Check for critical controllers to upgrade.
            _.forEach(TaskUpgradeController.getCriticalTasks(room), (task) => {
                console.log("Controller is critical, TTL: " + task.controller.ticksToDowngrade);
                if (Utilities.creepsWithTask(Cache.creepsInRoom("worker", room), {type: "upgradeController", room: task.room}).length === 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("worker", room)), room.controller), (creep) => {
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("CritCntrlr");
                            return false;
                        }
                    });
                }
            });

            // Check for unfilled extensions.
            tasks = TaskFillEnergy.getFillExtensionTasks(room);
            if (tasks.length > 0) {
                console.log("Unfilled extensions: " + tasks.length);
            }
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("worker", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + c.carry[RESOURCE_ENERGY];}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("worker", room)), task.object), (creep) => {
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("Extension");
                            energyMissing -= creep.carry[RESOURCE_ENERGY];
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });

            // Check for unfilled spawns.
            tasks = TaskFillEnergy.getFillSpawnTasks(room);
            if (tasks.length > 0) {
                console.log("Unfilled spawns: " + tasks.length);
            }
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("worker", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + c.carry[RESOURCE_ENERGY];}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("worker", room)), task.object), (creep) => {
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("Spawn");
                            energyMissing -= creep.carry[RESOURCE_ENERGY];
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });

            // Check for unfilled towers.
            tasks = TaskFillEnergy.getFillTowerTasks(room);
            if (tasks.length > 0) {
                console.log("Unfilled towers: " + tasks.length);
            }
            _.forEach(tasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("worker", room), {type: "fillEnergy", id: task.id}), function(sum, c) {return sum + c.carry[RESOURCE_ENERGY];}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("worker", room)), task.object), (creep) => {
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("Tower");
                            energyMissing -= creep.carry[RESOURCE_ENERGY];
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });
            
            // Check for critical repairs.  Anything under 50% AND 100,000 hits is critical.
            tasks = TaskRepair.getCriticalTasks(room);
            if (tasks.length > 0) {
                console.log("Critical repairs required: " + tasks.length);
                _.forEach(_.take(task, 5), (task) => {
                    console.log("  " + task.object.pos.x + "," + task.object.pos.y + " " + task.object.hits + "/" + task.object.hitsMax + " " + (100 * task.object.hits / task.object.hitsMax).toFixed(3) + "%");
                });

                // Repair with tower if possible.
                // TODO: Break this out into a role & task.
                if (Cache.hostilesInRoom(room).length === 0) {
                    _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                        towerFired = true;
                        tower.repair(task[0].structure);
                    });
                }
            }
            _forEach(tasks, (task) => {
                _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("worker", room)), task.object), (creep) => {
                    if (Utilities.creepsWithTask(Cache.creepsInRoom("worker", room), {type: "repair", id: task.id}).length === 0) {
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("CritRepair");
                            return false;
                        }
                    }
                });
            })
            
            // Check for construction sites.
            tasks = TaskBuild.getTasks(room);
            if (tasks.length > 0) {
                console.log("Construction sites: " + targets.length.toString());
            }
            _.forEach(tasks, (task) => {
                var progressMissing = task.object.progressCapacity - task.object.progress - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("worker", room), {type: "build", id: task.id}), function(sum, c) {return sum + c.carry[RESOURCE_ENERGY];}, 0)
                if (progressMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("worker", room)), task.object), (creep) => {
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("Build");
                            progressMissing -= creep.carry[RESOURCE_ENERGY];
                            if (progressMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            });

            // Check for repairs.
            tasks = TaskRepair.getTasks(room);
            if (tasks.length > 0) {
                console.log("Repairs required: " + tasks.length);
                _.forEach(_.take(task, 5), (task) => {
                    console.log("  " + task.object.pos.x + "," + task.object.pos.y + " " + task.object.hits + "/" + task.object.hitsMax + " " + (100 * task.object.hits / task.object.hitsMax).toFixed(3) + "%");
                });

                // Repair with tower if possible.
                // TODO: Break this out into a role & task.
                if (Cache.hostilesInRoom(room).length === 0) {
                    _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType === STRUCTURE_TOWER}), (tower) => {
                        towerFired = true;
                        tower.repair(task[0].structure);
                    });
                }
            }
            _forEach(tasks, (task) => {
                var hitsMissing = task.object.progressCapacity - task.object.progress - _.reduce(Utilities.creepsWithTask(Cache.creepsInRoom("worker", room), {type: "build", id: task.id}), function(sum, c) {return sum + c.carry[RESOURCE_ENERGY];}, 0)
                if (hitsMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("worker", room)), task.object), (creep) => {
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("Repair");
                            hitsMissing -= creep.carry[RESOURCE_ENERGY] * 100;
                            if (hitsMissing <= 0) {
                                return false;
                            }
                        }
                    });
                }
            })
            
            // Check for controllers to upgrade.
            _.forEach(TaskUpgradeController.getTasks(room), (task) => {
                if (Utilities.creepsWithTask(Cache.creepsInRoom("worker", room), {type: "upgradeController", room: room.name}).length === 0) {
                    _.forEach(Utilities.creepsClosestToObj(Utilities.creepsWithNoTask(Cache.creepsInRoom("worker", room)), room.controller), (creep) => {
                        if (task.canAssign(creep, creepTasks)) {
                            creep.say("Controller");
                        }
                    });
                }
            });
            
            // Attempt to assign harvest task to remaining creeps.
            _.forEach(_.filter(roomCreeps, (c) => !c.memory.currentTask), (creep) => {
                task = new TaskHarvest();
                if (task.canAssign(creep, creepTasks)) {
                    creep.say("Harvesting");
                }
            });
        }
    };

module.exports = Worker;
