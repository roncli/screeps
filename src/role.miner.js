const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##           #   #    #
//  #   #           #           #   #
//  #   #   ###     #     ###   ## ##   ##    # ##    ###   # ##
//  ####   #   #    #    #   #  # # #    #    ##  #  #   #  ##  #
//  # #    #   #    #    #####  #   #    #    #   #  #####  #
//  #  #   #   #    #    #      #   #    #    #   #  #      #
//  #   #   ###    ###    ###   #   #   ###   #   #   ###   #
/**
 * Represents the miner role.
 */
class RoleMiner {
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
        let settings = engine.checkSpawnSettingsCache("miner"),
            containerIdToMineOn, isMineralHarvester;

        if (settings) {
            return settings;
        }

        const {room} = engine,
            containers = Cache.containersInRoom(room),
            minerals = room.find(FIND_MINERALS),
            sources = Array.prototype.concat.apply([], [room.find(FIND_SOURCES), minerals]);

        // If there are no containers in the room, ignore the room.
        if (containers.length === 0) {
            return {
                name: "miner",
                spawn: false,
                max: 0
            };
        }

        if (!canSpawn) {
            return {
                name: "miner",
                spawn: false,
                max: containers.length - _.filter(minerals, (m) => m.mineralAmount === 0).length
            };
        }

        const {containerSource} = Memory,
            {creeps: {[room.name]: creeps}} = Cache,
            miners = creeps && creeps.miner || [];

        // Loop through containers to see if we have anything we need to spawn.
        _.forEach(containers, (container) => {
            const {id: containerId} = container;

            if (!containerSource[containerId]) {
                ({0: {id: containerSource[containerId]}} = Utilities.objectsClosestToObj(sources, container));
            }

            const source = Game.getObjectById(containerSource[containerId]),
                isMineral = source instanceof Mineral;

            // If this container is for a mineral, check to make sure it has resources.
            if (isMineral && source.mineralAmount === 0) {
                return true;
            }

            // If we don't have a miner for this container, spawn one.
            if (_.filter(miners, (c) => (c.spawning || c.ticksToLive >= 150) && c.memory.container === containerId).length === 0) {
                containerIdToMineOn = containerId;
                isMineralHarvester = isMineral;

                return false;
            }

            return true;
        });

        settings = {
            name: "miner",
            spawn: !!containerIdToMineOn,
            max: containers.length - _.filter(minerals, (m) => m.mineralAmount === 0).length,
            containerIdToMineOn,
            isMineralHarvester
        };

        if (miners.length > 0) {
            engine.room.memory.maxCreeps.miner = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(miners, (c) => c.spawning ? 100 : Math.min(c.timeToLive - 150, 100))))
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
            body = [MOVE, WORK, WORK, WORK, WORK, WORK];
        }

        return {
            body,
            memory: {
                role: "miner",
                home: checkSettings.home,
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
        const {room: {name: roomName}} = engine,
            {creeps: {[roomName]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.miner || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If not yet boosted, go get boosts.
        Assign.getBoost(creepsWithNoTask, "Boosting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to assign mine tasks.
        Assign.mine(creepsWithNoTask, "Mining");
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleMiner, "RoleMiner");
}
module.exports = RoleMiner;
