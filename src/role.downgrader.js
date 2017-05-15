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
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine) {
        var downgrader = Memory.maxCreeps.downgrader,
            roomName = engine.room.name,
            creeps = Cache.creeps[roomName],
            downgraders = creeps && creeps.downgrader || [],
            roomToDowngrade;
        
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
            max: Object.keys(downgrader[roomName]).length,
            roomToClaim: roomToDowngrade
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
     * @param {RoomEngine} engine The room engine to spawn for.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(engine) {
        var energy = Math.min(engine.room.energyCapacityAvailable, 24400),
            units = Math.floor(energy / 3050),
            body = [];

        body.push(...Array(units * 5).fill(CLAIM));
        body.push(...Array(units).fill(MOVE));

        return {
            body: body,
            name: "downgrader"
        };
    }

    static spawn(room, toRoom) {
        var body = [],
            spawns = Cache.spawnsInRoom(room),
            energy, units, count, spawnToUse, name;

        // Fail if all the spawns are busy.
        if (_.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }

        // Get the total energy in the room, limited to 24400.
        energy = Math.min(room.energyCapacityAvailable, 24400);
        units = Math.floor(energy / 3050);

        // Create the body based on the energy.
        for (count = 0; count < units; count++) {
            body.push(CLAIM);
            body.push(CLAIM);
            body.push(CLAIM);
            body.push(CLAIM);
            body.push(CLAIM);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }

        // Create the creep from the first listed spawn that is available.
        spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `downgrader-${toRoom}-${Game.time.toFixed(0).substring(4)}`, {role: "downgrader", home: room.name, attack: toRoom});
        Cache.spawning[spawnToUse.id] = typeof name !== "number";

        return typeof name !== "number";
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
