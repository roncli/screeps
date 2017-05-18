var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),
    TaskDowngrade = require("task.downgrade");

//  ####           ##           ####                                                 #               
//  #   #           #            #  #                                                #               
//  #   #   ###     #     ###    #  #   ###   #   #  # ##    ## #  # ##    ###    ## #   ###   # ##  
//  ####   #   #    #    #   #   #  #  #   #  #   #  ##  #  #  #   ##  #      #  #  ##  #   #  ##  # 
//  # #    #   #    #    #####   #  #  #   #  # # #  #   #   ##    #       ####  #   #  #####  #     
//  #  #   #   #    #    #       #  #  #   #  # # #  #   #  #      #      #   #  #  ##  #      #     
//  #   #   ###    ###    ###   ####    ###    # #   #   #   ###   #       ####   ## #   ###   #     
//                                                          #   #                                    
//                                                           ###                                     
/**
 * Represents the downgrader role.
 */
class RoleDowngrader {
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
        var downgrader = Memory.maxCreeps.downgrader,
            roomName = engine.room.name,
            creeps, downgraders, roomToDowngrade;

        if (!canSpawn) {
            return {
                name: "downgrader",
                spawn: false,
                max: downgrader && downgrader[roomName] ? Object.keys(downgrader[roomName]).length : 0
            };
        }

        creeps = Cache.creeps[roomName];
        downgraders = creeps && creeps.downgrader || [];
        
        // Loop through the room downgraders to see if we need to spawn a creep.
        if (downgrader) {
            _.forEach(downgrader[roomName], (value, toRoom) => {
                if (_.filter(downgraders, (c) => c.memory.attack === toRoom).length === 0) {
                    roomToDowngrade = toRoom;
                    return false;
                }
            });
        }

        return {
            name: "downgrader",
            spawn: !!roomToDowngrade,
            max: downgrader && downgrader[roomName] ? Object.keys(downgrader[roomName]).length : 0,
            roomToDowngrade: roomToDowngrade
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
        var energy = Math.min(checkSettings.energyCapacityAvailable, 24400),
            units = Math.floor(energy / 3050),
            body = [];

        body.push(...Array(units * 5).fill(CLAIM));
        body.push(...Array(units).fill(MOVE));

        return {
            body: body,
            memory: {
                role: "downgrader",
                home: checkSettings.home,
                attack: checkSettings.roomToDowngrade
            }
        };
    }

    static assignTasks(room) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].downgrader || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If the creeps are not in the room, rally them.
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.attack), (creep) => {
            var task = TaskRally.getClaimerTask(creep);
            if (task.canAssign(creep)) {
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attack the controller.
        _.forEach(creepsWithNoTask, (creep) => {
            var task = TaskDowngrade.getTask(creep);
            if (task.canAssign(creep)) {
                creep.say("Attacking");
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Suicide any remaining creeps.
        _.forEach(creepsWithNoTask, (creep) => {
            creep.suicide();
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleDowngrader, "RoleDowngrader");
}
module.exports = RoleDowngrader;
