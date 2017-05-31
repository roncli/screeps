const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##            ###    #                                
//  #   #           #           #   #   #                                
//  #   #   ###     #     ###   #      ####    ###   # ##    ###   # ##  
//  ####   #   #    #    #   #   ###    #     #   #  ##  #  #   #  ##  # 
//  # #    #   #    #    #####      #   #     #   #  #      #####  #     
//  #  #   #   #    #    #      #   #   #  #  #   #  #      #      #     
//  #   #   ###    ###    ###    ###     ##    ###   #       ###   #     
/**
 * Represents the storer role.
 */
class RoleStorer {
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
            length = 0,
            max = 0,
            containerSource, sources, lengthToStorage, controller, rcl, army, creeps, storers;
        
        // If there are no containers or storages in the room, ignore the room.
        if (containers.length === 0 || !room.storage || !room.storage.my) {
            return {
                name: "storer",
                spawn: false,
                max: 0
            };
        }

        containerSource = Memory.containerSource;
        sources = [].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]);
        lengthToStorage = Memory.lengthToStorage;
        controller = room.controller;
        rcl = controller.level;
        army = Memory.army;
        creeps = Cache.creeps[room.name];
        storers = creeps && creeps.storer || [];

        // Determine the number storers needed.
        _.forEach(containers, (container) => {
            var containerId = container.id,
                closest;

            if (!containerSource[containerId]) {
                containerSource[containerId] = Utilities.objectsClosestToObj(sources, container)[0].id;
            }

            closest = Game.getObjectById(containerSource[containerId]);

            if (closest instanceof Mineral) {
                if (closest.mineralAmount > 0) {
                    max += 1;
                }
            } else {
                if (!lengthToStorage[container.id]) {
                    lengthToStorage[container.id] = PathFinder.search(container.pos, {pos: room.storage.pos, range: 1}, {swampCost: 1}).path.length;
                }

                length += lengthToStorage[container.id];
            }
        });

        max += Math.ceil(2 * length / (controller && rcl === 8 ? 35 : 30)) + (rcl >= 7 && army && _.filter(army, (a) => a.region === room.memory.region && a.directive === "building").length > 0 ? 1 : 0);

        if (!canSpawn) {
            return {
                name: "storer",
                spawn: false,
                max: max
            };
        }

        return {
            name: "storer",
            spawn: _.filter(storers, (c) => c.spawning || c.ticksToLive >= 300).length < max,
            max: max,
            rcl: rcl
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

        switch (checkSettings.rcl) {
            case 7:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 8:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            default:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
        }

        return {
            body: body,
            memory: {
                role: "storer",
                home: checkSettings.home
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
        var room = engine.room,
            roomName = room.name,
            creeps = Cache.creeps[roomName],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.storer || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = creeps && creeps.all || [],
            tasks = engine.tasks;

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled links.
        Assign.fillWithEnergy(creepsWithNoTask, tasks.links, "Link");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled extensions.
        Assign.fillExtensions(creepsWithNoTask, allCreeps, room.controller.level, tasks.extensions, "Extension");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled spawns.
        Assign.fillSpawns(creepsWithNoTask, allCreeps, tasks.spawns, "Spawn");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for terminals.
        Assign.fillWithEnergy(creepsWithNoTask, tasks.terminalsFillWithEnergy, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled storage.
        Assign.fillStorageWithEnergy(creepsWithNoTask, allCreeps, room, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled storage for minerals.
        Assign.fillWithMinerals(creepsWithNoTask, room.storage, tasks.storageResourcesNeeded, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled terminals for minerals.
        Assign.fillWithMinerals(creepsWithNoTask, room.terminal, undefined, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to get energy from terminals.
        Assign.fillWithEnergy(creepsWithNoTask, tasks.terminalsCollectEnergy, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to get energy from containers.
        Assign.collectEnergy(creepsWithNoTask, allCreeps, tasks.structuresWithEnergy, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally to center.
        Assign.moveToTerminalOrRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleStorer, "RoleStorer");
}
module.exports = RoleStorer;
