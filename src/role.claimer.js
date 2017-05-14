var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),
    TaskClaim = require("task.claim");

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
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine) {
        var claimer = Memory.maxCreeps.claimer,
            roomName = engine.room.name,
            creeps = Cache.creeps[roomName],
            claimers = creeps && creeps.claimer || [],
            roomToClaim;
        
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
            spawn: !!roomToClaim,
            max: Object.keys(claimer[roomName]).length,
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
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings() {
        return {
            body: [CLAIM, MOVE],
            name: "claimer"
        };
    }

    static spawn(room, toRoom) {
        var spawns = Cache.spawnsInRoom(room),
            body = [CLAIM, MOVE],
            spawnToUse, name;

        // Fail if all the spawns are busy.
        if (_.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }

        // Create the creep from the first listed spawn that is available.
        spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `claimer-${toRoom}-${Game.time.toFixed(0).substring(4)}`, {role: "claimer", home: room.name, claim: toRoom});
        Cache.spawning[spawnToUse.id] = typeof name !== "number";

        return typeof name !== "number";
    }

    static assignTasks(room) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].claimer || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If the creeps are not in the room, rally them.
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.claim), (creep) => {
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

        // Claim the controller.
        _.forEach(creepsWithNoTask, (creep) => {
            var task = TaskClaim.getTask(creep);
            if (task.canAssign(creep)) {
                creep.say("Claiming");
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If we have claimed, set the room as a base, stop trying to claim the room, and suicide any remaining creeps.
        _.forEach(creepsWithNoTask, (creep) => {
            if (creep.room.name === creep.memory.claim && creep.room.controller.my) {
                creep.suicide();
            }
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleClaimer, "RoleClaimer");
}
module.exports = RoleClaimer;
