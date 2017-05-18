var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskBuild = require("task.build"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskHarvest = require("task.harvest"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),
    TaskRepair = require("task.repair");

                                                                                                                
//  ####           ##           ####                         #            #   #                #                   
//  #   #           #           #   #                        #            #   #                #                   
//  #   #   ###     #     ###   #   #   ###   ## #    ###   ####    ###   #   #   ###   # ##   #   #   ###   # ##  
//  ####   #   #    #    #   #  ####   #   #  # # #  #   #   #     #   #  # # #  #   #  ##  #  #  #   #   #  ##  # 
//  # #    #   #    #    #####  # #    #####  # # #  #   #   #     #####  # # #  #   #  #      ###    #####  #     
//  #  #   #   #    #    #      #  #   #      # # #  #   #   #  #  #      ## ##  #   #  #      #  #   #      #     
//  #   #   ###    ###    ###   #   #   ###   #   #   ###     ##    ###   #   #   ###   #      #   #   ###   #     
/**
 * Represents the remote worker role.
 */
class RoleRemoteWorker {
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
            containers = Cache.containersInRoom(room),
            max = 1,
            spawn = false,
            sources, lengthToContainer, creeps, workers, supportRoomName, containerIdToCollectFrom;

        // If there are no containers in the room, ignore the room.
        if (containers.length === 0) {
            return {
                name: "remoteWorker",
                spawn: false,
                max: 0
            };
        }

        if (!canSpawn) {
            return {
                name: "remoteWorker",
                spawn: false,
                max: max
            };
        }

        sources = [].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]),
        lengthToContainer = Memory.lengthToContainer;
        creeps = Cache.creeps[room.name];
        workers = creeps && creeps.remoteWorker || [];
        supportRoomName = engine.supportRoom.name;

        // Loop through containers to see if we have anything we need to spawn.
        _.forEach(containers, (container) => {
            var source = Utilities.objectsClosestToObj(sources, container)[0],
                containerId = container.id,
                lengthToThisAContainer = lengthToContainer[containerId];

            // If this container is for a mineral, skip it.
            if (source instanceof Mineral) {
                return;
            }

            if (_.filter(workers, (c) => (c.spawning || c.ticksToLive >= 150 + (lengthToThisAContainer && lengthToThisAContainer[supportRoomName] ? lengthToThisAContainer[supportRoomName] : 0) * 2) && c.memory.container === containerId).length === 0) {
                containerIdToCollectFrom = containerId;
                spawn = true;
            }

            // Only 1 worker per room.
            return false;
        });

        return {
            name: "remoteWorker",
            spawn: spawn,
            max: max,
            spawnFromRegion: true,
            containerIdToCollectFrom: containerIdToCollectFrom
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
        var energy = Math.min(checkSettings.energyCapacityAvailable, 3000),
            units = Math.floor(Math.min(energy, 2000) / 200),
            secondUnits = Math.floor(Math.max((energy - 2000), 0) / 150),
            remainder = Math.min(energy, 2000) % 200,
            secondRemainder = Math.max((energy - 2000), 0) % 150,
            body = [];

        body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
        body.push(...Array(units + secondUnits * 2 + (remainder >= 100 && remainder < 150 ? 1 : 0) + (secondRemainder > 100 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + secondUnits + (remainder >= 50 ? 1 : 0) + (secondRemainder >= 50 ? 1 : 0)).fill(MOVE));

        return {
            body: body,
            memory: {
                role: "remoteWorker",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                container: checkSettings.containerIdToCollectFrom
            }
        };
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteWorker || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for 1-progress construction sites.
        _.forEach(creepsWithNoTask, (creep) => {
            var sites = _.filter(creep.room.find(FIND_MY_CONSTRUCTION_SITES), (c) => c.progressTotal === 1);
            
            if (sites.length > 0) {
                var task = new TaskBuild(sites[0].id);
                if (task.canAssign(creep)) {
                    creep.say("Build");
                    assigned.push(creep.name);
                }
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check critical repairs.
        _.forEach(creepsWithNoTask, (creep) => {
            _.forEach(TaskRepair.getCriticalTasks(creep.room), (task) => {
                if (_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id).length === 0) {
                    if (task.canAssign(creep)) {
                        creep.say("CritRepair");
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

        // Check for construction sites.
        _.forEach(creepsWithNoTask, (creep) => {
            var constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
            if (constructionSites.length > 0) {
                var task = new TaskBuild(constructionSites[0].id);
                if (task.canAssign(creep)) {
                    creep.say("Build");
                    assigned.push(creep.name);
                }
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled containers.
        _.forEach([].concat.apply([], [tasks.fillEnergy.storageTasks, tasks.fillEnergy.containerTasks]), (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Container");
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

        // Check for dropped resources in current room.
        _.forEach(creepsWithNoTask, (creep) => {
            if (creep.room.name !== room.name) {
                return;
            }
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

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to get energy from containers.
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskCollectEnergy(creep.memory.container);

                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to assign harvest task to remaining creeps.
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskHarvest(),
                    sources = Utilities.objectsClosestToObj(_.filter(room.find(FIND_SOURCES), (s) => s.energy > 0), creep);
                
                if (sources.length === 0) {
                    return false;
                }

                creep.memory.homeSource = sources[0].id;

                if (task.canAssign(creep)) {
                    creep.say("Harvesting");
                    assigned.push(creep.name);
                }
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally remaining creeps.
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.memory.home);
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteWorker, "RoleRemoteWorker");
}
module.exports = RoleRemoteWorker;
