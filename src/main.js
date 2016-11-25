require("screeps-perf")({
    optimizePathFinding: false
});

var profiler = require("screeps-profiler"),
    Army = require("army"),
    Cache = require("cache"),
    Commands = require("commands"),
    Minerals = require("minerals"),
    Utilities = require("utilities"),
    RoleArmyDismantler = require("role.armyDismantler"),
    RoleArmyHealer = require("role.armyHealer"),
    RoleArmyMelee = require("role.armyMelee"),
    RoleArmyRanged = require("role.armyRanged"),
    RoleClaimer = require("role.claimer"),
    RoleCollector = require("role.collector"),
    RoleDefender = require("role.defender"),
    RoleHauler = require("role.hauler"),
    RoleHealer = require("role.healer"),
    RoleMeleeAttack = require("role.meleeAttack"),
    RoleMiner = require("role.miner"),
    RoleRangedAttack = require("role.rangedAttack"),
    RoleRemoteBuilder = require("role.remoteBuilder"),
    RoleRemoteMiner = require("role.remoteMiner"),
    RoleRemoteReserver = require("role.remoteReserver"),
    RoleRemoteStorer = require("role.remoteStorer"),
    RoleRemoteWorker = require("role.remoteWorker"),
    RoleStorer = require("role.storer"),
    RoleTower = require("role.tower"),
    RoleUpgrader = require("role.upgrader"),
    RoleWorker = require("role.worker"),
    RoomBase = require("room.base"),
    RoomCleanup = require("room.cleanup"),
    RoomMine = require("room.mine"),
    taskDeserialization = require("taskDeserialization"),
    roomDeserialization = require("roomDeserialization"),
    unobservableRooms,

    main = {
        loop: () => {
            "use strict";

            if (Game.cpu.bucket < Game.cpu.tickLimit) {
                return;
            }

            profiler.wrap(() => {
                main.init();
                main.log();
                main.rooms();
                main.army();
                main.creeps();

                Cache.log.cpuUsed = Game.cpu.getUsed();
            });

            console.log(JSON.stringify(Cache.log));
        },

        init: () => {
            "use strict";

            // Reset the cache.
            Cache.reset();

            // Export global objects to Game.cmd for use from console.
            Game.cmd = {
                Army: Army,
                Cache: Cache,
                Commands: Commands,
                Minerals: Minerals,
                Role: {
                    ArmyDismantler: RoleArmyDismantler,
                    ArmyHealer: RoleArmyHealer,
                    ArmyMelee: RoleArmyMelee,
                    ArmyRanged: RoleArmyRanged,
                    Claimer: RoleClaimer,
                    Collector: RoleCollector,
                    Defender: RoleDefender,
                    Hauler: RoleHauler,
                    Healer: RoleHealer,
                    MeleeAttack: RoleMeleeAttack,
                    Miner: RoleMiner,
                    RangedAttack: RoleRangedAttack,
                    RemoteBuilder: RoleRemoteBuilder,
                    RemoteMiner: RoleRemoteMiner,
                    RemoteReserver: RoleRemoteReserver,
                    RemoteStorer: RoleRemoteStorer,
                    RemoteWorker: RoleRemoteWorker,
                    Storer: RoleStorer,
                    Tower: RoleTower,
                    Upgrader: RoleUpgrader,
                    Worker: RoleWorker
                },
                Room: {
                    Base: RoomBase,
                    Cleanup: RoomCleanup,
                    Mine: RoomMine
                },
                Utilities: Utilities
            };
            
            // Initialize memory objects.
            if (!Memory.maxCreeps) {
                Memory.maxCreeps = {};
            }
            if (!Memory.containerSource) {
                Memory.containerSource = {};
            }
            if (!Memory.army) {
                Memory.army = {};
            }
            if (!Memory.avoidRooms) {
                Memory.avoidRooms = [];
            }
            if (!Memory.paths) {
                Memory.paths = {};
            }

            // Clear old memory.
            _.forEach(Memory.creeps, (creep, name) => {
                if (!Game.creeps[name]) {
                    delete Memory.creeps[name];
                }
            });
            _.forEach(Memory.lengthToContainer, (value, id) => {
                if (!Cache.getObjectById(id)) {
                    delete Memory.lengthToContainer[id];
                }
            });
            _.forEach(Memory.lengthToController, (value, id) => {
                if (!Cache.getObjectById(id)) {
                    delete Memory.lengthToController[id];
                }
            });
            _.forEach(Memory.lengthToLink, (value, id) => {
                if (!Cache.getObjectById(id)) {
                    delete Memory.lengthToLink[id];
                }
            });
            _.forEach(Memory.lengthToStorage, (value, id) => {
                if (!Cache.getObjectById(id)) {
                    delete Memory.lengthToStorage[id];
                }
            });
            _.forEach(Memory.containerSource, (value, id) => {
                if (!Cache.getObjectById(id)) {
                    delete Memory.containerSource[id];
                }
            });
            _.forEach(Memory.dismantle, (value, room) => {
                if (value.length === 0) {
                    delete Memory.dismantle[room];
                }
            });
            _.forEach(Memory.rooms, (value, room) => {
                if (!value || !value.roomType) {
                    delete Memory.rooms[room];
                }
            });
            _.forEach(Memory.maxCreeps, (max, type) => {
                _.forEach(Memory.maxCreeps[type], (value, room) => {
                     if (Object.keys(value).length === 0) {
                         delete max[room];
                     }
                });
            });
            _.forEach(Memory.paths, (value, id) => {
                if (value.lastUsed <= Game.time - 500) {
                    delete Memory.paths[id];
                }
            });
            delete Memory.flags;

            // Every generation, clear cache.
            if (Game.time % 1500 === 0) {
                delete Memory.lengthToStorage;
            }
            if (Game.time % 1500 === 100) {
                delete Memory.lengthToLink;
            }
            if (Game.time % 1500 === 200) {
                delete Memory.lengthToContainer;
            }
            if (Game.time % 1500 === 300) {
                delete Memory.lengthToController;
            }
            if (Game.time % 1500 === 400) {
                delete Memory.distances;
            }
            if (Game.time % 1500 === 500) {
                delete Memory.ranges;
            }
            if (Game.time % 1500 === 600) {
                delete Memory.paths;
            }
        },

        log: () => {
            "use strict";

            Cache.log.tick = Game.time;
            Cache.log.date = new Date();
            Cache.log.gcl = Game.gcl.level;
            Cache.log.progress = Game.gcl.progress;
            Cache.log.progressTotal = Game.gcl.progressTotal;
            Cache.log.limit = Game.cpu.limit;
            Cache.log.tickLimit = Game.cpu.tickLimit;
            Cache.log.bucket = Game.cpu.bucket;
            Cache.log.credits = Game.market.credits;

            _.forEach(Game.creeps, (c) => {
                Cache.log.creeps.push({
                    creepId: c.id,
                    name: c.name,
                    creepType: c.memory.role,
                    home: c.memory.home,
                    army: c.memory.army,
                    room: c.pos.roomName,
                    x: c.pos.x,
                    y: c.pos.y,
                    spawning: c.spawning,
                    ttl: c.ticksToLive,
                    carryCapacity: c.carryCapacity,
                    carryJSON: JSON.stringify(c.carry),
                    hits: c.hits,
                    hitsMax: c.hitsMax
                });
            });

            _.forEach(Game.spawns, (s) => {
                Cache.log.spawns.push({
                    spawnId: s.id,
                    name: s.name,
                    room: s.room.name,
                    spawningName: s.spawning ? s.spawning.name : undefined,
                    spawningNeedTime: s.spawning ? s.spawning.needTime : undefined,
                    spawningRemainingTime: s.spawning ? s.spawning.remainingTime : undefined,
                    spawningRole: s.spawning ? Game.creeps[s.spawning.name].memory.role : undefined,
                    spawningHome: s.spawning ? Game.creeps[s.spawning.name].memory.home : undefined,
                    spawningArmy: s.spawning ? Game.creeps[s.spawning.name].memory.army : undefined
                });
            });
        },

        rooms: () => {
            "use strict";

            var rooms;

            // Loop through each creep to deserialize their task and see if it is completed.
            _.forEach(Game.creeps, (creep) => {
                if (creep.memory.currentTask) {
                    taskDeserialization(creep);
                    if (Cache.creepTasks[creep.name]) {
                        Cache.creepTasks[creep.name].canComplete(creep);
                    }
                }
            });

            // Loop through each room in memory to deserialize their type and find rooms that aren't observable.
            unobservableRooms = [];
            _.forEach(Memory.rooms, (roomMemory, name) => {
                if (!roomMemory.roomType) {
                    return;
                }

                roomDeserialization(roomMemory, name);

                if (!Game.rooms[name]) {
                    unobservableRooms.push({
                        name: name,
                        unobservable: true
                    });
                }
            });

            // See if there is some energy balancing we can do.
            rooms = _.sortBy(_.filter(Game.rooms, (r) => Memory.rooms[r.name] && Memory.rooms[r.name].roomType && Memory.rooms[r.name].roomType.type === "base" && r.storage && r.terminal), (r) => r.storage.store[RESOURCE_ENERGY] + r.terminal.store[RESOURCE_ENERGY]);
            if (rooms.length > 1) {
                _.forEach(rooms, (room, index) => {
                    var otherRoom = rooms[rooms.length - index - 1],
                        transCost;
                    
                    if (room.storage.store[RESOURCE_ENERGY] >= otherRoom.storage.store[RESOURCE_ENERGY] || room.storage.store[RESOURCE_ENERGY] + room.terminal.store[RESOURCE_ENERGY] > 100000 || otherRoom.storage.store[RESOURCE_ENERGY] + otherRoom.terminal.store[RESOURCE_ENERGY] < 100000) {
                        return false;
                    }

                    if (otherRoom.terminal.store[RESOURCE_ENERGY] >= 1000) {
                        transCost = Game.market.calcTransactionCost(otherRoom.terminal.store[RESOURCE_ENERGY], otherRoom.name, room.name);

                        otherRoom.terminal.send(RESOURCE_ENERGY, Math.floor(otherRoom.terminal.store[RESOURCE_ENERGY] * (otherRoom.terminal.store[RESOURCE_ENERGY] / (otherRoom.terminal.store[RESOURCE_ENERGY] + transCost))), room.name);
                    }
                });
            }

            // Determine the minerals we need in each room and army.
            _.forEach(Game.rooms, (room) => {
                // Build the mineral data.
                if (room.memory.roomType && room.memory.roomType.type === "base" && room.terminal && Cache.labsInRoom(room).length > 0) {
                    Cache.minerals[room.name] = [];

                    // Check for mineral harvesters.  Each one needs XUHO2 x30 per WORK body part.
                    if (room.find(FIND_MINERALS).length > 0) {
                        Cache.minerals[room.name].push({
                            resource: RESOURCE_CATALYZED_UTRIUM_ALKALIDE,
                            amount: 30 * room.find(FIND_MINERALS).length * Math.floor(Math.floor(Math.min(room.energyCapacityAvailable, 4450) / 50) / 2.2),
                            terminal: room.terminal.store[RESOURCE_CATALYZED_UTRIUM_ALKALIDE] || 0,
                            labs: _.sum(_.map(_.filter(Cache.labsInRoom(room), (l) => l.mineralType === RESOURCE_CATALYZED_UTRIUM_ALKALIDE), (l) => l.mineralAmount))
                        });
                    }

                    // Check for upgraders.  Each one needs XGH2O x30 per WORK body part.
                    Cache.minerals[room.name].push({
                        resource: RESOURCE_CATALYZED_GHODIUM_ACID,
                        amount: 30 * Math.floor((Math.min(room.energyCapacityAvailable, 3300) + 50) / 200),
                        terminal: room.terminal.store[RESOURCE_CATALYZED_GHODIUM_ACID] || 0,
                        labs: _.sum(_.map(_.filter(Cache.labsInRoom(room), (l) => l.mineralType === RESOURCE_CATALYZED_GHODIUM_ACID), (l) => l.mineralAmount))
                    });

                    // Check for workers.  Each one needs XLH2O x30 per WORK body part.
                    Cache.minerals[room.name].push({
                        resource: RESOURCE_CATALYZED_LEMERGIUM_ACID,
                        amount: 30 * Math.floor((Math.min(room.energyCapacityAvailable, 3300) + 50) / 200),
                        terminal: room.terminal.store[RESOURCE_CATALYZED_LEMERGIUM_ACID] || 0,
                        labs: _.sum(_.map(_.filter(Cache.labsInRoom(room), (l) => l.mineralType === RESOURCE_CATALYZED_LEMERGIUM_ACID), (l) => l.mineralAmount))
                    });
                }
            });

            _.forEach(Memory.army, (data, army) => {
                if (data.boostRoom) {
                    // Check for units.  Each one needs XGHO2 per TOUGH body part, which each will have 5 of.
                    if (data.dismantler.maxCreeps > 0 || data.melee.maxCreeps > 0 || data.ranged.maxCreeps > 0 || data.healer.maxCreeps > 0) {
                        Cache.minerals[data.boostRoom].push({
                            resource: RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
                            amount: 30 * 5 * (data.dismantler.maxCreeps + data.melee.maxCreeps + data.ranged.maxCreeps + data.healer.maxCreeps),
                            terminal: Game.rooms[data.boostRoom].terminal.store[RESOURCE_CATALYZED_ZYNTHIUM_ACID] || 0,
                            labs: _.sum(_.map(_.filter(Cache.labsInRoom(Game.rooms[data.boostRoom]), (l) => l.mineralType === RESOURCE_CATALYZED_ZYNTHIUM_ACID), (l) => l.mineralAmount))
                        });
                    }

                    // Check for dismantlers.  Each one needs XZH2O x30 per WORK body part.
                    if (data.dismantler.maxCreeps > 0) {
                        Cache.minerals[data.boostRoom].push({
                            resource: RESOURCE_CATALYZED_ZYNTHIUM_ACID,
                            amount: 30 * data.dismantler.units * data.dismantler.maxCreeps,
                            terminal: Game.rooms[data.boostRoom].terminal.store[RESOURCE_CATALYZED_ZYNTHIUM_ACID] || 0,
                            labs: _.sum(_.map(_.filter(Cache.labsInRoom(Game.rooms[data.boostRoom]), (l) => l.mineralType === RESOURCE_CATALYZED_ZYNTHIUM_ACID), (l) => l.mineralAmount))
                        });
                    }

                    // Check for healers.  Each one needs XLHO2 x30 per HEAL body part.
                    if (data.healer.maxCreeps > 0) {
                        Cache.minerals[data.boostRoom].push({
                            resource: RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
                            amount: 30 * data.healer.units * data.healer.maxCreeps,
                            terminal: Game.rooms[data.boostRoom].terminal.store[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE] || 0,
                            labs: _.sum(_.map(_.filter(Cache.labsInRoom(Game.rooms[data.boostRoom]), (l) => l.mineralType === RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE), (l) => l.mineralAmount))
                        });
                    }
                }
            });

            // Create a hierarchy of each mineral's components.
            _.forEach(Cache.minerals, (value, room) => {
                _.forEach(Cache.minerals[room], (mineral) => {
                    Minerals.getHierarchy(mineral, (parent, child) => {
                        child.amount = parent.amount;
                        child.terminal = Game.rooms[room].terminal.store[child.resource] || 0;
                        child.labs = _.sum(_.map(_.filter(Cache.labsInRoom(Game.rooms[room]), (l) => l.mineralType === child.resource), (l) => l.mineralAmount));
                        return child.terminal < child.amount;
                    });
                });
            });

            // Get market values for each mineral and determine whether we should buy or combine minerals.

            // Loop through each room to determine the required tasks for the room, and then serialize the room.
            _.forEach(_.sortBy([].concat.apply([], [_.filter(Game.rooms), unobservableRooms]), (r) => Memory.rooms[r.name] && Memory.rooms[r.name].roomType ? ["base", "mine", "cleanup"].indexOf(Memory.rooms[r.name].roomType.type) : 9999), (room) => {
                var type = Memory.rooms[room.name] && Memory.rooms[room.name].roomType && Memory.rooms[room.name].roomType.type ? Memory.rooms[room.name].roomType.type : "unknown";

                // Log room data.
                if (room.unobservable) {
                    Cache.log.rooms[room.name] = {
                        type: type,
                        supportRoom: room.memory ? room.memory.supportRoom : undefined,
                        unobservable: true,
                        store: {},
                        source: [],
                        creeps: []
                    }
                } else {
                    Cache.log.rooms[room.name] = {
                        type: type,
                        supportRoom: room.memory? room.memory.supportRoom : undefined,
                        unobservable: false,
                        controller: !!room.controller,
                        store: {},
                        source: [],
                        creeps: []
                    }

                    if (Cache.log.rooms[room.name].controller) {
                        Cache.log.rooms[room.name].rcl = room.controller.level;
                        if (room.controller.owner) {
                            Cache.log.rooms[room.name].ownerUsername = room.controller.owner.username;
                        }
                        Cache.log.rooms[room.name].progress = room.controller.progress;
                        Cache.log.rooms[room.name].progressTotal = room.controller.progressTotal;
                        Cache.log.rooms[room.name].ttd = room.controller.ticksToDowngrade
                    }

                    if (room.controller && room.controller.reservation) {
                        Cache.log.rooms[room.name].reservedUsername = room.controller.reservation.username;
                        Cache.log.rooms[room.name].tte = room.controller.reservation.ticksToEnd;
                    }

                    _.forEach(_.filter(Cache.repairableStructuresInRoom(room), (s) => !(s instanceof StructureWall) && !(s instanceof StructureRampart) === -1), (s) => {
                        Cache.log.structures.push({
                            structureId: s.id,
                            room: room.name,
                            x: s.pos.x,
                            y: s.pos.y,
                            structureType: s.structureType,
                            hits: s.hits,
                            hitsMax: s.hitsMax
                        });
                    });

                    Cache.log.rooms[room.name].lowestWall = _.sortBy(_.filter(Cache.repairableStructuresInRoom(room), (s) => s instanceof StructureWall || s instanceof StructureRampart), (s) => s.hits)[0];

                    if (room.energyCapacityAvailable && room.energyCapacityAvailable > 0) {
                        Cache.log.rooms[room.name].energyAvailable = room.energyAvailable;
                        Cache.log.rooms[room.name].energyCapacityAvailable = room.energyCapacityAvailable;
                    }

                    Cache.log.rooms[room.name].constructionProgress = _.sum(_.map(room.find(FIND_MY_CONSTRUCTION_SITES), (c) => c.progress));
                    Cache.log.rooms[room.name].constructionProgressTotal = _.sum(_.map(room.find(FIND_MY_CONSTRUCTION_SITES), (c) => c.progressTotal));

                    Cache.log.rooms[room.name].towerEnergy = _.sum(_.map(Cache.towersInRoom(room), (t) => t.energy));
                    Cache.log.rooms[room.name].towerEnergyCapacity = _.sum(_.map(Cache.towersInRoom(room), (t) => t.energyCapacity));

                    Cache.log.rooms[room.name].labEnergy = _.sum(_.map(Cache.labsInRoom(room), (l) => l.energy));
                    Cache.log.rooms[room.name].labEnergyCapacity = _.sum(_.map(Cache.labsInRoom(room), (l) => l.energyCapacity));

                    if (room.storage) {
                        Cache.log.rooms[room.name].store.storage = _.map(room.storage.store, (s, k) => {return {resource: k, amount: s};});
                    }

                    if (room.terminal) {
                        Cache.log.rooms[room.name].store.terminal = _.map(room.terminal.store, (s, k) => {return {resource: k, amount: s};});
                    }

                    _.forEach(room.find(FIND_SOURCES), (s) => {
                        Cache.log.rooms[room.name].source.push({
                            sourceId: s.id,
                            resource: RESOURCE_ENERGY,
                            amount: s.energy,
                            capacity: s.energyCapacity,
                            ttr: s.ticksToRegeneration
                        });
                    });

                    _.forEach(room.find(FIND_MINERALS), (m) => {
                        Cache.log.rooms[room.name].source.push({
                            sourceId: m.id,
                            resource: m.mineralType,
                            amount: m.mineralAmount,
                            ttr: m.ticksToRegeneration
                        });
                    });

                    _.forEach(Cache.hostilesInRoom(room), (h) => {
                        Cache.log.hostiles.push({
                            creepId: h.id,
                            ownerUsername: h.owner.username,
                            room: room.name,
                            x: h.pos.x,
                            y: h.pos.y,
                            ttl: h.ticksToLive,
                            hits: h.hits,
                            hitsMax: h.hitsMax
                        });
                    });
                }

                if (Cache.roomTypes[room.name]) {
                    Cache.roomTypes[room.name].run(room);
                    if (Memory.rooms[room.name].roomType && Memory.rooms[room.name].roomType.type === Cache.roomTypes[room.name].type) {
                        Cache.roomTypes[room.name].toObj(room);
                    }
                }
            });
        },

        army: () => {
            // Loop through each army and run it.
            _.forEach(Memory.army, (value, army) => {
                // Log army data.
                Cache.log.army[army] = {
                    directive: value.directive,
                    buildRoom: value.buildRoom,
                    stageRoom: value.stageRoom,
                    attackRoom: value.attackRoom,
                    dismantle: value.dismantle.length,
                    creeps: []
                }

                if (Game.rooms[value.attackRoom]) {
                    Cache.log.army[army].structures = _.filter(Game.rooms[Memory.army[army].attackRoom].find(FIND_HOSTILE_STRUCTURES), (s) => !(s instanceof StructureController) && !(s instanceof StructureRampart)).length;
                    Cache.log.army[army].constructionSites = Game.rooms[Memory.army[army].attackRoom].find(FIND_HOSTILE_CONSTRUCTION_SITES).length;
                }

                // Run army.
                Army.run(army);
            });
        },

        creeps: () => {
            // Loop through each creep to run its current task, prioritizing most energy being carried first, and then serialize it.
            _.forEach(Game.creeps, (creep) => {
                // Don't do anything if the creep is spawning or stopped.
                if (creep.spawning || creep.memory.stop) {
                    return;
                }

                // Countdown to death!
                if (creep.ticksToLive <= 150 || (creep.ticksToLive < 500 && creep.ticksToLive % 10 === 1) || creep.ticksToLive % 100 === 1) {
                    switch (creep.ticksToLive - 1) {
                        case 3:
                            creep.say("R.I.P. and", true);
                            break;
                        case 2:
                            creep.say("Pepperonis", true);
                            break;
                        case 1:
                            creep.say(":(", true);
                            break;
                        default:
                            creep.say("TTL " + (creep.ticksToLive - 1).toString());
                            break;
                    }
                }

                // Happy new million!
                switch (Game.time % 1000000) {
                    case 999990:
                        creep.say("TEN!", true);
                        break;
                    case 999991:
                        creep.say("NINE!", true);
                        break;
                    case 999992:
                        creep.say("EIGHT!", true);
                        break;
                    case 999993:
                        creep.say("SEVEN!", true);
                        break;
                    case 999994:
                        creep.say("SIX!", true);
                        break;
                    case 999995:
                        creep.say("FIVE!", true);
                        break;
                    case 999996:
                        creep.say("FOUR!", true);
                        break;
                    case 999997:
                        creep.say("THREE!", true);
                        break;
                    case 999998:
                        creep.say("TWO!", true);
                        break;
                    case 999999:
                        creep.say("ONE!", true);
                        break;
                    case 0:
                        creep.say("HAPPY NEW", true);
                        break;
                    case 1:
                        creep.say("MILLION!", true);
                        break;
                }

                if (creep.memory.currentTask && Cache.creepTasks[creep.name]) {
                    Cache.creepTasks[creep.name].run(creep);

                    // Purge current task if the creep is in a new room.
                    if (creep.memory.lastRoom && creep.memory.lastRoom !== creep.room.name) {
                        delete creep.memory.currentTask;
                    }
                    creep.memory.lastRoom = creep.room.name;

                    // Only serialize if the task wasn't completed.
                    if (creep.memory.currentTask && Cache.creepTasks[creep.name]) {
                        Cache.creepTasks[creep.name].toObj(creep);
                    }

                    // If the creep has a work part, try to repair any road that may be under it.
                    if (creep.getActiveBodyparts(WORK) > 0 && creep.carry[RESOURCE_ENERGY] > 0) {
                        _.forEach(_.filter(creep.pos.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureRoad && s.hits < s.hitsMax), (structure) => {
                            creep.repair(structure);
                        });
                    }
                } else {
                    // RIP & Pepperonis :(
                    delete creep.memory.currentTask;
                    if (!creep.spawning && creep.ticksToLive < 150) {
                        creep.suicide();
                    }
                }
            });
        }
    };

profiler.registerObject(main, "main");

// Don't forget to reload global when reactivating the profiler.
if (Memory.profiling) {
    profiler.enable();
}

module.exports = main;
