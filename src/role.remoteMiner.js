const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##           ####                         #            #   #    #                        
//  #   #           #           #   #                        #            #   #                             
//  #   #   ###     #     ###   #   #   ###   ## #    ###   ####    ###   ## ##   ##    # ##    ###   # ##  
//  ####   #   #    #    #   #  ####   #   #  # # #  #   #   #     #   #  # # #    #    ##  #  #   #  ##  # 
//  # #    #   #    #    #####  # #    #####  # # #  #   #   #     #####  #   #    #    #   #  #####  #     
//  #  #   #   #    #    #      #  #   #      # # #  #   #   #  #  #      #   #    #    #   #  #      #     
//  #   #   ###    ###    ###   #   #   ###   #   #   ###     ##    ###   #   #   ###   #   #   ###   #     
/**
 * Represents the remote miner role.
 */
class RoleRemoteMiner {
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
            minerals = room.find(FIND_MINERALS),
            sources = [].concat.apply([], [room.find(FIND_SOURCES), minerals]),
            lengthToContainer, containerSource, supportRoom, supportRoomName, spawnsInRoom, creeps, miners, containerIdToMineOn, isMineralHarvester;

        // If there are no containers or sources in the room, ignore the room.
        if (containers.length === 0 || sources.length === 0) {
            return {
                name: "remoteMiner",
                spawn: false,
                max: 0
            };
        }

        if (!canSpawn) {
            return {
                name: "remoteMiner",
                spawn: false,
                max: containers.length - _.filter(minerals, (m) => m.mineralAmount === 0).length
            };
        }

        lengthToContainer = Memory.lengthToContainer,
        supportRoom = engine.supportRoom,
        supportRoomName = supportRoom.name,
        spawnsInRoom = Cache.spawnsInRoom(supportRoom),
        containerSource = Memory.containerSource,
        creeps = Cache.creeps[room.name],
        miners = creeps && creeps.remoteMiner || [];

        // Loop through containers to see if we have anything we need to spawn.
        _.forEach(containers, (container) => {
            var containerId = container.id,
                lengthToThisContainer, source, isMineral;

            // Calculate path length from container to support room's storage.
            if (!lengthToContainer[containerId]) {
                lengthToContainer[containerId] = {};
            }

            lengthToThisContainer = lengthToContainer[containerId];

            if (!lengthToThisContainer[supportRoomName]) {
                lengthToThisContainer[supportRoomName] = PathFinder.search(container.pos, {pos: spawnsInRoom[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}).path.length;
            }

            if (!containerSource[containerId]) {
                containerSource[containerId] = Utilities.objectsClosestToObj(sources, container)[0].id;
            }

            source = Game.getObjectById(containerSource[containerId]);
            isMineral = source instanceof Mineral;

            // If this container is for a mineral, check to make sure it has resources.
            if (isMineral && source.mineralAmount === 0) {
                return;
            }

            // If we don't have a remote miner for this container, spawn one.
            if (_.filter(miners, (c) => (c.spawning || c.ticksToLive >= 150 + lengthToThisContainer[supportRoomName] * 3) && c.memory.container === containerId).length === 0) {
                containerIdToMineOn = containerId;
                isMineralHarvester = isMineral;
                return false;
            }
        });

        return {
            name: "remoteMiner",
            spawn: !!containerIdToMineOn,
            max: containers.length - _.filter(minerals, (m) => m.mineralAmount === 0).length,
            spawnFromRegion: true,
            containerIdToMineOn: containerIdToMineOn,
            isMineralHarvester: isMineralHarvester
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
        var body = [];

        if (checkSettings.isMineralHarvester) {
            let energy = Math.min(checkSettings.energyCapacityAvailable, 4500),
                units = Math.floor(energy / 450),
                remainder = energy % 450;
            
            body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(MOVE));
            body.push(...Array(units * 4 + (remainder >= 150 ? 1 : 0) + (remainder >= 250 ? 1 : 0) + (remainder >= 350 ? 1 : 0)).fill(WORK));
        } else {
            body = checkSettings.isSourceRoom ? [MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK] : [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK];
        }

        return {
            body: body,
            memory: {
                role: "remoteMiner",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                container: checkSettings.containerIdToMineOn
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
        var creeps = Cache.creeps[engine.room.name],
            creepsWithNoTask = Utilities.creepsWithNoTask(creeps && creeps.remoteMiner || []);

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to assign mine tasks.
        Assign.mine(creepsWithNoTask, "Mining");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally remaining creeps.
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteMiner, "RoleRemoteMiner");
}
module.exports = RoleRemoteMiner;
