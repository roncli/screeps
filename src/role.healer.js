const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##           #   #                 ##                 
//  #   #           #           #   #                  #                 
//  #   #   ###     #     ###   #   #   ###    ###     #     ###   # ##  
//  ####   #   #    #    #   #  #####  #   #      #    #    #   #  ##  # 
//  # #    #   #    #    #####  #   #  #####   ####    #    #####  #     
//  #  #   #   #    #    #      #   #  #      #   #    #    #      #     
//  #   #   ###    ###    ###   #   #   ###    ####   ###    ###   #     
/**
 * Represents the healer role.
 */
class RoleHealer {
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
        var max = 1,
            creeps;

        if (!canSpawn) {
            return {
                name: "healer",
                spawn: false,
                max: max
            };
        }

        var creeps = Cache.creeps[engine.room.name];

        return {
            name: "healer",
            spawn: _.filter(creeps && creeps.healer || [], (c) => c.spawning || c.ticksToLive >= 300).length < max,
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
        var energy = Math.min(checkSettings.energyCapacityAvailable, 7500),
            units = Math.floor(energy / 300),
            body = [];

        body.push(...Array(units).fill(MOVE));
        body.push(...Array(units).fill(HEAL));

        return {
            body: body,
            memory: {
                role: "healer",
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
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.healer || []), (c) => !c.spawning),
            tasks = engine.tasks;

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Find allies to heal.
        Assign.heal(creepsWithNoTask, tasks.hurtCreeps, "Heal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        
        // If there is a source keeper in the quadrant under 200 ticks, move towards it.
        Assign.moveToSourceKeeper(creepsWithNoTask, tasks.keepers);

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally to the room.
        Assign.moveToRoom(creepsWithNoTask, roomName);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleHealer, "RoleHealer");
}
module.exports = RoleHealer;
