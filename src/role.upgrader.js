const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##           #   #                                  #
//  #   #           #           #   #                                  #
//  #   #   ###     #     ###   #   #  # ##    ## #  # ##    ###    ## #   ###   # ##
//  ####   #   #    #    #   #  #   #  ##  #  #  #   ##  #      #  #  ##  #   #  ##  #
//  # #    #   #    #    #####  #   #  ##  #   ##    #       ####  #   #  #####  #
//  #  #   #   #    #    #      #   #  # ##   #      #      #   #  #  ##  #      #
//  #   #   ###    ###    ###    ###   #       ###   #       ####   ## #   ###   #
//                                     #      #   #
//                                     #       ###
/**
 * Represents the upgrader role.
 */
class RoleUpgrader {
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
        let settings = engine.checkSpawnSettingsCache("upgrader"),
            max, roomToSpawnFor;

        if (settings) {
            return settings;
        }

        const {room} = engine,
            {name: roomName, storage} = room,
            storageEnergy = storage ? storage.store[RESOURCE_ENERGY] : 0;

        if (roomName === Memory.rushRoom) {
            max = 1;
        } else if (!storage || storageEnergy < Memory.upgradeEnergy) {
            max = 0;
        } else {
            max = 1;
        }

        if (!canSpawn) {
            return {
                name: "upgrader",
                spawn: false,
                max
            };
        }

        const {controller} = room,
            {creeps: {[roomName]: creeps}} = Cache,
            upgraders = creeps && creeps.upgrader || [];

        if (max > 0 && (controller && controller.level < 8 && storage && storageEnergy > 900000 || _.filter(upgraders, (c) => c.spawning || c.ticksToLive >= 150).length < max)) {
            roomToSpawnFor = roomName;
        }

        // Support smaller rooms in the region.
        if (!roomToSpawnFor) {
            _.forEach(_.filter(Game.rooms, (gameRoom) => {
                const {memory, controller: gameRoomController} = gameRoom,
                    {roomType} = memory;

                return memory && roomType && roomType.type === "base" && memory.region === room.memory.region && gameRoom.name !== room.name && gameRoomController && gameRoomController.level < 7;
            }), (otherRoom) => {
                const {name: otherRoomName} = otherRoom,
                    {creeps: {[otherRoomName]: otherCreeps}} = Cache;

                if (_.filter(otherCreeps && otherCreeps.upgrader || [], (c) => {
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
            name: "upgrader",
            spawn: !!roomToSpawnFor,
            max,
            spawnFromRegion: controller.level < 6,
            roomToSpawnFor
        };

        if (upgraders.length > 0) {
            engine.room.memory.maxCreeps.upgrader = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(upgraders, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 150, 100))))
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
        const {rooms: {[checkSettings.supportRoom]: room}} = Game,
            links = Cache.linksInRoom(room),
            {controller, storage} = room,
            spawns = Cache.spawnsInRoom(room),
            body = [],
            boosts = {};
        let {energyCapacityAvailable: energy} = room,
            units = Math.floor(energy / 200),
            remainder = energy % 200,
            store;

        if (storage) {
            ({store} = storage);
        }

        // Check if we have a link in range of the controller and build the creep accordingly.
        if (links >= 2 && Utilities.objectsClosestToObj(links, controller)[0].pos.getRangeTo(controller) <= 2) {
            const carryUnits = Math.ceil(energy / 3200);

            energy = Math.min(energy, controller.level === 8 ? 1950 : 4100);
            units = Math.floor((energy - carryUnits * 50) / 250);
            remainder = (energy - carryUnits * 50) % 250;

            const workUnits = units * 2 + (remainder >= 150 ? 1 : 0),
                moveUnits = units + (remainder >= 50 ? 1 : 0);

            for (let count = 0; count < workUnits; count++) {
                body.push(WORK);
            }
            for (let count = 0; count < carryUnits; count++) {
                body.push(CARRY);
            }
            for (let count = 0; count < moveUnits; count++) {
                body.push(MOVE);
            }
        } else {
            energy = Math.min(energy, controller.level === 8 ? 3000 : 3300);
            units = Math.floor(energy / 200);
            remainder = energy % 200;

            const workUnits = units + (remainder >= 150 ? 1 : 0),
                carryUnits = units + (remainder >= 100 && remainder < 150 ? 1 : 0),
                moveUnits = units + (remainder >= 50 ? 1 : 0);

            for (let count = 0; count < workUnits; count++) {
                body.push(WORK);
            }
            for (let count = 0; count < carryUnits; count++) {
                body.push(CARRY);
            }
            for (let count = 0; count < moveUnits; count++) {
                body.push(MOVE);
            }
        }

        if (storage && Cache.labsInRoom(room).length > 0) {
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
                role: "upgrader",
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
            {name: roomName} = room,
            {creeps: {[roomName]: creeps}} = Cache,
            upgraders = creeps && creeps.upgrader || [],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(upgraders), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = creeps && creeps.all || [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // If not yet boosted, go get boosts.
        Assign.getBoost(creepsWithNoTask, "Boosting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for controllers to upgrade.
        Assign.upgradeController(creepsWithNoTask, room.controller, "Upgrade");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Grab energy from link.
        Assign.collectEnergy(upgraders, [], Utilities.objectsClosestToObj(Cache.linksInRoom(room), room.controller), "Collecting");

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
        Assign.moveToPos(creepsWithNoTask, room.controller.pos, 1);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleUpgrader, "RoleUpgrader");
}
module.exports = RoleUpgrader;
