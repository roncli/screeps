var Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),
    TaskReserve = require("task.reserve");

//  ####           ##           ####                         #            ####                                                   
//  #   #           #           #   #                        #            #   #                                                  
//  #   #   ###     #     ###   #   #   ###   ## #    ###   ####    ###   #   #   ###    ###    ###   # ##   #   #   ###   # ##  
//  ####   #   #    #    #   #  ####   #   #  # # #  #   #   #     #   #  ####   #   #  #      #   #  ##  #  #   #  #   #  ##  # 
//  # #    #   #    #    #####  # #    #####  # # #  #   #   #     #####  # #    #####   ###   #####  #       # #   #####  #     
//  #  #   #   #    #    #      #  #   #      # # #  #   #   #  #  #      #  #   #          #  #      #       # #   #      #     
//  #   #   ###    ###    ###   #   #   ###   #   #   ###     ##    ###   #   #   ###   ####    ###   #        #     ###   #     
/**
 * Represents the remote reserver role.
 */
class RoleRemoteReserver {
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
            controller = room.controller,
            reservation = controller.reservation,
            max = 1,
            lengthToController, controllerId, supportRoom, supportRoomName, creeps, lengthToThisController;

        if (reservation && reservation.ticksToEnd >= 4000) {
            return {
                name: "remoteReserver",
                spawn: false,
                max: 0
            };
        }

        lengthToController = Memory.lengthToController;
        controllerId = controller.id;
        supportRoom = engine.supportRoom;
        supportRoomName = supportRoom.name;
        creeps = Cache.creeps[room.name];

        if (!lengthToController[controllerId]) {
            lengthToController[controllerId] = {};
        }

        lengthToThisController = lengthToController[controllerId];

        if (!lengthToThisController[supportRoomName]) {
            lengthToThisController[supportRoomName] = PathFinder.search(controller.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}).path.length;
        }

        return {
            name: "remoteReserver",
            spawn: _.filter(creeps && creeps.remoteReserver || [], (c) => c.spawning || c.ticksToLive > lengthToThisController[supportRoomName]).length < max,
            max: 0,
            spawnFromRegion: true,
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
        var energy = Math.min(checkSettings.energyCapacityAvailable, 3250),
            units = Math.floor(energy / 650),
            body = [];

        body.push(...Array(units).fill(CLAIM));
        body.push(...Array(units).fill(MOVE));

        return {
            body: body,
            memory: {
                role: "remoteReserver",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom
            }
        };
    }

    static assignTasks(room) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteReserver || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If we have claimed the controller, stop trying to reserve the room and suicide any remaining creeps.
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                if (creep.room.name === creep.memory.home && creep.room.controller.my) {
                    assigned.push(creep.name);
                    Commands.setRoomType(creep.room, {type: "base"});
                    creep.suicide();
                    // TODO: Assign other creeps in room to another task if possible.
                }
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Reserve the controller.
        if (room && !room.unobservable && room.controller) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = TaskReserve.getRemoteTask(creep);
                if (task.canAssign(creep)) {
                    creep.say("Reserving");
                    assigned.push(creep.name);
                }
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally the troops!
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.memory.home);
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteReserver, "RoleRemoteReserver");
}
module.exports = RoleRemoteReserver;
