const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##           ####            ##                     #               
//  #   #           #            #  #          #  #                    #               
//  #   #   ###     #     ###    #  #   ###    #      ###   # ##    ## #   ###   # ##  
//  ####   #   #    #    #   #   #  #  #   #  ####   #   #  ##  #  #  ##  #   #  ##  # 
//  # #    #   #    #    #####   #  #  #####   #     #####  #   #  #   #  #####  #     
//  #  #   #   #    #    #       #  #  #       #     #      #   #  #  ##  #      #     
//  #   #   ###    ###    ###   ####    ###    #      ###   #   #   ## #   ###   #     
/**
 * Represents the defender role.
 */
class RoleDefender {
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
                name: "defender",
                spawn: false,
                max: max
            };
        }

        creeps = Cache.creeps[engine.room.name];

        return {
            name: "defender",
            spawn: _.filter(creeps && creeps.defender || [], (c) => c.spawning || c.ticksToLive >= 300).length < max,
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
        return {
            body: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, HEAL, HEAL, HEAL, HEAL, HEAL],
            memory: {
                role: "defender",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                quadrant: 0
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
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.defender || []), (c) => !c.spawning),
            tasks = engine.tasks;

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If there is a hostile in the quadrant, attack it.
        Assign.attackInQuadrant(creepsWithNoTask, tasks.hostiles, "Die!");

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
        
        // Move to the next quadrant.
        _.forEach(_.filter(creepsWithNoTask, (c) => !c.memory.currentTask), (creep) => {
            creep.memory.quadrant = (creep.memory.quadrant + 1) % 4;
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleDefender, "RoleDefender");
}
module.exports = RoleDefender;
