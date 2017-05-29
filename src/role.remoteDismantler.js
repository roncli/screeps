const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##           ####                         #            ####     #                                 #      ##                 
//  #   #           #           #   #                        #             #  #                                      #       #                 
//  #   #   ###     #     ###   #   #   ###   ## #    ###   ####    ###    #  #   ##     ###   ## #    ###   # ##   ####     #     ###   # ##  
//  ####   #   #    #    #   #  ####   #   #  # # #  #   #   #     #   #   #  #    #    #      # # #      #  ##  #   #       #    #   #  ##  # 
//  # #    #   #    #    #####  # #    #####  # # #  #   #   #     #####   #  #    #     ###   # # #   ####  #   #   #       #    #####  #     
//  #  #   #   #    #    #      #  #   #      # # #  #   #   #  #  #       #  #    #        #  # # #  #   #  #   #   #  #    #    #      #     
//  #   #   ###    ###    ###   #   #   ###   #   #   ###     ##    ###   ####    ###   ####   #   #   ####  #   #    ##    ###    ###   #     
/**
 * Represents the remote dismantler role.
 */
class RoleRemoteDismantler {
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
            max = max = !room.unobservable && engine.type === "cleanup" ? Math.min(room.find(FIND_STRUCTURES).length, 8) : 1,
            creeps;

        if (!canSpawn) {
            return {
                name: "remoteDismantler",
                spawn: false,
                max: max
            };
        }

        creeps = Cache.creeps[room.name];

        return {
            name: "remoteDismantler",
            spawn: _.filter(creeps && creeps.remoteDismantler || [], (c) => c.spawning || c.ticksToLive >= 300).length < max,
            spawnFromRegion: true,
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
        var energy = Math.min(checkSettings.energyCapacityAvailable, 3750),
            units = Math.floor(energy / 150),
            body = [];

        body.push(...Array(units).fill(WORK));
        body.push(...Array(units).fill(MOVE));

        return {
            body: body,
            memory: {
                role: "remoteDismantler",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom
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
        var roomName = engine.room.name,
            creeps = Cache.creeps[roomName],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.remoteDismantler || []), (c) => _.sum(c.carry) > 0 || !c.spawning),
            tasks = engine.tasks;

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for enemy construction sites and rally to them.
        Assign.stomp(creepsWithNoTask, tasks.hostileConstructionSites, "Stomping");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for structures needing dismantling.
        Assign.dismantleStructures(creepsWithNoTask, tasks.dismantle, "Dismantle");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally remaining creeps.
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteDismantler, "RoleRemoteDismantler");
}
module.exports = RoleRemoteDismantler;
