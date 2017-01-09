require("screeps-perf")({
    optimizePathFinding: false
});

var profiler = require("screeps-profiler"),
    Army = require("army"),
    Cache = require("cache"),
    Commands = require("commands"),
    Market = require("market"),
    Minerals = require("minerals"),
    Utilities = require("utilities"),
    RoleArmyDismantler = require("role.armyDismantler"),
    RoleArmyHealer = require("role.armyHealer"),
    RoleArmyMelee = require("role.armyMelee"),
    RoleArmyRanged = require("role.armyRanged"),
    RoleClaimer = require("role.claimer"),
    RoleCollector = require("role.collector"),
    RoleDefender = require("role.defender"),
    RoleDismantler = require("role.dismantler"),
    RoleHealer = require("role.healer"),
    RoleMeleeAttack = require("role.meleeAttack"),
    RoleMiner = require("role.miner"),
    RoleRangedAttack = require("role.rangedAttack"),
    RoleRemoteBuilder = require("role.remoteBuilder"),
    RoleRemoteCollector = require("role.remoteCollector"),
    RoleRemoteDismantler = require("role.remoteDismantler"),
    RoleRemoteMiner = require("role.remoteMiner"),
    RoleRemoteReserver = require("role.remoteReserver"),
    RoleRemoteStorer = require("role.remoteStorer"),
    RoleRemoteWorker = require("role.remoteWorker"),
    RoleScientist = require("role.scientist"),
    RoleStorer = require("role.storer"),
    RoleTower = require("role.tower"),
    RoleUpgrader = require("role.upgrader"),
    RoleWorker = require("role.worker"),
    RoomBase = require("room.base"),
    RoomCleanup = require("room.cleanup"),
    RoomMine = require("room.mine"),
    taskDeserialization = require("taskDeserialization"),
    roomDeserialization = require("roomDeserialization"),
    reset,
    unobservableRooms,

    main = {
        loop: () => {
            "use strict";

            if (Game.cpu.bucket < Game.cpu.tickLimit) {
                return;
            }

            profiler.wrap(() => {
                main.init();
                main.minerals();
                main.baseMatrixes();
                main.deserializeCreeps();
                main.deserializeRooms();
                main.balanceEnergy();
                if (Memory.log) {
                    main.log();
                }
                main.rooms();
                main.army();
                main.creeps();
                main.finalize();
            });
        },

        init: () => {
            "use strict";

            var generationTick = Game.time % 1500;
            
            // Reset the cache.
            Cache.reset();

            if (!reset)
            {
                reset = true;
                Cache.log.events.push("System reset.");
            }
            
            // Export global objects to Game.cmd for use from console.
            Game.cmd = {
                Army: Army,
                Cache: Cache,
                Commands: Commands,
                Market: Market,
                Minerals: Minerals,
                Role: {
                    ArmyDismantler: RoleArmyDismantler,
                    ArmyHealer: RoleArmyHealer,
                    ArmyMelee: RoleArmyMelee,
                    ArmyRanged: RoleArmyRanged,
                    Claimer: RoleClaimer,
                    Collector: RoleCollector,
                    Defender: RoleDefender,
                    Dismantler: RoleDismantler,
                    Healer: RoleHealer,
                    MeleeAttack: RoleMeleeAttack,
                    Miner: RoleMiner,
                    RangedAttack: RoleRangedAttack,
                    RemoteBuilder: RoleRemoteBuilder,
                    RemoteCollector: RoleRemoteCollector,
                    RemoteDismantler: RoleRemoteDismantler,
                    RemoteMiner: RoleRemoteMiner,
                    RemoteReserver: RoleRemoteReserver,
                    RemoteStorer: RoleRemoteStorer,
                    RemoteWorker: RoleRemoteWorker,
                    Scientist: RoleScientist,
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
                if (!Game.getObjectById(id)) {
                    delete Memory.lengthToContainer[id];
                }
            });
            _.forEach(Memory.lengthToController, (value, id) => {
                if (!Game.getObjectById(id)) {
                    delete Memory.lengthToController[id];
                }
            });
            _.forEach(Memory.lengthToStorage, (value, id) => {
                if (!Game.getObjectById(id)) {
                    delete Memory.lengthToStorage[id];
                }
            });
            _.forEach(Memory.containerSource, (value, id) => {
                if (!Game.getObjectById(id)) {
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
            switch (generationTick) {
                case 0:
                    delete Memory.lengthToStorage;
                    break;
                case 100:
                    delete Memory.lengthToContainer;
                    break;
                case 200:
                    delete Memory.lengthToController;
                    break;
                case 300:
                    delete Memory.distances;
                    break;
                case 400:
                    delete Memory.ranges;
                    break;
                case 500:
                    Memory.paths = {};
                    break;
            }
        },

        minerals: () => {
            var mineralOrders = {},
                minerals, sellOrder;

            if (Game.cpu.bucket >= Memory.marketBucket) {
                // Determine the minerals we need.
                minerals = [
                    {resource: RESOURCE_HYDROGEN, amount: 3000},
                    {resource: RESOURCE_OXYGEN, amount: 3000},
                    {resource: RESOURCE_ZYNTHIUM, amount: 3000},
                    {resource: RESOURCE_KEANIUM, amount: 3000},
                    {resource: RESOURCE_UTRIUM, amount: 3000},
                    {resource: RESOURCE_LEMERGIUM, amount: 3000},
                    {resource: RESOURCE_CATALYST, amount: 3000},
                    {resource: RESOURCE_HYDROXIDE, amount: 3000},
                    {resource: RESOURCE_ZYNTHIUM_KEANITE, amount: 3000},
                    {resource: RESOURCE_UTRIUM_LEMERGITE, amount: 3000},
                    {resource: RESOURCE_GHODIUM, amount: 3000},
                    {resource: RESOURCE_UTRIUM_HYDRIDE, amount: 3000},
                    {resource: RESOURCE_UTRIUM_OXIDE, amount: 3000},
                    {resource: RESOURCE_KEANIUM_OXIDE, amount: 3000},
                    {resource: RESOURCE_LEMERGIUM_HYDRIDE, amount: 3000},
                    {resource: RESOURCE_LEMERGIUM_OXIDE, amount: 3000},
                    {resource: RESOURCE_ZYNTHIUM_HYDRIDE, amount: 3000},
                    {resource: RESOURCE_GHODIUM_HYDRIDE, amount: 3000},
                    {resource: RESOURCE_GHODIUM_OXIDE, amount: 3000},
                    {resource: RESOURCE_UTRIUM_ACID, amount: 3000},
                    {resource: RESOURCE_UTRIUM_ALKALIDE, amount: 3000},
                    {resource: RESOURCE_KEANIUM_ALKALIDE, amount: 3000},
                    {resource: RESOURCE_LEMERGIUM_ACID, amount: 3000},
                    {resource: RESOURCE_LEMERGIUM_ALKALIDE, amount: 3000},
                    {resource: RESOURCE_ZYNTHIUM_ACID, amount: 3000},
                    {resource: RESOURCE_GHODIUM_ACID, amount: 3000},
                    {resource: RESOURCE_GHODIUM_ALKALIDE, amount: 3000},
                    {resource: RESOURCE_CATALYZED_UTRIUM_ACID, amount: 15000},
                    {resource: RESOURCE_CATALYZED_UTRIUM_ALKALIDE, amount: 15000},
                    {resource: RESOURCE_CATALYZED_KEANIUM_ALKALIDE, amount: 15000},
                    {resource: RESOURCE_CATALYZED_LEMERGIUM_ACID, amount: 15000},
                    {resource: RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE, amount: 15000},
                    {resource: RESOURCE_CATALYZED_ZYNTHIUM_ACID, amount: 15000},
                    {resource: RESOURCE_CATALYZED_GHODIUM_ACID, amount: 15000},
                    {resource: RESOURCE_CATALYZED_GHODIUM_ALKALIDE, amount: 15000}
                ];

                _.forEach(minerals, (mineral) => {
                    var fx = (node, innerFx) => {
                        node.children = _.map(Minerals[node.resource], (m) => {return {resource: m};});

                        _.forEach(node.children, (child) => {
                            child.amount = node.amount;

                            innerFx(child, innerFx);
                        });
                    }

                    fx(mineral, fx);
                });

                // Determine how many of each mineral needs to be saved in each room.
                Memory.reserveMinerals = {};
                _.forEach(minerals, (mineral) => {
                    var fx = (node, innerFx) => {
                        if (!Memory.reserveMinerals[node.resource]) {
                            Memory.reserveMinerals[node.resource] = 0;
                        }
                        Memory.reserveMinerals[node.resource] = Math.min(Memory.reserveMinerals[node.resource] + node.amount, 20000);

                        _.forEach(node.children, (child) => {
                            innerFx(child, innerFx);
                        });
                    }

                    fx(mineral, fx);
                });

                // Get market values for each mineral.
                _.forEach(_.uniq(_.map(Market.getAllOrders(), (o) => o.resourceType)), (resource) => {
                    sellOrder = _.filter(Market.getAllOrders(), (o) => o.resourceType === resource && o.type === "sell" && o.amount > 0).sort((a, b) => a.price - b.price)[0];

                    if (sellOrder) {
                        mineralOrders[resource] = sellOrder;
                    }
                });

                // Assign the market values and determine whether we should buy or create the minerals.
                _.forEach(Game.rooms, (room, roomName) => {
                    var lowest = Infinity,
                        roomMemory = room.memory,
                        labQueue;

                    if (room.unobservable || !room.storage || !room.terminal || !room.terminal.my || !room.memory.roomType || room.memory.roomType.type !== "base" || Cache.labsInRoom(room) < 3) {
                        return;
                    }

                    Cache.minerals[roomName] = _.cloneDeep(minerals);
                    delete roomMemory.use;
                    
                    // Build the mineral data.
                    _.forEach(Cache.minerals[roomName], (mineral) => {
                        var fx = (node, innerFx) => {
                            var buyPrice,
                                resource = node.resource,
                                roomResources = (room.storage.store[resource] || 0) + (room.terminal.store[resource] || 0) + _.sum(Cache.creepsInRoom("all", room), (c) => c.carry[resource] || 0);

                            node.buyPrice = mineralOrders[resource] ? mineralOrders[resource].price : Infinity;
                            node.amount = Math.max(node.amount - roomResources, 0);

                            _.forEach(node.children, (child) => {
                                innerFx(child, innerFx);
                            });
                            
                            if (!node.children || node.children.length === 0) {
                                node.action = "buy";
                            } else {
                                buyPrice = _.sum(_.map(node.children, (c) => c.buyPrice));
                                if (node.buyPrice > buyPrice) {
                                    // Ensure we have the necessary minerals.
                                    let roomResources1 = (room.storage.store[node.children[0].resource] || 0) + (room.terminal.store[node.children[0].resource] || 0) + _.sum(Cache.creepsInRoom("all", room), (c) => c.carry[node.children[0].resource] || 0),
                                        roomResources2 = (room.storage.store[node.children[0].resource] || 0) + (room.terminal.store[node.children[0].resource] || 0) + _.sum(Cache.creepsInRoom("all", room), (c) => c.carry[node.children[0].resource] || 0);

                                    node.amount = Math.min(Math.min(node.amount, roomResources1), roomResources2);

                                    node.action = "create";
                                    node.buyPrice = buyPrice;
                                    if (roomResources <= lowest && node.amount > 0) {
                                        labQueue = node;
                                        lowest = roomResources;
                                    }
                                } else {
                                    node.action = "buy";
                                }
                            }
                            
                            // Set the buy queue if necessary.
                            if (node.amount > 0 && node.action === "buy" && !roomMemory.buyQueue) {
                                roomMemory.buyQueue = {
                                    resource: resource,
                                    amount: node.amount,
                                    price: node.buyPrice,
                                    start: Game.time
                                };

                                Memory.minimumSell[resource] = Math.min(Memory.minimumSell[resource] || Infinity, node.buyPrice);
                                if (Memory.minimumSell[resource] === 0 || Memory.minimumSell[resource] === Infinity) {
                                    delete Memory.minimumSell[resource];
                                }
                            }
                        };

                        fx(mineral, fx);
                    });
                    
                    // Set the lab queue if necessary.
                    if (labQueue && !roomMemory.labQueue) {
                        var fx = (node, innerFx) => {
                            var resource = node.resource;

                            // If we have the requested mineral, we're done.
                            if (node.amount <= 0) {
                                return;
                            }

                            if (node.action === "create") {
                                // Ensure we have the necessary minerals.
                                let roomResources1 = (room.storage.store[node.children[0].resource] || 0) + (room.terminal.store[node.children[0].resource] || 0) + _.sum(Cache.creepsInRoom("all", room), (c) => c.carry[node.children[0].resource] || 0),
                                    roomResources2 = (room.storage.store[node.children[0].resource] || 0) + (room.terminal.store[node.children[0].resource] || 0) + _.sum(Cache.creepsInRoom("all", room), (c) => c.carry[node.children[0].resource] || 0);

                                // We need to create the mineral, but we also need to traverse the hierarchy to make sure the children are available.
                                roomMemory.labQueue = {
                                    resource: resource,
                                    amount: Math.min(5 * Math.ceil(Math.min(Math.min(Math.min(node.amount, roomResources1), roomResources2), LAB_MINERAL_CAPACITY) / 5), 3000),
                                    children: _.map(node.children, (c) => c.resource),
                                    start: Game.time
                                };

                                _.forEach(node.children, (child) => {
                                    innerFx(child, innerFx);
                                });

                                if (node.action === "create" && node.children.length > 0) {
                                    Memory.minimumSell[resource] = Math.min(Memory.minimumSell[resource] || Infinity, _.sum(node.children, (c) => c.price));
                                    if (Memory.minimumSell[resource] === 0) {
                                        delete Memory.minimumSell[resource];
                                    }
                                }
                            }
                        };

                        fx(labQueue, fx);
                    }
                });

            }
        },
        
        baseMatrixes: () => {
            "use strict";
            
            if (!Memory.baseMatrixes) {
                Memory.baseMatrixes = {};
            }
            
            _.forEach(Memory.baseMatrixes, (matrix, roomName) => {
                var room = Game.rooms[roomName],
                    tempMatrix, costMatrix, repairableStructuresInRoom;
                
                if (!room || room.unobservable || matrix.status === "complete" || Cache.spawnsInRoom(room).length === 0) {
                    return;
                }
                
                // Step 1, create the room's initial matrix with structures defined.
                repairableStructuresInRoom = Cache.repairableStructuresInRoom(room);
                if (!matrix.status) {
                    costMatrix = new PathFinder.CostMatrix();
                    _.forEach(_.filter(repairableStructuresInRoom, (s) => !(s instanceof StructureRoad)), (structure) => {
                        costMatrix.set(structure.pos.x, structure.pos.y, 255);
                    });
                    matrix.tempMatrix = costMatrix.serialize();
                    matrix.costMatrix = costMatrix.serialize();
                    matrix.status = "building";
                    matrix.x = 0;
                    matrix.y = 0;
                }
                
                // Step 2, try to get to each position within the room.  If it fails, set the terrain as unwalkable.
                if (matrix.status === "building") {
                    tempMatrix = PathFinder.CostMatrix.deserialize(matrix.tempMatrix);
                    costMatrix = PathFinder.CostMatrix.deserialize(matrix.costMatrix);

                    for (; matrix.x < 50; matrix.x++) {
                        for (; matrix.y < 50; matrix.y++) {
                            // Break if CPU is too high, try again later.
                            if (Game.cpu.getUsed() >= 250) {
                                matrix.costMatrix = costMatrix.serialize();
                                return false;
                            }
                            
                            if (PathFinder.search(new RoomPosition(matrix.x, matrix.y, roomName), {pos: Cache.spawnsInRoom(room)[0].pos, range: 1}, {
                                roomCallback: () => {
                                    return tempMatrix;
                                },
                                maxOps: 10000,
                                maxRooms: 1
                            }).incomplete) {
                                costMatrix.set(matrix.x, matrix.y, 255);
                            }
                        }
                        matrix.y = 0;
                    }
                    
                    // Set ramparts back to 0.
                    _.forEach(_.filter(repairableStructuresInRoom, (s) => s instanceof StructureRampart), (structure) => {
                        costMatrix.set(structure.pos.x, structure.pos.y, 0);
                    });
                    
                    delete matrix.tempMatrix;
                    delete matrix.x;
                    delete matrix.y;
                    matrix.costMatrix = costMatrix.serialize();
                    matrix.status = "complete";
                }
            });
        },
        
        deserializeCreeps: () => {
            "use strict";

            // Loop through each creep to deserialize their task and see if it is completed.
            _.forEach(Game.creeps, (creep) => {
                var creepTask;

                if (creep.memory.currentTask) {
                    taskDeserialization(creep);
                    creepTask = Cache.creepTasks[creep.name];
                    if (creepTask) {
                        creepTask.canComplete(creep);
                    }
                }
            });
        },
        
        deserializeRooms: () => {
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
        },

        balanceEnergy: () => {
            // See if there is some energy balancing we can do.
            var rooms, energyGoal;

            rooms = _.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.storage && r.terminal).sort((a, b) => (a.storage.store[RESOURCE_ENERGY] + a.terminal.store[RESOURCE_ENERGY]) - (b.storage.store[RESOURCE_ENERGY] + b.terminal.store[RESOURCE_ENERGY]));
            if (rooms.length > 1) {
                energyGoal = Math.min(_.sum(_.map(rooms, (r) => r.storage.store[RESOURCE_ENERGY] + r.terminal.store[RESOURCE_ENERGY])) / rooms.length, 500000);
                _.forEach(rooms, (room, index) => {
                    var otherRoom = rooms[rooms.length - index - 1],
                        roomStorageEnergy = room.storage.store[RESOURCE_ENERGY],
                        otherRoomStorageEnergy = otherRoom.storage.store[RESOURCE_ENERGY],
                        otherRoomTerminal = otherRoom.terminal,
                        otherRoomTerminalEnergy = otherRoomTerminal.store[RESOURCE_ENERGY],
                        transCost;
                    
                    if (roomStorageEnergy >= otherRoomStorageEnergy || roomStorageEnergy + room.terminal.store[RESOURCE_ENERGY] > energyGoal || otherRoomStorageEnergy + otherRoomTerminalEnergy < energyGoal + 10000) {
                        return false;
                    }

                    if (otherRoomTerminalEnergy >= 1000) {
                        transCost = Game.market.calcTransactionCost(otherRoomTerminalEnergy, otherRoom.name, room.name);

                        otherRoomTerminal.send(RESOURCE_ENERGY, Math.floor(otherRoomTerminalEnergy * (otherRoomTerminalEnergy / (otherRoomTerminalEnergy + transCost))), room.name);
                    }
                });
            }
        },
        
        log: () => {
            "use strict";

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
                    carry: c.carry,
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
                    spawningRemainingTime: s.spawning ? s.spawning.remainingTime : undefined
                });
            });

            _.forEach([].concat.apply([], [_.filter(Game.rooms), unobservableRooms]), (room) => {
                var roomName = room.name,
                    roomMemory = Memory.rooms[roomName],
                    type = roomMemory && roomMemory.roomType && roomMemory.roomType.type ? roomMemory.roomType.type : "unknown",
                    repairableStructures, constructionSites, towers, labs, nukers, powerSpawns;

                // Log room data.
                if (room.unobservable) {
                    Cache.log.rooms[roomName] = {
                        type: type,
                        supportRoom: roomMemory && roomMemory.roomType ? roomMemory.roomType.supportRoom : undefined,
                        region: roomMemory ? roomMemory.region : undefined,
                        unobservable: true,
                        store: {},
                        labs: [],
                        source: [],
                        creeps: []
                    };
                } else {
                    repairableStructures = Cache.sortedRepairableStructuresInRoom(room),
                    constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES),
                    towers = Cache.towersInRoom(room),
                    labs = Cache.labsInRoom(room);
                    nukers = Cache.nukersInRoom(room);
                    powerSpawns = Cache.powerSpawnsInRoom(room);

                    Cache.log.rooms[roomName] = {
                        type: type,
                        supportRoom: roomMemory && roomMemory.roomType ? roomMemory.roomType.supportRoom : undefined,
                        region: roomMemory ? roomMemory.region : undefined,
                        unobservable: false,
                        controller: !!room.controller,
                        store: {},
                        labs: [],
                        source: [],
                        creeps: []
                    };

                    if (Cache.log.rooms[roomName].controller) {
                        Cache.log.rooms[roomName].rcl = room.controller.level;
                        if (room.controller.owner) {
                            Cache.log.rooms[roomName].ownerUsername = room.controller.owner.username;
                        }
                        Cache.log.rooms[roomName].progress = room.controller.progress;
                        Cache.log.rooms[roomName].progressTotal = room.controller.progressTotal;
                        Cache.log.rooms[roomName].ttd = room.controller.ticksToDowngrade;
                    }

                    if (room.controller && room.controller.reservation) {
                        Cache.log.rooms[roomName].reservedUsername = room.controller.reservation.username;
                        Cache.log.rooms[roomName].tte = room.controller.reservation.ticksToEnd;
                    }

                    _.forEach(_.filter(repairableStructures, (s) => !(s instanceof StructureWall) && !(s instanceof StructureRampart) === -1), (s) => {
                        Cache.log.structures.push({
                            structureId: s.id,
                            room: roomName,
                            x: s.pos.x,
                            y: s.pos.y,
                            structureType: s.structureType,
                            hits: s.hits,
                            hitsMax: s.hitsMax
                        });
                    });

                    Cache.log.rooms[roomName].lowestWall = _.filter(repairableStructures, (s) => s instanceof StructureWall || s instanceof StructureRampart)[0];

                    if (room.energyCapacityAvailable && room.energyCapacityAvailable > 0) {
                        Cache.log.rooms[roomName].energyAvailable = room.energyAvailable;
                        Cache.log.rooms[roomName].energyCapacityAvailable = room.energyCapacityAvailable;
                    }

                    Cache.log.rooms[roomName].constructionProgress = _.sum(_.map(constructionSites, (c) => c.progress));
                    Cache.log.rooms[roomName].constructionProgressTotal = _.sum(_.map(constructionSites, (c) => c.progressTotal));

                    Cache.log.rooms[roomName].towerEnergy = _.sum(_.map(towers, (t) => t.energy));
                    Cache.log.rooms[roomName].towerEnergyCapacity = _.sum(_.map(towers, (t) => t.energyCapacity));

                    Cache.log.rooms[roomName].labEnergy = _.sum(_.map(labs, (l) => l.energy));
                    Cache.log.rooms[roomName].labEnergyCapacity = _.sum(_.map(labs, (l) => l.energyCapacity));

                    Cache.log.rooms[roomName].nukerEnergy = _.sum(_.map(nukers, (n) => n.energy));
                    Cache.log.rooms[roomName].nukerEnergyCapacity = _.sum(_.map(nukers, (n) => n.energyCapacity));

                    Cache.log.rooms[roomName].nukerGhodium = _.sum(_.map(nukers, (n) => n.ghodium));
                    Cache.log.rooms[roomName].nukerGhodiumCapacity = _.sum(_.map(nukers, (n) => n.ghodiumCapacity));

                    Cache.log.rooms[roomName].powerSpawnEnergy = _.sum(_.map(powerSpawns, (s) => s.energy));
                    Cache.log.rooms[roomName].powerSpawnEnergyCapacity = _.sum(_.map(powerSpawns, (s) => s.energyCapacity));

                    Cache.log.rooms[roomName].powerSpawnPower = _.sum(_.map(powerSpawns, (s) => s.power));
                    Cache.log.rooms[roomName].powerSpawnPowerCapacity = _.sum(_.map(powerSpawns, (s) => s.powerCapacity));

                    if (room.storage) {
                        Cache.log.rooms[roomName].store.storage = _.map(room.storage.store, (s, k) => {return {resource: k, amount: s};});
                    }

                    if (room.terminal) {
                        Cache.log.rooms[roomName].store.terminal = _.map(room.terminal.store, (s, k) => {return {resource: k, amount: s};});
                    }

                    Cache.log.rooms[roomName].labs = _.map(labs, (l) => {return {resource: l.mineralType, amount: l.mineralAmount};});

                    Cache.log.rooms[roomName].labQueue = roomMemory.labQueue;
                    Cache.log.rooms[roomName].buyQueue = roomMemory.buyQueue;

                    _.forEach(room.find(FIND_SOURCES), (s) => {
                        Cache.log.rooms[roomName].source.push({
                            sourceId: s.id,
                            resource: RESOURCE_ENERGY,
                            amount: s.energy,
                            capacity: s.energyCapacity,
                            ttr: s.ticksToRegeneration
                        });
                    });

                    _.forEach(room.find(FIND_MINERALS), (m) => {
                        Cache.log.rooms[roomName].source.push({
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
                            room: roomName,
                            x: h.pos.x,
                            y: h.pos.y,
                            ttl: h.ticksToLive,
                            hits: h.hits,
                            hitsMax: h.hitsMax
                        });
                    });
                }
            });
        },

        rooms: () => {
            "use strict";

            // Loop through each room to determine the required tasks for the room, and then serialize the room.
            _.forEach([].concat.apply([], [_.filter(Game.rooms), unobservableRooms]), (room) => {
                var roomName = room.name,
                    roomMemory = Memory.rooms[roomName];
                
                if (Cache.roomTypes[roomName]) {
                    Cache.roomTypes[roomName].run(room);
                    if (roomMemory && roomMemory.roomType && roomMemory.roomType.type === Cache.roomTypes[roomName].type) {
                        Cache.roomTypes[roomName].toObj(room);
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
                    scheduled: value.scheduled,
                    portals: value.portals,
                    boostRoom: value.boostRoom,
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

                // Army creeps should congratulate.
                if (creep.memory.army && Memory.army[creep.memory.army] && creep.room.name === Memory.army[creep.memory.army].attackRoom) {
                    creep.say(["I don't", "always", "test my", "code, but", "when I do,", "I do it in", "production", "Stay", "thirsty", "my friend!", ""][Game.time % 11], true);
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
                    // Ensure creeps try to move off of the sides of the room if they're not moving anywhere else this turn.
                    if (creep.pos.x === 0) {
                        switch (Math.floor(Math.random() * 3)) {
                            case 0:
                                creep.move(RIGHT);
                                break;
                            case 1:
                                creep.move(TOP_RIGHT);
                                break;
                            case 2:
                                creep.move(BOTTOM_RIGHT);
                                break;
                        }
                    }

                    if (creep.pos.x === 49) {
                        switch (Math.floor(Math.random() * 3)) {
                            case 0:
                                creep.move(LEFT);
                                break;
                            case 1:
                                creep.move(TOP_LEFT);
                                break;
                            case 2:
                                creep.move(BOTTOM_LEFT);
                                break;
                        }
                    }

                    if (creep.pos.y === 0) {
                        switch (Math.floor(Math.random() * 3)) {
                            case 0:
                                creep.move(BOTTOM);
                                break;
                            case 1:
                                creep.move(BOTTOM_RIGHT);
                                break;
                            case 2:
                                creep.move(BOTTOM_LEFT);
                                break;
                        }
                    }

                    if (creep.pos.y === 49) {
                        switch (Math.floor(Math.random() * 3)) {
                            case 0:
                                creep.move(TOP);
                                break;
                            case 1:
                                creep.move(TOP_RIGHT);
                                break;
                            case 2:
                                creep.move(TOP_LEFT);
                                break;
                        }
                    }

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
                    if (creep.carry[RESOURCE_ENERGY] > 0 && creep.getActiveBodyparts(WORK) > 0) {
                        _.forEach(_.filter(creep.pos.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureRoad && s.hits < s.hitsMax), (structure) => {
                            creep.repair(structure);
                        });
                    }
                } else {
                    delete creep.memory.currentTask;

                    // RIP & Pepperonis :(
                    if (!creep.spawning && creep.ticksToLive < 150 && ["armyDismantler", "armyHealer", "armyMelee", "armyRanged", "claimer", "defender", "healer", "meleeAttack", "rangedAttack", "remoteReserver"].indexOf(creep.memory.role) === -1) {
                        creep.suicide();
                    }
                }
            });
        },

        finalize: () => {
            Cache.log.tick = Game.time;
            Cache.log.date = new Date();
            Cache.log.gcl = Game.gcl.level;
            Cache.log.progress = Game.gcl.progress;
            Cache.log.progressTotal = Game.gcl.progressTotal;
            Cache.log.limit = Game.cpu.limit;
            Cache.log.tickLimit = Game.cpu.tickLimit;
            Cache.log.bucket = Game.cpu.bucket;
            Cache.log.credits = Game.market.credits;
            Cache.log.cpuUsed = Game.cpu.getUsed();
            Memory.console = Cache.log;
        }
    };

profiler.registerObject(main, "main");

// Don't forget to reload global when reactivating the profiler.
if (Memory.profiling) {
    profiler.enable();
}

module.exports = main;
