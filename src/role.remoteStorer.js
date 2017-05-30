const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

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
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        var room = engine.room,
            containers = Cache.containersInRoom(room),
            max = 0,
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
            max += count;

            // If we don't have enough remote storers for this container, spawn one.
            if (canSpawn && !containerIdToCollectFrom && _.filter(remoteStorers || [], (c) => (c.spawning || c.ticksToLive >= 150 + length * 2) && c.memory.container === containerId).length < count) {
                containerIdToCollectFrom = containerId;
            }
        });

        if (!canSpawn) {
            return {
                name: "remoteStorer",
                spawn: false,
                max: max
            };
        }

        return {
            name: "remoteStorer",
            spawn: !!containerIdToCollectFrom,
            max: max,
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

    //                      #                ###                #            
    //                                        #                 #            
    //  ###   ###    ###   ##     ###  ###    #     ###   ###   # #    ###   
    // #  #  ##     ##      #    #  #  #  #   #    #  #  ##     ##    ##     
    // # ##    ##     ##    #     ##   #  #   #    # ##    ##   # #     ##   
    //  # #  ###    ###    ###   #     #  #   #     # #  ###    #  #  ###    
    //                            ###                                        
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     */
    static assignTasks(engine) {
        var roomName = room.name,
            creeps = Cache.creeps[roomName],
            creepsWithNoTask = Utilities.creepsWithNoTask(creeps && creeps.remoteStorer || []),
            allCreeps = creeps && creeps.all || [],
            supportRoom = engine.supportRoom,
            supportEngine = Cache.rooms[supportRoom.name];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for dropped resources in current room.
        Assign.pickupResourcesInCurrentRoom(creepsWithNoTask, allCreeps, "Pickup");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled storage.
        Assign.fillStorageWithEnergy(creepsWithNoTask, allCreeps, supportRoom, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled storage for minerals.
        Assign.fillWithMinerals(creepsWithNoTask, supportRoom.storage, supportEngine.tasks.storageResourcesNeeded, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled terminals for minerals.
        Assign.fillWithMinerals(creepsWithNoTask, supportRoom.terminal, undefined, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled containers.
        Assign.fillWithEnergy(creepsWithNoTask, allCreeps, Cache.containersInRoom(supportRoom), "Container");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to get energy from containers.
        Assign.collectEnergyFromHomeContainer(creepsWithNoTask, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to get minerals from containers.
        Assign.collectMineralsFromHomeContainer(creepsWithNoTask, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally remaining creeps.
        Assign.moveToHomeOrSupport(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteStorer, "RoleRemoteStorer");
}
module.exports = RoleRemoteStorer;
