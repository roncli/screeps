var Cache = require("cache"),
    RoomCleanup = require("room.cleanup"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally");

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
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine) {
        var room = engine.room,
            creeps = Cache.creeps[room.name],
            max = !room.unobservable && engine instanceof RoomCleanup ? Math.min(room.find(FIND_STRUCTURES).length, 8) : 1;

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

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteDismantler || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for enemy construction sites and rally to them.
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === roomName), (creep) => {
            if (room.find(FIND_HOSTILE_CONSTRUCTION_SITES).length > 0) {
                var task = new TaskRally(room.find(FIND_HOSTILE_CONSTRUCTION_SITES)[0].id);
                task.canAssign(creep);
                creep.say("Stomping");
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for structures needing dismantling.
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === roomName), (creep) => {
            _.forEach(tasks.remoteDismantle.cleanupTasks, (task) => {
                if (_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "dismantle" && c.memory.currentTask.id === task.id).length > 0) {
                    return;
                }
                if (task.canAssign(creep)) {
                    creep.say("Dismantle");
                    assigned.push(creep.name);
                    return false;
                }
            });
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally remaining creeps.
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.memory.home);
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteDismantler, "RoleRemoteDismantler");
}
module.exports = RoleRemoteDismantler;
