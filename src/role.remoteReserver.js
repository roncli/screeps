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
        let settings = engine.checkSpawnSettingsCache("remoteReserver");

        if (settings) {
            return settings;
        }

        const {room} = engine,
            {controller} = room,
            max = 1;

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
                max
            };
        }

        const {reservation} = controller;

        if (reservation && reservation.ticksToEnd >= 4000) {
            return {
                name: "remoteReserver",
                spawn: false,
                max: 0
            };
        }

        const {lengthToController} = Memory,
            {id: controllerId} = controller,
            {supportRoom} = engine,
            {name: supportRoomName} = supportRoom,
            {creeps: {[room.name]: creeps}} = Cache,
            remoteReservers = creeps && creeps.remoteReserver || [];

        if (!lengthToController[controllerId]) {
            lengthToController[controllerId] = {};
        }

        const {[controllerId]: lengthToThisController} = lengthToController;

        if (!lengthToThisController[supportRoomName]) {
            ({path: {length: lengthToThisController[supportRoomName]}} = PathFinder.search(controller.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}));
        }

        settings = {
            name: "remoteReserver",
            spawn: _.filter(remoteReservers, (c) => c.spawning || c.ticksToLive > lengthToThisController[supportRoomName]).length < max,
            max,
            spawnFromRegion: true
        };

        if (remoteReservers.length > 0) {
            engine.room.memory.maxCreeps.remoteReserver = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(remoteReservers, (c) => c.spawning ? 100 : Math.min(c.timeToLive - 150, 100))))
            };
        }

        return settings;
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
        const energy = Math.min(checkSettings.energyCapacityAvailable, 3250),
            units = Math.floor(energy / 650),
            body = [];

        body.push(...Array(units).fill(CLAIM));
        body.push(...Array(units).fill(MOVE));

        return {
            body,
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
     * @return {void}
     */
    static assignTasks(engine) {
        const {room} = engine,
            {creeps: {[room.name]: creeps}} = Cache,
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
