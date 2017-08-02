const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##           #   #                #
//  #   #           #           #   #                #
//  #   #   ###     #     ###   #   #   ###   # ##   #   #   ###   # ##
//  ####   #   #    #    #   #  # # #  #   #  ##  #  #  #   #   #  ##  #
//  # #    #   #    #    #####  # # #  #   #  #      ###    #####  #
//  #  #   #   #    #    #      ## ##  #   #  #      #  #   #      #
//  #   #   ###    ###    ###   #   #   ###   #      #   #   ###   #
/**
 * Represents the worker role.
 */
class RoleWorker {
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
        let settings = engine.checkSpawnSettingsCache("worker"),
            roomToSpawnFor;

        if (settings) {
            return settings;
        }

        const {room} = engine,
            {storage} = room,
            max = storage && storage.my ? 1 : 2;

        if (!canSpawn) {
            return {
                name: "worker",
                spawn: false,
                max
            };
        }

        const {name: roomName} = room,
            {creeps: {[roomName]: creeps}} = Cache,
            workers = creeps && creeps.worker || [];

        if (max > 0 && _.filter(workers, (c) => c.spawning || c.ticksToLive >= (storage && storage.my ? 150 : 300)).length < max) {
            ({name: roomToSpawnFor} = room);
        }

        // Support smaller rooms in the region.
        if (!roomToSpawnFor) {
            _.forEach(_.filter(Game.rooms, (gameRoom) => {
                const {memory, controller} = gameRoom,
                    {roomType} = memory;

                return memory && roomType && roomType.type === "base" && memory.region === room.memory.region && gameRoom.name !== roomName && controller && controller.level < 6;
            }), (otherRoom) => {
                const {name: otherRoomName} = otherRoom,
                    {creeps: {[otherRoomName]: otherCreeps}} = Cache;

                if (_.filter(otherCreeps && otherCreeps.worker || [], (c) => {
                    const {memory} = c;

                    return memory.supportRoom !== memory.home;
                }).length === 0) {
                    roomToSpawnFor = otherRoomName;

                    return false;
                }

                return true;
            });
        }

        settings = {
            name: "worker",
            spawn: !!roomToSpawnFor,
            max,
            spawnFromRegion: room.controller.level < 6,
            roomToSpawnFor
        };

        if (workers.length > 0) {
            engine.room.memory.maxCreeps.worker = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(workers, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 150, 100))))
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
        const {rooms: {[checkSettings.home]: room}} = Game,
            energy = Math.min(room.energyCapacityAvailable, 3300),
            units = Math.floor(energy / 200),
            remainder = energy % 200,
            {storage} = room,
            spawns = Cache.spawnsInRoom(room),
            workUnits = units + (remainder >= 150 ? 1 : 0),
            carryUnits = units + (remainder >= 100 && remainder < 150 ? 1 : 0),
            moveUnits = units + (remainder >= 50 ? 1 : 0),
            body = [],
            boosts = {};
        let store;

        if (storage) {
            ({store} = storage);
        }

        for (let count = 0; count < workUnits; count++) {
            body.push(WORK);
        }
        for (let count = 0; count < carryUnits; count++) {
            body.push(CARRY);
        }
        for (let count = 0; count < moveUnits; count++) {
            body.push(MOVE);
        }

        if ((!Memory.survey || !Memory.survey.data.rooms.find((r) => r.name === checkSettings.home) || Memory.survey.data.rooms.find((r) => r.name === checkSettings.home) < 200000000) && storage && Cache.labsInRoom(room).length > 0) {
            if (store[RESOURCE_CATALYZED_LEMERGIUM_ACID] >= 30 * units) {
                boosts[RESOURCE_CATALYZED_LEMERGIUM_ACID] = units;
            } else if (store[RESOURCE_LEMERGIUM_ACID] >= 30 * units) {
                boosts[RESOURCE_LEMERGIUM_ACID] = units;
            } else if (store[RESOURCE_CATALYZED_LEMERGIUM_ACID] >= 30 * units) {
                boosts[RESOURCE_LEMERGIUM_HYDRIDE] = units;
            }
        }

        return {
            body,
            boosts,
            memory: {
                role: "worker",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                homeSource: spawns.length ? Utilities.objectsClosestToObj(room.find(FIND_SOURCES), spawns[0])[0].id : room.find(FIND_SOURCES)[0]
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
            workers = creeps && creeps.worker || [],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(workers), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = creeps && creeps.all || [],
            storers = creeps && creeps.storer || [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If not yet boosted, go get boosts.
        Assign.getBoost(creepsWithNoTask, "Boosting");

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

        // Check for critical controllers to upgrade.
        Assign.upgradeCriticalController(creepsWithNoTask, controller, "Upgrade");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled extensions if we don't have storage or storer creeps.
        if (!room.storage || storers.length === 0) {
            Assign.fillExtensions(creepsWithNoTask, allCreeps, room.controller.level, tasks.extensions, "Extension");
        }

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled spawns if we don't have storage or storer creeps.
        if (!room.storage || storers.length === 0) {
            Assign.fillSpawns(creepsWithNoTask, allCreeps, tasks.spawns, "Spawn");
        }

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

        // Check for quick construction sites.
        Assign.build(creepsWithNoTask, allCreeps, tasks.quickConstructionSites, "Build");

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
        if (controller && controller.level < 8) {
            Assign.upgradeController(creepsWithNoTask, controller, "Upgrade");
        }

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for dropped resources in current room under RCL 6 if there are no hostiles.
        if (!controller || controller.level < 6) {
            Assign.pickupResources(creepsWithNoTask, allCreeps, Cache.resourcesInRoom(room), tasks.hostiles, "Pickup");
        }

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
    require("screeps-profiler").registerObject(RoleWorker, "RoleWorker");
}
module.exports = RoleWorker;
