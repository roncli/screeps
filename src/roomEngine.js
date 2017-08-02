const Cache = require("cache"),
    Utilities = require("utilities");

//  ####                        #####                  #
//  #   #                       #
//  #   #   ###    ###   ## #   #      # ##    ## #   ##    # ##    ###
//  ####   #   #  #   #  # # #  ####   ##  #  #  #     #    ##  #  #   #
//  # #    #   #  #   #  # # #  #      #   #   ##      #    #   #  #####
//  #  #   #   #  #   #  # # #  #      #   #  #        #    #   #  #
//  #   #   ###    ###   #   #  #####  #   #   ###    ###   #   #   ###
//                                            #   #
//                                             ###
/**
 * A class representing a room engine.
 */
class RoomEngine {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new room engine.
     */
    constructor() {}

    //       #                 #      ##
    //       #                 #     #  #
    //  ##   ###    ##    ##   # #    #    ###    ###  #  #  ###
    // #     #  #  # ##  #     ##      #   #  #  #  #  #  #  #  #
    // #     #  #  ##    #     # #   #  #  #  #  # ##  ####  #  #
    //  ##   #  #   ##    ##   #  #   ##   ###    # #  ####  #  #
    //                                     #
    /**
     * Checks whether we should spawn a creep for the role.
     * @param {object} Role The role of the creep.
     * @param {bool} [canSpawn] Whether the creep can be spawned. Defaults to true.
     * @return {void}
     */
    checkSpawn(Role, canSpawn) {
        const {room, room: {name: roomName}} = this,
            {creeps: {[roomName]: creeps}} = Cache;
        let canBoost = false,
            labsToBoostWith, spawnToUse;

        if (canSpawn === void 0) {
            canSpawn = true;
        }

        const checkSettings = Role.checkSpawnSettings(this, canSpawn),
            count = creeps && creeps[checkSettings.name] ? creeps[checkSettings.name].length : 0;

        // Output creep count in the report.
        if (checkSettings.max > 0 || count > 0) {
            if (!Memory.creepCount[roomName]) {
                Memory.creepCount[roomName] = [];
            }
            Memory.creepCount[roomName].push({role: checkSettings.name, count, max: checkSettings.max});
        }

        // Bail if we're not spawning anything.
        if (!checkSettings.spawn) {
            return;
        }

        const {memory, memory: {roomType}} = room,
            supportRoomName = checkSettings.supportRoom || (roomType && roomType.supportRoom ? roomType.supportRoom : roomName),
            {rooms: {[supportRoomName]: supportRoom}} = Game;

        // Set additional settings.
        checkSettings.home = checkSettings.roomToSpawnFor || roomName;
        checkSettings.supportRoom = supportRoomName;
        ({energyCapacityAvailable: checkSettings.energyCapacityAvailable} = supportRoom);

        // Get the spawn settings from the role.
        const spawnSettings = Role.spawnSettings(checkSettings);

        // Add labs to the spawn settings.
        if (spawnSettings.boosts && supportRoom && Cache.labsInRoom(supportRoom).length > 0) {
            labsToBoostWith = Utilities.getLabToBoostWith(supportRoom, Object.keys(spawnSettings.boosts).length);

            canBoost = !!labsToBoostWith;
        }

        // Get the spawn to use.
        if (checkSettings.spawnFromRegion) {
            ({0: spawnToUse} = _.filter(Game.spawns, (s) => !Cache.spawning[s.id] && !s.spawning && s.room.memory && s.room.memory.roomType && s.room.memory.roomType === "base" && s.room.memory.region === room.memory.region && s.room.energyAvailable >= Utilities.getBodypartCost(spawnSettings.body)).sort((a, b) => (a.room.name === roomName ? 0 : 1) - (b.room.name === roomName ? 0 : 1)));
        } else {
            ({0: spawnToUse} = _.filter(Game.spawns, (s) => !Cache.spawning[s.id] && !s.spawning && s.room.memory && s.room.memory.roomType && s.room.memory.roomType === "base" && s.room.name === supportRoomName && s.room.energyAvailable >= Utilities.getBodypartCost(spawnSettings.body)));
        }

        // Bail if a spawn is not available.
        if (!spawnToUse) {
            return;
        }

        spawnSettings.memory.labs = canBoost ? _.map(labsToBoostWith, (l) => l.id) : [];

        // Spawn the creep.
        const name = spawnToUse.createCreep(spawnSettings.body, `${checkSettings.name}-${checkSettings.roomToSpawnFor || roomName}-${Game.time.toFixed(0).substring(4)}`, spawnSettings.memory),
            spawning = typeof name !== "number";

        if (spawning) {
            delete memory.maxCreeps[checkSettings.name];
        }

        Cache.spawning[spawnToUse.id] = spawning;

        if (canBoost && typeof spawning) {
            // Set the labs to be in use.
            const {memory: {labsInUse}} = supportRoom;
            let labIndex = 0;

            _.forEach(spawnSettings.boosts, (amount, resource) => {
                labsToBoostWith[labIndex].creepToBoost = name;
                labsToBoostWith[labIndex].resource = resource;
                labsToBoostWith[labIndex].amount = 30 * amount;
                labsInUse.push(labsToBoostWith[labIndex]);

                labIndex++;
            });

            // If anything is coming to fill the labs, stop them.
            if (Cache.creeps[supportRoomName]) {
                _.forEach(_.filter(Cache.creeps[supportRoomName].all, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && _.map(labsToBoostWith, (l) => l.id).indexOf(c.memory.currentTask.id) !== -1), (creep) => {
                    delete creep.memory.currentTask;
                });
            }
        }
    }

    //       #                 #      ##                            ##          #     #     #                        ##               #
    //       #                 #     #  #                          #  #         #     #                             #  #              #
    //  ##   ###    ##    ##   # #    #    ###    ###  #  #  ###    #     ##   ###   ###   ##    ###    ###   ###   #      ###   ##   ###    ##
    // #     #  #  # ##  #     ##      #   #  #  #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     #     #  #  #     #  #  # ##
    // #     #  #  ##    #     # #   #  #  #  #  # ##  ####  #  #  #  #  ##     #     #     #    #  #   ##     ##   #  #  # ##  #     #  #  ##
    //  ##   #  #   ##    ##   #  #   ##   ###    # #  ####  #  #   ##    ##     ##    ##  ###   #  #  #     ###     ##    # #   ##   #  #   ##
    //                                     #                                                            ###
    /**
     * Checks the spawn settings cache to see if we can use the cache instead of calculating it manually.
     * @param {string} role The role to check.
     * @return {object} The spawn settings to use.
     */
    checkSpawnSettingsCache(role) {
        const {room: {memory: {maxCreeps, maxCreeps: {[role]: cache}}}} = this;

        if (cache && cache.cacheUntil === null && cache.cache.spawn === false) {
            delete maxCreeps[role];
        }

        if (cache && (!cache.cacheUntil || cache.cacheUntil >= Game.time)) {
            return cache.cache;
        }

        delete maxCreeps[role];

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoomEngine, "RoomEngine");
}
module.exports = RoomEngine;
