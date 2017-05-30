const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

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
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        var room = engine.room,
            controller = room.controller,
            max = 1,
            reservation, lengthToController, controllerId, supportRoom, supportRoomName, creeps, lengthToThisController;

        if (!controller) {
            return {
                name: "remoteReserver",
                spawn: false,
                max: 0
            };
        }

        if (!canSpawn) {
            return {
                name: "remoteReserver",
                spawn: false,
                max: max
            };
        }

        reservation = controller.reservation;
        
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
        var room = engine.room,
            creeps = Cache.creeps[room.name],
            creepsWithNoTask = Utilities.creepsWithNoTask(creeps && creeps.remoteReserver || []);

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Reserve the controller.
        Assign.reserveController(creepsWithNoTask, room, "Reserving");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally the troops!
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteReserver, "RoleRemoteReserver");
}
module.exports = RoleRemoteReserver;
