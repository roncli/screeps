require("screeps-perf")({
    optimizePathFinding: false
});

var profiler = require("screeps-profiler"),
    Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
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
                Cache: Cache,
                Commands: Commands,
                Role: {
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
            delete Memory.flags;
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
            if (Game.cpu.bucket >= 9000) {
                rooms = _.sortBy(_.filter(Game.rooms, (r) => Memory.rooms[r.name] && Memory.rooms[r.name].roomType && Memory.rooms[r.name].roomType.type === "base" && r.storage), (r) => r.storage.store[RESOURCE_ENERGY]);
                if (rooms.length > 1) {
                    _.forEach(rooms, (room, index) => {
                        var otherRoom = rooms[rooms.length - index - 1];
                        
                        if (room.storage.store[RESOURCE_ENERGY] >= otherRoom.storage.store[RESOURCE_ENERGY] || room.storage.store[RESOURCE_ENERGY] > 500000 || otherRoom.storage.store[RESOURCE_ENERGY] < 500000) {
                            return false;
                        }

                        Cache.haulers[otherRoom.name] = room.name;
                    });
                }
            }

            // Loop through each room to determine the required tasks for the room, and then serialize the room.
            _.forEach(_.sortBy([].concat.apply([], [_.filter(Game.rooms), unobservableRooms]), (r) => Memory.rooms[r.name] && Memory.rooms[r.name].roomType ? ["base", "mine", "cleanup"].indexOf(Memory.rooms[r.name].roomType.type) : 9999), (room) => {
                var type = Memory.rooms[room.name] && Memory.rooms[room.name].roomType && Memory.rooms[room.name].roomType.type ? Memory.rooms[room.name].roomType.type : "unknown";

                // Log room data.
                if (room.unobservable) {
                    Cache.log.rooms[room.name] = {
                        type: type,
                        supportRoom: room.memory ? room.memory.supportRoom : undefined,
                        unobservable: true
                    }

                    Cache.log.rooms[room.name].store = {};
                    Cache.log.rooms[room.name].source = [];
                } else {
                    Cache.log.rooms[room.name] = {
                        type: type,
                        supportRoom: room.memory? room.memory.supportRoom : undefined,
                        unobservable: false,
                        controller: !!room.controller
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

                    _.forEach(_.sortBy(_.filter(Cache.repairableStructuresInRoom(room), (s) => [STRUCTURE_WALL, STRUCTURE_RAMPART].indexOf(s.structureType) === -1), (s) => s.hits), (s) => {
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

                    if (room.energyCapacityAvailable && room.energyCapacityAvailable > 0) {
                        Cache.log.rooms[room.name].energyAvailable = room.energyAvailable;
                        Cache.log.rooms[room.name].energyCapacityAvailable = room.energyCapacityAvailable;
                    }

                    Cache.log.rooms[room.name].constructionProgress = _.sum(_.map(Cache.constructionSitesInRoom(room), (c) => c.progress));
                    Cache.log.rooms[room.name].constructionProgressTotal = _.sum(_.map(Cache.constructionSitesInRoom(room), (c) => c.progressTotal));

                    Cache.log.rooms[room.name].towerEnergy = _.sum(_.map(Cache.towersInRoom(room), (t) => t.energy));
                    Cache.log.rooms[room.name].towerEnergyCapacity = _.sum(_.map(Cache.towersInRoom(room), (t) => t.energyCapacity));

                    Cache.log.rooms[room.name].labEnergy = _.sum(_.map(Cache.labsInRoom(room), (l) => l.energy));
                    Cache.log.rooms[room.name].labEnergyCapacity = _.sum(_.map(Cache.labsInRoom(room), (l) => l.energyCapacity));

                    Cache.log.rooms[room.name].store = {};
                    Cache.log.rooms[room.name].source = [];

                    if (room.storage) {
                        Cache.log.rooms[room.name].store.storage = _.map(room.storage.store, (s, k) => {return {resource: k, amount: s};});
                    }

                    if (room.terminal) {
                        Cache.log.rooms[room.name].store.terminal = _.map(room.terminal.store, (s, k) => {return {resource: k, amount: s};});
                    }

                    _.forEach(Cache.energySourcesInRoom(room), (s) => {
                        Cache.log.rooms[room.name].source.push({
                            sourceId: s.id,
                            resource: RESOURCE_ENERGY,
                            amount: s.energy,
                            capacity: s.energyCapacity,
                            ttr: s.ticksToRegeneration
                        });
                    });

                    _.forEach(Cache.mineralsInRoom(room), (m) => {
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

                Cache.log.rooms[room.name].creeps = [];

                if (Cache.roomTypes[room.name]) {
                    Cache.roomTypes[room.name].run(room);
                    if (Memory.rooms[room.name].roomType && Memory.rooms[room.name].roomType.type === Cache.roomTypes[room.name].type) {
                        Cache.roomTypes[room.name].toObj(room);
                    }
                }
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

if (Memory.profiling) {
    profiler.enable();
}

module.exports = main;
