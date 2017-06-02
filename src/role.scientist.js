const Assign = require("assign"),
    Cache = require("cache"),
    Utilities = require("utilities");

//  ####           ##            ###            #                   #       #            #
//  #   #           #           #   #                               #                    #
//  #   #   ###     #     ###   #       ###    ##     ###   # ##   ####    ##     ###   ####
//  ####   #   #    #    #   #   ###   #   #    #    #   #  ##  #   #       #    #       #
//  # #    #   #    #    #####      #  #        #    #####  #   #   #       #     ###    #
//  #  #   #   #    #    #      #   #  #   #    #    #      #   #   #  #    #        #   #  #
//  #   #   ###    ###    ###    ###    ###    ###    ###   #   #    ##    ###   ####     ##
/**
 * Represents the scientist role.
 */
class RoleScientist {
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
            max = 1;

        if (!canSpawn) {
            return {
                name: "scientist",
                spawn: false,
                max
            };
        }

        const {creeps: {[room.name]: creeps}} = Cache;

        return {
            name: "scientist",
            spawn: _.filter(creeps && creeps.scientist || [], (c) => c.spawning || c.ticksToLive >= 150).length < max,
            max
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
        const energy = Math.min(checkSettings.energyCapacityAvailable, 2500),
            units = Math.floor(energy / 150),
            remainder = energy % 150,
            body = [];

        body.push(...Array(units * 2 + (remainder >= 100 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + (remainder >= 50 ? 1 : 0)).fill(MOVE));

        return {
            body,
            memory: {
                role: "scientist",
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
            {creeps: {[room.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.scientist || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = creeps && creeps.all || [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled towers.
        Assign.fillTowersWithEnergy(creepsWithNoTask, allCreeps, tasks.towers, "Tower");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to get minerals from labs.
        Assign.collectMinerals(creepsWithNoTask, allCreeps, tasks.labsCollectMinerals, void 0, void 0, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled labs for minerals.
        Assign.fillWithMinerals(creepsWithNoTask, tasks.labsFillMinerals, tasks.labsFillMineralsResourcesNeeded, "Lab");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled nukers for minerals.
        Assign.fillWithMinerals(creepsWithNoTask, tasks.nuker, tasks.nukerResourcesNeeded, "NukeG");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled power spawns for minerals.
        Assign.fillWithMinerals(creepsWithNoTask, tasks.powerSpawn, tasks.powerSpawnResourcesNeeded, "PowerPower");

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

        // Check for unfilled nukers.
        Assign.fillWithEnergy(creepsWithNoTask, Cache.nukersInRoom(room), "NukeEnergy");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled power spawns.
        Assign.fillWithEnergy(creepsWithNoTask, Cache.powerSpawnsInRoom(room), "PwrEnergy");

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

        // Check for unfilled storage.
        Assign.fillStorageWithEnergy(creepsWithNoTask, allCreeps, room, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to get minerals from terminals.
        Assign.collectMinerals(creepsWithNoTask, allCreeps, tasks.terminalCollectMinerals, tasks.terminalCollectMineralsResource, tasks.terminalCollectMineralsAmount, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to get minerals from storage.
        Assign.collectMinerals(creepsWithNoTask, allCreeps, tasks.storageCollectMinerals, tasks.storageCollectMineralsResource, tasks.storageCollectMineralsAmount, "Collecting");

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

        // Attempt to get energy from terminals.
        Assign.fillWithEnergy(creepsWithNoTask, tasks.terminalsCollectEnergy, "Terminal");

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

        // Rally remaining creeps.
        if (room.terminal) {
            Assign.moveToPos(creepsWithNoTask, room.terminal.pos, 1);
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleScientist, "RoleScientist");
}
module.exports = RoleScientist;
