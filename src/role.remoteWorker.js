const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##           ####                         #            #   #                #
//  #   #           #           #   #                        #            #   #                #
//  #   #   ###     #     ###   #   #   ###   ## #    ###   ####    ###   #   #   ###   # ##   #   #   ###   # ##
//  ####   #   #    #    #   #  ####   #   #  # # #  #   #   #     #   #  # # #  #   #  ##  #  #  #   #   #  ##  #
//  # #    #   #    #    #####  # #    #####  # # #  #   #   #     #####  # # #  #   #  #      ###    #####  #
//  #  #   #   #    #    #      #  #   #      # # #  #   #   #  #  #      ## ##  #   #  #      #  #   #      #
//  #   #   ###    ###    ###   #   #   ###   #   #   ###     ##    ###   #   #   ###   #      #   #   ###   #
/**
 * Represents the remote worker role.
 */
class RoleRemoteWorker {
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
        let settings = engine.checkSpawnSettingsCache("remoteWorker"),
            spawn = false,
            containerIdToCollectFrom;

        if (settings) {
            return settings;
        }

        const {room} = engine,
            containers = Cache.containersInRoom(room),
            max = 1;

        // If there are no containers in the room, ignore the room.
        if (containers.length === 0) {
            return {
                name: "remoteWorker",
                spawn: false,
                max: 0
            };
        }

        if (!canSpawn) {
            return {
                name: "remoteWorker",
                spawn: false,
                max
            };
        }

        const sources = Array.prototype.concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]),
            {lengthToContainer} = Memory,
            {creeps: {[room.name]: creeps}} = Cache,
            remoteWorkers = creeps && creeps.remoteWorker || [],
            {supportRoom: {name: supportRoomName}} = engine;

        // Loop through containers to see if we have anything we need to spawn.
        _.forEach(containers, (container) => {
            const {0: source} = Utilities.objectsClosestToObj(sources, container),
                {id: containerId} = container,
                {[containerId]: lengthToThisAContainer} = lengthToContainer;

            // If this container is for a mineral, skip it.
            if (source instanceof Mineral) {
                return true;
            }

            if (_.filter(remoteWorkers, (c) => (c.spawning || c.ticksToLive >= 150 + (lengthToThisAContainer && lengthToThisAContainer[supportRoomName] ? lengthToThisAContainer[supportRoomName] : 0) * 2) && c.memory.container === containerId).length === 0) {
                containerIdToCollectFrom = containerId;
                spawn = true;
            }

            // Only 1 worker per room.
            return false;
        });

        settings = {
            name: "remoteWorker",
            spawn,
            max,
            spawnFromRegion: true,
            containerIdToCollectFrom
        };

        if (remoteWorkers.length > 0) {
            engine.room.memory.maxCreeps.remoteWorker = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(remoteWorkers, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 300, 100))))
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
        const energy = Math.min(checkSettings.energyCapacityAvailable, 3000),
            units = Math.floor(Math.min(energy, 2000) / 200),
            secondUnits = Math.floor(Math.max(energy - 2000, 0) / 150),
            remainder = Math.min(energy, 2000) % 200,
            secondRemainder = Math.max(energy - 2000, 0) % 150,
            body = [];

        body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
        body.push(...Array(units + secondUnits * 2 + (remainder >= 100 && remainder < 150 ? 1 : 0) + (secondRemainder > 100 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + secondUnits + (remainder >= 50 ? 1 : 0) + (secondRemainder >= 50 ? 1 : 0)).fill(MOVE));

        return {
            body,
            memory: {
                role: "remoteWorker",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                container: checkSettings.containerIdToCollectFrom
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
            remoteWorkers = _.filter(creeps && creeps.remoteWorker || [], (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            creepsWithNoTask = Utilities.creepsWithNoTask(remoteWorkers),
            allCreeps = creeps && creeps.all || [],
            {supportRoom} = engine;

        if (remoteWorkers.length === 0) {
            return;
        }

        // Flee from enemies.
        Assign.flee(remoteWorkers, "Run away!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for quick construction sites.
        Assign.buildInCurrentRoom(creepsWithNoTask, allCreeps, true, "Build");

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

        // Check for unfilled storage.
        Assign.fillStorageWithEnergy(creepsWithNoTask, allCreeps, supportRoom, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled storage for minerals.
        Assign.fillWithMinerals(creepsWithNoTask, supportRoom.storage, Cache.rooms[supportRoom.name].tasks.storageResourcesNeeded, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled terminals for minerals.
        Assign.fillWithMinerals(creepsWithNoTask, supportRoom.terminal, void 0, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled containers.
        Assign.fillWithEnergy(creepsWithNoTask, allCreeps, Cache.containersInRoom(supportRoom), "Container");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for dropped resources in current room.
        Assign.pickupResourcesInCurrentRoom(creepsWithNoTask, allCreeps, "Pickup");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to get energy from containers.
        Assign.collectEnergyFromHomeContainer(creepsWithNoTask, "Collecting");

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
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteWorker, "RoleRemoteWorker");
}
module.exports = RoleRemoteWorker;
