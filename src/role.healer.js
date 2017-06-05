const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##           #   #                 ##
//  #   #           #           #   #                  #
//  #   #   ###     #     ###   #   #   ###    ###     #     ###   # ##
//  ####   #   #    #    #   #  #####  #   #      #    #    #   #  ##  #
//  # #    #   #    #    #####  #   #  #####   ####    #    #####  #
//  #  #   #   #    #    #      #   #  #      #   #    #    #      #
//  #   #   ###    ###    ###   #   #   ###    ####   ###    ###   #
/**
 * Represents the healer role.
 */
class RoleHealer {
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
        let settings = engine.checkSpawnSettingsCache("healer");

        if (settings) {
            return settings;
        }

        const max = 1;

        if (!canSpawn) {
            return {
                name: "healer",
                spawn: false,
                max
            };
        }

        const {creeps: {[engine.room.name]: creeps}} = Cache,
            healers = creeps && creeps.healer || [];

        settings = {
            name: "healer",
            spawn: _.filter(healers, (c) => c.spawning || c.ticksToLive >= 300).length < max,
            spawnFromRegion: true,
            max
        };

        if (healers.length > 0) {
            engine.room.memory.maxCreeps.healer = {
                cache: settings,
                cacheUntil: settings.spawn ? Game.time + Math.min(..._.map(healers, (c) => c.spawning ? 25 : Math.min(c.timeToLive - 300, 25))) : 25
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
        const energy = Math.min(checkSettings.energyCapacityAvailable, 7500),
            units = Math.floor(energy / 300),
            body = [];

        body.push(...Array(units).fill(MOVE));
        body.push(...Array(units).fill(HEAL));

        return {
            body,
            memory: {
                role: "healer",
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
        const {room: {name: roomName}, tasks} = engine,
            {creeps: {[roomName]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.healer || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Find allies to heal.
        Assign.heal(creepsWithNoTask, tasks.hurtCreeps, "Heal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If there is a source keeper in the quadrant under 200 ticks, move towards it.
        Assign.moveToSourceKeeper(creepsWithNoTask, tasks.keepers);

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally to the room.
        Assign.moveToRoom(creepsWithNoTask, roomName);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleHealer, "RoleHealer");
}
module.exports = RoleHealer;
