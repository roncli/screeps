var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskHarvest = require("task.harvest"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally");

//  ####           ##           #   #                #                   
//  #   #           #           #   #                #                   
//  #   #   ###     #     ###   #   #   ###   # ##   #   #   ###   # ##  
//  ####   #   #    #    #   #  # # #  #   #  ##  #  #  #   #   #  ##  # 
//  # #    #   #    #    #####  # # #  #   #  #      ###    #####  #     
//  #  #   #   #    #    #      ## ##  #   #  #      #  #   #      #     
//  #   #   ###    ###    ###   #   #   ###   #      #   #   ###   #     
/**
 * Represents the worker role.
 */
class RoleWorker {
    //       #                 #      ##                            ##          #     #     #                       
    //       #                 #     #  #                          #  #         #     #                             
    //  ##   ###    ##    ##   # #    #    ###    ###  #  #  ###    #     ##   ###   ###   ##    ###    ###   ###   
    // #     #  #  # ##  #     ##      #   #  #  #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     
    // #     #  #  ##    #     # #   #  #  #  #  # ##  ####  #  #  #  #  ##     #     #     #    #  #   ##     ##   
    //  ##   #  #   ##    ##   #  #   ##   ###    # #  ####  #  #   ##    ##     ##    ##  ###   #  #  #     ###    
    //                                     #                                                            ###         
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        var room = engine.room,
            storage = room.storage,
            max = storage && storage.my ? 1 : 2,
            roomName, creeps, roomToSpawnFor;

        if (!canSpawn) {
            return {
                name: "worker",
                spawn: false,
                max: max
            };
        }

        roomName = room.name;
        creeps = Cache.creeps[roomName];

        if (max > 0 && _.filter(creeps && creeps.worker || [], (c) => c.spawning || c.ticksToLive >= (storage && storage.my ? 150 : 300)).length < max) {
            roomToSpawnFor = room.name;
        }

        // Support smaller rooms in the region.
        if (!roomToSpawnFor) {
            _.forEach(_.filter(Game.rooms, (r) => {
                var memory = r.memory,
                    roomType = memory.roomType,
                    controller = r.controller;

                return memory && roomType && roomType.type === "base" && memory.region === room.memory.region && r.name !== roomName && controller && controller.level < 6;
            }), (otherRoom) => {
                var otherRoomName = otherRoom.name,
                    otherCreeps = Cache.creeps[otherRoom.name];
                
                if (_.filter(otherCreeps && otherCreeps.worker || [], (c) => {
                    var memory = c.memory;

                    return memory.supportRoom !== memory.home;
                }).length === 0) {
                    roomToSpawnFor = otherRoomName;
                }
            });
        }

        return {
            name: "worker",
            spawn: !!roomToSpawnFor,
            max: max,
            spawnFromRegion: room.controller.level < 6,
            roomToSpawnFor: roomToSpawnFor
        };
    }

    //                                 ##          #     #     #                       
    //                                #  #         #     #                             
    //  ###   ###    ###  #  #  ###    #     ##   ###   ###   ##    ###    ###   ###   
    // ##     #  #  #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     
    //   ##   #  #  # ##  ####  #  #  #  #  ##     #     #     #    #  #   ##     ##   
    // ###    ###    # #  ####  #  #   ##    ##     ##    ##  ###   #  #  #     ###    
    //        #                                                            ###         
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        var room = Game.rooms[checkSettings.home],
            energy = Math.min(room.energyCapacityAvailable, 3300),
            units = Math.floor(energy / 200),
            remainder = energy % 200,
            storage = room.storage,
            storage = room.storage,
            store = storage.store,
            spawns = Cache.spawnsInRoom(room),
            body = [],
            boosts = {};

        body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
        body.push(...Array(units + (remainder >= 100 && remainder < 150 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + (remainder >= 50 ? 1 : 0)).fill(MOVE));

        if (storage && Cache.labsInRoom(room).length > 0) {
            if (store[RESOURCE_CATALYZED_LEMERGIUM_ACID] >= 30 * units) {
                boosts[RESOURCE_CATALYZED_LEMERGIUM_ACID] = units;
            } else if (store[RESOURCE_LEMERGIUM_ACID] >= 30 * units) {
                boosts[RESOURCE_LEMERGIUM_ACID] = units;
            } else if (store[RESOURCE_CATALYZED_LEMERGIUM_ACID] >= 30 * units) {
                boosts[RESOURCE_LEMERGIUM_HYDRIDE] = units;
            }
        }

        return {
            body: body,
            boosts: boosts,
            memory: {
                role: "worker",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                homeSource: spawns ? Utilities.objectsClosestToObj(room.find(FIND_SOURCES), spawns[0])[0].id : room.find(FIND_SOURCES)[0]
            }
        };
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            workers = Cache.creeps[roomName] && Cache.creeps[roomName].worker || [],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(workers), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = Cache.creeps[roomName] && Cache.creeps[roomName].all || [],
            storers = Cache.creeps[roomName] && Cache.creeps[roomName].storer || [],
            controller = room.controller,
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If not yet boosted, go get boosts.
        _.forEach(_.filter(creepsWithNoTask, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
            var lab = _.filter(Memory.rooms[creep.memory.supportRoom].labsInUse, (l) => l.id === creep.memory.labs[0])[0];
            if (lab && Game.getObjectById(creep.memory.labs[0]).mineralType === lab.resource && Game.getObjectById(creep.memory.labs[0]).mineralAmount >= lab.amount) {
                var task = new TaskRally(creep.memory.labs[0]);
                task.canAssign(creep);
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled storage for minerals.
        _.forEach(tasks.fillMinerals.storageTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Storage");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled terminals for minerals.
        _.forEach(tasks.fillMinerals.terminalTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Terminal");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for critical controllers to upgrade.
        _.forEach(tasks.upgradeController.criticalTasks, (task) => {
            if (_.filter(workers, (c) => c.memory.currentTask && c.memory.currentTask.type === "upgradeController" && c.memory.currentTask.room === task.room).length === 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, controller), (creep) => {
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

        // Check for unfilled extensions if we don't have storage or storer creeps.
        if (!room.storage || storers.length === 0) {
            _.forEach(creepsWithNoTask, (creep) => {
                // Don't bother if the creep doesn't have enough energy.
                if (creep.carry[RESOURCE_ENERGY] < (room.controller.level === 8 ? 200 : room.controller.level === 7 ? 100 : 50)) {
                    return;
                }
                
                _.forEach(tasks.fillEnergy.extensionTasks.sort((a, b) => a.object.pos.getRangeTo(creep) - b.object.pos.getRangeTo(creep)), (task) => {
                    var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
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
        }
        
        // Check for unfilled spawns if we don't have storage or storer creeps.
        if (!room.storage || storers.length === 0) {
            _.forEach(tasks.fillEnergy.spawnTasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
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
        }

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled towers.
        _.forEach(tasks.fillEnergy.towerTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
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

        // Check for 1-progress construction sites.
        _.forEach(_.filter(tasks.build.tasks, (t) => t.constructionSite.progressTotal === 1), (task) => {
            var progressMissing = task.constructionSite.progressTotal - task.constructionSite.progress - _.reduce(_.filter(task.constructionSite.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "build" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
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

        // Check for critical repairs.
        _.forEach(tasks.repair.criticalTasks, (task) => {
            _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.structure), (creep) => {
                if (_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id).length === 0) {
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
            var progressMissing = task.constructionSite.progressTotal - task.constructionSite.progress - _.reduce(_.filter(task.constructionSite.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "build" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
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
            var hitsMissing = task.structure.hitsMax - task.structure.hits - _.reduce(_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0) * 100,
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

        // Check for controllers to upgrade under RCL 8.
        if (controller && controller.level < 8) {
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
        }

        // Check for dropped resources in current room if there are no hostiles.
        if (!controller || controller.level < 6) {
            if (Cache.hostilesInRoom(room).length === 0) {
                _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === room.name), (creep) => {
                    _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                        if (_.filter(task.resource.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                            return;
                        }
                        if (task.canAssign(creep)) {
                            creep.say("Pickup");
                            assigned.push(creep.name);
                            return false;
                        }
                    });
                });
            }

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }
        }

        // Attempt to get energy from terminals.
        if (tasks.collectEnergy.terminalTask) {
            _.forEach(creepsWithNoTask, (creep) => {
                if (tasks.collectEnergy.terminalTask.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
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

        // If there are no full containers in the room, attempt to assign harvest task to remaining creeps.
        if (_.filter(Cache.containersInRoom(room), (c) => c.energy > 0).length === 0 && !room.storage) {
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
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleWorker, "RoleWorker");
}
module.exports = RoleWorker;
