var Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##            ###    ##             #                        
//  #   #           #           #   #    #                                      
//  #   #   ###     #     ###   #        #     ###    ##    ## #    ###   # ##  
//  ####   #   #    #    #   #  #        #        #    #    # # #  #   #  ##  # 
//  # #    #   #    #    #####  #        #     ####    #    # # #  #####  #     
//  #  #   #   #    #    #      #   #    #    #   #    #    # # #  #      #     
//  #   #   ###    ###    ###    ###    ###    ####   ###   #   #   ###   #     
/**
 * Represents the claimer role.
 */
class RoleClaimer {
    //       #                 #      ##                            ##          #     #     #                       
    //       #                 #     #  #                          #  #         #     #                             
    //  ##   ###    ##    ##   # #    #    ###    ###  #  #  ###    #     ##   ###   ###   ##    ###    ###   ###   
    // #     #  #  # ##  #     ##      #   #  #  #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     
    // #     #  #  ##    #     # #   #  #  #  #  # ##  ####  #  #  #  #  ##     #     #     #    #  #   ##     ##   
    //  ##   #  #   ##    ##   #  #   ##   ###    # #  ####  #  #   ##    ##     ##    ##  ###   #  #  #     ###    
    //                                     #                                                            ###         
    /**
     * Gets the settings for checking whether a creep should be spawned.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        var claimer = Memory.maxCreeps.claimer,
            roomName = engine.room.name,
            creeps, claimers, roomToClaim;

        if (!canSpawn) {
            return {
                name: "claimer",
                spawn: false,
                max: claimer && claimer[roomName] ? Object.keys(claimer[roomName]).length : 0
            };
        }

        creeps = Cache.creeps[roomName];
        claimers = creeps && creeps.claimer || [];
        
        // Loop through the room claimers to see if we need to spawn a creep.
        if (claimer) {
            _.forEach(claimer[roomName], (value, toRoom) => {
                if (_.filter(claimers, (c) => c.memory.claim === toRoom).length === 0) {
                    roomToClaim = toRoom;
                    return false;
                }
            });
        }

        return {
            name: "claimer",
            spawn: !!roomToClaim,
            max: claimer && claimer[roomName] ? Object.keys(claimer[roomName]).length : 0,
            roomToClaim: roomToClaim
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
            body: [CLAIM, MOVE],
            memory: {
                role: "claimer",
                home: checkSettings.home,
                claim: checkSettings.roomToClaim
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
     * @param {Room} room The room to assign tasks for.
     */
    static assignTasks(room) {
        var creeps = Cache.creeps[room.name],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Claim controller.
        Assign.claimController(creepsWithNoTask, "Claiming");
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleClaimer, "RoleClaimer");
}
module.exports = RoleClaimer;
