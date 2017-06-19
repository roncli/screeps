const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##            ###    #
//  #   #           #           #   #   #
//  #   #   ###     #     ###   #      ####    ###   # ##    ###   # ##
//  ####   #   #    #    #   #   ###    #     #   #  ##  #  #   #  ##  #
//  # #    #   #    #    #####      #   #     #   #  #      #####  #
//  #  #   #   #    #    #      #   #   #  #  #   #  #      #      #
//  #   #   ###    ###    ###    ###     ##    ###   #       ###   #
/**
 * Represents the storer role.
 */
class RoleStorer {
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
        let settings = engine.checkSpawnSettingsCache("storer"),
            max = 0,
            length = 0;

        if (settings) {
            return settings;
        }

        const {room} = engine,
            containers = Cache.containersInRoom(room);

        // If there are no containers or storages in the room, ignore the room.
        if (containers.length === 0 || !room.storage || !room.storage.my) {
            return {
                name: "storer",
                spawn: false,
                max: 0
            };
        }

        const {containerSource, lengthToStorage, army} = Memory,
            sources = Array.prototype.concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]),
            {controller} = room,
            {level: rcl} = controller,
            {creeps: {[room.name]: creeps}} = Cache,
            storers = creeps && creeps.storer || [];

        // Determine the number storers needed.
        _.forEach(containers, (container) => {
            const {id: containerId} = container;

            if (!containerSource[containerId]) {
                ({0: {id: containerSource[containerId]}} = Utilities.objectsClosestToObj(sources, container));
            }

            const closest = Game.getObjectById(containerSource[containerId]);

            if (closest instanceof Mineral) {
                if (closest.mineralAmount > 0) {
                    max += 1;
                }
            } else {
                if (!lengthToStorage[container.id]) {
                    ({path: {length: lengthToStorage[container.id]}} = PathFinder.search(container.pos, {pos: room.storage.pos, range: 1}, {swampCost: 1}));
                }

                length += lengthToStorage[container.id];
            }
        });

        max += Math.ceil(length / (rcl === 8 ? 20 : 15));

        if (!canSpawn) {
            return {
                name: "storer",
                spawn: false,
                max
            };
        }

        settings = {
            name: "storer",
            spawn: _.filter(storers, (c) => c.spawning || c.ticksToLive >= 300).length < max,
            max,
            rcl
        };

        if (storers.length > 0) {
            engine.room.memory.maxCreeps.storer = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(storers, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 300, 100))))
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
        let body;

        switch (checkSettings.rcl) {
            case 7:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 8:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            default:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
        }

        return {
            body,
            memory: {
                role: "storer",
                home: checkSettings.home
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
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.storer || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = creeps && creeps.all || [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled links.
        Assign.fillWithEnergy(creepsWithNoTask, tasks.links, "Link");

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

        // Check for unfilled labs.
        Assign.fillWithEnergy(creepsWithNoTask, Cache.labsInRoom(room), "LabEnergy");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for terminals.
        Assign.fillWithEnergy(creepsWithNoTask, tasks.terminalsFillWithEnergy, "Terminal");

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

        // Attempt to get minerals from containers.
        Assign.collectMinerals(creepsWithNoTask, allCreeps, tasks.structuresWithMinerals, void 0, void 0, "Collecting");

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

        // Attempt to get energy from terminals.
        Assign.collectEnergy(creepsWithNoTask, allCreeps, tasks.terminalsCollectEnergy, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Rally to center.
        Assign.moveToTerminalOrRoom(creepsWithNoTask, room);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleStorer, "RoleStorer");
}
module.exports = RoleStorer;
