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
        var creeps = Cache.creeps[engine.room.name],
            max = engine instanceof RoomCleanup ? 8 : 1;

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
     * @param {RoomEngine} engine The room engine to spawn for.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(engine) {
        var energy = Math.min(engine.room.energyCapacityAvailable, 3750),
            units = Math.floor(energy / 150),
            body = [];

        body.push(...Array(units).fill(WORK));
        body.push(...Array(units).fill(MOVE));

        return {
            body: body,
            name: "remoteDismantler"
        };
    }

    static spawn(room, supportRoom) {
        var body = [],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, count, spawnToUse, name;

        // Fail if all the spawns are busy.
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }

        // Get the total energy in the room, limited to 3750.
        energy = Math.min(supportRoom.energyCapacityAvailable, 3750);
        units = Math.floor(energy / 150);

        // Create the body based on the energy.
        for (count = 0; count < units; count++) {
            body.push(WORK);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }

        // Create the creep from the first listed spawn that is available.
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `remoteDismantler-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "remoteDismantler", home: roomName, supportRoom: supportRoomName});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
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
