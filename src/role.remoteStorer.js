var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskCollectMinerals = require("task.collectMinerals"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally");

//  ####           ##           ####                         #             ###    #                                
//  #   #           #           #   #                        #            #   #   #                                
//  #   #   ###     #     ###   #   #   ###   ## #    ###   ####    ###   #      ####    ###   # ##    ###   # ##  
//  ####   #   #    #    #   #  ####   #   #  # # #  #   #   #     #   #   ###    #     #   #  ##  #  #   #  ##  # 
//  # #    #   #    #    #####  # #    #####  # # #  #   #   #     #####      #   #     #   #  #      #####  #     
//  #  #   #   #    #    #      #  #   #      # # #  #   #   #  #  #      #   #   #  #  #   #  #      #      #     
//  #   #   ###    ###    ###   #   #   ###   #   #   ###     ##    ###    ###     ##    ###   #       ###   #     
/**
 * Represents the remote storer role.
 */
class RoleRemoteStorer {
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
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine) {
        var room = engine.room,
            containers = Cache.containersInRoom(room),
            containerSource, sources, foundFirstSource, lengthToContainer, supportRoom, supportRoomName, supportRoomRcl, creeps, remoteStorers, containerIdToCollectFrom;

        // If there are no containers in the room, ignore the room.
        if (containers.length === 0) {
            return {
                name: "remoteStorer",
                spawn: false,
                max: 0
            };
        }

        containerSource = Memory.containerSource;
        sources = [].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]);
        foundFirstSource = false;
        lengthToContainer = Memory.lengthToContainer;
        supportRoom = engine.supportRoom;
        supportRoomName = supportRoom.name;
        supportRoomRcl = supportRoom.controller.level;
        creeps = Cache.creeps[room.name];
        remoteStorers = creeps && creeps.remoteStorer;

        // Loop through containers to see if we have anything we need to spawn.
        _.forEach(containers, (container) => {
            var count = 0,
                containerId = container.id,
                source, length;

            if (!containerSource[containerId]) {
                containerSource[containerId] = Utilities.objectsClosestToObj(sources, container)[0].id;
            }

            source = Game.getObjectById(containerSource[containerId]);
            
            if (source instanceof Mineral) {
                // If this container is for a mineral, bail if there are no minerals left.
                if (source.mineralAmount === 0) {
                    return;
                }
            } else if (!foundFirstSource) {
                // If this is the first energy source, don't count the worker.
                count = -1;
                foundFirstSource = true;
            }

            // Calculate the length the storers need to travel.
            length = lengthToContainer[containerId] ? lengthToContainer[containerId][supportRoomName] : 0;

            // Calculate number of storers needed.
            count += Math.max(Math.ceil(length / [18, 18, 18, 18, 30, 44, 54, 62, 62][supportRoomRcl]), 0);

            // If we don't have enough remote storers for this container, spawn one.
            if (_.filter(remoteStorers || [], (c) => (c.spawning || c.ticksToLive >= 150 + length * 2) && c.memory.container === containerId).length < count) {
                containerIdToCollectFrom = containerId;
                return false;
            }
        });

        return {
            name: "remoteStorer",
            spawn: !!containerIdToCollectFrom,
            max: _.sum(_.map(containers, (c) => lengthToContainer[c.id] ? Math.max(Math.ceil(lengthToContainer[c.id][supportRoomName] / [18, 18, 18, 18, 30, 44, 54, 62, 62][supportRoomRcl]), 0) : 0)) - 1,
            spawnFromRegion: true,
            containerIdToCollectFrom: containerIdToCollectFrom,
            supportRoomRcl: supportRoomRcl
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
        var body;

        switch (checkSettings.supportRoomRcl) {
            case 3:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 4:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 5:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 6:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 7:
            case 8:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
        }

        return {
            body: body,
            memory: {
                role: "remoteStorer",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                container: checkSettings.containerIdToCollectFrom
            }
        };
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteStorer || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for dropped resources in current room.
        _.forEach(creepsWithNoTask, (creep) => {
            _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                if (_.sum(Cache.creeps[room.name] && Cache.creeps[room.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id ? c.carryCapacity - _.sum(c.carry) : 0) >= task.resource.amount) {
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

        // Check for unfilled storage.
        _.forEach(tasks.fillEnergy.storageTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
            if (energyMissing > 0) {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
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

        // Check for unfilled containers.
        _.forEach(tasks.fillEnergy.containerTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
            if (energyMissing > 0) {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Container");
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

        // Attempt to get energy from containers.
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var container = Game.getObjectById(creep.memory.container),
                    task;
                
                if (!container) {
                    return;
                }
                
                if (container.store[RESOURCE_ENERGY]) {
                    task = new TaskCollectEnergy(creep.memory.container);
                } else if (_.sum(container.store) > 0) {
                    task = new TaskCollectMinerals(creep.memory.container);
                }

                if (!task) {
                    return;
                }

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

        // Rally remaining creeps.
        _.forEach(creepsWithNoTask, (creep) => {
            var task;
            if (_.sum(creep.carry) > 0) {
                task = new TaskRally(creep.memory.supportRoom);
            } else {
                task = new TaskRally(creep.memory.home);
            }
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteStorer, "RoleRemoteStorer");
}
module.exports = RoleRemoteStorer;
