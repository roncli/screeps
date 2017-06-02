const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##            ###           ##     ##                   #
//  #   #           #           #   #           #      #                   #
//  #   #   ###     #     ###   #       ###     #      #     ###    ###   ####    ###   # ##
//  ####   #   #    #    #   #  #      #   #    #      #    #   #  #   #   #     #   #  ##  #
//  # #    #   #    #    #####  #      #   #    #      #    #####  #       #     #   #  #
//  #  #   #   #    #    #      #   #  #   #    #      #    #      #   #   #  #  #   #  #
//  #   #   ###    ###    ###    ###    ###    ###    ###    ###    ###     ##    ###   #
/**
 * Represents the collector role.
 */
class RoleCollector {
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
        const {room} = engine,
            {storage} = room,
            maxPerSource = 3;
        let sourceIdToCollectFrom;

        // If there is storage and containers in the room, ignore the room.
        if (Cache.containersInRoom(room).length !== 0 && storage && storage.my) {
            return {
                name: "collector",
                spawn: false,
                max: 0
            };
        }

        // If there is only one energy source, ignore the room.
        const sources = room.find(FIND_SOURCES);

        if (sources.length <= 1) {
            return {
                name: "collector",
                spawn: false,
                max: 0
            };
        }

        const max = maxPerSource * (sources.length - 1);

        if (!canSpawn) {
            return {
                name: "collector",
                spawn: false,
                max
            };
        }

        const {creeps: {[room.name]: creeps}} = Cache,
            collectors = creeps && creeps.collector || [];

        // Loop through sources to see if we have anything we need to spawn.
        _.forEach(Utilities.objectsClosestToObj(sources, Cache.spawnsInRoom(room)[0]), (source, index) => {
            // Skip the first source, it is for workers instead of collectors.
            if (index === 0) {
                return true;
            }

            const {id: sourceId} = source;

            if (_.filter(collectors, (c) => c.memory.homeSource === sourceId).length < maxPerSource) {
                sourceIdToCollectFrom = sourceId;

                return false;
            }

            return true;
        });

        return {
            name: "collector",
            spawn: !!sourceIdToCollectFrom,
            max,
            spawnFromRegion: true,
            sourceIdToCollectFrom
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
                role: "collector",
                home: checkSettings.home,
                homeSource: checkSettings.sourceIdToCollectFrom
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
            {name: roomName, controller} = room,
            {creeps: {[roomName]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.collector || []), (c) => !c.spawning),
            allCreeps = creeps && creeps.all || [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for critical controllers to upgrade.
        Assign.upgradeCriticalController(creepsWithNoTask, controller, "Upgrade");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled extensions.
        Assign.fillExtensions(creepsWithNoTask, allCreeps, room.controller.level, tasks.extensions, "Extension");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled spawns.
        Assign.fillSpawns(creepsWithNoTask, allCreeps, tasks.spawns, "Spawn");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled towers.
        Assign.fillTowersWithEnergy(creepsWithNoTask, allCreeps, tasks.towers, "Tower");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for critical repairs.
        Assign.repairStructures(creepsWithNoTask, allCreeps, tasks.criticalRepairableStructures, "CritRepair");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for construction sites.
        Assign.build(creepsWithNoTask, allCreeps, tasks.constructionSites, "Build");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for repairs.
        Assign.repairStructures(creepsWithNoTask, allCreeps, tasks.repairableStructures, "Repair");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for controllers to upgrade.
        Assign.upgradeController(creepsWithNoTask, controller, "Upgrade");

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

        // Attempt to get energy from containers.
        Assign.collectEnergy(creepsWithNoTask, allCreeps, tasks.structuresWithEnergy, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to assign harvest task to remaining creeps.
        Assign.harvest(creepsWithNoTask, "Harvesting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally remaining creeps.
        Assign.moveToHomeSource(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleCollector, "RoleCollector");
}
module.exports = RoleCollector;
