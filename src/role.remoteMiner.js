const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##           ####                         #            #   #    #
//  #   #           #           #   #                        #            #   #
//  #   #   ###     #     ###   #   #   ###   ## #    ###   ####    ###   ## ##   ##    # ##    ###   # ##
//  ####   #   #    #    #   #  ####   #   #  # # #  #   #   #     #   #  # # #    #    ##  #  #   #  ##  #
//  # #    #   #    #    #####  # #    #####  # # #  #   #   #     #####  #   #    #    #   #  #####  #
//  #  #   #   #    #    #      #  #   #      # # #  #   #   #  #  #      #   #    #    #   #  #      #
//  #   #   ###    ###    ###   #   #   ###   #   #   ###     ##    ###   #   #   ###   #   #   ###   #
/**
 * Represents the remote miner role.
 */
class RoleRemoteMiner {
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
        let settings = engine.checkSpawnSettingsCache("remoteMiner"),
            containerIdToMineOn, isMineralHarvester;

        if (settings) {
            return settings;
        }

        const {room} = engine,
            containers = Cache.containersInRoom(room),
            minerals = room.find(FIND_MINERALS),
            sources = Array.prototype.concat.apply([], [room.find(FIND_SOURCES), minerals]);

        // If there are no containers or sources in the room, ignore the room.
        if (containers.length === 0 || sources.length === 0) {
            return {
                name: "remoteMiner",
                spawn: false,
                max: 0
            };
        }

        if (!canSpawn) {
            return {
                name: "remoteMiner",
                spawn: false,
                max: containers.length - _.filter(minerals, (m) => m.mineralAmount === 0).length
            };
        }

        const {lengthToContainer, containerSource} = Memory,
            {supportRoom} = engine,
            {name: supportRoomName} = supportRoom,
            spawnsInRoom = Cache.spawnsInRoom(supportRoom),
            {creeps: {[room.name]: creeps}} = Cache,
            remoteMiners = creeps && creeps.remoteMiner || [];

        // Loop through containers to see if we have anything we need to spawn.
        _.forEach(containers, (container) => {
            const {id: containerId} = container;

            // Calculate path length from container to support room's storage.
            if (!lengthToContainer[containerId]) {
                lengthToContainer[containerId] = {};
            }

            const {[containerId]: lengthToThisContainer} = lengthToContainer;

            if (!lengthToThisContainer[supportRoomName]) {
                ({path: {length: lengthToThisContainer[supportRoomName]}} = PathFinder.search(container.pos, {pos: spawnsInRoom[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}));
            }

            if (!containerSource[containerId]) {
                ({0: {id: containerSource[containerId]}} = Utilities.objectsClosestToObj(sources, container));
            }

            const source = Game.getObjectById(containerSource[containerId]),
                isMineral = source instanceof Mineral;

            // If this container is for a mineral, check to make sure it has resources.
            if (isMineral && source.mineralAmount === 0) {
                return true;
            }

            // If we don't have a remote miner for this container, spawn one.
            if (_.filter(remoteMiners, (c) => (c.spawning || c.ticksToLive >= 300) && c.memory.container === containerId).length === 0) {
                containerIdToMineOn = containerId;
                isMineralHarvester = isMineral;

                return false;
            }

            return true;
        });

        settings = {
            name: "remoteMiner",
            spawn: !!containerIdToMineOn,
            max: containers.length - _.filter(minerals, (m) => m.mineralAmount === 0).length,
            spawnFromRegion: true,
            containerIdToMineOn,
            isMineralHarvester
        };

        if (remoteMiners.length > 0) {
            engine.room.memory.maxCreeps.remoteMiner = {
                cache: settings,
                cacheUntil: settings.spawn ? Math.min(..._.map(remoteMiners, (c) => c.spawning ? 100 : Math.min(c.timeToLive - 300, 100))) : 100
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
        let body = [];

        if (checkSettings.isMineralHarvester) {
            const energy = Math.min(checkSettings.energyCapacityAvailable, 4500),
                units = Math.floor(energy / 450),
                remainder = energy % 450;

            body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(MOVE));
            body.push(...Array(units * 4 + (remainder >= 150 ? 1 : 0) + (remainder >= 250 ? 1 : 0) + (remainder >= 350 ? 1 : 0)).fill(WORK));
        } else {
            body = checkSettings.isSourceRoom ? [MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK] : [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK];
        }

        return {
            body,
            memory: {
                role: "remoteMiner",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                container: checkSettings.containerIdToMineOn
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
            creepsWithNoTask = Utilities.creepsWithNoTask(creeps && creeps.remoteMiner || []);

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to assign mine tasks.
        Assign.mine(creepsWithNoTask, "Mining");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally remaining creeps.
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteMiner, "RoleRemoteMiner");
}
module.exports = RoleRemoteMiner;
