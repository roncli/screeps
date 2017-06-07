const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##           ####     #                                 #      ##
//  #   #           #            #  #                                      #       #
//  #   #   ###     #     ###    #  #   ##     ###   ## #    ###   # ##   ####     #     ###   # ##
//  ####   #   #    #    #   #   #  #    #    #      # # #      #  ##  #   #       #    #   #  ##  #
//  # #    #   #    #    #####   #  #    #     ###   # # #   ####  #   #   #       #    #####  #
//  #  #   #   #    #    #       #  #    #        #  # # #  #   #  #   #   #  #    #    #      #
//  #   #   ###    ###    ###   ####    ###   ####   #   #   ####  #   #    ##    ###    ###   #
/**
 * Represents the dismantler role.
 */
class RoleDismantler {
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
        let settings = engine.checkSpawnSettingsCache("dismantler");

        if (settings) {
            return settings;
        }

        const max = 1;

        if (!canSpawn) {
            return {
                name: "dismantler",
                spawn: false,
                max: 0
            };
        }

        const {creeps: {[engine.room.name]: creeps}} = Cache,
            dismantlers = creeps && creeps.dismantler || [];

        settings = {
            name: "dismantler",
            spawn: _.filter(dismantlers || [], (c) => c.spawning || c.ticksToLive >= 150).length < max,
            spawnFromRegion: true,
            max
        };

        if (dismantlers.length > 0) {
            engine.room.memory.maxCreeps.dismantler = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(dismantlers, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 300, 100))))
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
                role: "dismantler",
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
        const {room, tasks} = engine,
            {name: roomName} = room,
            {creeps: {[roomName]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.dismantler || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = creeps && creeps.all || [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for structures needing dismantling.
        Assign.dismantleTargets(creepsWithNoTask, room, "Dismantle");

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

        // Check for unfilled storage.
        Assign.fillStorageWithEnergy(creepsWithNoTask, allCreeps, room, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled storage for minerals.
        Assign.fillWithMinerals(creepsWithNoTask, room.storage, tasks.storageResourcesNeeded, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled terminals for minerals.
        Assign.fillWithMinerals(creepsWithNoTask, room.terminal, void 0, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled containers.
        Assign.fillWithEnergy(creepsWithNoTask, allCreeps, Cache.containersInRoom(room), "Container");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for dropped resources in current room if there are no hostiles.
        Assign.pickupResources(creepsWithNoTask, allCreeps, Cache.resourcesInRoom(room), tasks.hostiles, "Pickup");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally to the room.
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleDismantler, "RoleDismantler");
}
module.exports = RoleDismantler;
