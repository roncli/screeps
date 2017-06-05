const Assign = require("assign"),
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
        let settings = engine.checkSpawnSettingsCache("claimer"),
            roomToClaim;

        if (settings) {
            return settings;
        }

        const {maxCreeps: {claimer}} = Memory,
            {room: {name: roomName}} = engine;

        if (!canSpawn) {
            return {
                name: "claimer",
                spawn: false,
                max: claimer && claimer[roomName] ? Object.keys(claimer[roomName]).length : 0
            };
        }

        const {creeps: {[roomName]: creeps}} = Cache,
            claimers = creeps && creeps.claimer || [];

        // Loop through the room claimers to see if we need to spawn a creep.
        if (claimer) {
            _.forEach(claimer[roomName], (value, toRoom) => {
                if (_.filter(claimers, (c) => c.memory.claim === toRoom).length === 0) {
                    roomToClaim = toRoom;

                    return false;
                }

                return true;
            });
        }

        settings = {
            name: "claimer",
            spawn: !!roomToClaim,
            max: claimer && claimer[roomName] ? Object.keys(claimer[roomName]).length : 0,
            roomToClaim
        };

        if (claimers.length > 0) {
            engine.room.memory.maxCreeps.claimer = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(claimers, (c) => c.spawning ? 100 : Math.min(c.timeToLive, 100))))
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
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {creeps: {[engine.room.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.claimer || []), (c) => !c.spawning);

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
