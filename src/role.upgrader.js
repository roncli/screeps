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
        var room = engine.room,
            roomName = room.name,
            storage = room.storage,
            storageEnergy = storage ? storage.store[RESOURCE_ENERGY] : 0,
            max, controller, creeps, spawnForRoom;

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
                max: max
            };
        }

        controller = room.controller;
        creeps = Cache.creeps[roomName];

        if (max > 0 && (controller && controller.level < 8 && storage && storageEnergy > 900000 || _.filter(creeps && creeps.upgrader || [], (c) => c.spawning || c.ticksToLive >= 150).length < max)) {
            spawnForRoom = roomName;
        }

        // Support smaller rooms in the region.
        if (!spawnForRoom) {
            _.forEach(_.filter(Game.rooms, (r) => {
                var memory = r.memory,
                    roomType = memory.roomType,
                    controller = r.controller;

                return memory && roomType && roomType.type === "base" && memory.region === room.memory.region && r.name !== room.name && controller && controller.level < 7;
            }), (otherRoom) => {
                var otherRoomName = otherRoom.name,
                    otherCreeps = Cache.creeps[otherRoomName];
                
                if (_.filter(otherCreeps && otherCreeps.upgrader || [], (c) => {
                    var memory = c.memory;

                    return memory.supportRoom !== memory.home;
                }).length === 0) {
                    spawnForRoom = otherRoomName;
                    return false;
                }
            });
        }

        return {
            name: "upgrader",
            spawn: !!spawnForRoom,
            max: max,
            spawnFromRegion: controller.level < 6,
            spawnForRoom: spawnForRoom
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
        var room = Game.rooms[checkSettings.home],
            links = Cache.linksInRoom(room),
            controller = room.controller,
            energy = room.energyCapacityAvailable,
            units = Math.floor(energy / 200),
            remainder = energy % 200,
            storage = room.storage,
            store = storage.store,
            spawns = Cache.spawnsInRoom(room),
            body = [],
            boosts = {};

        // Check if we have a link in range of the controller and build the creep accordingly.
        if (links >= 2 && Utilities.objectsClosestToObj(links, controller)[0].pos.getRangeTo(controller) <= 2) {
            let carryUnits;

            energy = Math.min(energy, controller.level === 8 ? 1950 : 4100);
            carryUnits = Math.ceil(energy / 3200);
            units = Math.floor((energy - carryUnits * 50) / 250);
            remainder = (energy - carryUnits * 50) % 250;

            body.push(...Array(units * 2 + (remainder >= 150 ? 1 : 0)).fill(WORK));
            body.push(...Array(carryUnits).fill(CARRY));
            body.push(...Array(units + (remainder >= 50 ? 1 : 0)).fill(MOVE));
        } else {
            energy = Math.min(energy, controller.level === 8 ? 3000 : 3300);
            units = Math.floor(energy / 200);
            remainder = energy % 200;

            body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
            body.push(...Array(units + (remainder >= 100 && remainder < 150 ? 1 : 0)).fill(CARRY));
            body.push(...Array(units + (remainder >= 50 ? 1 : 0)).fill(MOVE));
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
            body: body,
            boosts: boosts,
            memory: {
                role: "upgrader",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                homeSource: spawns ? Utilities.objectsClosestToObj(room.find(FIND_SOURCES), spawns[0])[0].id : room.find(FIND_SOURCES)[0]
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
     */
    static assignTasks(engine) {
        var room = engine.room,
            roomName = room.name,
            creeps = Cache.creeps[roomName],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.upgrader || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150);

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
        Assign.upgradeController(creepsWithNoTask, controller, "Upgrade");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        Assign.collectEnergy(creeps, [], Utilities.objectsClosestToObj(Cache.linksInRoom(room), room.controller), "Collecting");

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
