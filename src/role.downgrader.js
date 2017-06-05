const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

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
        let settings = engine.checkSpawnSettingsCache("downgrader"),
            roomToDowngrade;

        if (settings) {
            return settings;
        }

        const {maxCreeps: {downgrader}} = Memory,
            {room: {name: roomName}} = engine;

        if (!canSpawn) {
            return {
                name: "downgrader",
                spawn: false,
                max: downgrader && downgrader[roomName] ? Object.keys(downgrader[roomName]).length : 0
            };
        }

        const {creeps: {[roomName]: creeps}} = Cache,
            downgraders = creeps && creeps.downgrader || [];

        // Loop through the room downgraders to see if we need to spawn a creep.
        if (downgrader) {
            _.forEach(downgrader[roomName], (value, toRoom) => {
                if (_.filter(downgraders, (c) => c.memory.downgrade === toRoom).length === 0) {
                    roomToDowngrade = toRoom;

                    return false;
                }

                return true;
            });
        }

        settings = {
            name: "downgrader",
            spawn: !!roomToDowngrade,
            max: downgrader && downgrader[roomName] ? Object.keys(downgrader[roomName]).length : 0,
            roomToDowngrade
        };

        if (downgraders.length > 0) {
            engine.room.memory.maxCreeps.downgrader = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(downgraders, (c) => c.spawning ? 100 : Math.min(c.timeToLive, 100))))
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
        const energy = Math.min(checkSettings.energyCapacityAvailable, 24400),
            units = Math.floor(energy / 3050),
            body = [];

        body.push(...Array(units * 5).fill(CLAIM));
        body.push(...Array(units).fill(MOVE));

        return {
            body,
            memory: {
                role: "downgrader",
                home: checkSettings.home,
                downgrade: checkSettings.roomToDowngrade
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
        const {creeps: {[engine.room.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.downgrader || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Downgrade controller.
        Assign.downgradeController(creepsWithNoTask, "Downgrade");
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleDowngrader, "RoleDowngrader");
}
module.exports = RoleDowngrader;
