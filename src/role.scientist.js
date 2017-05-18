var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally");

//  ####           ##            ###            #                   #       #            #    
//  #   #           #           #   #                               #                    #    
//  #   #   ###     #     ###   #       ###    ##     ###   # ##   ####    ##     ###   ####  
//  ####   #   #    #    #   #   ###   #   #    #    #   #  ##  #   #       #    #       #    
//  # #    #   #    #    #####      #  #        #    #####  #   #   #       #     ###    #    
//  #  #   #   #    #    #      #   #  #   #    #    #      #   #   #  #    #        #   #  # 
//  #   #   ###    ###    ###    ###    ###    ###    ###   #   #    ##    ###   ####     ##  
/**
 * Represents the scientist role.
 */
class RoleScientist {
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
            max = 1,
            creeps;

        if (!canSpawn) {
            return {
                name: "scientist",
                spawn: false,
                max: max
            };
        }

        creeps = Cache.creeps[room.name];

        return {
            name: "scientist",
            spawn: _.filter(creeps && creeps.scientist || [], (c) => c.spawning || c.ticksToLive >= 150).length < max,
            max: max
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
        var energy = Math.min(checkSettings.energyCapacityAvailable, 2500),
            units = Math.floor(energy / 150),
            remainder = energy % 150,
            body = [];

        body.push(...Array(units * 2 + (remainder >= 100 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + (remainder >= 50 ? 1 : 0)).fill(MOVE));

        return {
            body: body,
            memory: {
                role: "scientist",
                home: checkSettings.home
            }
        };
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].scientist || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = Cache.creeps[roomName] && Cache.creeps[roomName].all || [],
            assigned = [];

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

        // Attempt to get minerals from labs.
        _.forEach(tasks.collectMinerals.labTasks, (task) => {
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

        // Check for unfilled labs for minerals.
        _.forEach(tasks.fillMinerals.labTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Lab");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled nukers for minerals.
        _.forEach(tasks.fillMinerals.nukerTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("NukeG");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled power spawns for minerals.
        _.forEach(tasks.fillMinerals.powerSpawnTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("powerPower");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

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

        // Check for unfilled labs.
        _.forEach(tasks.fillEnergy.labTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("LabEnergy");
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

        // Check for terminals.
        if (tasks.fillEnergy.terminalTask) {
            _.forEach(creepsWithNoTask, (creep) => {
                if (tasks.fillEnergy.terminalTask.canAssign(creep)) {
                    creep.say("Terminal");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        }

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled nukers.
        _.forEach(tasks.fillEnergy.nukerTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("NukeEnergy");
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

        // Check for unfilled power spawns.
        if (room.storage && room.storage.store[RESOURCE_ENERGY] > 25000) {
            _.forEach(tasks.fillEnergy.powerSpawnTasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("PwrEnergy");
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

        // Check for unfilled extensions.
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
        
        // Check for unfilled spawns.
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

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled storage.
        _.forEach(tasks.fillEnergy.storageTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (!creep.memory.lastCollectEnergyWasStorage && task.canAssign(creep)) {
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

        // Attempt to get minerals from terminals.
        _.forEach(tasks.collectMinerals.terminalTasks, (task) => {
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

        // Attempt to get minerals from storage.
        _.forEach(tasks.collectMinerals.storageTasks, (task) => {
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
        
        // Check for dropped resources in current room if there are no hostiles.
        if (Cache.hostilesInRoom(room).length === 0) {
            _.forEach(creepsWithNoTask, (creep) => {
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

        // Rally remaining creeps.
        if (room.terminal) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskRally(room.terminal.id, creep);
                task.canAssign(task.creep);
            });
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleScientist, "RoleScientist");
}
module.exports = RoleScientist;
