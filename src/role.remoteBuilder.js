const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##           ####                         #            ####            #     ##        #
//  #   #           #           #   #                        #             #  #                  #        #
//  #   #   ###     #     ###   #   #   ###   ## #    ###   ####    ###    #  #  #   #   ##      #     ## #   ###   # ##
//  ####   #   #    #    #   #  ####   #   #  # # #  #   #   #     #   #   ###   #   #    #      #    #  ##  #   #  ##  #
//  # #    #   #    #    #####  # #    #####  # # #  #   #   #     #####   #  #  #   #    #      #    #   #  #####  #
//  #  #   #   #    #    #      #  #   #      # # #  #   #   #  #  #       #  #  #  ##    #      #    #  ##  #      #
//  #   #   ###    ###    ###   #   #   ###   #   #   ###     ##    ###   ####    ## #   ###    ###    ## #   ###   #
/**
 * Represents the remote builder role.
 */
class RoleRemoteBuilder {
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
        let settings = engine.checkSpawnSettingsCache("remoteBuilder");

        if (settings) {
            return settings;
        }

        const max = 2;

        if (!canSpawn) {
            return {
                name: "remoteBuilder",
                spawn: false,
                max
            };
        }

        const {creeps: {[engine.room.name]: creeps}} = Cache,
            remoteBuilders = creeps && creeps.remoteBuilder || [];

        settings = {
            name: "remoteBuilder",
            spawn: _.filter(remoteBuilders, (c) => c.spawning || c.ticksToLive >= 150).length < max,
            spawnFromRegion: true,
            max
        };

        if (remoteBuilders.length > 0) {
            engine.room.memory.maxCreeps.remoteBuilder = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(remoteBuilders, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 150, 100))))
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
        const energy = Math.min(checkSettings.energyCapacityAvailable, 3300),
            units = Math.floor(energy / 200),
            remainder = energy % 200,
            body = [];

        body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
        body.push(...Array(units + (remainder >= 100 && remainder < 150 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + (remainder >= 50 ? 1 : 0)).fill(MOVE));

        return {
            body,
            memory: {
                role: "remoteBuilder",
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
        const {creeps: {[engine.room.name]: creeps}} = Cache,
            {room, tasks} = engine,
            remoteBuilders = _.filter(creeps && creeps.remoteBuilder || [], (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            creepsWithNoTask = Utilities.creepsWithNoTask(remoteBuilders),
            allCreeps = creeps && creeps.all || [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Flee from enemies.
        Assign.flee(remoteBuilders, tasks.hostiles, "Run away!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for enemy construction sites and rally to them.
        Assign.stomp(creepsWithNoTask, tasks.hostileConstructionSites, "Stomping");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check critical repairs.
        Assign.repairCriticalStructuresInCurrentRoom(creepsWithNoTask, "CritRepair");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for construction sites.
        Assign.buildInCurrentRoom(creepsWithNoTask, allCreeps, false, "Build");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for dropped resources in current room.
        if (!room.unobservable) {
            Assign.pickupResources(creepsWithNoTask, allCreeps, Cache.sortedResourcesInRoom(room), Cache.hostilesInRoom(room), "Pickup");

            _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
            if (creepsWithNoTask.length === 0) {
                return;
            }
        }

        // Attempt to assign harvest task to remaining creeps.
        Assign.harvest(creepsWithNoTask, "Harvesting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally remaining creeps.
        Assign.moveToHomeSource(creepsWithNoTask);

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally to room.
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteBuilder, "RoleRemoteBuilder");
}
module.exports = RoleRemoteBuilder;
