/* This header is placed at the beginning of the output file and defines the
	special `__require`, `__getFilename`, and `__getDirname` functions.
*/
(function() {
	/* __modules is an Array of functions; each function is a module added
		to the project */
var __modules = {},
	/* __modulesCache is an Array of cached modules, much like
		`require.cache`.  Once a module is executed, it is cached. */
	__modulesCache = {},
	/* __moduleIsCached - an Array of booleans, `true` if module is cached. */
	__moduleIsCached = {};
/* If the module with the specified `uid` is cached, return it;
	otherwise, execute and cache it first. */
function __require(uid, parentUid) {
	if(!__moduleIsCached[uid]) {
		// Populate the cache initially with an empty `exports` Object
		__modulesCache[uid] = {"exports": {}, "loaded": false};
		__moduleIsCached[uid] = true;
		if(uid === 0 && typeof require === "function") {
			require.main = __modulesCache[0];
		} else {
			__modulesCache[uid].parent = __modulesCache[parentUid];
		}
		/* Note: if this module requires itself, or if its depenedencies
			require it, they will only see an empty Object for now */
		// Now load the module
		__modules[uid].call(this, __modulesCache[uid], __modulesCache[uid].exports);
		__modulesCache[uid].loaded = true;
	}
	return __modulesCache[uid].exports;
}
/* This function is the replacement for all `__filename` references within a
	project file.  The idea is to return the correct `__filename` as if the
	file was not concatenated at all.  Therefore, we should return the
	filename relative to the output file's path.

	`path` is the path relative to the output file's path at the time the
	project file was concatenated and added to the output file.
*/
function __getFilename(path) {
	return require("path").resolve(__dirname + "/" + path);
}
/* Same deal as __getFilename.
	`path` is the path relative to the output file's path at the time the
	project file was concatenated and added to the output file.
*/
function __getDirname(path) {
	return require("path").resolve(__dirname + "/" + path + "/../");
}
/********** End of header **********/
/********** Start module 0: /Users/roncli/dev/git/github/screeps/src/main.js **********/
__modules[0] = function(module, exports) {
const profiler = __require(1,0),
    Army = __require(2,0),
    Cache = __require(3,0),
    Commands = __require(4,0),
    Drawing = __require(5,0),
    Market = __require(6,0),
    Minerals = __require(7,0),
    Utilities = __require(8,0),
    RoleArmyDismantler = __require(9,0),
    RoleArmyHealer = __require(10,0),
    RoleArmyMelee = __require(11,0),
    RoleArmyRanged = __require(12,0),
    RoleClaimer = __require(13,0),
    RoleCollector = __require(14,0),
    RoleConverter = __require(15,0),
    RoleDefender = __require(16,0),
    RoleDismantler = __require(17,0),
    RoleHealer = __require(18,0),
    RoleMiner = __require(19,0),
    RoleRemoteBuilder = __require(20,0),
    RoleRemoteCollector = __require(21,0),
    RoleRemoteDismantler = __require(22,0),
    RoleRemoteMiner = __require(23,0),
    RoleRemoteReserver = __require(24,0),
    RoleRemoteStorer = __require(25,0),
    RoleRemoteWorker = __require(26,0),
    RoleScientist = __require(27,0),
    RoleStorer = __require(28,0),
    RoleTower = __require(29,0),
    RoleUpgrader = __require(30,0),
    RoleWorker = __require(31,0),
    RoomBase = __require(32,0),
    RoomCleanup = __require(33,0),
    RoomMine = __require(34,0),
    RoomSource = __require(35,0),
    TaskAttack = __require(36,0),
    TaskBuild = __require(37,0),
    TaskClaim = __require(38,0),
    TaskCollectEnergy = __require(39,0),
    TaskCollectMinerals = __require(40,0),
    TaskDismantle = __require(41,0),
    TaskFillEnergy = __require(42,0),
    TaskFillMinerals = __require(43,0),
    TaskHarvest = __require(44,0),
    TaskHeal = __require(45,0),
    TaskMeleeAttack = __require(46,0),
    TaskMine = __require(47,0),
    TaskPickupResource = __require(48,0),
    TaskRally = __require(49,0),
    TaskRangedAttack = __require(50,0),
    TaskRepair = __require(51,0),
    TaskReserve = __require(52,0),
    TaskUpgradeController = __require(53,0);
/**
 * A class representing the main entry point of the scripts.
 */
class Main {
    /**
     * The main loop that runs every tick.
     */
    static loop() {
        var gameCpu = Game.cpu,
            cpu = gameCpu.getUsed(),
            bucket = gameCpu.bucket,
            logCpu = Memory.logCpu;

        if (cpu >= 10) {
            if (gameCpu.bucket < 9700) {
                Game.notify(`CPU started at ${cpu.toFixed(2)} with bucket at ${bucket.toFixed(0)}, aborting! ${Game.time.toFixed(0)}`);
                return;
            }
        }

        if (bucket < gameCpu.tickLimit) {
            Game.notify(`Bucket at ${bucket.toFixed(0)}, aborting! ${Game.time.toFixed(0)}`);
            return;
        }
        
        var loop = () => {
            var log = "",
                lastCpu, thisCpu;
            
            if (logCpu) {
                lastCpu = thisCpu;
                log = `Started at ${lastCpu.toFixed(2)}`;
            }

            this.init();

            if (logCpu) {
                thisCpu = gameCpu.getUsed();
                log += `${log.length > 0 ? " - " : ""}init took ${(thisCpu - lastCpu).toFixed(2)}`;
                lastCpu = thisCpu;
            }

            this.minerals();

            if (logCpu) {
                thisCpu = gameCpu.getUsed();
                log += `${log.length > 0 ? " - " : ""}minerals took ${(thisCpu - lastCpu).toFixed(2)}`;
                lastCpu = thisCpu;
            }

            this.baseMatrixes();

            if (logCpu) {
                thisCpu = gameCpu.getUsed();
                log += `${log.length > 0 ? " - " : ""}baseMatrixes took ${(thisCpu - lastCpu).toFixed(2)}`;
                lastCpu = thisCpu;
            }

            this.deserializeCreeps();

            if (logCpu) {
                thisCpu = gameCpu.getUsed();
                log += `${log.length > 0 ? " - " : ""}deserializeCreeps took ${(thisCpu - lastCpu).toFixed(2)}`;
                lastCpu = thisCpu;
            }

            this.deserializeRooms();

            if (logCpu) {
                thisCpu = gameCpu.getUsed();
                log += `${log.length > 0 ? " - " : ""}deserializeRooms took ${(thisCpu - lastCpu).toFixed(2)}`;
                lastCpu = thisCpu;
            }

            this.deserializeArmies();

            if (logCpu) {
                thisCpu = gameCpu.getUsed();
                log += `${log.length > 0 ? " - " : ""}deserializeArmies took ${(thisCpu - lastCpu).toFixed(2)}`;
                lastCpu = thisCpu;
            }

            this.balanceEnergy();

            if (logCpu) {
                thisCpu = gameCpu.getUsed();
                log += `${log.length > 0 ? " - " : ""}balanceEnergy took ${(thisCpu - lastCpu).toFixed(2)}`;
                lastCpu = thisCpu;
            }

            if (Memory.log) {
                this.log();

                if (logCpu) {
                    thisCpu = gameCpu.getUsed();
                    log += `${log.length > 0 ? " - " : ""}log took ${(thisCpu - lastCpu).toFixed(2)}`;
                    lastCpu = thisCpu;
                }
            }

            this.rooms();

            if (logCpu) {
                thisCpu = gameCpu.getUsed();
                log += `${log.length > 0 ? " - " : ""}rooms took ${(thisCpu - lastCpu).toFixed(2)}`;
                lastCpu = thisCpu;
            }

            this.army();

            if (logCpu) {
                thisCpu = gameCpu.getUsed();
                log += `${log.length > 0 ? " - " : ""}army took ${(thisCpu - lastCpu).toFixed(2)}`;
                lastCpu = thisCpu;
            }

            this.creeps();

            if (logCpu) {
                thisCpu = gameCpu.getUsed();
                log += `${log.length > 0 ? " - " : ""}creeps took ${(thisCpu - lastCpu).toFixed(2)}`;
                lastCpu = thisCpu;
            }
            
            if (Memory.debug) {
                this.debug();
                
                if (logCpu) {
                    thisCpu = gameCpu.getUsed();
                    log += `${log.length > 0 ? " - " : ""}debug took ${(thisCpu - lastCpu).toFixed(2)}`;
                    lastCpu = thisCpu;
                }
            }

            if (Memory.visualizations) {
                this.drawGlobal();

                if (logCpu) {
                    thisCpu = gameCpu.getUsed();
                    log += `${log.length > 0 ? " - " : ""}drawGlobal took ${(thisCpu - lastCpu).toFixed(2)}`;
                    Cache.log.events.push(log);
                }
            }

            this.finalize();

            if (logCpu) {
                thisCpu = gameCpu.getUsed();
                log += `${log.length > 0 ? " - " : ""}finalize took ${(thisCpu - lastCpu).toFixed(2)}`;
                lastCpu = thisCpu;
            }
        };

        if (Memory.profiling) {
            profiler.wrap(loop);
        } else {
            loop();
        }
    }
    /**
     * Initializes the script.
     */
    static init() {
        var generationTick = Game.time % 1500;
        Cache.reset();
        if (!this.reset)
        {
            this.reset = true;
            Cache.log.events.push("System reset.");
        }
        if (Cache.credits < Memory.minimumCredits) {
            delete Memory.buy;
        }

        if (Cache.credits >= Memory.minimumCredits * 1.5) {
            Memory.buy = true;
        }
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
                Converter: RoleConverter,
                Defender: RoleDefender,
                Dismantler: RoleDismantler,
                Healer: RoleHealer,
                Miner: RoleMiner,
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
                Mine: RoomMine,
                Source: RoomSource
            },
            Utilities: Utilities
        };
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
        if (!Memory.avoidSquares) {
            Memory.avoidSquares = {};
        }
        if (!Memory.paths) {
            Memory.paths = {};
        }
        
        if (!Memory.lengthToStorage) {
            Memory.lengthToStorage = {};
        }
        if (!Memory.towerTasks) {
            Memory.towerTasks = {};
        }
        if (!Memory.stats) {
            Memory.stats = {};
        }
        if (!Memory.stats.cpu) {
            Memory.stats.cpu = [];
        }
        if (!Memory.stats.bucket) {
            Memory.stats.bucket = [];
        }
        if (!Memory.stats.gclProgress) {
            Memory.stats.gclProgress = [];
        }

        if (!Memory.minimumSell) {
            Memory.minimumSell = {};
        }
        
        if (!Memory.flipPrice) {
            Memory.flipPrice = {};
        }
        
        if (!Memory.allies) {
            Memory.allies = [];
        }
        if (Game.time % 10 === 0) {
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
                if (value[3] <= Game.time - 500 || value[2] <= Game.time - 1500) {
                    delete Memory.paths[id];
                }
            });
        }

        delete Memory.flags;
        switch (generationTick) {
            case 0:
                Memory.lengthToStorage = {};
                break;
            case 100:
                Memory.lengthToContainer = {};
                break;
            case 200:
                Memory.lengthToController = {};
                break;
            case 300:
                Memory.ranges = {};
                break;
        }
        Cache.creeps = Utilities.nest(_.filter(Game.creeps, (c) => c.memory.home || c.memory.army), [(c) => c.memory.home || c.memory.army, (c) => c.memory.role]);
        _.forEach(Cache.creeps, (creeps, entity) => {
            Cache.creeps[entity].all = _.flatten(_.values(creeps));
        });
    }
    /**
     * Gets data on minerals needed for rooms, including what labs should buy or create.
     */
    static minerals() {
        var mineralOrders = {},
            minerals, sellOrder;

        if (Game.cpu.bucket >= Memory.marketBucket) {
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
                {resource: RESOURCE_KEANIUM_OXIDE, amount: 3000},
                {resource: RESOURCE_LEMERGIUM_HYDRIDE, amount: 3000},
                {resource: RESOURCE_LEMERGIUM_OXIDE, amount: 3000},
                {resource: RESOURCE_ZYNTHIUM_HYDRIDE, amount: 3000},
                {resource: RESOURCE_GHODIUM_HYDRIDE, amount: 3000},
                {resource: RESOURCE_GHODIUM_OXIDE, amount: 3000},
                {resource: RESOURCE_UTRIUM_ACID, amount: 3000},
                {resource: RESOURCE_KEANIUM_ALKALIDE, amount: 3000},
                {resource: RESOURCE_LEMERGIUM_ACID, amount: 3000},
                {resource: RESOURCE_LEMERGIUM_ALKALIDE, amount: 3000},
                {resource: RESOURCE_ZYNTHIUM_ACID, amount: 3000},
                {resource: RESOURCE_GHODIUM_ACID, amount: 3000},
                {resource: RESOURCE_GHODIUM_ALKALIDE, amount: 3000},
                {resource: RESOURCE_CATALYZED_UTRIUM_ACID, amount: 15000},
                {resource: RESOURCE_CATALYZED_KEANIUM_ALKALIDE, amount: 15000},
                {resource: RESOURCE_CATALYZED_LEMERGIUM_ACID, amount: 15000},
                {resource: RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE, amount: 15000},
                {resource: RESOURCE_CATALYZED_ZYNTHIUM_ACID, amount: 15000},
                {resource: RESOURCE_CATALYZED_GHODIUM_ACID, amount: 15000},
                {resource: RESOURCE_CATALYZED_GHODIUM_ALKALIDE, amount: 15000},
                {resource: RESOURCE_POWER, amount: 3000}
            ];

            _.forEach(minerals, (mineral) => {
                var fx = (node, innerFx) => {
                    node.children = _.map(Minerals[node.resource], (m) => {return {resource: m};});

                    _.forEach(node.children, (child) => {
                        child.amount = node.amount;

                        innerFx(child, innerFx);
                    });
                };

                fx(mineral, fx);
            });
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

                    node.amount = Memory.reserveMinerals[node.resource];
                };

                fx(mineral, fx);
            });
            _.forEach(_.uniq(_.map(Market.getAllOrders(), (o) => o.resourceType)), (resource) => {
                sellOrder = (Market.getFilteredOrders().sell[resource] || [])[0];

                if (sellOrder) {
                    mineralOrders[resource] = sellOrder;
                }
            });
            _.forEach(Game.rooms, (room, roomName) => {
                var lowest = Infinity,
                    roomMemory = room.memory,
                    roomType = roomMemory.roomType,
                    storage = room.storage,
                    terminal = room.terminal,
                    creeps = Cache.creeps[roomName],
                    allCreepsInRoom = creeps && creeps.all,
                    labQueue, storageStore, terminalStore;

                if (!storage || !terminal || !terminal.my || !roomType || roomType.type !== "base" || Cache.labsInRoom(room) < 3) {
                    return;
                }

                storageStore = storage.store;
                terminalStore = terminal.store;

                Cache.minerals[roomName] = _.cloneDeep(minerals);
                _.forEach(Cache.minerals[roomName], (mineral) => {
                    var fx = (node, innerFx) => {
                        var resource = node.resource,
                            roomResources = (storageStore[resource] || 0) + (terminalStore[resource] || 0) + _.sum(allCreepsInRoom, (c) => c.carry[resource] || 0),
                            children = node.children,
                            buyPrice;

                        node.buyPrice = mineralOrders[resource] ? mineralOrders[resource].price : Infinity;
                        node.amount = Math.max(node.amount - roomResources, 0);

                        _.forEach(children, (child) => {
                            innerFx(child, innerFx);
                        });

                        if (!children || children.length === 0) {
                            node.action = "buy";
                        } else {
                            buyPrice = _.sum(_.map(children, (c) => c.buyPrice)) * 1.2;
                            Memory.minimumSell[resource] = Math.min(Infinity, buyPrice);
                            if (Memory.minimumSell[resource] === 0 || Memory.minimumSell[resource] === Infinity) {
                                delete Memory.minimumSell[resource];
                            }
                            if (node.buyPrice > buyPrice || !Memory.buy) {
                                let roomResources1 = Math.floor(((storageStore[children[0].resource] || 0) + (terminalStore[children[0].resource] || 0) + _.sum(allCreepsInRoom, (c) => c.carry[children[0].resource] || 0)) / 5) * 5,
                                    roomResources2 = Math.floor(((storageStore[children[1].resource] || 0) + (terminalStore[children[1].resource] || 0) + _.sum(allCreepsInRoom, (c) => c.carry[children[1].resource] || 0)) / 5) * 5;

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
                        if (node.amount > 0 && node.action === "buy" && !roomMemory.buyQueue && Cache.credits >= Memory.minimumCredits && Memory.buy) {
                            roomMemory.buyQueue = {
                                resource: resource,
                                amount: node.amount,
                                price: node.buyPrice,
                                start: Game.time
                            };
                        }
                    };

                    fx(mineral, fx);
                });
                if (labQueue && !roomMemory.labQueue) {
                    var fx = (node, innerFx) => {
                        var resource = node.resource,
                            children = node.children;
                        if (node.amount <= 0) {
                            return;
                        }

                        if (node.action === "create") {
                            let roomResources1 = Math.floor(((storageStore[children[0].resource] || 0) + (terminalStore[children[0].resource] || 0) + _.sum(allCreepsInRoom, (c) => c.carry[children[0].resource] || 0)) / 5) * 5,
                                roomResources2 = Math.floor(((storageStore[children[1].resource] || 0) + (terminalStore[children[1].resource] || 0) + _.sum(allCreepsInRoom, (c) => c.carry[children[1].resource] || 0)) / 5) * 5;
                            roomMemory.labQueue = {
                                resource: resource,
                                amount: Math.min(5 * Math.ceil(Math.min(Math.min(Math.min(node.amount, roomResources1), roomResources2), LAB_MINERAL_CAPACITY) / 5), 3000),
                                children: _.map(children, (c) => c.resource),
                                start: Game.time
                            };

                            _.forEach(children, (child) => {
                                innerFx(child, innerFx);
                            });
                        }
                    };

                    fx(labQueue, fx);
                }
            });
        }
    }
    /**
     * Creates defensive CostMatrixes for base rooms that need them.
     */
    static baseMatrixes() {
        if (!Memory.baseMatrixes) {
            Memory.baseMatrixes = {};
        }
        
        _.forEach(Memory.baseMatrixes, (matrix, roomName) => {
            var room = Game.rooms[roomName],
                repairableStructuresInRoom;
            
            if (!room || room.unobservable || matrix.status === "complete" || Cache.spawnsInRoom(room).length === 0) {
                return;
            }
            repairableStructuresInRoom = Cache.repairableStructuresInRoom(room);
            if (!matrix.status) {
                let costMatrix = new PathFinder.CostMatrix();

                _.forEach(_.filter(repairableStructuresInRoom, (s) => !(s.structureType === STRUCTURE_ROAD)), (structure) => {
                    costMatrix.set(structure.pos.x, structure.pos.y, 255);
                });
                matrix.tempMatrix = costMatrix.serialize();
                matrix.costMatrix = costMatrix.serialize();
                matrix.status = "building";
                matrix.x = 0;
                matrix.y = 0;
            }
            if (matrix.status === "building") {
                let firstSpawn = Cache.spawnsInRoom(room)[0],
                    tempMatrix = PathFinder.CostMatrix.deserialize(matrix.tempMatrix),
                    costMatrix = PathFinder.CostMatrix.deserialize(matrix.costMatrix);

                for (; matrix.x < 50; matrix.x++) {
                    for (; matrix.y < 50; matrix.y++) {
                        if (Game.cpu.getUsed() >= 250) {
                            matrix.costMatrix = costMatrix.serialize();
                            return false;
                        }
                        
                        if (PathFinder.search(new RoomPosition(matrix.x, matrix.y, roomName), {pos: firstSpawn.pos, range: 1}, {
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
                _.forEach(_.filter(repairableStructuresInRoom, (s) => s.structureType === STRUCTURE_RAMPART), (structure) => {
                    costMatrix.set(structure.pos.x, structure.pos.y, 0);
                });
                
                delete matrix.tempMatrix;
                delete matrix.x;
                delete matrix.y;
                matrix.costMatrix = costMatrix.serialize();
                matrix.status = "complete";
            }
        });
    }
    /**
     * Deserialies creep tasks from memory into task objects.
     */
    static deserializeCreeps() {
        var creepTasks = Cache.creepTasks;
        _.forEach(Game.creeps, (creep) => {
            if (creep.memory.currentTask) {
                switch (creep.memory.currentTask.type) {
                    case "attack":
                        creepTasks[creep.name] = TaskAttack.fromObj(creep);
                        break;
                    case "build":
                        creepTasks[creep.name] = TaskBuild.fromObj(creep);
                        break;
                    case "claim":
                        creepTasks[creep.name] = TaskClaim.fromObj(creep);
                        break;
                    case "collectEnergy":
                        creepTasks[creep.name] = TaskCollectEnergy.fromObj(creep);
                        break;
                    case "collectMinerals":
                        creepTasks[creep.name] = TaskCollectMinerals.fromObj(creep);
                        break;
                    case "dismantle":
                        creepTasks[creep.name] = TaskDismantle.fromObj(creep);
                        break;
                    case "fillEnergy":
                        creepTasks[creep.name] = TaskFillEnergy.fromObj(creep);
                        break;
                    case "fillMinerals":
                        creepTasks[creep.name] = TaskFillMinerals.fromObj(creep);
                        break;
                    case "harvest":
                        creepTasks[creep.name] = TaskHarvest.fromObj(creep);
                        break;
                    case "heal":
                        creepTasks[creep.name] = TaskHeal.fromObj(creep);
                        break;
                    case "meleeAttack":
                        creepTasks[creep.name] = TaskMeleeAttack.fromObj(creep);
                        break;
                    case "mine":
                        creepTasks[creep.name] = TaskMine.fromObj(creep);
                        break;
                    case "pickupResource":
                        creepTasks[creep.name] = TaskPickupResource.fromObj(creep);
                        break;
                    case "rally":
                        creepTasks[creep.name] = TaskRally.fromObj(creep);
                        break;
                    case "rangedAttack":
                        creepTasks[creep.name] = TaskRangedAttack.fromObj(creep);
                        break;
                    case "repair":
                        creepTasks[creep.name] = TaskRepair.fromObj(creep);
                        break;
                    case "reserve":
                        creepTasks[creep.name] = TaskReserve.fromObj(creep);
                        break;
                    case "upgradeController":
                        creepTasks[creep.name] = TaskUpgradeController.fromObj(creep);
                        break;
                }
            }
        });
    }
    /**
     * Deserialize rooms from memory into room objects.
     */
    static deserializeRooms() {
        var rooms = Cache.rooms;
        this.unobservableRooms = [];
        _.forEach(Memory.rooms, (roomMemory, name) => {
            if (roomMemory.roomType) {
                switch (roomMemory.roomType.type) {
                    case "base":
                        rooms[name] = RoomBase.fromObj(roomMemory);
                        break;
                    case "cleanup":
                        rooms[name] = RoomCleanup.fromObj(roomMemory);
                        break;
                    case "mine":
                        rooms[name] = RoomMine.fromObj(roomMemory);
                        break;
                    case "source":
                        rooms[name] = RoomSource.fromObj(roomMemory);
                        break;
                }

                if (!Game.rooms[name]) {
                    this.unobservableRooms.push({
                        name: name,
                        unobservable: true
                    });
                }
            }
        });
    }
    /**
     * Deserializes armies from memory into army objects.
     */
    static deserializeArmies() {
        var armies = Cache.armies;

        _.forEach(Memory.army, (army, armyName) => {
            armies[armyName] = Army.fromObj(armyName, army);
        });
    }
    /**
     * Balance energy between rooms with terminals.
     */
    static balanceEnergy() {
        var rooms, energyGoal;

        rooms = _.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.storage && r.storage.my && r.terminal && r.terminal.my).sort((a, b) => a.storage.store[RESOURCE_ENERGY] + a.terminal.store[RESOURCE_ENERGY] - (b.storage.store[RESOURCE_ENERGY] + b.terminal.store[RESOURCE_ENERGY]));
        if (rooms.length > 1) {
            energyGoal = Math.min(_.sum(_.map(rooms, (r) => r.storage.store[RESOURCE_ENERGY] + r.terminal.store[RESOURCE_ENERGY])) / rooms.length, 500000);
            _.forEach(rooms, (room, index) => {
                var otherRoom = rooms[rooms.length - index - 1],
                    roomStorageEnergy = room.storage.store[RESOURCE_ENERGY],
                    otherRoomStorageEnergy = otherRoom.storage.store[RESOURCE_ENERGY],
                    otherRoomTerminal = otherRoom.terminal,
                    otherRoomTerminalEnergy = otherRoomTerminal.store[RESOURCE_ENERGY],
                    transCost;
                
                if (otherRoomTerminal.cooldown > 0) {
                    return;
                }
                
                if (roomStorageEnergy >= otherRoomStorageEnergy || roomStorageEnergy + room.terminal.store[RESOURCE_ENERGY] > energyGoal || otherRoomStorageEnergy + otherRoomTerminalEnergy < energyGoal + 10000) {
                    return false;
                }

                if (otherRoomTerminalEnergy >= 1000) {
                    transCost = Game.market.calcTransactionCost(otherRoomTerminalEnergy, otherRoom.name, room.name);

                    otherRoomTerminal.send(RESOURCE_ENERGY, Math.floor(otherRoomTerminalEnergy * (otherRoomTerminalEnergy / (otherRoomTerminalEnergy + transCost))), room.name);
                    Cache.log.events.push(`Sending ${Math.floor(otherRoomTerminalEnergy * (otherRoomTerminalEnergy / (otherRoomTerminalEnergy + transCost)))} energy from ${otherRoom.name} to ${room.name}`);
                }
            });
        }
    }
    /**
     * Create a log.
     */
    static log() {
        Cache.log.creeps = _.map(Game.creeps, (c) => {
            return {
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
            };
        });

        _.forEach(Cache.armies, (army) => {
            Cache.log.army[army.name] = {
                directive: army.directive,
                scheduled: army.scheduled,
                portals: army.portals,
                boostRoom: army.boostRoom,
                buildRoom: army.buildRoom,
                stageRoom: army.stageRoom,
                attackRoom: army.attackRoom,
                dismantle: army.dismantle.length,
                creeps: []
            };

            if (Game.rooms[army.attackRoom]) {
                Cache.log.army[army.name].structures = _.filter(Game.rooms[army.attackRoom].find(FIND_HOSTILE_STRUCTURES), (s) => !(s.structureType === STRUCTURE_CONTROLLER) && !(s.structureType === STRUCTURE_RAMPART) && !(s.structureType === STRUCTURE_KEEPER_LAIR)).length;
                Cache.log.army[army.name].constructionSites = Game.rooms[army.attackRoom].find(FIND_HOSTILE_CONSTRUCTION_SITES).length;
            }
        });

        Cache.log.spawns = _.map(Game.spawns, (s) => {
            return {
                spawnId: s.id,
                name: s.name,
                room: s.room.name,
                spawningName: s.spawning ? s.spawning.name : undefined,
                spawningNeedTime: s.spawning ? s.spawning.needTime : undefined,
                spawningRemainingTime: s.spawning ? s.spawning.remainingTime : undefined
            };
        });

        _.forEach([].concat.apply([], [_.filter(Game.rooms), this.unobservableRooms]), (room) => {
            var roomName = room.name,
                roomMemory = Memory.rooms[roomName],
                type = roomMemory && roomMemory.roomType && roomMemory.roomType.type ? roomMemory.roomType.type : "unknown",
                repairableStructures, constructionSites, towers, labs, nukers, powerSpawns;
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
                if (Game.time % 10 === 0) {
                    repairableStructures = Cache.repairableStructuresInRoom(room);
                }
                constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
                towers = Cache.towersInRoom(room);
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
                
                if (Game.time % 10 === 0) {
                    Cache.log.rooms[roomName].lowestWall = Math.min.apply(Math, _.map(_.filter(repairableStructures, (s) => s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART), (s) => s.hits));
                } else {
                    Cache.log.rooms[roomName].lowestWall = Memory.console && Memory.console.rooms && Memory.console.rooms[roomName] && Memory.console.rooms[roomName].lowestWall || null;
                }

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

                Cache.log.hostiles = [].concat.apply([], [Cache.log.hostiles, _.map(Cache.hostilesInRoom(room), (h) => {
                    return {
                        creepId: h.id,
                        ownerUsername: h.owner.username,
                        room: roomName,
                        x: h.pos.x,
                        y: h.pos.y,
                        ttl: h.ticksToLive,
                        hits: h.hits,
                        hitsMax: h.hitsMax
                    };
                })]);
            }
        });
    }
    /**
     * Process game rooms.
     */
    static rooms() {
        var roomOrder = ["base", "source", "mine", "cleanup", ""],
            memoryRooms = Memory.rooms,
            roomsToAlwaysRun = ["source", "cleanup"],
            runRooms = Game.cpu.bucket >= 9700 || Game.time % 2 === 0;

        Memory.rushRoom = (_.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.controller && r.controller.level < 8).sort((a, b) => b.controller.level - a.controller.level || b.controller.progress - a.controller.progress)[0] || {name: ""}).name;
        _.forEach([].concat.apply([], [_.filter(Game.rooms), this.unobservableRooms]).sort((a, b) => {
            return roomOrder.indexOf(memoryRooms[a.name] && memoryRooms[a.name].roomType && memoryRooms[a.name].roomType.type || "") - roomOrder.indexOf(memoryRooms[b.name] && memoryRooms[b.name].roomType && memoryRooms[b.name].roomType.type || "");
        }), (room) => {
            var roomName = room.name,
                rooms = Cache.rooms[roomName],
                roomMemory = memoryRooms[roomName],
                roomType;
            
            if (rooms && roomMemory && (roomType = roomMemory.roomType)) {
                if (roomsToAlwaysRun.indexOf(roomType.type) !== -1 || runRooms) {
                    rooms.run(room);
                }
                if (roomType.type === rooms.type) {
                    rooms.toObj(room);
                }
            }
            
            if (Memory.visualizations && !room.unobservable) {
                this.drawRoom(room);
            }
        });
    }
    /**
     * Draws the visualizations for a room.
     * @param {Room} room The room to draw visualizations for.
     */
    static drawRoom(room) {
        var visual = room.visual,
            x, y, towers, labs, nukers, powerSpawns;

        if (!visual) {
            visual = new RoomVisual(room.name);
        }

        if (!visual) {
            return;
        }

        if (room.memory && room.memory.roomType) {
            visual.text(_.capitalize(room.memory.roomType.type), -0.5, 49.325, {align: "left", font: "0.5 Arial"});
        }

        if (room.controller && room.controller.level) {
            visual.text(`RCL ${room.controller.level}`, 2.5, 49.325, {align: "left", font: "0.5 Arial"});
            if (room.controller.progress && room.controller.progressTotal) {
                Drawing.progressBar(visual, 5.5, 48.9, 20, 0.5, room.controller.progress, room.controller.progressTotal, {background: "#808080", bar: "#00ff00", showDetails: true, color: "#ffffff", font: "0.5 Arial"});
            }
        }

        y = 2.125;
        if (room.energyCapacityAvailable) {
            y += 0.7;
            visual.text("Energy", -0.5, y, {align: "left", font: "0.5 Arial"});
            Drawing.progressBar(visual, 2.5, y - 0.425, 5, 0.5, room.energyAvailable, room.energyCapacityAvailable, {background: "#808080", bar: "#00ff00", showDetails: false, color: "#ffffff", font: "0.5 Arial"});
        }

        towers = Cache.towersInRoom(room);
        if (towers.length > 0) {
            y += 0.7;
            visual.text("Towers", -0.5, y, {align: "left", font: "0.5 Arial"});
            Drawing.progressBar(visual, 2.5, y - 0.425, 5, 0.5, _.sum(_.map(towers, (t) => t.energy)), _.sum(_.map(towers, (t) => t.energyCapacity)), {background: "#808080", bar: "#00ff00", showDetails: false, color: "#ffffff", font: "0.5 Arial"});
        }

        labs = Cache.labsInRoom(room);
        if (labs.length > 0) {
            y += 0.7;
            visual.text("Labs", -0.5, y, {align: "left", font: "0.5 Arial"});
            Drawing.progressBar(visual, 2.5, y - 0.425, 5, 0.5, _.sum(_.map(labs, (t) => t.energy)), _.sum(_.map(labs, (t) => t.energyCapacity)), {background: "#808080", bar: "#00ff00", showDetails: false, color: "#ffffff", font: "0.5 Arial"});
        }

        nukers = Cache.nukersInRoom(room);
        if (nukers.length > 0) {
            y += 0.7;
            visual.text("Nuker", -0.5, y, {align: "left", font: "0.5 Arial"});
            Drawing.progressBar(visual, 2.5, y - 0.425, 5, 0.5, _.sum(_.map(nukers, (t) => t.energy)), _.sum(_.map(nukers, (t) => t.energyCapacity)), {background: "#808080", bar: "#00ff00", showDetails: false, color: "#ffffff", font: "0.5 Arial"});
            Drawing.progressBar(visual, 8.5, y - 0.425, 5, 0.5, _.sum(_.map(nukers, (t) => t.ghodium)), _.sum(_.map(nukers, (t) => t.ghodiumCapacity)), {background: "#808080", bar: "#ffff00", showDetails: false, color: "#ffffff", font: "0.5 Arial"});
        }

        powerSpawns = Cache.powerSpawnsInRoom(room);
        if (powerSpawns.length > 0) {
            y += 0.7;
            visual.text("Power Spawn", -0.5, y, {align: "left", font: "0.5 Arial"});
            Drawing.progressBar(visual, 2.5, y - 0.425, 5, 0.5, _.sum(_.map(powerSpawns, (t) => t.energy)), _.sum(_.map(powerSpawns, (t) => t.energyCapacity)), {background: "#808080", bar: "#00ff00", showDetails: false, color: "#ffffff", font: "0.5 Arial"});
            Drawing.progressBar(visual, 8.5, y - 0.425, 5, 0.5, _.sum(_.map(powerSpawns, (t) => t.power)), _.sum(_.map(powerSpawns, (t) => t.powerCapacity)), {background: "#808080", bar: "#ff0000", showDetails: false, color: "#ffffff", font: "0.5 Arial"});
        }

        if (room.memory && room.memory.buyQueue) {
            y += 0.7;
            visual.text("Buy", -0.5, y, {align: "left", font: "bold 0.5 Arial"});
            visual.text(room.memory.buyQueue.amount, 2.5, y, {align: "right", font: "0.5 Arial"});
            Drawing.resource(visual, 2.8, y - 0.175, 0.5, room.memory.buyQueue.resource, {opacity: 1});
        }

        if (room.memory && room.memory.labQueue) {
            y += 0.7;
            visual.text("Create", -0.5, y, {align: "left", font: "bold 0.5 Arial"});
            visual.text(room.memory.labQueue.amount, 2.5, y, {align: "right", font: "0.5 Arial"});
            Drawing.resource(visual, 2.8, y - 0.175, 0.5, room.memory.labQueue.resource, {opacity: 1});
        }

        if (labs.length > 0) {
            y += 0.7;
            visual.text("Labs", -0.5, y, {align: "left", font: "bold 0.5 Arial"});
            x = 0;
            _.forEach(labs, (lab) => {
                x += 2.5;
                if (lab.mineralAmount === 0) {
                    visual.text("Empty", x, y, {align: "right", font: "0.5 Arial"});
                } else {
                    visual.text(lab.mineralAmount, x, y, {align: "right", font: "0.5 Arial"});
                    Drawing.resource(visual, x + 0.3, y - 0.175, 0.5, lab.mineralType, {opacity: 1});
                }
            });
        }

        if (room.storage) {
            y += 1.4;
            visual.text("Storage", -0.5, y, {align: "left", font: "bold 0.5 Arial"});
            _.forEach(room.storage.store, (amount, resource) => {
                if (resource === RESOURCE_ENERGY) {
                    return;
                }

                y += 0.7;
                visual.text(amount, 1, y, {align: "right", font: "0.5 Arial"});
                Drawing.resource(visual, 1.3, y - 0.175, 0.5, resource, {opacity: 1});
            });
        }

        if (room.terminal) {
            y += 1.4;
            visual.text("Terminal", -0.5, y, {align: "left", font: "bold 0.5 Arial"});
            _.forEach(room.terminal.store, (amount, resource) => {
                if (resource === RESOURCE_ENERGY) {
                    return;
                }

                y += 0.7;
                visual.text(amount, 1, y, {align: "right", font: "0.5 Arial"});
                Drawing.resource(visual, 1.3, y - 0.175, 0.5, resource, {opacity: 1});
            });
        }
    }
    /**
     * Process armies.
     */
    static army() {
        _.forEach(Cache.armies, (army) => {
            army.run();

            army.toObj();
        });
    }
    /**
     * Process creep tasks.
     */
    static creeps() {
        var time = Game.time;
        _.forEach(Game.creeps, (creep) => {
            let ttl, creepMemory, army, creepRoom, creepTasks;
            if (creep.spawning || creep.memory.stop) {
                return;
            }

            ttl = creep.ticksToLive;
            creepMemory = creep.memory;
            army = creepMemory.army;
            creepRoom = creep.room.name;
            creepTasks = Cache.creepTasks[creep.name];
            if (ttl <= 150 || ttl < 500 && ttl % 10 === 1 || ttl % 100 === 1) {
                switch (ttl - 1) {
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
                        creep.say(`TTL ${ttl - 1}`);
                        break;
                }
            }
            if (army && Cache.armies[army] && creepRoom === Cache.armies[army].attackRoom) {
                creep.say(["All", "my", "friends", "are", "heathens,", "take", "it", "slow.", "", "Wait", "for", "them", "to", "ask", "you", "who", "you", "know.", "", "Please", "don't", "make", "any", "sudden", "moves.", "", "You", "don't", "know", "the", "half", "of", "the", "abuse.", ""][time % 35], true);
            }
            switch (time % 1000000) {
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

            if (creepMemory.currentTask && creepTasks) {
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
                creepTasks.run(creep);
                if (creepMemory.lastRoom && creepMemory.lastRoom !== creepRoom && (!creepTasks || !creepTasks.force)) {
                    delete creepMemory.currentTask;
                }
                creepMemory.lastRoom = creepRoom;
                if (creepMemory.currentTask && creepTasks) {
                    creepTasks.toObj(creep);
                }
                if (creep.carry[RESOURCE_ENERGY] > 0 && creep.getActiveBodyparts(WORK) > 0) {
                    _.forEach(_.filter(creep.pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax), (structure) => {
                        creep.repair(structure);
                    });
                }
                if (!creep.spawning && ttl < 150 && _.sum(creep.carry) === 0 && (!creepMemory.currentTask || creep.memory.currentTask.type === "rally") && ["armyDismantler", "armyHealer", "armyMelee", "armyRanged", "claimer", "converter", "defender", "healer", "remoteReserver"].indexOf(creep.memory.role) === -1) {
                    creep.suicide();
                }
            } else {
                delete creepMemory.currentTask;
                if (!creep.spawning && ttl < 150 && _.sum(creep.carry) === 0 && ["armyDismantler", "armyHealer", "armyMelee", "armyRanged", "claimer", "converter", "defender", "healer", "remoteReserver"].indexOf(creepMemory.role) === -1) {
                    creep.suicide();
                } else {
                    creep.say("Idle");
                }
            }
        });
    }
    /**
     * Show each creep name, role, and current task in their respective RoomVisual.
     */
    static debug() {
        _.forEach(Game.creeps, (creep) => {
            var creepMemory = creep.memory;

            creep.room.visual
                .text(creep.name, creep.pos.x, creep.pos.y + 1, {align: "center", font: "0.5 Arial"})
                .text(creepMemory.role, creep.pos.x, creep.pos.y + 1.5, {align: "center", font: "0.5 Arial"})
                .text(creepMemory.currentTask ? creepMemory.currentTask.type : "", creep.pos.x, creep.pos.y + 2, {align: "center", font: "0.5 Arial"});
        });
    }
    /**
     * Draw information onto the global visual.
     */
    static drawGlobal() {
        var y;
        Cache.globalVisual.text(`GCL ${Game.gcl.level}`, -0.5, 0.025, {align: "left", font: "0.5 Arial"});
        Drawing.progressBar(Cache.globalVisual, 2.5, -0.4, 20, 0.5, Game.gcl.progress, Game.gcl.progressTotal, {background: "#808080", bar: "#00ff00", showDetails: true, color: "#ffffff", font: "0.5 Arial"});
        Drawing.progressBar(Cache.globalVisual, 34.5, -0.4, 10, 0.5, Game.cpu.bucket, 10000, {label: "Bucket", background: "#808080", showMax: false, bar: Game.cpu.bucket >= 9990 ? "#00ffff" : Game.cpu.bucket >= 9000 ? "#00ff00" : Game.cpu.bucket >= 5000 ? "#cccc00" : "#ff0000", color: "#ffffff", font: "0.5 Arial"});
        Cache.globalVisual.text(`Tick ${Game.time}`, 49.5, 0.025, {align: "right", font: "0.5 Arial"})
            .text(Cache.time, 49.5, 0.725, {align: "right", font: "0.5 Arial"});
        Cache.globalVisual.text(`Credits ${Game.market.credits.toFixed(2)}`, -0.5, 0.725, {align: "left", font: "0.5 Arial"});
        Cache.globalVisual.text(`Creeps ${_.keys(Game.creeps).length}`, -0.5, 1.425, {align: "left", font: "0.5 Arial"});
        y = 0.725;
        _.forEach(_.filter(Game.rooms, (r) => !r.unobservable && r.memory.roomType && r.memory.roomType.type === "base"), (room) => {
            y += 0.7;

            Cache.globalVisual.text(room.name, 43.5, y, {align: "right", font: "bold 0.5 Arial"});
            if (room.storage) {
                Cache.globalVisual.text(room.storage.store[RESOURCE_ENERGY], 45.8, y, {align: "right", font: "0.5 Arial"});
                Drawing.resource(Cache.globalVisual, 46.15, y - 0.175, 0.5, RESOURCE_ENERGY, {opacity: 1});
            }
            if (room.terminal) {
                Cache.globalVisual.text(room.terminal.store[RESOURCE_ENERGY], 48.8, y, {align: "right", font: "0.5 Arial"});
                Drawing.resource(Cache.globalVisual, 49.15, y - 0.175, 0.5, RESOURCE_ENERGY, {opacity: 1});
            }
        });
        Memory.stats.cpu.push(Game.cpu.getUsed());
        while (Memory.stats.cpu.length > 100) {
            Memory.stats.cpu.shift();
        }
        Memory.stats.bucket.push(Game.cpu.bucket);
        while (Memory.stats.bucket.length > 100) {
            Memory.stats.bucket.shift();
        }
        Memory.stats.gclProgress.push(Game.gcl.progress);
        while (Memory.stats.gclProgress.length > 100) {
            Memory.stats.gclProgress.shift();
        }
        Drawing.sparkline(Cache.globalVisual, 23.5, 1, 18, 2, _.map(Memory.stats.cpu, (v, i) => ({cpu: Memory.stats.cpu[i], bucket: Memory.stats.bucket[i], limit: Game.cpu.limit})), [{key: "limit", min: Game.cpu.limit * 0.5, max: Game.cpu.limit * 1.5, stroke: "#c0c0c0", opacity: 0.25}, {key: "cpu", min: Game.cpu.limit * 0.5, max: Game.cpu.limit * 1.5, stroke: "#ffff00", opacity: 0.5}, {key: "bucket", min: 0, max: 10000, stroke: "#00ffff", opacity: 0.5, font: "0.5 Arial"}]);
        Cache.log.cpuUsed = Game.cpu.getUsed();
        Memory.stats.cpu[Memory.stats.cpu.length - 1] = Game.cpu.getUsed();
        Drawing.progressBar(Cache.globalVisual, 23.5, -0.4, 10, 0.5, Game.cpu.getUsed(), Game.cpu.limit, {label: "CPU", background: "#808080", valueDecimals: 2, bar: Cache.log.cpuUsed > Game.cpu.limit ? "#ff0000" : "#00ff00", color: "#ffffff", font: "0.5 Arial"});
    }
    /**
     * Finalize log data and write it to memory.
     */
    static finalize() {
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
}
if (Memory.profiling) {
    profiler.registerObject(Main, "Main");
    profiler.enable();
}

module.exports = Main;

return module.exports;
}
/********** End of module 0: /Users/roncli/dev/git/github/screeps/src/main.js **********/
/********** Start module 1: ../src/screeps-profiler.js **********/
__modules[1] = function(module, exports) {
Array.prototype.forEach = function(callback, thisArg) {
    var arr = this;
    for (var iterator = 0; iterator < arr.length; iterator++) {
        callback.call(thisArg, arr[iterator], iterator, arr);
    }
};

Array.prototype.map = function(callback, thisArg) {
    var arr = this;
    var returnVal = [];
    for (var iterator = 0; iterator < arr.length; iterator++) {
        returnVal.push(callback.call(thisArg, arr[iterator], iterator, arr));
    }
    return returnVal;
};

let usedOnStart = 0;
let enabled = false;
let depth = 0;

function setupProfiler() {
  depth = 0; // reset depth, this needs to be done each tick.
  Game.profiler = {
    stream(duration, filter, startsWith) {
      setupMemory('stream', duration || 10, filter, startsWith);
    },
    email(duration, filter, startsWith) {
      setupMemory('email', duration || 100, filter, startsWith);
    },
    profile(duration, filter, startsWith) {
      setupMemory('profile', duration || 100, filter, startsWith);
    },
    background(filter, startsWith) {
      setupMemory('background', false, filter, startsWith);
    },
    restart() {
      if (Profiler.isProfiling()) {
        const filter = Memory.profiler.filter;
        const startsWith = Memory.profiler.startsWith;
        let duration = false;
        if (Memory.profiler.disableTick) {
          duration = Memory.profiler.disableTick - Memory.profiler.enabledTick + 1;
        }
        const type = Memory.profiler.type;
        setupMemory(type, duration, filter);
      }
    },
    reset: resetMemory,
    output: Profiler.output
  };

  overloadCPUCalc();
}

function setupMemory(profileType, duration, filter, startsWith) {
  resetMemory();
  const disableTick = Number.isInteger(duration) ? Game.time + duration : false;
  if (!Memory.profiler) {
    Memory.profiler = {
      map: {},
      totalTime: 0,
      enabledTick: Game.time + 1,
      disableTick,
      type: profileType,
      filter,
      startsWith
    };
  }
}

function resetMemory() {
  Memory.profiler = null;
}

function overloadCPUCalc() {
  if (Game.rooms.sim) {
    usedOnStart = 0; // This needs to be reset, but only in the sim.
    Game.cpu.getUsed = function getUsed() {
      return performance.now() - usedOnStart;
    };
  }
}

function getFilter() {
  return Memory.profiler.filter;
}

function getStartsWith() {
  return Memory.profiler.startsWith;
}

const functionBlackList = [
  'getUsed', // Let's avoid wrapping this... may lead to recursion issues and should be inexpensive.
  'constructor' // es6 class constructors need to be called with `new`
];

function wrapFunction(name, originalFunction) {
  return function wrappedFunction() {
    if (Profiler.isProfiling()) {
      const nameMatchesFilter = Memory.profiler.startsWith ? name.startsWith(getFilter()) : name === getFilter();
      const start = Game.cpu.getUsed();
      if (nameMatchesFilter) {
        depth++;
      }
      const result = originalFunction.apply(this, arguments);
      if (depth > 0 || !getFilter()) {
        const end = Game.cpu.getUsed();
        Profiler.record(name, end - start);
      }
      if (nameMatchesFilter) {
        depth--;
      }
      return result;
    }

    return originalFunction.apply(this, arguments);
  };
}

function hookUpPrototypes() {
  Profiler.prototypes.forEach(proto => {
    profileObjectFunctions(proto.val, proto.name);
  });
}

function profileObject(objectToWrap, label) {
  Object.getOwnPropertyNames(objectToWrap).forEach(functionName => {
    const extendedLabel = `${label}.${functionName}`;
    try {
      const isFunction = typeof objectToWrap[functionName] === 'function';
      const notBlackListed = functionBlackList.indexOf(functionName) === -1;
      if (isFunction && notBlackListed) {
        const originalFunction = objectToWrap[functionName];
        objectToWrap[functionName] = profileFunction(originalFunction, extendedLabel);
      }
    } catch (e) { } /* eslint no-empty:0 */
  });

  return objectToWrap;
}

function profileObjectFunctions(object, label) {
  if (object.prototype) {
    profileObject(object.prototype, label);
  }
  profileObject(object, label);
}

function profileFunction(fn, functionName) {
  const fnName = functionName || fn.name;
  if (!fnName) {
    console.log('Couldn\'t find a function name for - ', fn);
    console.log('Will not profile this function.');
    return fn;
  }

  return wrapFunction(fnName, fn);
}

const Profiler = {
  printProfile() {
    console.log(Profiler.output());
  },

  emailProfile() {
    Game.notify(Profiler.output());
  },

  output(numresults) {
    const displayresults = numresults ? numresults : 20;
    if (!Memory.profiler || !Memory.profiler.enabledTick) {
      return 'Profiler not active.';
    }

    const elapsedTicks = Game.time - Memory.profiler.enabledTick + 1;
    const header = 'calls\t\ttime\t\tavg\t\tfunction';
    const footer = [
      `Avg: ${(Memory.profiler.totalTime / elapsedTicks).toFixed(2)}`,
      `Total: ${Memory.profiler.totalTime.toFixed(2)}`,
      `Ticks: ${elapsedTicks}`
    ].join('\t');
    return [].concat(header, Profiler.lines().slice(0, displayresults), footer).join('\n');
  },

  lines() {
    const stats = Object.keys(Memory.profiler.map).map(functionName => {
      const functionCalls = Memory.profiler.map[functionName];
      return {
        name: functionName,
        calls: functionCalls.calls,
        totalTime: functionCalls.time,
        averageTime: functionCalls.time / functionCalls.calls
      };
    }).sort((val1, val2) => {
      return val2.totalTime - val1.totalTime;
    });

    const lines = stats.map(data => {
      return [
        data.calls,
        data.totalTime.toFixed(1),
        data.averageTime.toFixed(3),
        data.name
      ].join('\t\t');
    });

    return lines;
  },

  prototypes: [
    { name: 'Game', val: Game },
    { name: 'Room', val: Room },
    { name: 'Structure', val: Structure },
    { name: 'Spawn', val: Spawn },
    { name: 'Creep', val: Creep },
    { name: 'RoomPosition', val: RoomPosition },
    { name: 'Source', val: Source },
    { name: 'Flag', val: Flag }
  ],

  record(functionName, time) {
    if (!Memory.profiler.map[functionName]) {
      Memory.profiler.map[functionName] = {
        time: 0,
        calls: 0
      };
    }
    Memory.profiler.map[functionName].calls++;
    Memory.profiler.map[functionName].time += time;
  },

  endTick() {
    if (Game.time >= Memory.profiler.enabledTick) {
      const cpuUsed = Game.cpu.getUsed();
      Memory.profiler.totalTime += cpuUsed;
      Profiler.report();
    }
  },

  report() {
    if (Profiler.shouldPrint()) {
      Profiler.printProfile();
    } else if (Profiler.shouldEmail()) {
      Profiler.emailProfile();
    }
  },

  isProfiling() {
    if (!enabled || !Memory.profiler) {
      return false;
    }
    return !Memory.profiler.disableTick || Game.time <= Memory.profiler.disableTick;
  },

  type() {
    return Memory.profiler.type;
  },

  shouldPrint() {
    const streaming = Profiler.type() === 'stream';
    const profiling = Profiler.type() === 'profile';
    const onEndingTick = Memory.profiler.disableTick === Game.time;
    return streaming || profiling && onEndingTick;
  },

  shouldEmail() {
    return Profiler.type() === 'email' && Memory.profiler.disableTick === Game.time;
  }
};

module.exports = {
  wrap(callback) {
    if (enabled) {
      setupProfiler();
    }

    if (Profiler.isProfiling()) {
      usedOnStart = Game.cpu.getUsed();
      const returnVal = callback();
      Profiler.endTick();
      return returnVal;
    }

    return callback();
  },

  enable() {
    enabled = true;
    hookUpPrototypes();
  },

  output: Profiler.output,

  registerObject: profileObjectFunctions,
  registerFN: profileFunction,
  registerClass: profileObjectFunctions
};
return module.exports;
}
/********** End of module 1: ../src/screeps-profiler.js **********/
/********** Start module 2: ../src/army.js **********/
__modules[2] = function(module, exports) {
const Cache = __require(3,2),
    Utilities = __require(8,2),
    RoleArmyDismantler = __require(9,2),
    RoleArmyHealer = __require(10,2),
    RoleArmyMelee = __require(11,2),
    RoleArmyRanged = __require(12,2);
/**
 * Represents an army.
 */
class Army {
    /**
     * Create a new Army object.
     * @param {string} name The name of the army.
     * @param {object} settings The settings for the army.
     */
    constructor(name, settings) {
        if (!settings.directive) {
            settings.directive = "preparing";
        }
        if (!Memory.army[name]) {
            Memory.army[name] = settings;
        }
        _.extend(this, settings);
        this.name = name;
    }
    /**
     * Runs the army.
     */
    run() {
        var name = this.name,
            allCreepsInArmy = Cache.creeps[name] && Cache.creeps[name].all || [],
            attackRoom = Game.rooms[this.attackRoom],
            dismantler = this.dismantler,
            healer = this.healer,
            melee = this.melee,
            ranged = this.ranged;
        if (this.scheduled && this.scheduled > Game.time) {
            return;
        }
        if (allCreepsInArmy.length === 0 && this.success) {
            this.delete = true;
            return;
        }
        if (this.directive !== "preparing" && this.directive !== "building" && allCreepsInArmy.length === 0 && !this.success) {
            Game.notify(`Army ${name} operation failed, restarting.`);
            this.directive = "preparing";
        }
        if (this.safeMode && attackRoom && attackRoom.controller && attackRoom.controller.safeMode) {
            this.directive = "staging";
            this.stageRoom = this.safeMode.stageRoom;
            this.attackRoom = this.safeMode.attackRoom;
            this.dismantle = this.safeMode.dismantle;
            this.safeMode = this.safeMode.safeMode;
        }
        if (this.directive === "preparing") {
            let boostRoomName = this.boostRoom;
            
            if (boostRoomName) {
                let boostRoomStorageStore = Game.rooms[boostRoomName].storage.store;

                if (!boostRoomStorageStore || (
                    (boostRoomStorageStore[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] || 0) >= 30 * 5 * (dismantler.maxCreeps + melee.maxCreeps + ranged.maxCreeps + healer.maxCreeps) &&
                    (boostRoomStorageStore[RESOURCE_CATALYZED_ZYNTHIUM_ACID] || 0) >= 30 * dismantler.units * dismantler.maxCreeps &&
                    (boostRoomStorageStore[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE] || 0) >= 30 * healer.units * healer.maxCreeps
                )) {
                    this.directive = "building";
                }
            } else {
                this.directive = "building";
            }
        }
        if (this.directive === "building") {
            if (_.filter(allCreepsInArmy, (c) => c.room.name !== this.buildRoom).length === 0 && _.filter(allCreepsInArmy, (c) => c.room.name === this.buildRoom).length >= dismantler.maxCreeps + healer.maxCreeps + melee.maxCreeps + ranged.maxCreeps) {
                this.directive = "staging";
            }
        }
        if (this.directive === "staging") {
            if (_.filter(allCreepsInArmy, (c) => c.room.name !== this.stageRoom).length === 0) {
                this.directive = "dismantle";
            }
        }
        if (this.directive === "dismantle") {
            if (!this.dismantle) {
                this.directive = "attack";
            } else if (attackRoom) {
                this.dismantle = _.filter(this.dismantle, (d) => Game.getObjectById(d));

                if (this.dismantle.length === 0) {
                    this.directive = "attack";
                }
            }
        }
        if (attackRoom) {
            this.hostileConstructionSites = attackRoom.find(FIND_HOSTILE_CONSTRUCTION_SITES);
            if (attackRoom.find(FIND_HOSTILE_CREEPS).length === 0 && !this.reinforce && _.filter(attackRoom.find(FIND_HOSTILE_STRUCTURES), (s) => !(s.structureType === STRUCTURE_CONTROLLER) && !(s.structureType === STRUCTURE_RAMPART) && !(s.structureType === STRUCTURE_KEEPER_LAIR)).length === 0 && this.hostileConstructionSites.length === 0) {
                this.directive = "attack";
                this.success = true;
            }
        }
        if (this.directive === "building" || this.reinforce) {
            this.checkSpawn("armyDismantler", dismantler.maxCreeps, this.spawnFromRegion.bind(this, RoleArmyDismantler));
            this.checkSpawn("armyHealer", healer.maxCreeps, this.spawnFromRegion.bind(this, RoleArmyHealer));
            this.checkSpawn("armyMelee", melee.maxCreeps, this.spawnFromRegion.bind(this, RoleArmyMelee));
            this.checkSpawn("armyRanged", ranged.maxCreeps, this.spawnFromRegion.bind(this, RoleArmyRanged));
        }
        if (dismantler.escort || melee.escort || ranged.escort) {
            _.forEach(_.filter(Cache.creeps[name] && Cache.creeps[name].armyHealer || [], (c) => !c.memory.escorting && !c.spawning), (healer) => {
                var escort = [].concat.apply([], [
                    dismantler.escort && Cache.creeps[name].armyDismantler ? _.filter(Cache.creeps[name].armyDismantler, (c) => !c.memory.escortedBy && !c.spawning) : [],
                    melee.escort && Cache.creeps[name].armyMelee ? _.filter(Cache.creeps[name].armyMelee, (c) => !c.memory.escortedBy && !c.spawning) : [],
                    ranged.escort && Cache.creeps[name].armyRanged ? _.filter(Cache.creeps[name].armyRanged, (c) => !c.memory.escortedBy && !c.spawning) : []
                ])[0];

                if (escort) {
                    healer.memory.escorting = escort.id;
                    escort.memory.escortedBy = healer.id;
                } else {
                    return false;
                }
            });
        }
        if (attackRoom) {
            switch (this.directive) {
                case "attack":
                    this.hostiles = Cache.hostilesInRoom(attackRoom);
                    break;
                default:
                    if (allCreepsInArmy.length > 0) {
                        this.hostiles = _.filter(Cache.hostilesInRoom(attackRoom), (c) => Utilities.objectsClosestToObj(allCreepsInArmy, c)[0].pos.getRangeTo(c) <= 3);
                    } else {
                        this.hostiles = [];
                    }
                    break;
            }
        }
        RoleArmyDismantler.assignTasks(this);
        RoleArmyHealer.assignTasks(this);
        RoleArmyMelee.assignTasks(this);
        RoleArmyRanged.assignTasks(this);
    }
    /**
     * Checks whether we should spawn for the role.
     * @param {string} role The role of the creep.
     * @param {number} max The maximum number of creeps that should be spawned.
     * @param {function} successCallback The callback to run on success.
     */
    checkSpawn(role, max, successCallback) {
        var armyName = this.name,
            count = _.filter(Cache.creeps[armyName] && Cache.creeps[armyName][role] || [], (c) => c.spawning || c.ticksToLive > 300).length,
            armyLog = Cache.log.army[armyName];

        if (count < max) {
            successCallback();
        }
        if (armyLog && (max > 0 || count > 0)) {
            armyLog.creeps.push({
                role: role,
                count: count,
                max: max
            });
        }
    }
    /**
     * Spawn a creep for this army from within the region.
     * @param {class} Role The class of the role to create the creep for.
     */
    spawnFromRegion(Role) {
        var settings = Role.spawnSettings(this),
            spawns = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(settings.body) && s.room.memory.region === this.region),
            boostRoom, labsInUse, labsToBoostWith, name;
        if (spawns.length === 0) {
            return false;
        }
        if (this.boostRoom) {
            boostRoom = Game.rooms[this.boostRoom];
            labsInUse = boostRoom.memory.labsInUse;
            if (boostRoom && !(labsToBoostWith = Utilities.getLabToBoostWith(boostRoom, Object.keys(settings.boosts).length))) {
                return false;
            }
        }
        name = spawns[0].createCreep(settings.body, `${settings.name}-${this.name}-${Game.time.toFixed(0).substring(4)}`, {role: settings.name, army: this.name, labs: boostRoom ? _.map(labsToBoostWith, (l) => l.id) : [], portals: this.portals});
        Cache.spawning[spawns[0].id] = typeof name !== "number";

        if (typeof name !== "number" && boostRoom) {
            let labIndex = 0;
            _.forEach(settings.boosts, (amount, compound) => {
                labsToBoostWith[labIndex].creepToBoost = name;
                labsToBoostWith[labIndex].resource = compound;
                labsToBoostWith[labIndex].amount = 30 * amount;
                labsInUse.push(labsToBoostWith[labIndex]);

                labIndex++;
            });
            if (Cache.creeps[boostRoom.name]) {
                _.forEach(_.filter(Cache.creeps[boostRoom.name].all, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && _.map(labsToBoostWith, (l) => l.id).indexOf(c.memory.currentTask.id) !== -1), (creep) => {
                    delete creep.memory.currentTask;
                });
            }
        }

        return typeof name !== "number";
    }
    /**
     * Serializes the army to memory.
     */
    toObj() {
        if (this.delete) {
            delete Memory.army[this.name];
        } else {
            Memory.army[this.name] = {
                attackRoom: this.attackRoom,
                boostRoom: this.boostRoom,
                buildRoom: this.buildRoom,
                directive: this.directive,
                dismantle: this.dismantle,
                dismantler: this.dismantler,
                healer: this.healer,
                melee: this.melee,
                ranged: this.ranged,
                region: this.region,
                reinforce: this.reinforce,
                restPosition: this.restPosition,
                safeMode: this.safeMode,
                scheduled: this.scheduled,
                stageRoom: this.stageRoom,
                success: this.success
            };
        }
    }
    /**
     * Deserializes the object from memory.
     * @param {string} armyName The name of the army.
     * @param {object} army The army object from memory.
     * @return {Army} The Army object.
     */
    static fromObj(armyName, army) {
        return new Army(armyName, army);
    }
}

if (Memory.profiling) {
    __require(1,2).registerObject(Army, "Army");
}
module.exports = Army;

return module.exports;
}
/********** End of module 2: ../src/army.js **********/
/********** Start module 3: ../src/cache.js **********/
__modules[3] = function(module, exports) {
//   ###                 #            
/**
 * A class that caches data.
 */
class Cache {
    /**
     * Resets the cache.
     */
    static reset() {
        this.containers = {};
        this.costMatrixes = {};
        this.extensions = {};
        this.extractors = {};
        this.hostiles = {};
        this.labs = {};
        this.links = {};
        this.nukers = {};
        this.portals = {};
        this.powerBanks = {};
        this.powerSpawns = {};
        this.repairableStructures = {};
        this.resources = {};
        this.sortedRepairableStructures = {};
        this.sourceKeepers = {};
        this.spawns = {};
        this.towers = {};
        this.armies = {};
        this.creepTasks = {};
        this.minerals = {};
        this.spawning = {};
        this.rooms = {};
        this.log = {
            events: [],
            hostiles: [],
            creeps: [],
            spawns: [],
            structures: [],
            rooms: {},
            army: {}
        };
        this.credits = Game.market.credits;
        if (Memory.visualizations) {
            this.globalVisual = new RoomVisual();
            this.time = new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}).replace(",", "");
        }
    }
    /**
     * Caches containers in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureContainer[]} The containers in the room.
     */
    static containersInRoom(room) {
        return this.containers[room.name] ? this.containers[room.name] : this.containers[room.name] = _.filter(room.find(FIND_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER);
    }
    /**
     * Caches the cost matrix for a room.
     * @param {Room} room The room to cache for.
     * @return {CostMatrix} The cost matrix for the room.
     */
    static costMatrixForRoom(room) {
        var roomName = room.name;

        if (!room || room.unobservable) {
            return new PathFinder.CostMatrix();
        }

        if (!this.costMatrixes[roomName]) {
            let matrix = new PathFinder.CostMatrix();

            _.forEach(room.find(FIND_STRUCTURES), (structure) => {
                var pos = structure.pos;
                if (structure.structureType === STRUCTURE_ROAD) {
                    matrix.set(pos.x, pos.y, Math.max(1, matrix.get(pos.x, pos.y)));
                } else if (structure.structureType === STRUCTURE_WALL) {
                    matrix.set(pos.x, pos.y, 255);
                } else if (structure.structureType === STRUCTURE_CONTAINER) {
                    matrix.set(pos.x, pos.y, Math.max(10, matrix.get(pos.x, pos.y)));
                } else if (!(structure.structureType === STRUCTURE_RAMPART) || !structure.my) {
                    matrix.set(pos.x, pos.y, 255);
                }
            });

            _.forEach(room.find(FIND_MY_CONSTRUCTION_SITES), (structure) => {
                var pos = structure.pos;
                matrix.set(pos.x, pos.y, Math.max(5, matrix.get(pos.x, pos.y)));
            });
            
            _.forEach(this.portalsInRoom(room), (structure) => {
                var pos = structure.pos;
                matrix.set(pos.x, pos.y, 10);
            });

            if (Memory.avoidSquares[roomName]) {
                _.forEach(Memory.avoidSquares[roomName], (square) => {
                    matrix.set(square.x, square.y, 255);
                });
            }
            
            this.costMatrixes[roomName] = matrix;
        }
        
        return this.costMatrixes[roomName];
    }
    /**
     * Caches extensions in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureExtension[]} The extensions in the room.
     */
    static extensionsInRoom(room) {
        return this.extensions[room.name] ? this.extensions[room.name] : this.extensions[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_EXTENSION);
    }
    /**
     * Caches extractors in a room.
     * @param {Room} room The room to cache for.
     * @return {Structure[]} The extractors in the room.
     */
    static extractorsInRoom(room) {
        return this.extractors[room.name] ? this.extractors[room.name] : this.extractors[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_EXTRACTOR});
    }
    /**
     * Caches hostiles in a room.  Allies are excluded.
     * @param {Room} room The room to cache for.
     * @return {Creep[]} The hostiles in the room.
     */
    static hostilesInRoom(room) {
        var hostiles, memory;

        if (!room || room.unobservable) {
            return [];
        }

        hostiles = this.hostiles[room.name] ? this.hostiles[room.name] : this.hostiles[room.name] = _.filter(room.find(FIND_HOSTILE_CREEPS), (c) => !c.owner || Memory.allies.indexOf(c.owner.username) === -1);
        memory = room.memory;

        if (!memory.hostiles) {
            memory.hostiles = [];
        }

        memory.hostiles = _.map(hostiles, (h) => h.id);

        return hostiles;
    }
    /**
     * Caches labs in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureLab[]} The labs in the room.
     */
    static labsInRoom(room) {
        return this.labs[room.name] ? this.labs[room.name] : this.labs[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_LAB);
    }
    /**
     * Caches links in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureLink[]} The links in the room.
     */
    static linksInRoom(room) {
        return this.links[room.name] ? this.links[room.name] : this.links[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_LINK});
    }
    /**
     * Caches nukers in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureNuker[]} The nukers in the room.
     */
    static nukersInRoom(room) {
        return this.nukers[room.name] ? this.nukers[room.name] : this.nukers[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_NUKER);
    }
    /**
     * Caches portals in a room.
     * @param {Room} room The room to cache for.
     * @return {Structure[]} The portals in the room.
     */
    static portalsInRoom(room) {
        return this.portals[room.name] ? this.portals[room.name] : this.portals[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_PORTAL});
    }
    /**
     * Caches power banks in a room.
     * @param {Room} room The room to cache for.
     * @return {StructurePowerBank[]} The power banks in the room.
     */
    static powerBanksInRoom(room) {
        return this.powerBanks[room.name] ? this.powerBanks[room.name] : this.powerBanks[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_POWER_BANK});
    }
    /**
     * Caches power spawns in a room.
     * @param {Room} room The room to cache for.
     * @return {StructurePowerSpawn[]} The power spawns in the room.
     */
    static powerSpawnsInRoom(room) {
        return this.powerSpawns[room.name] ? this.powerSpawns[room.name] : this.powerSpawns[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_POWER_SPAWN);
    }
    /**
     * Caches repairable structures in a room.
     * @param {Room} room The room to cache for.
     * @return {Structure[]} The structures in the room.
     */
    static repairableStructuresInRoom(room) {
        return this.repairableStructures[room.name] ? this.repairableStructures[room.name] : this.repairableStructures[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => (s.my || s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) && s.hits});
    }
    /**
     * Caches repairable structures in a room, sorted by hits ascending.
     * @param {Room} room The room to cache for.
     * @return {Structure[]} The structures in the room.
     */
    static sortedRepairableStructuresInRoom(room) {
        return this.sortedRepairableStructures[room.name] ? this.sortedRepairableStructures[room.name] : this.sortedRepairableStructures[room.name] = this.repairableStructuresInRoom(room).sort((a, b) => a.hits - b.hits);
    }
    /**
     * Caches source keepers in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureKeeperLair[]} The source keepers in the room.
     */
    static sourceKeepersInRoom(room) {
        return this.sourceKeepers[room.name] ? this.sourceKeepers[room.name] : this.sourceKeepers[room.name] = room.find(FIND_HOSTILE_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_KEEPER_LAIR});
    }
    /**
     * Caches spawns in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureSpawn[]} The spawns in the room.
     */
    static spawnsInRoom(room) {
        return this.spawns[room.name] ? this.spawns[room.name] : this.spawns[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_SPAWN);
    }
    /**
     * Caches towers in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureTower[]} The towers in the room.
     */
    static towersInRoom(room) {
        return this.towers[room.name] ? this.towers[room.name] : this.towers[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_TOWER);
    }
    /**
     * Caches resources in a room.
     * @param {Room} room The room to cache for.
     * @return {Resource[]} The resources in the room.
     */
    static resourcesInRoom(room) {
        return this.resources[room.name] ? this.resources[room.name] : this.resources[room.name] = room.find(FIND_DROPPED_RESOURCES).sort((a, b) => b.amount - a.amount);
    }

}

if (Memory.profiling) {
    __require(1,3).registerObject(Cache, "Cache");
}
module.exports = Cache;

return module.exports;
}
/********** End of module 3: ../src/cache.js **********/
/********** Start module 4: ../src/commands.js **********/
__modules[4] = function(module, exports) {
const Cache = __require(3,4);
/**
 * Commands intended to be used in the Screeps console.  Can be used elsewhere as well.
 */
class Commands {
    /**
     * Adds an ally.  All creeps belonging to this user will not be attacked.
     * @param {string} name The ally to add.
     */
    static addAlly(name) {
        Memory.allies.push(name);
    }
    /**
     * Adds a sign to a room.  When a reserver or upgrader is near the controller, it will apply the sign.
     * @param {string} roomName The name of the room to sign.
     * @param {string} text The text to sign.
     */
    static addSign(roomName, text) {
        if (!Memory.signs) {
            Memory.signs = {};
        }
        if (text) {
            Memory.signs[roomName] = text;
        } else {
            delete Memory.signs[roomName];
        }
    }
    /**
     * Attacks the controller in a room.
     * @param {string} fromRoomName The name of the room to spawn the converter from.
     * @param {string} toRoomName The name of the room to attack the controller in.
     * @param {bool} attack Whether to attack the room's controller or not.
     */
    static attackRoomController(fromRoomName, toRoomName, attack) {
        if (!Memory.maxCreeps.converter) {
            Memory.maxCreeps.converter = {};
        }

        if (!Memory.maxCreeps.converter[fromRoomName]) {
            Memory.maxCreeps.converter[fromRoomName] = {};
        }
        
        if (attack) {
            Memory.maxCreeps.converter[fromRoomName][toRoomName] = true;
        } else {
            delete Memory.maxCreeps.converter[fromRoomName][toRoomName];
        }
    }
    /**
     * Directs creeps to avoid a room.
     * @param {string} room The name of the room to avoid.
     * @param {bool} avoid Whether to avoid the room or not.
     */
    static avoidRoom(roomName, avoid) {
        if (avoid && Memory.avoidRooms.indexOf(roomName) === -1) {
            Memory.avoidRooms.push(roomName);
        }
        if (!avoid) {
            _.remove(Memory.avoidRooms, (r) => r === roomName);
        }
    }
    /**
     * Directs creeps to avoid a square.
     * @param {number} x The X coordinate of the square to avoid.
     * @param {number} y The Y coordinate of the square to avoid.
     * @param {string} roomName The name of the room of the square to avoid.
     * @param {bool} avoid Whether to avoid the square or not.
     */
    static avoidSquare(x, y, roomName, avoid) {
        if (avoid) {
            if (!Memory.avoidSquares[roomName]) {
                Memory.avoidSquares[roomName] = [];
            }
            Memory.avoidSquares[roomName].push({x: x, y: y});
        }
        if (!avoid) {
            if (Memory.avoidSquares[roomName]) {
                _.remove(Memory.avoidSquares[roomName], (s) => s.x === x && s.y === y);
            }
        }
    }
    /**
     * Claim a room that's currently being reserved.  Only works if you already have a reserver on the controller.
     * @param {string} roomName The name of the room to claim.
     */
    static claimMine(roomName) {
        if (Game.rooms[roomName] && Cache.creeps[roomName]) {
            _.forEach(Cache.creeps[roomName].remoteReserver, (creep) => {
                creep.claimController(Game.rooms[roomName].controller);
            });
        }
    }
    /**
     * Claims a room.
     * @param {string} fromRoomName The name of the room to spawn the claimer from.
     * @param {string} toRoomName The name of the room to claim.
     * @param {bool} claim Whether to claim the room or not.
     */
    static claimRoom(fromRoomName, toRoomName, claim) {
        if (!Memory.maxCreeps.claimer) {
            Memory.maxCreeps.claimer = {};
        }

        if (!Memory.maxCreeps.claimer[fromRoomName]) {
            Memory.maxCreeps.claimer[fromRoomName] = {};
        }
        
        if (claim) {
            Memory.maxCreeps.claimer[fromRoomName][toRoomName] = true;
        } else {
            delete Memory.maxCreeps.claimer[fromRoomName][toRoomName];
        }
    }
    /**
     * Creates an army.
     * @param {string} armyName The name of the army.
     * @param {object} options The options for the army.
     */
    static createArmy(armyName, options) {
        if (options === undefined) {
            delete Memory.army[armyName];
        } else {
            Memory.army[armyName] = options;
            Memory.army[armyName].directive = "preparing";
        }
    }
    /**
     * Dismantle a location within a room.
     * @param {number} x The X coordinate of the object to dismantle.
     * @param {number} y The Y coordinate of the object to dismantle.
     * @param {string} roomName The room to dismantle in.
     */
    static dismantle(x, y, roomName) {
        if (!Memory.dismantle) {
            Memory.dismantle = {};
        }

        if (!Memory.dismantle[roomName]) {
            Memory.dismantle[roomName] = [];
        }

        Memory.dismantle[roomName].push({x: x, y: y});
    }
    /**
     * Recover from an emergency.
     */
    static recover() {
        _.forEach(Game.spawns, (spawn) => {spawn.createCreep([MOVE, MOVE, CARRY, CARRY, CARRY, CARRY], `storer-emerg-${spawn.room.name}-${spawn.name}`, {role: "storer", home: spawn.room.name})});
    }
    /**
     * Removes an ally.
     * @param {string} name The ally to remove.
     */
    static removeAlly(name) {
        _.pull(Memory.allies, name);
    }
    /**
     * Resets a wartime cost matrix for a room.  It will be automatically recalculated.
     * @param {string} roomName The name of the room to reset the base matrix for.
     */
    static resetBaseMatrix(roomName) {
        Memory.baseMatrixes[roomName] = {};
    }
    /**
     * Set a container's source.  Useful when you want to have a container for a source be at a location different than default, ie: E36N11.
     * @param {string} containerId The container ID to assign to a source.
     * @param {string} sourceId The source ID to assign to a container.
     */
    static setContainerSource(containerId, sourceId) {
        Memory.containerSource[containerId] = sourceId;
    }
    /**
     * Set the room type.  Options should be an object containing at least a "type" key.
     * @param {string} roomName The name of the room.
     * @param {string} region The region of the room.
     * @param {object} options The options for the room.
     */
    static setRoomType(roomName, region, options) {
        if (options === undefined) {
            delete Memory.rooms[roomName].roomType;
        } else {
            if (!Memory.rooms[roomName]) {
                Memory.rooms[roomName] = {};
            }
            Memory.rooms[roomName].roomType = options;
            Memory.rooms[roomName].region = region;
        }
    }
    /**
     * Starts all creeps moving again.
     */
    static startAllCreeps() {
        _.forEach(Game.creeps, (creep) => {
            delete creep.memory.stop;
        });
    }
    /**
     * Starts a creep moving again.
     * @param {string} name The name of the creep to start moving.
     */
    static startCreep(name) {
        if (Game.creeps[name]) {
            delete Game.creeps[name].memory.stop;
        }
    }
    /**
     * Stops a creep from moving.
     * @param {string} name The name of the creep to stop moving.
     */
    static stopCreep(name) {
        if (Game.creeps[name]) {
            Game.creeps[name].memory.stop = true;
        }
    }
}

if (Memory.profiling) {
    __require(1,4).registerObject(Commands, "Commands");
}
module.exports = Commands;

return module.exports;
}
/********** End of module 4: ../src/commands.js **********/
/********** Start module 5: ../src/drawing.js **********/
__modules[5] = function(module, exports) {
//  ####                          #                 
/**
 * A class of static functions to support drawing visuals.
 */
class Drawing {
    /**
     * Draw a progress bar on a visual.
     * @param {RoomVisual} visual The RoomVisual object to draw to.
     * @param {number} x The X coordinate of the progress bar.
     * @param {number} y The Y coordinate of the progress bar. 
     * @param {number} w The width of the progress bar.
     * @param {number} h The height of the progress bar.
     * @param {number} value The current value for the progress bar.
     * @param {number} max The maximum value for the progress bar.
     * @param {object} options The options for the progress bar.
     */
    static progressBar(visual, x, y, w, h, value, max, options) {
        if (options.showMax === undefined) {
            options.showMax = true;
        }
        if (options.valueDecimals === undefined) {
            options.valueDecimals = 0;
        }
        visual
            .rect(x, y, w, h, {fill: options.background})
            .rect(x, y, w * Math.min(value / max, 1), h, {fill: options.bar})
            .text(`${options.label ? `${options.label} ` : ""}${value.toFixed(options.valueDecimals)}${options.showMax ? `/${max.toFixed(0)}` : ""}${options.showDetails ? ` (${(100 * value / max).toFixed(3)}%) ${(max - value).toFixed(0)} to go` : ""}`, x + w / 2, y + h / 2 + 0.175, {align: "center", color: options.color, font: options.font});
    }
    /**
     * Draws a graphical representation of a resource.
     * @param {RoomVisual} visual The RoomVisual object to draw to.
     * @param {number} x The X coordinate of the resource.
     * @param {number} y The Y coordinate of the resource. 
     * @param {number} size The size of the resource.
     * @param {string} resource The resource to draw.
     * @param {object} options The options for the resource.
     */
    static resource(visual, x, y, size, resource, options) {
        switch (resource) {
            case RESOURCE_ENERGY:
                visual.circle(x, y, {radius: 0.625 * size / 2, fill: "#FFE664", opacity: options.opacity});
                break;
            case RESOURCE_POWER:
                visual.circle(x, y, {radius: 0.625 * size / 2, fill: "#FF1930", opacity: options.opacity});
                break;
            case RESOURCE_HYDROGEN:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#B4B4B4", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#4C4C4C", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#B4B4B4", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_OXYGEN:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#B4B4B4", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#4C4C4C", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#B4B4B4", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_UTRIUM:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#50D7F9", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#006181", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#50D7F9", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_KEANIUM:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#A071FF", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#371383", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#A071FF", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_LEMERGIUM:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#00F4A2", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#236144", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#00F4A2", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_ZYNTHIUM:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#FDD388", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#5D4C2E", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#FDD388", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYST:
                visual
                    .circle(x, y, {radius: 0.4375 * size, fill: "#FF7B7B", opacity: options.opacity})
                    .circle(x, y, {radius: 0.375 * size, fill: "#592121", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#FF7B7B", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_HYDROXIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#B4B4B4", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#666666", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_ZYNTHIUM_KEANITE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#B4B4B4", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#666666", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_UTRIUM_LEMERGITE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#B4B4B4", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#666666", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_GHODIUM:
                visual
                    .rect(x - size / 2, y - size / 2, size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x, y + 0.2 * size, {color: "#666666", size: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_UTRIUM_HYDRIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#50D7F9", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#006181", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_UTRIUM_OXIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#50D7F9", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#006181", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_KEANIUM_HYDRIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#A071FF", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#371383", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_KEANIUM_OXIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#A071FF", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#371383", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_LEMERGIUM_HYDRIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#00F4A2", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#236144", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_LEMERGIUM_OXIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#00F4A2", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#236144", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_ZYNTHIUM_HYDRIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#FDD388", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#5D4C2E", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_ZYNTHIUM_OXIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#FDD388", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#5D4C2E", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_GHODIUM_HYDRIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#666666", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_GHODIUM_OXIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 1.375 * size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x + 0.1875 * size, y + 0.2 * size, {color: "#666666", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_UTRIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#50D7F9", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#006181", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_UTRIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#50D7F9", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#006181", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_KEANIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#A071FF", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#371383", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_KEANIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#A071FF", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#371383", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_LEMERGIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#00F4A2", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#236144", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_LEMERGIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#00F4A2", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#236144", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_ZYNTHIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#FDD388", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#5D4C2E", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_ZYNTHIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#FDD388", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#5D4C2E", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_GHODIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#666666", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_GHODIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.125 * size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x + 0.5 * size, y + 0.2 * size, {color: "#666666", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_UTRIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#50D7F9", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#006181", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_UTRIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#50D7F9", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#006181", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_KEANIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#A071FF", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#371383", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_KEANIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#A071FF", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#371383", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_LEMERGIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#00F4A2", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#236144", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#00F4A2", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#236144", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_ZYNTHIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#FDD388", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#5D4C2E", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#FDD388", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#5D4C2E", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_GHODIUM_ACID:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#666666", font: 0.625 * size, opacity: options.opacity});
                break;
            case RESOURCE_CATALYZED_GHODIUM_ALKALIDE:
                visual
                    .rect(x - size / 2, y - size / 2, 2.5 * size, size, {fill: "#FFFFFF", opacity: options.opacity})
                    .text(resource, x + 0.725 * size, y + 0.2 * size, {color: "#666666", font: 0.625 * size, opacity: options.opacity});
                break;
        }
    }
    /**
     * Creates a sparkline series, which is a mini line graph.
     * @param {RoomVisual} visual The RoomVisual object to draw to.
     * @param {number} x The X coordinate of the sparkline.
     * @param {number} y The Y coordinate of the sparkline. 
     * @param {number} w The width of the sparkline.
     * @param {number} h The height of the sparkline.
     * @param {object[]} values The series of values for the sparkline.
     * @param {object[]} options The series of options for the sparkline.
     * @example
     * // This draws a sparkline of values from the Memory.status.cpu object.
     * Drawing.sparkline(Cache.globalVisual, 23.5, 1, 18, 2, _.map(Memory.stats.cpu, (v, i) => ({cpu: Memory.stats.cpu[i], bucket: Memory.stats.bucket[i], limit: Game.cpu.limit})), [{key: "limit", min: Game.cpu.limit * 0.5, max: Game.cpu.limit * 1.5, stroke: "#c0c0c0", opacity: 0.25}, {key: "cpu", min: Game.cpu.limit * 0.5, max: Game.cpu.limit * 1.5, stroke: "#ffff00", opacity: 0.5}, {key: "bucket", min: 0, max: 10000, stroke: "#00ffff", opacity: 0.5, font: "0.5 Arial"}]);
     */
    static sparkline(visual, x, y, w, h, values, options) {
        visual.rect(x, y, w, h, {fill: "#404040", opacity: 0.5});
        _.forEach(options, (option) => {
            visual.poly(_.map(values, (v, i) => [x + w * (i / (values.length - 1)), y + h * (1 - (v[option.key] - option.min) / (option.max - option.min))]), option);
        });
    }
}

if (Memory.profiling) {
    __require(1,5).registerObject(Drawing, "Drawing");
}
module.exports = Drawing;

return module.exports;
}
/********** End of module 5: ../src/drawing.js **********/
/********** Start module 6: ../src/market.js **********/
__modules[6] = function(module, exports) {
const Cache = __require(3,6),
    Utilities = __require(8,6);
/**
 * A class for dealing with and caching market data.
 */
class Market {
    /**
     * Gets and caches all of the orders on the market.
     * @return {object[]} All of the orders on the market.
     */
    static getAllOrders() {
        if (!Market.orders || Game.cpu.bucket >= Memory.marketBucket) {
            Market.orders = Game.market.getAllOrders();
            delete Market.filteredOrders;
        }
        
        return Market.orders;
    }
    /**
     * Gets all orders on the market filtered by type (buy/sell) and resource type.
     * @return {object} All of the orders on the market, filtered by type and resource type.
     */
    static getFilteredOrders() {
        if (!Market.filteredOrders) {
            Market.filteredOrders = Utilities.nest(_.filter(Market.getAllOrders(), (o) => o.amount > 0), [(d) => d.type, (d) => d.resourceType]);
            _.forEach(Market.filteredOrders.sell, (orders, resource) => {
                Market.filteredOrders.sell[resource].sort((a, b) => a.price - b.price);
            });
            _.forEach(Market.filteredOrders.buy, (orders, resource) => {
                Market.filteredOrders.buy[resource].sort((a, b) => b.price - a.price);
            });
        }
        
        return Market.filteredOrders;
    }
    /**
     * Attempt to deal on the market.
     * @param {string} orderId The order ID to fill.
     * @param {number} amount The quantity of the order to fill.
     * @param {string} yourRoomName The room name containing the terminal to deal from.
     * @return {number} The return value from Game.market.deal.
     */
    static deal(orderId, amount, yourRoomName) {
        var ret = Game.market.deal(orderId, amount, yourRoomName),
            order = _.find(Market.orders, (m) => m.id === orderId);
        
        if (ret === OK) {
            if (order) {
                if (order.type === "sell") {
                    Cache.credits -= order.amount * order.price;
                }
                if (order.amount <= amount) {
                    Cache.log.events.push(`${yourRoomName} ${order.resourceType} x${amount} @ ${order.price} completed, ${order.type} sold out ${order.id}`);
                    _.remove(Market.filteredOrders[order.type][order.resourceType], (m) => m.id === orderId);
                    _.remove(Market.orders, (m) => m.id === orderId);
                } else {
                    order.amount -= amount;
                    Cache.log.events.push(`${yourRoomName} ${order.resourceType} x${amount} @ ${order.price} completed, ${order.type} ${order.amount} remaining on ${order.id}`);
                }
            }
        } else {
            if (order) {
                Cache.log.events.push(`${yourRoomName} failed to process order ID ${orderId}: ${ret}`);
                _.remove(Market.filteredOrders[order.type][order.resourceType], (m) => m.id === orderId);
                _.remove(Market.orders, (m) => m.id === orderId);
            }
        }
        
        return ret;
    }
}

if (Memory.profiling) {
    __require(1,6).registerObject(Market, "Market");
}
module.exports = Market;

return module.exports;
}
/********** End of module 6: ../src/market.js **********/
/********** Start module 7: ../src/minerals.js **********/
__modules[7] = function(module, exports) {
var Minerals = {};

Minerals[RESOURCE_HYDROGEN] = [];
Minerals[RESOURCE_OXYGEN] = [];
Minerals[RESOURCE_ZYNTHIUM] = [];
Minerals[RESOURCE_KEANIUM] = [];
Minerals[RESOURCE_UTRIUM] = [];
Minerals[RESOURCE_LEMERGIUM] = [];
Minerals[RESOURCE_CATALYST] = [];
Minerals[RESOURCE_HYDROXIDE] = [RESOURCE_HYDROGEN, RESOURCE_OXYGEN];
Minerals[RESOURCE_ZYNTHIUM_KEANITE] = [RESOURCE_ZYNTHIUM, RESOURCE_KEANIUM];
Minerals[RESOURCE_UTRIUM_LEMERGITE] = [RESOURCE_UTRIUM, RESOURCE_LEMERGIUM];
Minerals[RESOURCE_GHODIUM] = [RESOURCE_ZYNTHIUM_KEANITE, RESOURCE_UTRIUM_LEMERGITE];
Minerals[RESOURCE_UTRIUM_HYDRIDE] = [RESOURCE_UTRIUM, RESOURCE_HYDROGEN];
Minerals[RESOURCE_UTRIUM_OXIDE] = [RESOURCE_UTRIUM, RESOURCE_OXYGEN];
Minerals[RESOURCE_KEANIUM_HYDRIDE] = [RESOURCE_KEANIUM, RESOURCE_HYDROGEN];
Minerals[RESOURCE_KEANIUM_OXIDE] = [RESOURCE_KEANIUM, RESOURCE_OXYGEN];
Minerals[RESOURCE_LEMERGIUM_HYDRIDE] = [RESOURCE_LEMERGIUM, RESOURCE_HYDROGEN];
Minerals[RESOURCE_LEMERGIUM_OXIDE] = [RESOURCE_LEMERGIUM, RESOURCE_OXYGEN];
Minerals[RESOURCE_ZYNTHIUM_HYDRIDE] = [RESOURCE_ZYNTHIUM, RESOURCE_HYDROGEN];
Minerals[RESOURCE_ZYNTHIUM_OXIDE] = [RESOURCE_ZYNTHIUM, RESOURCE_OXYGEN];
Minerals[RESOURCE_GHODIUM_HYDRIDE] = [RESOURCE_GHODIUM, RESOURCE_HYDROGEN];
Minerals[RESOURCE_GHODIUM_OXIDE] = [RESOURCE_GHODIUM, RESOURCE_OXYGEN];
Minerals[RESOURCE_UTRIUM_ACID] = [RESOURCE_UTRIUM_HYDRIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_UTRIUM_ALKALIDE] = [RESOURCE_UTRIUM_OXIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_KEANIUM_ACID] = [RESOURCE_KEANIUM_HYDRIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_KEANIUM_ALKALIDE] = [RESOURCE_KEANIUM_OXIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_LEMERGIUM_ACID] = [RESOURCE_LEMERGIUM_HYDRIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_LEMERGIUM_ALKALIDE] = [RESOURCE_LEMERGIUM_OXIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_ZYNTHIUM_ACID] = [RESOURCE_ZYNTHIUM_HYDRIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_ZYNTHIUM_ALKALIDE] = [RESOURCE_ZYNTHIUM_OXIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_GHODIUM_ACID] = [RESOURCE_GHODIUM_HYDRIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_GHODIUM_ALKALIDE] = [RESOURCE_GHODIUM_OXIDE, RESOURCE_HYDROXIDE];
Minerals[RESOURCE_CATALYZED_UTRIUM_ACID] = [RESOURCE_UTRIUM_ACID, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_UTRIUM_ALKALIDE] = [RESOURCE_UTRIUM_ALKALIDE, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_KEANIUM_ACID] = [RESOURCE_KEANIUM_ACID, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_KEANIUM_ALKALIDE] = [RESOURCE_KEANIUM_ALKALIDE, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_LEMERGIUM_ACID] = [RESOURCE_LEMERGIUM_ACID, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE] = [RESOURCE_LEMERGIUM_ALKALIDE, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_ZYNTHIUM_ACID] = [RESOURCE_ZYNTHIUM_ACID, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE] = [RESOURCE_ZYNTHIUM_ALKALIDE, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_GHODIUM_ACID] = [RESOURCE_GHODIUM_ACID, RESOURCE_CATALYST];
Minerals[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] = [RESOURCE_GHODIUM_ALKALIDE, RESOURCE_CATALYST];

module.exports = Minerals;

return module.exports;
}
/********** End of module 7: ../src/minerals.js **********/
/********** Start module 8: ../src/utilities.js **********/
__modules[8] = function(module, exports) {
var Cache = __require(3,8);

class Utilities {
    static nest(seq, keys) {
        if (!keys.length) {
            return seq;
        }

        return _.mapValues(_.groupBy(seq, keys[0]), function (value) { 
            return Utilities.nest(value, keys.slice(1));
        });
    }
    
    static creepsWithNoTask(creeps) {
        return _.filter(creeps, (c) => !c.memory.currentTask || c.memory.currentTask.unimportant);
    }

    static objectsClosestToObj(objects, obj) {
        var objId = obj.id;

        if (objects.length === 0) {
            return [];
        }

        if (!obj) {
            return objects;
        }
        
        var objList = _.map(objects, (o) => {
            var oId = o.id,
                range;
            
            if (Memory.ranges && Memory.ranges[objId] && Memory.ranges[objId][oId]) {
                range = Memory.ranges[objId][oId];
            } else {
                range = obj.pos.getRangeTo(o);
                if (!(o instanceof Creep) && !(obj instanceof Creep)) {
                    if (!Memory.ranges) {
                        Memory.ranges = {};
                    }
                    if (!Memory.ranges[objId]) {
                        Memory.ranges[objId] = {};
                    }
                    Memory.ranges[objId][oId] = range;
                }
            }

            return {
                object: o,
                distance: range
            };
        });
        
        objList.sort((a, b) => a.distance - b.distance);
        
        return _.map(objList, (o) => o.object);
    }

    static getEmptyPosAroundPos(pos) {
        var count = 0,
            x, y, checkPos;

        for (x = pos.x - 1; x < pos.x + 2; x++) {
            for (y = pos.y - 1; y < pos.y + 2; y++) {
                if (x === pos.x && y === pos.y) {
                    continue;
                }

                checkPos = new RoomPosition(x, y, pos.roomName);
                if (checkPos) {
                    count += _.filter(checkPos.look(), (o) => o.type === "terrain" && o.terrain !== "wall").length;
                }
            }
        }

        return count;
    }

    static checkSiteIsClear(pos) {
        var siteClear = true,
            x = pos.x,
            y = pos.y,
            roomName = pos.roomName,
            room = Game.rooms[roomName],
            structures;
        if (
            new RoomPosition(x, y, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" ||
            (
                new RoomPosition(x - 1, y, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" &&
                new RoomPosition(x + 1, y, roomName).lookFor(LOOK_TERRAIN)[0] === "wall"
            ) ||
            (
                new RoomPosition(x, y - 1, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" &&
                new RoomPosition(x, y + 1, roomName).lookFor(LOOK_TERRAIN)[0] === "wall"
            )
        ) {
            return false;
        }
        _.forEach(room.find(FIND_SOURCES), (source) => {
            return siteClear = pos.getRangeTo(source) > 1;
        });
        if (!siteClear) {
            return false;
        }
        _.forEach(room.find(FIND_MINERALS), (source) => {
            return siteClear = pos.getRangeTo(source) > 1;
        });
        if (!siteClear) {
            return false;
        }
        if (pos.getRangeTo(room.controller) <= 4) {
            return false;
        }
        structures = _.filter(pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType !== "rampart");
        if (structures.length === 0) {
            return true;
        }
        if (_.filter(structures, (s) => [STRUCTURE_ROAD, STRUCTURE_WALL].indexOf(s.structureType) !== -1).length !== structures.length) {
            return false;
        }
        return structures;
    }

    static buildStructures(room, structureType, structuresToBuild, buildAroundObj) {
        var distanceFromSpawn = 1,
            buildAroundPos = buildAroundObj.pos,
            buildAroundx = buildAroundPos.x,
            buildAroundy = buildAroundPos.y,
            x, y, siteIsClear;

        while (structuresToBuild > 0 && distanceFromSpawn < 50) {
            for (x = buildAroundx - distanceFromSpawn; x <= buildAroundx + distanceFromSpawn; x += 2) {
                for (y = buildAroundy - distanceFromSpawn; y <= buildAroundy + distanceFromSpawn; y += (Math.abs(buildAroundx - x) === distanceFromSpawn ? 2 : 2 * distanceFromSpawn)) {
                    if (x < 1 || x > 48 || y < 1 || y > 48) {
                        continue;
                    }
                    if (_.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (s) => s.pos.x === x && s.pos.y === y).length > 0) {
                        continue;
                    }
                    siteIsClear = Utilities.checkSiteIsClear(new RoomPosition(x, y, room.name));
                    if (siteIsClear === false) {
                        continue;
                    }
                    if (siteIsClear !== true) {
                        _.forEach(siteIsClear, (structure) => {
                            structure.destroy();
                        });
                    }
                    room.createConstructionSite(x, y, structureType);
                    structuresToBuild--;
                    if (structuresToBuild === 0) {
                        break;
                    }
                }
                if (structuresToBuild === 0) {
                    break;
                }
            }

            distanceFromSpawn++;
        }
    }
    
    static getBodypartCost(body) {
        return _.sum(_.map(body, (b) => BODYPART_COST[b]));
    }

    static getSourceLabs(room) {
        var labs = Cache.labsInRoom(room),
            sourceLabs = [];

        _.forEach(labs, (lab) => {
            if (Utilities.objectsClosestToObj(labs, lab)[labs.length - 1].pos.getRangeTo(lab) <= 2) {
                sourceLabs.push(lab.id);
                if (sourceLabs.length >= 2) {
                    return false;
                }
            }
        });

        return sourceLabs;
    }

    static getLabToBoostWith(room, count) {
        var labQueue = room.memory.labQueue,
            sourceLabs = (labQueue && labQueue.sourceLabs) ? labQueue.sourceLabs : [],
            labs = [],
            labToUse = null,
            lab, labUsed;

        if (!count) {
            count = 1;
        }

        if (sourceLabs.length === 0) {
            sourceLabs = Utilities.getSourceLabs(room);
        }

        if (!room.memory.labsInUse) {
            room.memory.labsInUse = [];
        }

        for (let index = 0; index < count; index++) {
            labToUse = {};
            lab = _.filter(Cache.labsInRoom(room), (l) => sourceLabs.indexOf(l.id) === -1 && _.map(room.memory.labsInUse, (liu) => liu.id).indexOf(l.id) === -1 && _.map(labs, (liu) => liu.id).indexOf(l.id) === -1);

            if (lab.length > 0) {
                labToUse = {
                    id: lab[0].id,
                    pause: false
                };
            }
            if (!labToUse || !labToUse.id) {
                labToUse = {
                    id: _.filter(sourceLabs, (l) => _.map(room.memory.labsInUse, (liu) => liu.id).indexOf(l) === -1 && _.map(labs, (liu) => liu.id).indexOf(l) === -1)[0],
                    pause: true
                }
                
                if (!labToUse.id) {
                    return false;
                }
                labUsed = Game.getObjectById(labToUse.id);
                if (labUsed.mineralAmount > 0) {
                    labToUse.status = "emptying";
                    labToUse.oldResource = labUsed.mineralType;
                    labToUse.oldAmount = labUsed.mineralAmount;
                }
            }
            if (!labToUse.id) {
                return false;
            }

            labs.push(labToUse);
        }

        return labs;
    }

    static roomLabsArePaused(room) {
        return room.memory.labsInUse && _.filter(room.memory.labsInUse, (l) => l.pause).length > 0;
    }
    
    static getControllerOwner(controller) {
        if (controller.owner) {
            return controller.owner.username;
        }
        if (controller.reservation) {
            return controller.reservation.owner;
        }
        return "";
    }
}

if (Memory.profiling) {
    __require(1,8).registerObject(Utilities, "Utilities");
}
module.exports = Utilities;

return module.exports;
}
/********** End of module 8: ../src/utilities.js **********/
/********** Start module 9: ../src/role.armyDismantler.js **********/
__modules[9] = function(module, exports) {
const Assign = __require(54,9),
    Cache = __require(3,9),
    Utilities = __require(8,9);
/**
 * Represents the dismantler role in the army.
 */
class RoleArmyDismantler {
    /**
     * Gets the settings for spawning a creep.
     * @param {Army} army The army to spawn the creep for.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(army) {
        var units = army.dismantler.units,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH],
            boosts;

        body.push(...Array(units).fill(WORK));
        body.push(...Array(units + 5).fill(MOVE));

        if (army.boostRoom) {
            boosts = {
                RESOURCE_CATALYZED_GHODIUM_ALKALIDE: 5,
                RESOURCE_CATALYZED_ZYNTHIUM_ACID: units
            };
        }

        return {
            body: body,
            boosts: boosts,
            name: "armyDismantler"
        };
    }
    /**
     * Assign tasks to creeps of this role.
     * @param {Army} army The army to assign tasks to.
     */
    static assignTasks(army) {
        switch (army.directive) {
            case "building":
                this.assignBuildingTasks(army);
                break;
            case "staging":
                this.assignStagingTasks(army);
                break;
            case "dismantle":
                this.assignDismantleTasks(army);
                break;
            case "attack":
                this.assignAttackTasks(army);
                break;
        }
    }
    /**
     * Assignments for the building directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignBuildingTasks(army) {
        var creeps = creeps = Cache.creeps[army.name],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyDismantler || []), (c) => !c.spawning);
        Assign.getBoost(creepsWithNoTask, "Boosting");
        
        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToRoom(creepsWithNoTask, army.buildRoom, "Building");
    }
    /**
     * Assignments for the staging directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignStagingTasks(army) {
        var creeps = creeps = Cache.creeps[army.name];
        Assign.moveToRoom(_.filter(Utilities.creepsWithNoTask(creeps && creeps.armyDismantler || []), (c) => !c.spawning), army.stageRoom, "Staging");
    }
    /**
     * Assignments for the dismantle directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignDismantleTasks(army) {
        var armyName = army.name,
            creeps = Cache.creeps[armyName],
            dismantlerCreeps = creeps && creeps.armyDismantler || [],
            attackRoomName = army.attackRoom,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(dismantlerCreeps), (c) => !c.spawning);
        Assign.retreatArmyUnitOrMoveToHealer(dismantlerCreeps, creeps && creeps.armyHealer || [], army.stageRoom, attackRoomName, 0.8, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.dismantleArmyTarget(creepsWithNoTask, attackRoomName, army.dismantle, "Dismantle");
        
        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
    }
    /**
     * Assignments for the attack directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignAttackTasks(army) {
        var armyName = army.name,
            creeps = Cache.creeps[armyName],
            dismantlerCreeps = creeps && creeps.armyDismantler || [],
            attackRoomName = army.attackRoom,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(dismantlerCreeps), (c) => !c.spawning),
            restPosition;
        Assign.retreatArmyUnit(dismantlerCreeps, creeps && creeps.armyHealer || [], army.stageRoom, attackRoomName, 0.8, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.dismantleHostileStructures(creepsWithNoTask, attackRoomName, "Dismantle");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.stomp(creepsWithNoTask, army.hostileConstructionSites, "Stomping");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        if (restPosition = army.restPosition) {
            Assign.moveToPos(creepsWithNoTask, new RoomPosition(restPosition.x, restPosition.y, restPosition.room), undefined, "Attacking");
        } else {
            Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
        }
    }
}

if (Memory.profiling) {
    __require(1,9).registerObject(RoleArmyDismantler, "RoleArmyDismantler");
}
module.exports = RoleArmyDismantler;

return module.exports;
}
/********** End of module 9: ../src/role.armyDismantler.js **********/
/********** Start module 10: ../src/role.armyHealer.js **********/
__modules[10] = function(module, exports) {
const Assign = __require(54,10),
    Cache = __require(3,10),
    Utilities = __require(8,10);
/**
 * Represents the healer role in the army.
 */
class RoleArmyHealer {
    /**
     * Gets the settings for spawning a creep.
     * @param {Army} army The army to spawn the creep for.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(army) {
        var units = army.healer.units,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH],
            boosts;

        body.push(...Array(units - 1).fill(HEAL));
        body.push(...Array(units + 5).fill(MOVE));
        body.push(HEAL);

        if (army.boostRoom) {
            boosts = {
                RESOURCE_CATALYZED_GHODIUM_ALKALIDE: 5,
                RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE: units
            };
        }

        return {
            body: body,
            boosts: boosts,
            name: "armyHealer"
        };
    }
    /**
     * Assign tasks to creeps of this role.
     * @param {Army} army The army to assign tasks to.
     */
    static assignTasks(army) {
        var creeps = Cache.creeps[army.name];
        Assign.escort(creeps && creeps.armyHealer || [], "Healing");

        switch (army.directive) {
            case "building":
                this.assignBuildingTasks(army);
                break;
            case "staging":
                this.assignStagingTasks(army);
                break;
            case "dismantle":
                this.assignDismantleTasks(army);
                break;
            case "attack":
                this.assignAttackTasks(army);
                break;
        }
    }
    /**
     * Assignments for the building directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignBuildingTasks(army) {
        var creeps = Cache.creeps[army.name],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyHealer || []), (c) => !c.spawning && !c.memory.escorting);
        Assign.getBoost(creepsWithNoTask, "Boosting");
        
        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.heal(creepsWithNoTask, _.filter(creeps && creeps.all || [], (c) => c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax), "Healing");
        
        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToRoom(creepsWithNoTask, army.buildRoom, "Building");
    }
    /**
     * Assignments for the staging directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignStagingTasks(army) {
        var creeps = Cache.creeps[army.name],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyHealer || []), (c) => !c.spawning && !c.memory.escorting);
        Assign.heal(creepsWithNoTask, _.filter(creeps && creeps.all || [], (c) => c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax), "Healing");
        
        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToRoom(creepsWithNoTask, army.stageRoom, "Staging");
    }
    /**
     * Assignments for the dismantle directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignDismantleTasks(army) {
        var creeps = Cache.creeps[army.name],
            healerCreeps = creeps && creeps.armyHealer || [],
            attackRoomName = army.attackRoom,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(healerCreeps), (c) => !c.spawning && !c.memory.escorting),
            dismantle;
        Assign.retreatArmyUnit(healerCreeps, healerCreeps, army.stageRoom, attackRoomName, 0.8, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.heal(creepsWithNoTask, _.filter(creeps && creeps.all || [], (c) => c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax), "Healing");
        
        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (Game.rooms[attackRoomName] && (dismantle = army.dismantle).length > 0) {
            Assign.moveToPos(creepsWithNoTask, dismantle[0].pos, 3, "Attacking");

            _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
        Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
    }
    /**
     * Assignments for the attack directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignAttackTasks(army) {
        var creeps = Cache.creeps[army.name],
            healerCreeps = creeps && creeps.armyHealer || [],
            attackRoomName = army.attackRoom,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(healerCreeps), (c) => !c.spawning && !c.memory.escorting),
            attackRoom, restPosition;
        Assign.retreatArmyUnit(healerCreeps, healerCreeps, army.stageRoom, attackRoomName, 0.8, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.heal(creepsWithNoTask, _.filter(creeps && creeps.all || [], (c) => c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax), "Healing");
        
        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (attackRoom = Game.rooms[attackRoomName]) {
            Assign.heal(creepsWithNoTask, _.filter(attackRoom.find(FIND_MY_CREEPS), (c) => c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax), "Healing");
        
            _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
        Assign.stomp(creepsWithNoTask, army.hostileConstructionSites, "Stomping");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        if (restPosition = army.restPosition) {
            Assign.moveToPos(creepsWithNoTask, new RoomPosition(restPosition.x, restPosition.y, restPosition.room), undefined, "Attacking");
        } else {
            Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
        }
    }
}

if (Memory.profiling) {
    __require(1,10).registerObject(RoleArmyHealer, "RoleArmyHealer");
}
module.exports = RoleArmyHealer;

return module.exports;
}
/********** End of module 10: ../src/role.armyHealer.js **********/
/********** Start module 11: ../src/role.armyMelee.js **********/
__modules[11] = function(module, exports) {
const Assign = __require(54,11),
    Cache = __require(3,11),
    Utilities = __require(8,11);
/**
 * Represents the melee role in the army.
 */
class RoleArmyMelee {
    /**
     * Gets the settings for spawning a creep.
     * @param {Army} army The army to spawn the creep for.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(army) {
        var units = army.melee.units,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH],
            boosts;

        body.push(...Array(units).fill(ATTACK));
        body.push(...Array(units + 5).fill(MOVE));

        if (army.boostRoom) {
            boosts = {
                RESOURCE_CATALYZED_GHODIUM_ALKALIDE: 5,
                RESOURCE_CATALYZED_UTRIUM_ACID: units
            };
        }

        return {
            body: body,
            boosts: boosts,
            name: "armyMelee"
        };
    }
    /**
     * Assign tasks to creeps of this role.
     * @param {Army} army The army to assign tasks to.
     */
    static assignTasks(army) {
        switch (army.directive) {
            case "building":
                this.assignBuildingTasks(army);
                break;
            case "staging":
                this.assignStagingTasks(army);
                break;
            case "dismantle":
                this.assignDismantleTasks(army);
                break;
            case "attack":
                this.assignAttackTasks(army);
                break;
        }
    }
    /**
     * Assignments for the building directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignBuildingTasks(army) {
        var creeps = Cache.creeps[army.name],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyMelee || []), (c) => !c.spawning);
        Assign.getBoost(creepsWithNoTask, "Boosting");
        
        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.attack(creepsWithNoTask, army.hostiles, "Attacking");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToRoom(creepsWithNoTask, army.buildRoom, "Building");
    }
    /**
     * Assignments for the staging directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignStagingTasks(army) {
        var creeps = Cache.creeps[army.name],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyMelee || []), (c) => !c.spawning);
        Assign.attack(creepsWithNoTask, army.hostiles, "Attacking");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToRoom(creepsWithNoTask, army.stageRoom, "Staging");
    }
    /**
     * Assignments for the dismantle directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignDismantleTasks(army) {
        var creeps = Cache.creeps[army.name],
            meleeCreeps = creeps && creeps.armyMelee || [],
            attackRoomName = army.attackRoom,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(meleeCreeps), (c) => !c.spawning),
            dismantle;
        Assign.retreatArmyUnitOrMoveToHealer(meleeCreeps, creeps && creeps.armyHealer || [], army.stageRoom, attackRoomName, 0.8, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.attack(creepsWithNoTask, army.hostiles, "Attacking");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (Game.rooms[attackRoomName] && (dismantle = army.dismantle).length > 0) {
            Assign.moveToPos(creepsWithNoTask, dismantle[0].pos, 3, "Attacking");

            _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
        Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
    }
    /**
     * Assignments for the attack directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignAttackTasks(army) {
        var creeps = Cache.creeps[army.name],
            meleeCreeps = creeps && creeps.armyMelee || [],
            attackRoomName = army.attackRoom,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(meleeCreeps), (c) => !c.spawning),
            restPosition;
        Assign.retreatArmyUnit(meleeCreeps, creeps && creeps.armyHealer || [], army.stageRoom, attackRoomName, 0.8, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.attack(creepsWithNoTask, army.hostiles, "Attacking");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.stomp(creepsWithNoTask, army.hostileConstructionSites, "Stomping");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        if (restPosition = army.restPosition) {
            Assign.moveToPos(creepsWithNoTask, new RoomPosition(restPosition.x, restPosition.y, restPosition.room), undefined, "Attacking");
        } else {
            Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
        }
    }
}

if (Memory.profiling) {
    __require(1,11).registerObject(RoleArmyMelee, "RoleArmyMelee");
}
module.exports = RoleArmyMelee;

return module.exports;
}
/********** End of module 11: ../src/role.armyMelee.js **********/
/********** Start module 12: ../src/role.armyRanged.js **********/
__modules[12] = function(module, exports) {
const Assign = __require(54,12),
    Cache = __require(3,12),
    Utilities = __require(8,12);
/**
 * Represents the ranged role in the army.
 */
class RoleArmyRanged {
    /**
                                    ##          #     #     #                       
                                   #  #         #     #                             
     ###   ###    ###  #  #  ###    #     ##   ###   ###   ##    ###    ###   ###   
    ##     #  #  #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     
      ##   #  #  # ##  ####  #  #  #  #  ##     #     #     #    #  #   ##     ##   
    ###    ###    # #  ####  #  #   ##    ##     ##    ##  ###   #  #  #     ###    
           #                                                            ###         
     * Gets the settings for spawning a creep.
     * @param {Army} army The army to spawn the creep for.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(army) {
        var units = army.ranged.units,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH],
            boosts;

        body.push(...Array(units).fill(RANGED_ATTACK));
        body.push(...Array(units + 5).fill(MOVE));

        if (army.boostRoom) {
            boosts = {
                RESOURCE_CATALYZED_GHODIUM_ALKALIDE: 5,
                RESOURCE_CATALYZED_UTRIUM_ACID: units
            };
        }

        return {
            body: body,
            boosts: boosts,
            name: "armyRanged"
        };
    }

    /**
                         #                ###                #            
                                           #                 #            
     ###   ###    ###   ##     ###  ###    #     ###   ###   # #    ###   
    #  #  ##     ##      #    #  #  #  #   #    #  #  ##     ##    ##     
    # ##    ##     ##    #     ##   #  #   #    # ##    ##   # #     ##   
     # #  ###    ###    ###   #     #  #   #     # #  ###    #  #  ###    
                               ###                                        
     * Assign tasks to creeps of this role.
     * @param {Army} army The army to assign tasks to.
     */
    static assignTasks(army) {
        switch (army.directive) {
            case "building":
                this.assignBuildingTasks(army);
                break;
            case "staging":
                this.assignStagingTasks(army);
                break;
            case "dismantle":
                this.assignDismantleTasks(army);
                break;
            case "attack":
                this.assignAttackTasks(army);
                break;
        }
    }
    /**
     * Assignments for the building directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignBuildingTasks(army) {
        var creeps = Cache.creeps[army.name],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyRanged || []), (c) => !c.spawning);
        Assign.getBoost(creepsWithNoTask, "Boosting");
        
        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.rangedAttack(creepsWithNoTask, army.hostiles, "Attacking");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToRoom(creepsWithNoTask, army.buildRoom, "Building");
    }
    /**
     * Assignments for the staging directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignStagingTasks(army) {
        var creeps = Cache.creeps[army.name],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyRanged || []), (c) => !c.spawning);
        Assign.rangedAttack(creepsWithNoTask, army.hostiles, "Attacking");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToRoom(creepsWithNoTask, army.stageRoom, "Staging");
    }
    /**
     * Assignments for the dismantle directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignDismantleTasks(army) {
        var creeps = Cache.creeps[army.name],
            rangedCreeps = creeps && creeps.armyRanged || [],
            attackRoomName = army.attackRoom,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(rangedCreeps), (c) => !c.spawning),
            dismantle;
        Assign.retreatArmyUnitOrMoveToHealer(rangedCreeps, creeps && creeps.armyHealer || [], army.stageRoom, attackRoomName, 0.8, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.rangedAttack(creepsWithNoTask, army.hostiles, "Attacking");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (Game.rooms[attackRoomName] && (dismantle = army.dismantle).length > 0) {
            Assign.moveToPos(creepsWithNoTask, dismantle[0].pos, 3, "Attacking");

            _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
        Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
    }
    /**
     * Assignments for the attack directive.
     * @param {Army} army The army to assign tasks to.
     */
    static assignAttackTasks(army) {
        var creeps = Cache.creeps[army.name],
            rangedCreeps = creeps && creeps.armyRanged || [],
            attackRoomName = army.attackRoom,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(rangedCreeps), (c) => !c.spawning),
            restPosition;
        Assign.retreatArmyUnit(rangedCreeps, creeps && creeps.armyHealer || [], army.stageRoom, attackRoomName, 0.8, "Ouch!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.rangedAttack(creepsWithNoTask, army.hostiles, "Attacking");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.stomp(creepsWithNoTask, army.hostileConstructionSites, "Stomping");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }

        if (restPosition = army.restPosition) {
            Assign.moveToPos(creepsWithNoTask, new RoomPosition(restPosition.x, restPosition.y, restPosition.room), undefined, "Attacking");
        } else {
            Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
        }
    }
}

if (Memory.profiling) {
    __require(1,12).registerObject(RoleArmyRanged, "RoleArmyRanged");
}
module.exports = RoleArmyRanged;

return module.exports;
}
/********** End of module 12: ../src/role.armyRanged.js **********/
/********** Start module 13: ../src/role.claimer.js **********/
__modules[13] = function(module, exports) {
var Cache = __require(3,13),
    Commands = __require(4,13),
    Utilities = __require(8,13),
    TaskRally = __require(49,13),
    TaskClaim = __require(38,13);

class Claimer {
    static checkSpawn(room) {
        var claimer = Memory.maxCreeps.claimer,
            roomName = room.name,
            claimers = Cache.creeps[roomName] && Cache.creeps[roomName].claimer || [],
            num = 0,
            max = 0;
        if (claimer) {
            _.forEach(claimer[roomName], (value, toRoom) => {
                var count = _.filter(claimers, (c) => c.memory.claim === toRoom).length;

                num += count;
                max += 1;

                if (count === 0) {
                    Claimer.spawn(room, toRoom);
                }
            });
        }
        if (Memory.log && (claimers.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "claimer",
                count: claimers.length,
                max: max
            });
        }        
    }

    static spawn(room, toRoom) {
        var spawns = Cache.spawnsInRoom(room),
            body = [CLAIM, MOVE],
            spawnToUse, name;
        if (_.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `claimer-${toRoom}-${Game.time.toFixed(0).substring(4)}`, {role: "claimer", home: room.name, claim: toRoom});
        Cache.spawning[spawnToUse.id] = typeof name !== "number";

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].claimer || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.claim), (creep) => {
            var task = TaskRally.getClaimerTask(creep);
            if (task.canAssign(creep)) {
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = TaskClaim.getTask(creep);
            if (task.canAssign(creep)) {
                creep.say("Claiming");
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            if (creep.room.name === creep.memory.claim && creep.room.controller.my) {
                creep.suicide();
            }
        });
    }
}

if (Memory.profiling) {
    __require(1,13).registerObject(Claimer, "RoleClaimer");
}
module.exports = Claimer;

return module.exports;
}
/********** End of module 13: ../src/role.claimer.js **********/
/********** Start module 14: ../src/role.collector.js **********/
__modules[14] = function(module, exports) {
var Cache = __require(3,14),
    Utilities = __require(8,14),
    TaskHarvest = __require(44,14),
    TaskPickupResource = __require(48,14),
    TaskRally = __require(49,14);

class Collector {
    static checkSpawn(room) {
        var spawns = Cache.spawnsInRoom(room),
            max = 0,
            roomName = room.name,
            collectors = Cache.creeps[roomName] && Cache.creeps[roomName].collector || [],
            count, sources, capacity, adjustment;
        if (Cache.containersInRoom(room).length !== 0 && room.storage && room.storage.my) {
            return;
        }
        if (spawns.length === 0) {
            return;
        }
        sources = Utilities.objectsClosestToObj(room.find(FIND_SOURCES), spawns[0]);
        if (sources.length <= 1) {
            return;
        }
        adjustment = Math.max((2500 - room.energyCapacityAvailable) / 2500, 0.1);
        _.forEach(sources, (source, index) => {
            var sourceId = source.id;
            if (index === 0) {
                return;
            }

            max += Math.ceil(3 * adjustment);
            count = _.filter(collectors, (c) => c.memory.homeSource === sourceId).length;
            if (count < 3 * adjustment) {
                Collector.spawn(room, sourceId);
            }
        });
        if (Memory.log && (collectors.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "collector",
                count: collectors.length,
                max: max
            });
        }        
    }

    static spawn(room, id) {
        var body = [],
            roomName = room.name,
            energy, units, remainder, count, spawnToUse, name;
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        energy = Math.min(room.energyCapacityAvailable, 3300);
        units = Math.floor(energy / 200);
        remainder = energy % 200;
        for (count = 0; count < units; count++) {
            body.push(WORK);
        }

        if (remainder >= 150) {
            body.push(WORK);
        }

        for (count = 0; count < units; count++) {
            body.push(CARRY);
        }

        if (remainder >= 100 && remainder < 150) {
            body.push(CARRY);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }

        if (remainder >= 50) {
            body.push(MOVE);
        }
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === room.memory.region).sort((a, b) => (a.room.name === roomName ? 0 : 1) - (b.room.name === roomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `collector-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "collector", home: roomName, homeSource: id});
        if (spawnToUse.room.name === roomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].collector || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = Cache.creeps[roomName] && Cache.creeps[roomName].all || [],
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.upgradeController.criticalTasks, (task) => {
            if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "upgradeController" && c.memory.currentTask.room === task.room).length === 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, room.controller), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("CritCntrlr");
                        assigned.push(creep.name);
                        return false;
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            if (creep.carry[RESOURCE_ENERGY] < (room.controller.level === 8 ? 200 : room.controller.level === 7 ? 100 : 50)) {
                return;
            }
            
            _.forEach(tasks.fillEnergy.extensionTasks.sort((a, b) => a.object.pos.getRangeTo(creep) - b.object.pos.getRangeTo(creep)), (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
                if (energyMissing > 0) {
                    if (task.canAssign(creep)) {
                        creep.say("Extension");
                        assigned.push(creep.name);
                        return false;
                    }
                }
            });
        });
        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.spawnTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Spawn");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.towerTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Tower");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });
        
        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.repair.criticalTasks, (task) => {
            _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.structure), (creep) => {
                if (_.filter(Cache.creeps[task.structure.room.name] && Cache.creeps[task.structure.room.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id).length === 0) {
                    if (task.canAssign(creep)) {
                        creep.say("CritRepair");
                        assigned.push(creep.name);
                        return false;
                    }
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.build.tasks, (task) => {
            var progressMissing = task.constructionSite.progressTotal - task.constructionSite.progress - _.reduce(_.filter(Cache.creeps[task.constructionSite.room.name] && Cache.creeps[task.constructionSite.room.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "build" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (progressMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.constructionSite), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Build");
                        assigned.push(creep.name);
                        progressMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (progressMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.repair.tasks, (task) => {
            var hitsMissing = task.structure.hitsMax - task.structure.hits - _.reduce(_.filter(Cache.creeps[task.structure.room.name] && Cache.creeps[task.structure.room.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0) * 100,
                taskAssigned = false;

            if (hitsMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.structure), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Repair");
                        assigned.push(creep.name);
                        hitsMissing -= (creep.carry[RESOURCE_ENERGY] || 0) * 100;
                        taskAssigned = true;
                        if (hitsMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
            
            return taskAssigned;
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.upgradeController.tasks, (task) => {
            _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, room.controller), (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Controller");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (Cache.hostilesInRoom(room).length === 0) {
            _.forEach(creepsWithNoTask, (creep) => {
                _.forEach(TaskPickupResource.getCollectorTasks(creep.room), (task) => {
                    if (_.filter(Cache.creeps[task.resource.room.name] && Cache.creeps[task.resource.room.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                        return;
                    }
                    if (task.canAssign(creep)) {
                        creep.say("Pickup");
                        assigned.push(creep.name);
                        return false;
                    }
                });
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.collectEnergy.tasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskHarvest();
            if (task.canAssign(creep)) {
                creep.say("Harvesting");
                assigned.push(creep.name);
            }
        });
        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(TaskRally.getHarvesterTasks(creepsWithNoTask), (task) => {
            task.canAssign(task.creep);
        });
    }
}

if (Memory.profiling) {
    __require(1,14).registerObject(Collector, "RoleCollector");
}
module.exports = Collector;

return module.exports;
}
/********** End of module 14: ../src/role.collector.js **********/
/********** Start module 15: ../src/role.converter.js **********/
__modules[15] = function(module, exports) {
var Cache = __require(3,15),
    Commands = __require(4,15),
    Utilities = __require(8,15),
    TaskRally = __require(49,15),
    TaskAttack = __require(36,15);

class Converter {
    static checkSpawn(room) {
        var converter = Memory.maxCreeps.converter,
            roomName = room.name,
            converters = Cache.creeps[roomName] && Cache.creeps[roomName].converter || [],
            num = 0,
            max = 0;
        if (converter) {
            _.forEach(converter[roomName], (value, toRoom) => {
                var count = _.filter(converters, (c) => c.memory.attack === toRoom).length;

                num += count;
                max += 1;

                if (count === 0) {
                    Converter.spawn(room, toRoom);
                }
            });
        }
        if (Memory.log && (converters.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "converter",
                count: converters.length,
                max: max
            });
        }        
    }

    static spawn(room, toRoom) {
        var body = [],
            roomName = room.name,
            spawns = Cache.spawnsInRoom(room),
            supportRoomName = supportRoom.name,
            energy, units, count, spawnToUse, name;
        if (_.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        energy = Math.min(supportRoom.energyCapacityAvailable, 24400);
        units = Math.floor(energy / 3050);
        for (count = 0; count < units; count++) {
            body.push(CLAIM);
            body.push(CLAIM);
            body.push(CLAIM);
            body.push(CLAIM);
            body.push(CLAIM);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }
        spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `converter-${toRoom}-${Game.time.toFixed(0).substring(4)}`, {role: "converter", home: room.name, attack: toRoom});
        Cache.spawning[spawnToUse.id] = typeof name !== "number";

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].converter || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.attack), (creep) => {
            var task = TaskRally.getClaimerTask(creep);
            if (task.canAssign(creep)) {
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = TaskAttack.getTask(creep);
            if (task.canAssign(creep)) {
                creep.say("Attacking");
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            creep.suicide();
        });
    }
}

if (Memory.profiling) {
    __require(1,15).registerObject(Converter, "RoleConverter");
}
module.exports = Converter;

return module.exports;
}
/********** End of module 15: ../src/role.converter.js **********/
/********** Start module 16: ../src/role.defender.js **********/
__modules[16] = function(module, exports) {
var Cache = __require(3,16),
    Utilities = __require(8,16),
    TaskRally = __require(49,16),
    TaskMeleeAttack = __require(46,16);

class Defender {
    static checkQuadrant(pos, quadrant) {
        switch (quadrant) {
            case 0:
                return pos.x < 25 && pos.y < 25;
            case 1:
                return pos.x < 25 && pos.y > 25;
            case 2:
                return pos.x > 25 && pos.y > 25;
            case 3:
                return pos.x > 25 && pos.y < 25;
        }
    }

    static checkSpawn(room) {
        var roomName = room.name,
            defenders = Cache.creeps[roomName] && Cache.creeps[roomName].defender || [],
            supportRoom = Game.rooms[Memory.rooms[roomName].roomType.supportRoom],
            max = 1;
        if (_.filter(defenders, (c) => c.spawning || c.ticksToLive >= 300).length < max) {
            Defender.spawn(room, supportRoom);
        }
        if (Memory.log && (defenders.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "defender",
                count: defenders.length,
                max: max
            });
        }
    }

    static spawn(room, supportRoom) {
        var body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, HEAL, HEAL, HEAL, HEAL, HEAL],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            spawnToUse, name;
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `defender-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "defender", home: roomName, supportRoom: supportRoomName});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].defender || []), (c) => !c.spawning),
            hostiles, keepers;
        
        if (room && !room.unobservable) {
            hostiles = Cache.hostilesInRoom(room);
            keepers = Cache.sourceKeepersInRoom(room);
        }
        
        _.forEach(creepsWithNoTask, (creep) => {
            if (creep.room.name !== creep.memory.home) {
                var task = TaskRally.getDefenderTask(creep);
                task.canAssign(creep);
                return;
            }
            if (!creep.memory.quadrant) {
                creep.memory.quadrant = 0;
            }
            _.forEach(_.filter(hostiles, (h) => this.checkQuadrant(h.pos, creep.memory.quadrant)), (hostile) => {
                return !(new TaskMeleeAttack(hostile.id)).canAssign(creep);
            });

            if (creep.memory.currentTask) {
                return;
            }
            _.forEach(_.filter(keepers, (k) => k.ticksToSpawn < 200 && this.checkQuadrant(k.pos, creep.memory.quadrant)), (keeper) => {
                var task = new TaskRally(keeper.id, creep);
                task.range = 1;
                return !task.canAssign(creep);
            });

            if (creep.memory.currentTask) {
                return;
            }

            creep.memory.quadrant = (creep.memory.quadrant + 1) % 4;
        });
    }
}

if (Memory.profiling) {
    __require(1,16).registerObject(Defender, "RoleDefender");
}
module.exports = Defender;

return module.exports;
}
/********** End of module 16: ../src/role.defender.js **********/
/********** Start module 17: ../src/role.dismantler.js **********/
__modules[17] = function(module, exports) {
var Cache = __require(3,17),
    Utilities = __require(8,17),
    TaskBuild = __require(37,17),
    TaskPickupResource = __require(48,17),
    TaskRally = __require(49,17),
    TaskRepair = __require(51,17);

class Dismantler {
    static checkSpawn(room, supportRoom) {
        var max = 1,
            roomName = room.name,
            dismantlers = Cache.creeps[roomName] && Cache.creeps[roomName].dismantler || [];

        if (!supportRoom) {
            supportRoom = room;
        }
        if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable) {
            return;
        }
        if (_.filter(dismantlers, (c) => c.spawning || c.ticksToLive >= 150).length === 0) {
            Dismantler.spawn(room, supportRoom);
        }
        if (Memory.log && (dismantlers.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "dismantler",
                count: dismantlers.length,
                max: max
            });
        }        
    }

    static spawn(room, supportRoom) {
        var body = [],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, remainder, count, spawnToUse, name;
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        energy = Math.min(supportRoom.energyCapacityAvailable, 3300);
        units = Math.floor(energy / 200);
        remainder = energy % 200;
        for (count = 0; count < units; count++) {
            body.push(WORK);
        }

        if (remainder >= 150) {
            body.push(WORK);
        }

        for (count = 0; count < units; count++) {
            body.push(CARRY);
        }

        if (remainder >= 100 && remainder < 150) {
            body.push(CARRY);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }

        if (remainder >= 50) {
            body.push(MOVE);
        }
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `dismantler-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "dismantler", home: roomName, supportRoom: supportRoomName});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].dismantler || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== roomName), (creep) => {
            _.forEach(TaskRepair.getCriticalTasks(creep.room), (task) => {
                if (_.filter(Cache.creeps[task.structure.room.name] && Cache.creeps[task.structure.room.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id).length === 0) {
                    if (task.canAssign(creep)) {
                        creep.say("CritRepair");
                        assigned.push(creep.name);
                        return false;
                    }
                }
            });
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
            if (constructionSites.length > 0) {
                var task = new TaskBuild(constructionSites[0].id);
                if (task.canAssign(creep)) {
                    creep.say("Build");
                    assigned.push(creep.name);
                }
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach([].concat.apply([], [tasks.fillEnergy.storageTasks, tasks.fillEnergy.containerTasks]), (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) !== -1 && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Container");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });

                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.storageTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Storage");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.terminalTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Terminal");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === roomName), (creep) => {
            _.forEach(tasks.dismantle.tasks, (task) => {
                if (_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "dismantle" && c.memory.currentTask.id === task.id).length > 0) {
                    return;
                }
                if (task.canAssign(creep)) {
                    creep.say("Dismantle");
                    assigned.push(creep.name);
                    return false;
                }
            });
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                if (_.filter(task.resource.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                    return;
                }
                if (task.canAssign(creep)) {
                    creep.say("Pickup");
                    assigned.push(creep.name);
                    return false;
                }
            });
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.memory.home);
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    __require(1,17).registerObject(Dismantler, "RoleDismantler");
}
module.exports = Dismantler;

return module.exports;
}
/********** End of module 17: ../src/role.dismantler.js **********/
/********** Start module 18: ../src/role.healer.js **********/
__modules[18] = function(module, exports) {
var Cache = __require(3,18),
    Utilities = __require(8,18),
    TaskHeal = __require(45,18),
    TaskRally = __require(49,18);

class Healer {
    static checkSpawn(room) {
        var roomName = room.name,
            healers = Cache.creeps[roomName] && Cache.creeps[roomName].healer || [],
            supportRoom = Game.rooms[Memory.rooms[roomName].roomType.supportRoom],
            max = 1;
        if (_.filter(healers, (c) => c.spawning || c.ticksToLive >= 300).length < max) {
            Healer.spawn(room, supportRoom);
        }
        if (Memory.log && (healers.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "healer",
                count: healers.length,
                max: max
            });
        }        
    }

    static spawn(room, supportRoom) {
        var body = [],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, count, spawnToUse, name;
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        energy = Math.min(supportRoom.energyCapacityAvailable, 7500);
        units = Math.floor(energy / 300);

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }

        for (count = 0; count < units; count++) {
            body.push(HEAL);
        }
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `healer-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "healer", home: roomName, supportRoom: supportRoomName});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].healer || []), (c) => !c.spawning),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== c.memory.home), (creep) => {
            var task = TaskRally.getDefenderTask(creep);
            if (task.canAssign(creep)) {
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = TaskHeal.getDefenderTask(creep);
            if (task && task.canAssign(creep)) {
                creep.say("Heal");
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === c.memory.home), (creep) => {
            var task = TaskRally.getDefenderTask(creep);
            task.range = 1;
            if (task.canAssign(creep)) {
                assigned.push(creep.name);
            }
        });
    }
}

if (Memory.profiling) {
    __require(1,18).registerObject(Healer, "RoleHealer");
}
module.exports = Healer;

return module.exports;
}
/********** End of module 18: ../src/role.healer.js **********/
/********** Start module 19: ../src/role.miner.js **********/
__modules[19] = function(module, exports) {
var Cache = __require(3,19),
    Utilities = __require(8,19),
    TaskMine = __require(47,19),
    TaskRally = __require(49,19);

class Miner {
    static checkSpawn(room) {
        var roomName = room.name,
            containers = Cache.containersInRoom(room),
            max = 0,
            miners;
        if (Cache.spawnsInRoom(room).length === 0 || containers.length === 0) {
            return;
        }
        
        miners = Cache.creeps[roomName] && Cache.creeps[roomName].miner || [];
        _.forEach(containers, (container) => {
            var containerId = container.id,
                source;

            if (!Memory.containerSource[containerId]) {
                Memory.containerSource[containerId] = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0].id;
            }

            source = Game.getObjectById(Memory.containerSource[containerId]);
            if (source instanceof Mineral && source.mineralAmount === 0) {
                return;
            }

            max += 1;
            if (_.filter(miners, (c) => (c.spawning || c.ticksToLive >= 150) && c.memory.container === containerId).length === 0) {
                Miner.spawn(room, containerId);
            }
        });
        if (Memory.log && (miners.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "miner",
                count: miners.length,
                max: max
            });
        }        
    }

    static spawn(room, id) {
        var spawns = Cache.spawnsInRoom(room),
            body = [MOVE, WORK, WORK, WORK, WORK, WORK],
            roomName = room.name,
            energy, units, remainder, count, spawnToUse, name;
        if (_.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        energy = Math.min(room.energyCapacityAvailable, 4500);
        units = Math.floor(energy / 450);
        remainder = energy % 450;
        if (Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), Game.getObjectById(id))[0] instanceof Mineral) {
            body = [];
            for (count = 0; count < units; count++) {
                body.push(MOVE);
            }

            if (remainder >= 50) {
                body.push(MOVE);
            }

            for (count = 0; count < units; count++) {
                body.push(WORK);
                body.push(WORK);
                body.push(WORK);
                body.push(WORK);
            }

            if (remainder >= 150) {
                body.push(WORK);
            }

            if (remainder >= 250) {
                body.push(WORK);
            }

            if (remainder >= 350) {
                body.push(WORK);
            }
        }
        spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `miner-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "miner", home: roomName, container: id});
        Cache.spawning[spawnToUse.id] = typeof name !== "number";
        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].miner || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(creepsWithNoTask, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
            var task = new TaskRally(creep.memory.labs[0]);
            task.canAssign(creep);
            assigned.push(creep.name);
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskMine();
            if (task.canAssign(creep)) {
                creep.say("Mining");
            }
        });
    }
}

if (Memory.profiling) {
    __require(1,19).registerObject(Miner, "RoleMiner");
}
module.exports = Miner;

return module.exports;
}
/********** End of module 19: ../src/role.miner.js **********/
/********** Start module 20: ../src/role.remoteBuilder.js **********/
__modules[20] = function(module, exports) {
var Cache = __require(3,20),
    Utilities = __require(8,20),
    TaskBuild = __require(37,20),
    TaskHarvest = __require(44,20),
    TaskPickupResource = __require(48,20),
    TaskRally = __require(49,20),
    TaskRepair = __require(51,20);

class Builder {
    static checkSpawn(room) {
        var roomName = room.name,
            supportRoom = Game.rooms[Memory.rooms[roomName].roomType.supportRoom],
            max = 2,
            num;
        if (Cache.spawnsInRoom(supportRoom).length === 0) {
            return;
        }
        if ((num = (Cache.creeps[roomName] && Cache.creeps[roomName].remoteBuilder || []).length) < max) {
            Builder.spawn(room, supportRoom);
        }
        if (Memory.log && (num > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "remoteBuilder",
                count: num,
                max: max
            });
        }
    }

    static spawn(room, supportRoom) {
        var body = [],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, remainder, count, spawnToUse, name;
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        energy = Math.min(supportRoom.energyCapacityAvailable, 3300);
        units = Math.floor(energy / 200);
        remainder = energy % 200;
        for (count = 0; count < units; count++) {
            body.push(WORK);
        }

        if (remainder >= 150) {
            body.push(WORK);
        }

        for (count = 0; count < units; count++) {
            body.push(CARRY);
        }

        if (remainder >= 100 && remainder < 150) {
            body.push(CARRY);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }

        if (remainder >= 50) {
            body.push(MOVE);
        }
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `remoteBuilder-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "remoteBuilder", home: roomName, supportRoom: supportRoomName});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteBuilder || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === room.name), (creep) => {
            if (room.find(FIND_HOSTILE_CONSTRUCTION_SITES).length > 0) {
                var task = new TaskRally(room.find(FIND_HOSTILE_CONSTRUCTION_SITES)[0].id);
                task.canAssign(creep);
                creep.say("Stomping");
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            _.forEach(TaskRepair.getCriticalTasks(creep.room), (task) => {
                if (_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id).length === 0) {
                    if (task.canAssign(creep)) {
                        creep.say("CritRepair");
                        assigned.push(creep.name);
                        return false;
                    }
                }
            });
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
                if (constructionSites.length > 0) {
                    var task = new TaskBuild(Utilities.objectsClosestToObj(constructionSites, creep)[0].id);
                    if (task.canAssign(creep)) {
                        creep.say("Build");
                        assigned.push(creep.name);
                    }
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
        _.forEach(creepsWithNoTask, (creep) => {
            if (creep.room.name === creep.memory.home) {
                _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                    if (_.filter(task.resource.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                        return;
                    }
                    if (task.canAssign(creep)) {
                        creep.say("Pickup");
                        assigned.push(creep.name);
                        return false;
                    }
                });
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskHarvest(),
                    sources = Utilities.objectsClosestToObj(_.filter(room.find(FIND_SOURCES), (s) => s.energy > 0), creep);
                
                if (sources.length === 0) {
                    return false;
                }

                creep.memory.homeSource = sources[0].id;

                if (task.canAssign(creep)) {
                    creep.say("Harvesting");
                    assigned.push(creep.name);
                }
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.memory.home);
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    __require(1,20).registerObject(Builder, "RoleRemoteBuilder");
}
module.exports = Builder;

return module.exports;
}
/********** End of module 20: ../src/role.remoteBuilder.js **********/
/********** Start module 21: ../src/role.remoteCollector.js **********/
__modules[21] = function(module, exports) {
var Cache = __require(3,21),
    Utilities = __require(8,21),
    TaskPickupResource = __require(48,21),
    TaskRally = __require(49,21);

class RemoteCollector {
    static checkSpawn(room, supportRoom, max) {
        var roomName = room.name,
            creeps = Cache.creeps[roomName],
            collectors = creeps && creeps.remoteCollector || [];

        if (!supportRoom) {
            supportRoom = room;
        }

        if (!max) {
            max = room.memory.roomType && room.memory.roomType.type === "cleanup" ? supportRoom.controller ? supportRoom.controller.level : 3 : 1;
        }
        if (Cache.spawnsInRoom(supportRoom).length === 0) {
            return;
        }
        if (_.filter(collectors, (c) => c.spawning || c.ticksToLive >= 300).length < max) {
            RemoteCollector.spawn(room, supportRoom);
        }

        if (Memory.log && (collectors.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "remoteCollector",
                count: collectors.length,
                max: max
            });
        }
    }

    static spawn(room, supportRoom) {
        var body = [],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, spawnToUse, name, count;
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        energy = Math.min(supportRoom.energyCapacityAvailable, 2400);
        units = Math.floor(energy / 150);
        for (count = 0; count < units; count++) {
            body.push(CARRY);
            body.push(CARRY);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `remoteCollector-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "remoteCollector", home: roomName, supportRoom: supportRoomName});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creeps = Cache.creeps[roomName],
            creepsWithNoTask = Utilities.creepsWithNoTask(creeps && creeps.remoteCollector || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                if (_.sum(creeps && creeps.all || [], (c) => c.memory.currentTask && c.memory.currentTask.id === task.idG ? c.carryCapacity - _.sum(c.carry) : 0) >= task.resource.amount) {
                    return;
                }
                if (task.canAssign(creep)) {
                    creep.say("Pickup");
                    assigned.push(creep.name);
                    return false;
                }
            });
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (tasks.collectMinerals && tasks.collectMinerals.cleanupTasks) {
            _.forEach(tasks.collectMinerals.cleanupTasks, (task) => {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                    }
                });

                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];

                if (creepsWithNoTask.length === 0) {
                    return;
                }
            });
        }

        if (tasks.collectEnergy && tasks.collectEnergy.cleanupTasks) {
            _.forEach(tasks.collectEnergy.cleanupTasks, (task) => {
                _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === roomName), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                    }
                });

                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];

                if (creepsWithNoTask.length === 0) {
                    return;
                }
            });
        }
        _.forEach(tasks.fillEnergy.storageTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Storage");
                        assigned.push(creep.name);
                        energyMissing -= _.sum(creep.carry);
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.storageTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Storage");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.terminalTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Terminal");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.containerTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Container");
                        assigned.push(creep.name);
                        energyMissing -= _.sum(creep.carry);
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task;
            
            if (_.sum(creep.carry) > 0) {
                task = new TaskRally(creep.memory.supportRoom);
            } else {
                task = new TaskRally(creep.memory.home);
            }
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    __require(1,21).registerObject(RemoteCollector, "RoleRemoteCollector");
}
module.exports = RemoteCollector;

return module.exports;
}
/********** End of module 21: ../src/role.remoteCollector.js **********/
/********** Start module 22: ../src/role.remoteDismantler.js **********/
__modules[22] = function(module, exports) {
var Cache = __require(3,22),
    Utilities = __require(8,22),
    TaskBuild = __require(37,22),
    TaskPickupResource = __require(48,22),
    TaskRally = __require(49,22);

class RemoteDismantler {
    static checkSpawn(room, supportRoom, max) {
        var roomName = room.name,
            dismantlers = Cache.creeps[roomName] && Cache.creeps[roomName].remoteDismantler || [];

        if (!supportRoom) {
            supportRoom = room;
        }
        if (Cache.spawnsInRoom(supportRoom).length === 0) {
            return;
        }
        if (_.filter(dismantlers, (c) => c.spawning || c.ticksToLive >= 300).length < max) {
            RemoteDismantler.spawn(room, supportRoom);
        }
        if (Memory.log && (dismantlers.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "remoteDismantler",
                count: dismantlers.length,
                max: max
            });
        }        
    }

    static spawn(room, supportRoom) {
        var body = [],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, remainder, count, spawnToUse, name;
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        energy = Math.min(supportRoom.energyCapacityAvailable, 3750);
        units = Math.floor(energy / 150);
        remainder = energy % 150;
        for (count = 0; count < units; count++) {
            body.push(WORK);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `remoteDismantler-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "remoteDismantler", home: roomName, supportRoom: supportRoomName});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteDismantler || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === roomName), (creep) => {
            if (room.find(FIND_HOSTILE_CONSTRUCTION_SITES).length > 0) {
                var task = new TaskRally(room.find(FIND_HOSTILE_CONSTRUCTION_SITES)[0].id);
                task.canAssign(creep);
                creep.say("Stomping");
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === roomName), (creep) => {
            _.forEach(tasks.remoteDismantle.cleanupTasks, (task) => {
                if (_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "dismantle" && c.memory.currentTask.id === task.id).length > 0) {
                    return;
                }
                if (task.canAssign(creep)) {
                    creep.say("Dismantle");
                    assigned.push(creep.name);
                    return false;
                }
            });
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.memory.home);
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    __require(1,22).registerObject(RemoteDismantler, "RoleRemoteDismantler");
}
module.exports = RemoteDismantler;

return module.exports;
}
/********** End of module 22: ../src/role.remoteDismantler.js **********/
/********** Start module 23: ../src/role.remoteMiner.js **********/
__modules[23] = function(module, exports) {
var Cache = __require(3,23),
    Utilities = __require(8,23),
    TaskMine = __require(47,23),
    TaskRally = __require(49,23);

class Miner {
    static checkSpawn(room) {
        var roomName = room.name,
            supportRoom = Game.rooms[Memory.rooms[roomName].roomType.supportRoom],
            supportRoomName = supportRoom.name,
            miners = Cache.creeps[roomName] && Cache.creeps[roomName].remoteMiner || [],
            containers = Cache.containersInRoom(room),
            max = 0;
        if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable || containers.length === 0) {
            return;
        }
        if (!Memory.lengthToContainer) {
            Memory.lengthToContainer = {};
        }
        _.forEach(containers, (container) => {
            var containerId = container.id,
                source;
            if (!Memory.lengthToContainer[containerId]) {
                Memory.lengthToContainer[containerId] = {};
            }
            if (!Memory.lengthToContainer[containerId][supportRoomName]) {
                Memory.lengthToContainer[containerId][supportRoomName] = PathFinder.search(container.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}).path.length;
            }

            if (!Memory.containerSource[containerId]) {
                Memory.containerSource[containerId] = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0].id;
            }

            source = Game.getObjectById(Memory.containerSource[containerId]);
            if (source instanceof Mineral && (source.mineralAmount === 0 || room.controller && (!room.controller.my || room.controller.level < 6))) {
                return;
            }

            max += 1;
            if (_.filter(miners, (c) => (c.spawning || c.ticksToLive >= 150 + Memory.lengthToContainer[containerId][supportRoomName] * 3) && c.memory.container === containerId).length === 0) {
                Miner.spawn(room, supportRoom, containerId);
            }
        });
        if (Memory.log && (miners.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "remoteMiner",
                count: miners.length,
                max: max
            });
        }        
    }

    static spawn(room, supportRoom, id) {
        var body = room.memory && room.memory.roomType && room.memory.roomType.type === "source" || /^[EW][1-9][0-9]*5[NS][1-9][0-9]*5$/.test(room.name) ? [MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK] : [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, remainder, count, spawnToUse, name;
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        if (Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), Game.getObjectById(id))[0] instanceof Mineral) {
            body = [];
            energy = Math.min(supportRoom.energyCapacityAvailable, 4500);
            units = Math.floor(energy / 450);
            remainder = energy % 450;
            for (count = 0; count < units; count++) {
                body.push(MOVE);
            }

            if (remainder >= 50) {
                body.push(MOVE);
            }

            for (count = 0; count < units; count++) {
                body.push(WORK);
                body.push(WORK);
                body.push(WORK);
                body.push(WORK);
            }

            if (remainder >= 150) {
                body.push(WORK);
            }

            if (remainder >= 250) {
                body.push(WORK);
            }

            if (remainder >= 350) {
                body.push(WORK);
            }
        }
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `remoteMiner-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "remoteMiner", home: roomName, supportRoom: supportRoomName, container: id});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteMiner || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskMine();
                if (task.canAssign(creep)) {
                    creep.say("Mining");
                    assigned.push(creep.name);
                }
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.memory.home);
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    __require(1,23).registerObject(Miner, "RoleRemoteMiner");
}
module.exports = Miner;

return module.exports;
}
/********** End of module 23: ../src/role.remoteMiner.js **********/
/********** Start module 24: ../src/role.remoteReserver.js **********/
__modules[24] = function(module, exports) {
var Cache = __require(3,24),
    Commands = __require(4,24),
    Utilities = __require(8,24),
    TaskRally = __require(49,24),
    TaskReserve = __require(52,24);

class Reserver {
    static checkSpawn(room) {
        var supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom],
            supportRoomName = supportRoom.name,
            spawns = Cache.spawnsInRoom(supportRoom),
            controller = room.controller,
            roomName = room.name,
            reservers = Cache.creeps[roomName] && Cache.creeps[roomName].remoteReserver || [],
            count = 0,
            max = 0,
            id, reservation;
        if (spawns.length === 0 || room.unobservable || !controller) {
            return;
        }
        
        id = controller.id;
        reservation = controller.reservation;
        if (!Memory.lengthToController) {
            Memory.lengthToController = {};
        }
        if (!Memory.lengthToController[id]) {
            Memory.lengthToController[id] = {};
        }
        if (!Memory.lengthToController[id][supportRoomName]) {
            Memory.lengthToController[id][supportRoomName] = PathFinder.search(controller.pos, {pos: spawns[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}).path.length;
        }

        count = _.filter(reservers, (c) => c.spawning || c.ticksToLive > Memory.lengthToController[id][supportRoomName]).length;

        if (!reservation || reservation.ticksToEnd < 4000) {
            max += 1;
        }

        if (count < max) {
            Reserver.spawn(room, supportRoom);
        }
        if (Memory.log && (reservers.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "remoteReserver",
                count: reservers.length,
                max: max
            });
        }        
    }

    static spawn(room, supportRoom) {
        var body = [],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, count, spawnToUse, name;
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        energy = Math.min(supportRoom.energyCapacityAvailable, 3250);
        units = Math.floor(energy / 650);
        for (count = 0; count < units; count++) {
            body.push(CLAIM);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `remoteReserver-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "remoteReserver", home: roomName, supportRoom: supportRoomName});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteReserver || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                if (creep.room.name === creep.memory.home && creep.room.controller.my) {
                    assigned.push(creep.name);
                    Commands.setRoomType(creep.room, {type: "base"});
                    creep.suicide();
                }
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (room && !room.unobservable && room.controller) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = TaskReserve.getRemoteTask(creep);
                if (task.canAssign(creep)) {
                    creep.say("Reserving");
                    assigned.push(creep.name);
                }
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.memory.home);
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    __require(1,24).registerObject(Reserver, "RoleRemoteReserver");
}
module.exports = Reserver;

return module.exports;
}
/********** End of module 24: ../src/role.remoteReserver.js **********/
/********** Start module 25: ../src/role.remoteStorer.js **********/
__modules[25] = function(module, exports) {
var Cache = __require(3,25),
    Utilities = __require(8,25),
    TaskCollectEnergy = __require(39,25),
    TaskCollectMinerals = __require(40,25),
    TaskPickupResource = __require(48,25),
    TaskRally = __require(49,25);

class Storer {
    static checkSpawn(room) {
        var supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom],
            containers = Cache.containersInRoom(room),
            roomName = room.name,
            storers = Cache.creeps[roomName] && Cache.creeps[roomName].remoteStorer || [],
            max = 0,
            foundFirstSource = false;
        if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable || containers.length === 0) {
            return;
        }
        _.forEach(containers, (container) => {
            var count = 0,
                id = container.id,
                source, length;

            if (!Memory.containerSource[id]) {
                Memory.containerSource[id] = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0].id;
            }

            source = Game.getObjectById(Memory.containerSource[id]);
            if (source instanceof Mineral) {
                if (source.mineralAmount === 0) {
                    return;
                }
            } else {
                count = foundFirstSource ? 0 : -1;
                foundFirstSource = true;
            }
            length = Memory.lengthToContainer[id][supportRoom.name];
            count += Math.max(Math.ceil(length / [18, 18, 18, 18, 30, 44, 54, 62, 62][supportRoom.controller.level]), 0);
            max += count;
            if (_.filter(storers, (c) => (c.spawning || c.ticksToLive >= 150 + length * 2) && c.memory.container === id).length < count) {
                Storer.spawn(room, supportRoom, id);
            }
        });

        if (Memory.log && (storers.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "remoteStorer",
                count: storers.length,
                max: max
            });
        }
    }

    static spawn(room, supportRoom, id) {
        var roomName = room.name,
            supportRoomName = supportRoom.name,
            body = [], spawnToUse, name;
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }

        switch (supportRoom.controller.level) {
            case 3:
                body =  [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 4:
                body =  [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 5:
                body =  [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 6:
                body =  [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 7:
            case 8:
                body =  [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
        }
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `remoteStorer-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "remoteStorer", home: roomName, supportRoom: supportRoomName, container: id});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteStorer || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                if (_.sum(Cache.creeps[room.name] && Cache.creeps[room.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id ? c.carryCapacity - _.sum(c.carry) : 0) >= task.resource.amount) {
                    return;
                }
                if (task.canAssign(creep)) {
                    creep.say("Pickup");
                    assigned.push(creep.name);
                    return false;
                }
            });
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.storageTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
            if (energyMissing > 0) {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Storage");
                        assigned.push(creep.name);
                        energyMissing -= _.sum(creep.carry);
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.storageTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Storage");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.terminalTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Terminal");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.containerTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
            if (energyMissing > 0) {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Container");
                        assigned.push(creep.name);
                        energyMissing -= _.sum(creep.carry);
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var container = Game.getObjectById(creep.memory.container),
                    task;
                
                if (!container) {
                    return;
                }
                
                if (container.store[RESOURCE_ENERGY]) {
                    task = new TaskCollectEnergy(creep.memory.container);
                } else if (_.sum(container.store) > 0) {
                    task = new TaskCollectMinerals(creep.memory.container);
                }

                if (!task) {
                    return;
                }

                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task;
            if (_.sum(creep.carry) > 0) {
                task = new TaskRally(creep.memory.supportRoom);
            } else {
                task = new TaskRally(creep.memory.home);
            }
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    __require(1,25).registerObject(Storer, "RoleRemoteStorer");
}
module.exports = Storer;

return module.exports;
}
/********** End of module 25: ../src/role.remoteStorer.js **********/
/********** Start module 26: ../src/role.remoteWorker.js **********/
__modules[26] = function(module, exports) {
var Cache = __require(3,26),
    Utilities = __require(8,26),
    TaskBuild = __require(37,26),
    TaskCollectEnergy = __require(39,26),
    TaskHarvest = __require(44,26),
    TaskPickupResource = __require(48,26),
    TaskRally = __require(49,26),
    TaskRepair = __require(51,26);

class Worker {
    static checkSpawn(room) {
        var roomName = room.name,
            supportRoom = Game.rooms[Memory.rooms[roomName].roomType.supportRoom],
            supportRoomName = supportRoom.name,
            containers = Cache.containersInRoom(room),
            workers = Cache.creeps[roomName] && Cache.creeps[roomName].remoteWorker || [],
            max = 0;
        if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable || containers.length === 0) {
            return;
        }
        _.forEach(containers, (container) => {
            var source = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0],
                containerId = container.id;
            if (source instanceof Mineral) {
                return;
            }

            max += 1;

            if (_.filter(workers, (c) => (c.spawning || c.ticksToLive >= 150 + (Memory.lengthToContainer && Memory.lengthToContainer[containerId] && Memory.lengthToContainer[containerId][supportRoomName] ? Memory.lengthToContainer[containerId][supportRoomName] : 0) * 2) && c.memory.container === containerId).length === 0) {
                Worker.spawn(room, supportRoom, containerId);
            }
            return false;
        });
        if (Memory.log && (workers.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "remoteWorker",
                count: workers.length,
                max: max
            });
        }
    }

    static spawn(room, supportRoom, id) {
        var body = [],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, secondUnits, remainder, secondRemainder, count, spawnToUse, name;
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        energy = Math.min(supportRoom.energyCapacityAvailable, 3000);
        units = Math.floor(energy / 200);
        secondUnits = Math.floor((energy - 2000) / 150);
        remainder = energy % 200;
        secondRemainder = (energy - 2000) % 150;
        for (count = 0; count < units && count < 10; count++) {
            body.push(WORK);
        }

        if (energy < 2000 && remainder >= 150) {
            body.push(WORK);
        }

        for (count = 0; count < units && count < 10; count++) {
            body.push(CARRY);
        }

        for (count = 0; count < secondUnits; count++) {
            body.push(CARRY);
            body.push(CARRY);
        }

        if (energy < 2000 && remainder >= 100 && remainder < 150) {
            body.push(CARRY);
        }

        if (energy > 2000 && secondRemainder >= 100) {
            body.push(CARRY);
        }

        for (count = 0; count < units && count < 10; count++) {
            body.push(MOVE);
        }

        for (count = 0; count < secondUnits; count++) {
            body.push(MOVE);
        }

        if (energy < 2000 && remainder >= 50) {
            body.push(MOVE);
        }

        if (energy > 2000 && secondRemainder >= 50) {
            body.push(MOVE);
        }
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `remoteWorker-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "remoteWorker", home: roomName, supportRoom: supportRoomName, container: id});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteWorker || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var sites = _.filter(creep.room.find(FIND_MY_CONSTRUCTION_SITES), (c) => c.progressTotal === 1);
            
            if (sites.length > 0) {
                var task = new TaskBuild(sites[0].id);
                if (task.canAssign(creep)) {
                    creep.say("Build");
                    assigned.push(creep.name);
                }
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            _.forEach(TaskRepair.getCriticalTasks(creep.room), (task) => {
                if (_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id).length === 0) {
                    if (task.canAssign(creep)) {
                        creep.say("CritRepair");
                        assigned.push(creep.name);
                        return false;
                    }
                }
            });
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
            if (constructionSites.length > 0) {
                var task = new TaskBuild(constructionSites[0].id);
                if (task.canAssign(creep)) {
                    creep.say("Build");
                    assigned.push(creep.name);
                }
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach([].concat.apply([], [tasks.fillEnergy.storageTasks, tasks.fillEnergy.containerTasks]), (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Container");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });

                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.storageTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Storage");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.terminalTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Terminal");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            if (creep.room.name !== room.name) {
                return;
            }
            _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                if (_.filter(task.resource.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                    return;
                }
                if (task.canAssign(creep)) {
                    creep.say("Pickup");
                    assigned.push(creep.name);
                    return false;
                }
            });
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskCollectEnergy(creep.memory.container);

                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskHarvest(),
                    sources = Utilities.objectsClosestToObj(_.filter(room.find(FIND_SOURCES), (s) => s.energy > 0), creep);
                
                if (sources.length === 0) {
                    return false;
                }

                creep.memory.homeSource = sources[0].id;

                if (task.canAssign(creep)) {
                    creep.say("Harvesting");
                    assigned.push(creep.name);
                }
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.memory.home);
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    __require(1,26).registerObject(Worker, "RoleRemoteWorker");
}
module.exports = Worker;

return module.exports;
}
/********** End of module 26: ../src/role.remoteWorker.js **********/
/********** Start module 27: ../src/role.scientist.js **********/
__modules[27] = function(module, exports) {
var Cache = __require(3,27),
    Utilities = __require(8,27),
    TaskCollectEnergy = __require(39,27),
    TaskPickupResource = __require(48,27),
    TaskRally = __require(49,27);

class Scientist {
    static checkSpawn(room) {
        var controller = room.controller,
            roomName = room.name,
            scientists = Cache.creeps[roomName] && Cache.creeps[roomName].scientist || [],
            max = 1,
            count;
        if (!controller || controller.level < 6) {
            return;
        }
        count = _.filter(scientists, (c) => c.spawning || c.ticksToLive >= 150).length;

        if (count < max) {
            Scientist.spawn(room);
        }
        if (Memory.log && (scientists.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[room.name].creeps.push({
                role: "scientist",
                count: scientists.length,
                max: max
            });
        }
    }

    static spawn(room) {
        var spawns = Cache.spawnsInRoom(room),
            body = [],
            roomName = room.name,
            energy, units, remainder, count, spawnToUse, name;
        if (_.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        energy = Math.min(room.energyCapacityAvailable, 2500);
        units = Math.floor(energy / 150);
        remainder = energy % 150;
        for (count = 0; count < units; count++) {
            body.push(CARRY);
            body.push(CARRY);
        }

        if (remainder >= 100) {
            body.push(CARRY);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }

        if (remainder >= 50) {
            body.push(MOVE);
        }
        spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `scientist-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "scientist", home: roomName, homeSource: Utilities.objectsClosestToObj(room.find(FIND_SOURCES), spawns[0])[0].id});
        Cache.spawning[spawnToUse.id] = typeof name !== "number";

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].scientist || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = Cache.creeps[roomName] && Cache.creeps[roomName].all || [],
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.towerTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Tower");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });
        
        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.collectMinerals.labTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.labTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Lab");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.nukerTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("NukeG");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.powerSpawnTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("powerPower");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.storageTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Storage");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.terminalTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Terminal");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.labTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("LabEnergy");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });
        
        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (tasks.fillEnergy.terminalTask) {
            _.forEach(creepsWithNoTask, (creep) => {
                if (tasks.fillEnergy.terminalTask.canAssign(creep)) {
                    creep.say("Terminal");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        }

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.nukerTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("NukeEnergy");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });
        
        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (room.storage && room.storage.store[RESOURCE_ENERGY] > 25000) {
            _.forEach(tasks.fillEnergy.powerSpawnTasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("PwrEnergy");
                            assigned.push(creep.name);
                            energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];
                }
            });
        }
        
        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            if (creep.carry[RESOURCE_ENERGY] < (room.controller.level === 8 ? 200 : room.controller.level === 7 ? 100 : 50)) {
                return;
            }
            
            _.forEach(tasks.fillEnergy.extensionTasks.sort((a, b) => a.object.pos.getRangeTo(creep) - b.object.pos.getRangeTo(creep)), (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
                if (energyMissing > 0) {
                    if (task.canAssign(creep)) {
                        creep.say("Extension");
                        assigned.push(creep.name);
                        return false;
                    }
                }
            });
        });
        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.spawnTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Spawn");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.storageTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (!creep.memory.lastCollectEnergyWasStorage && task.canAssign(creep)) {
                        creep.say("Storage");
                        assigned.push(creep.name);
                        energyMissing -= _.sum(creep.carry);
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.collectMinerals.terminalTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.collectMinerals.storageTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (Cache.hostilesInRoom(room).length === 0) {
            _.forEach(creepsWithNoTask, (creep) => {
                _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                    if (_.filter(task.resource.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                        return;
                    }
                    if (task.canAssign(creep)) {
                        creep.say("Pickup");
                        assigned.push(creep.name);
                        return false;
                    }
                });
            });
        }

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (tasks.collectEnergy.terminalTask) {
            _.forEach(creepsWithNoTask, (creep) => {
                if (tasks.collectEnergy.terminalTask.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        }
        _.forEach(tasks.collectEnergy.tasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (room.terminal) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskRally(room.terminal.id, creep);
                task.canAssign(task.creep);
            });
        }
    }
}

if (Memory.profiling) {
    __require(1,27).registerObject(Scientist, "RoleScientist");
}
module.exports = Scientist;

return module.exports;
}
/********** End of module 27: ../src/role.scientist.js **********/
/********** Start module 28: ../src/role.storer.js **********/
__modules[28] = function(module, exports) {
var Cache = __require(3,28),
    Utilities = __require(8,28),
    TaskRally = __require(49,28);

class Storer {
    static checkSpawn(room) {
        var containers = Cache.containersInRoom(room),
            roomName = room.name,
            length = 0,
            max = 0,
            controller, army, storers, lengthToStorage;
        if (Cache.spawnsInRoom(room).length === 0 || containers.length === 0 || !room.storage || !room.storage.my) {
            return;
        }

        controller = room.controller;
        army = Memory.army;
        storers = Cache.creeps[roomName] && Cache.creeps[roomName].storer || [];
        if (!Memory.lengthToStorage) {
            Memory.lengthToStorage = {};
        }

        lengthToStorage = Memory.lengthToStorage;
        _.forEach(containers, (container) => {
            var containerId = container.id,
                closest;

            if (!Memory.containerSource[containerId]) {
                Memory.containerSource[containerId] = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0].id;
            }

            closest = Game.getObjectById(Memory.containerSource[containerId]);

            if (closest instanceof Mineral) {
                if (closest.mineralAmount > 0) {
                    max += 1;
                }
            } else {
                if (!lengthToStorage[container.id]) {
                    lengthToStorage[container.id] = PathFinder.search(container.pos, {pos: room.storage.pos, range: 1}, {swampCost: 1}).path.length;
                }

                length += lengthToStorage[container.id];
            }
        });
        max += Math.ceil(2 * length / (controller && controller.level === 8 ? 35 : 30)) + (controller.level >= 7 && army && _.filter(army, (a) => a.region === room.memory.region).length > 0 ? 1 : 0);
        if (_.filter(storers, (c) => c.spawning || c.ticksToLive >= 300).length < max) {
            Storer.spawn(room);
        }
        if (Memory.log && (storers.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "storer",
                count: storers.length,
                max: max
            });
        }        
    }

    static spawn(room) {
        var spawns = Cache.spawnsInRoom(room),
            roomName = room.name,
            body, spawnToUse, name;

        switch (room.controller.level) {
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
        if (_.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === room.memory.region).sort((a, b) => (a.room.name === roomName ? 0 : 1) - (b.room.name === roomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `storer-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "storer", home: roomName});
        Cache.spawning[spawnToUse.id] = typeof name !== "number";

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].storer || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = Cache.creeps[roomName] && Cache.creeps[roomName].all || [],
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.linkTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Link");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            if (creep.carry[RESOURCE_ENERGY] < (room.controller.level === 8 ? 200 : room.controller.level === 7 ? 100 : 50)) {
                return;
            }
            
            _.forEach(tasks.fillEnergy.extensionTasks.sort((a, b) => a.object.pos.getRangeTo(creep) - b.object.pos.getRangeTo(creep)), (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
                if (energyMissing > 0) {
                    if (task.canAssign(creep)) {
                        creep.say("Extension");
                        assigned.push(creep.name);
                        return false;
                    }
                }
            });
        });
        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.spawnTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Spawn");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (tasks.fillEnergy.terminalTask) {
            _.forEach(creepsWithNoTask, (creep) => {
                if (tasks.fillEnergy.terminalTask.canAssign(creep)) {
                    creep.say("Terminal");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        }

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.storageTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if ((!room.terminal || !creep.memory.lastCollectEnergyWasStorage) && task.canAssign(creep)) {
                        creep.say("Storage");
                        assigned.push(creep.name);
                        energyMissing -= _.sum(creep.carry);
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.storageTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Storage");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.terminalTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Terminal");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach([].concat.apply([], [tasks.collectEnergy.storerTasks, tasks.collectMinerals.storerTasks]).sort((a, b) => (b.object.energy || _.sum(b.object.store) || 0) - (a.object.energy || _.sum(a.object.store) || 0)), (task) => {
            if (!task.object.energy && !_.sum(task.object.store)) {
                return;
            }
            var energy = (task.object.energy || _.sum(task.object.store) || 0) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === task.type && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carryCapacity - _.sum(c.carry));}, 0);
            if (energy >= 500) {
                _.forEach(creepsWithNoTask, (creep) => {
                    creep.memory.lastCollectEnergyWasStorage = false;
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                        energy -= creep.carryCapacity - _.sum(creep.carry);
                        if (energy < 500) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (tasks.collectEnergy.terminalTask) {
            _.forEach(creepsWithNoTask, (creep) => {
                if (tasks.collectEnergy.terminalTask.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                    creep.memory.lastCollectEnergyWasStorage = false;
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        }

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.collectEnergy.tasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                    if (task.object.structureType === STRUCTURE_STORAGE) {
                        creep.memory.lastCollectEnergyWasStorage = true;
                    }
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.room.terminal ? creep.room.terminal.id : creep.room.name);
            task.range = 0;
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    __require(1,28).registerObject(Storer, "RoleStorer");
}
module.exports = Storer;

return module.exports;
}
/********** End of module 28: ../src/role.storer.js **********/
/********** Start module 29: ../src/role.tower.js **********/
__modules[29] = function(module, exports) {
var Cache = __require(3,29);

class Tower {
    static assignTasks(room, tasks) {
        if (tasks.rangedAttack.tasks.length > 0) {
            _.forEach(Cache.towersInRoom(room), (tower) => {
                tower.attack(tasks.rangedAttack.tasks[0].enemy);
            });
            return;
        }
        if (tasks.repair.towerTasks.length > 0) {
            _.forEach(Cache.towersInRoom(room), (tower) => {
                tower.repair(tasks.repair.towerTasks[0].structure);
            });
            return;
        }
        if (tasks.heal.tasks.length > 0) {
            _.forEach(Cache.towersInRoom(room), (tower) => {
                tower.heal(tasks.heal.tasks[0].ally);
            });
            return;
        }
    }
}

if (Memory.profiling) {
    __require(1,29).registerObject(Tower, "RoleTower");
}
module.exports = Tower;

return module.exports;
}
/********** End of module 29: ../src/role.tower.js **********/
/********** Start module 30: ../src/role.upgrader.js **********/
__modules[30] = function(module, exports) {
var Cache = __require(3,30),
    Utilities = __require(8,30),
    TaskCollectEnergy = __require(39,30),
    TaskHarvest = __require(44,30),
    TaskPickupResource = __require(48,30),
    TaskRally = __require(49,30);

class Upgrader {
    static checkSpawn(room) {
        var roomName = room.name,
            upgraders = Cache.creeps[roomName] && Cache.creeps[roomName].upgrader || [],
            storage = room.storage,
            controller = room.controller,
            storageEnergy, count, max;
        if (Cache.spawnsInRoom(room).length === 0) {
            return;
        }

        if (storage) {
            storageEnergy = storage.store[RESOURCE_ENERGY];
        }

        count = _.filter(upgraders, (c) => c.spawning || c.ticksToLive >= 150).length;
        if (roomName === Memory.rushRoom) {
            max = 1;
        } else if (!storage || storageEnergy < Memory.upgradeEnergy) {
            max = 0;
        } else {
            max = 1;
        }

        if (count < max || controller && controller.level < 8 && storage && storageEnergy > 900000) {
            Upgrader.spawn(room);
        }
        if (Memory.log && (upgraders.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "upgrader",
                count: upgraders.length,
                max: max
            });
        }
        _.forEach(_.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.memory.region === room.memory.region && r.name !== room.name && r.controller && r.controller.my && r.controller.level < 7), (otherRoom) => {
            if (_.filter(Cache.creeps[otherRoom.name] && Cache.creeps[otherRoom.name].upgrader || [], (c) => c.memory.supportRoom !== c.memory.home).length === 0) {
                Upgrader.spawn(otherRoom, room);
            }
        });
    }

    static spawn(room, supportRoom) {
        var body = [],
            controller = room.controller,
            workCount = 0,
            canBoost = false,
            roomName = room.name,
            supportRoomName, spawns, storage, energy, units, remainder, count, spawnToUse, name, labToBoostWith;

        if (!supportRoom) {
            supportRoom = room;
        }
        supportRoomName = supportRoom.name;
        spawns = Cache.spawnsInRoom(supportRoom);
        storage = supportRoom.storage;
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        if (Cache.linksInRoom(room).length >= 2 && Utilities.objectsClosestToObj(Cache.linksInRoom(room), controller)[0].pos.getRangeTo(controller) <= 2) {
            energy = Math.min(supportRoom.energyCapacityAvailable, controller.level === 8 ? 1950 : 4100);
            units = Math.floor((energy - Math.ceil(energy / 3200) * 50) / 250);
            remainder = (energy - Math.ceil(energy / 3200) * 50) % 250;
            for (count = 0; count < units; count++) {
                body.push(WORK);
                body.push(WORK);
                workCount += 2;
            }

            if (remainder >= 150) {
                body.push(WORK);
                workCount++;
            }

            for (count = 0; count < Math.ceil(energy / 3200); count++) {
                body.push(CARRY);
            }

            for (count = 0; count < units; count++) {
                body.push(MOVE);
            }

            if (remainder >= 50) {
                body.push(MOVE);
            }
        } else {
            energy = Math.min(supportRoom.energyCapacityAvailable, controller.level === 8 ? 3000 : 3300);
            units = Math.floor(energy / 200);
            remainder = energy % 200;
            for (count = 0; count < units; count++) {
                body.push(WORK);
                workCount++;
            }

            if (remainder >= 150) {
                body.push(WORK);
                workCount++;
            }

            for (count = 0; count < units; count++) {
                body.push(CARRY);
            }

            if (remainder >= 100 && remainder < 150) {
                body.push(CARRY);
            }

            for (count = 0; count < units; count++) {
                body.push(MOVE);
            }

            if (remainder >= 50) {
                body.push(MOVE);
            }
        }

        if (workCount > 0 && storage && Cache.labsInRoom(supportRoom).length > 0 && Math.max(storage.store[RESOURCE_GHODIUM_HYDRIDE] || 0, storage.store[RESOURCE_GHODIUM_ACID] || 0, storage.store[RESOURCE_CATALYZED_GHODIUM_ACID] || 0) >= 30 * workCount) {
            canBoost = !!(labToBoostWith = Utilities.getLabToBoostWith(supportRoom)[0]);
        }
        if (Cache.labsInRoom(supportRoom).length < 3) {
            spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        } else {
            spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
        }

        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `upgrader-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "upgrader", home: roomName, supportRoom: supportRoomName, homeSource: Utilities.objectsClosestToObj(room.find(FIND_SOURCES), spawns[0])[0].id, labs: canBoost ? [labToBoostWith.id] : []});
        Cache.spawning[spawnToUse.id] = typeof name !== "number";

        if (typeof name !== "number" && canBoost) {
            labToBoostWith.creepToBoost = name;
            labToBoostWith.resource = storage.store[RESOURCE_CATALYZED_GHODIUM_ACID] >= 30 * workCount ? RESOURCE_CATALYZED_GHODIUM_ACID : storage.store[RESOURCE_GHODIUM_ACID] >= 30 * workCount ? RESOURCE_GHODIUM_ACID : RESOURCE_GHODIUM_HYDRIDE;
            labToBoostWith.amount = 30 * workCount;
            supportRoom.memory.labsInUse.push(labToBoostWith);
            _.forEach(_.filter(Cache.creeps[supportRoomName] && Cache.creeps[supportRoomName].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && c.memory.currentTask.id === labToBoostWith.id), (creep) => {
                delete creep.memory.currentTask;
            });
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].upgrader || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            assigned = [],
            controller = room.controller;

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(creepsWithNoTask, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
            var task = new TaskRally(creep.memory.labs[0]);
            task.canAssign(creep);
            assigned.push(creep.name);
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.upgradeController.tasks, (task) => {
            _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, controller), (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Controller");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });
        
        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var links = Utilities.objectsClosestToObj(Cache.linksInRoom(room), controller),
                task;

            if (links.length > 0 && links[0].energy > 0) {
                task = new TaskCollectEnergy(links[0].id);
                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!controller || controller.level < 6) {
            if (Cache.hostilesInRoom(room).length === 0) {
                _.forEach(creepsWithNoTask, (creep) => {
                    _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                        if (_.filter(task.resource.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                            return;
                        }
                        if (task.canAssign(creep)) {
                            creep.say("Pickup");
                            assigned.push(creep.name);
                            return false;
                        }
                    });
                });
            }

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
        _.forEach(tasks.collectEnergy.tasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (_.filter(Cache.containersInRoom(room), (c) => c.energy > 0).length === 0 && !room.storage) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskHarvest();
                if (task.canAssign(creep)) {
                    creep.say("Harvesting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.memory.home);
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    __require(1,30).registerObject(Upgrader, "RoleUpgrader");
}
module.exports = Upgrader;

return module.exports;
}
/********** End of module 30: ../src/role.upgrader.js **********/
/********** Start module 31: ../src/role.worker.js **********/
__modules[31] = function(module, exports) {
var Cache = __require(3,31),
    Utilities = __require(8,31),
    TaskHarvest = __require(44,31),
    TaskPickupResource = __require(48,31),
    TaskRally = __require(49,31);

class Worker {
    static checkSpawn(room, canSpawn) {
        var roomName = room.name,
            workers = Cache.creeps[roomName] && Cache.creeps[roomName].worker || [],
            storage = room.storage,
            count, max;
        if (room.find(FIND_SOURCES).length === 0) {
            return;
        }
        count = _.filter(workers, (c) => c.spawning || c.ticksToLive >= (storage && storage.my ? 150 : 300)).length;
        max = canSpawn ? storage && storage.my ? 1 : 2 : 0;

        if (count < max) {
            Worker.spawn(room);
        }
        if (Memory.log && (workers.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "worker",
                count: workers.length,
                max: max
            });
        }
        _.forEach(_.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.memory.region === room.memory.region && r.name !== roomName && r.controller && r.controller.my && r.controller.level < 6), (otherRoom) => {
            if (_.filter(Cache.creeps[otherRoom.name] && Cache.creeps[otherRoom.name].worker || [], (c) => c.memory.supportRoom !== c.memory.home).length === 0) {
                Worker.spawn(otherRoom, room);
            }
        });
    }

    static spawn(room, supportRoom) {
        var body = [],
            workCount = 0,
            canBoost = false,
            roomName = room.name,
            supportRoomName, spawns, storage, energy, units, remainder, count, spawnToUse, name, labToBoostWith;

        if (!supportRoom) {
            supportRoom = room;
        }
        supportRoomName = supportRoom.name;
        spawns = Cache.spawnsInRoom(supportRoom);
        storage = supportRoom.storage;
        if (spawns.length === 0) {
            return;
        }
        if (Cache.labsInRoom(supportRoom).length >= 3 && _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }
        energy = Math.min(supportRoom.energyCapacityAvailable, 3300);
        units = Math.floor(energy / 200);
        remainder = energy % 200;
        for (count = 0; count < units; count++) {
            body.push(WORK);
            workCount++;
        }

        if (remainder >= 150) {
            body.push(WORK);
            workCount++;
        }

        for (count = 0; count < units; count++) {
            body.push(CARRY);
        }

        if (remainder >= 100 && remainder < 150) {
            body.push(CARRY);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }

        if (remainder >= 50) {
            body.push(MOVE);
        }

        if ((roomName === supportRoomName || room.find(FIND_MY_CONSTRUCTION_SITES).length > 0) && workCount > 0 && storage && Cache.labsInRoom(supportRoom).length > 0 && Math.max(storage.store[RESOURCE_LEMERGIUM_HYDRIDE] || 0, storage.store[RESOURCE_LEMERGIUM_ACID] || 0, storage.store[RESOURCE_CATALYZED_LEMERGIUM_ACID] || 0) >= 30 * workCount) {
            canBoost = !!(labToBoostWith = Utilities.getLabToBoostWith(supportRoom)[0]);
        }
        if (Cache.labsInRoom(supportRoom).length < 3) {
            spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        } else {
            spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
        }
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `worker-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "worker", home: roomName, supportRoom: supportRoomName, homeSource: Utilities.objectsClosestToObj(room.find(FIND_SOURCES), spawns[0])[0].id, labs: canBoost ? [labToBoostWith.id] : []});
        Cache.spawning[spawnToUse.id] = typeof name !== "number";

        if (typeof name !== "number" && canBoost) {
            labToBoostWith.creepToBoost = name;
            labToBoostWith.resource = storage.store[RESOURCE_CATALYZED_LEMERGIUM_ACID] >= 30 * workCount ? RESOURCE_CATALYZED_LEMERGIUM_ACID : storage.store[RESOURCE_LEMERGIUM_ACID] >= 30 * workCount ? RESOURCE_LEMERGIUM_ACID : RESOURCE_LEMERGIUM_HYDRIDE;
            labToBoostWith.amount = 30 * workCount;
            supportRoom.memory.labsInUse.push(labToBoostWith);
            _.forEach(_.filter(Cache.creeps[supportRoom.name] && Cache.creeps[supportRoom.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && c.memory.currentTask.id === labToBoostWith.id), (creep) => {
                delete creep.memory.currentTask;
            });
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            workers = Cache.creeps[roomName] && Cache.creeps[roomName].worker || [],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(workers), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = Cache.creeps[roomName] && Cache.creeps[roomName].all || [],
            storers = Cache.creeps[roomName] && Cache.creeps[roomName].storer || [],
            controller = room.controller,
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(creepsWithNoTask, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
            var lab = _.filter(Memory.rooms[creep.memory.supportRoom].labsInUse, (l) => l.id === creep.memory.labs[0])[0];
            if (lab && Game.getObjectById(creep.memory.labs[0]).mineralType === lab.resource && Game.getObjectById(creep.memory.labs[0]).mineralAmount >= lab.amount) {
                var task = new TaskRally(creep.memory.labs[0]);
                task.canAssign(creep);
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.storageTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Storage");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillMinerals.terminalTasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Terminal");
                    assigned.push(creep.name);
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.upgradeController.criticalTasks, (task) => {
            if (_.filter(workers, (c) => c.memory.currentTask && c.memory.currentTask.type === "upgradeController" && c.memory.currentTask.room === task.room).length === 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, controller), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("CritCntrlr");
                        assigned.push(creep.name);
                        return false;
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!room.storage || storers.length === 0) {
            _.forEach(creepsWithNoTask, (creep) => {
                if (creep.carry[RESOURCE_ENERGY] < (room.controller.level === 8 ? 200 : room.controller.level === 7 ? 100 : 50)) {
                    return;
                }
                
                _.forEach(tasks.fillEnergy.extensionTasks.sort((a, b) => a.object.pos.getRangeTo(creep) - b.object.pos.getRangeTo(creep)), (task) => {
                    var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
                    if (energyMissing > 0) {
                        if (task.canAssign(creep)) {
                            creep.say("Extension");
                            assigned.push(creep.name);
                            return false;
                        }
                    }
                });
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
        if (!room.storage || storers.length === 0) {
            _.forEach(tasks.fillEnergy.spawnTasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Spawn");
                            assigned.push(creep.name);
                            energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];
                }
            });
        }

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.fillEnergy.towerTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Tower");
                        assigned.push(creep.name);
                        energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (energyMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });
        
        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(_.filter(tasks.build.tasks, (t) => t.constructionSite.progressTotal === 1), (task) => {
            var progressMissing = task.constructionSite.progressTotal - task.constructionSite.progress - _.reduce(_.filter(task.constructionSite.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "build" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (progressMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.constructionSite), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Build");
                        assigned.push(creep.name);
                        progressMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (progressMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.repair.criticalTasks, (task) => {
            _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.structure), (creep) => {
                if (_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id).length === 0) {
                    if (task.canAssign(creep)) {
                        creep.say("CritRepair");
                        assigned.push(creep.name);
                        return false;
                    }
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.build.tasks, (task) => {
            var progressMissing = task.constructionSite.progressTotal - task.constructionSite.progress - _.reduce(_.filter(task.constructionSite.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "build" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (progressMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.constructionSite), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Build");
                        assigned.push(creep.name);
                        progressMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (progressMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        _.forEach(tasks.repair.tasks, (task) => {
            var hitsMissing = task.structure.hitsMax - task.structure.hits - _.reduce(_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0) * 100,
                taskAssigned = false;
            
            if (hitsMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.structure), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Repair");
                        assigned.push(creep.name);
                        hitsMissing -= (creep.carry[RESOURCE_ENERGY] || 0) * 100;
                        taskAssigned = true;
                        if (hitsMissing <= 0) {
                            return false;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];

                return taskAssigned;
            }
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (controller && controller.level < 8) {
            _.forEach(tasks.upgradeController.tasks, (task) => {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, room.controller), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Controller");
                        assigned.push(creep.name);
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            });
            
            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
        if (!controller || controller.level < 6) {
            if (Cache.hostilesInRoom(room).length === 0) {
                _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === room.name), (creep) => {
                    _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                        if (_.filter(task.resource.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
                            return;
                        }
                        if (task.canAssign(creep)) {
                            creep.say("Pickup");
                            assigned.push(creep.name);
                            return false;
                        }
                    });
                });
            }

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
        if (tasks.collectEnergy.terminalTask) {
            _.forEach(creepsWithNoTask, (creep) => {
                if (tasks.collectEnergy.terminalTask.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        }
        _.forEach(tasks.collectEnergy.tasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];
        });

        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (_.filter(Cache.containersInRoom(room), (c) => c.energy > 0).length === 0 && !room.storage) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskHarvest();
                if (task.canAssign(creep)) {
                    creep.say("Harvesting");
                    assigned.push(creep.name);
                }
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
        _.forEach(TaskRally.getHarvesterTasks(creepsWithNoTask), (task) => {
            task.canAssign(task.creep);
        });
    }
}

if (Memory.profiling) {
    __require(1,31).registerObject(Worker, "RoleWorker");
}
module.exports = Worker;

return module.exports;
}
/********** End of module 31: ../src/role.worker.js **********/
/********** Start module 32: ../src/room.base.js **********/
__modules[32] = function(module, exports) {
var Cache = __require(3,32),
    Commands = __require(4,32),
    Market = __require(6,32),
    Minerals = __require(7,32),
    Utilities = __require(8,32),
    RoleClaimer = __require(13,32),
    RoleCollector = __require(14,32),
    RoleConverter = __require(15,32),
    RoleDismantler = __require(17,32),
    RoleMiner = __require(19,32),
    RoleScientist = __require(27,32),
    RoleStorer = __require(28,32),
    RoleTower = __require(29,32),
    RoleUpgrader = __require(30,32),
    RoleWorker = __require(31,32),
    TaskBuild = __require(37,32),
    TaskCollectEnergy = __require(39,32),
    TaskCollectMinerals = __require(40,32),
    TaskDismantle = __require(41,32),
    TaskFillEnergy = __require(42,32),
    TaskFillMinerals = __require(43,32),
    TaskHeal = __require(45,32),
    TaskRangedAttack = __require(50,32),
    TaskRepair = __require(51,32),
    TaskUpgradeController = __require(53,32);

class Base {
    constructor() {
        this.type = "base";
    }

    manage(room) {
        var controller = room.controller,
            rcl = controller.level,
            sites = room.find(FIND_MY_CONSTRUCTION_SITES),
            spawn = Cache.spawnsInRoom(room)[0],
            spawnPos = spawn.pos,
            storage = room.storage,
            minerals = room.find(FIND_MINERALS),
            roomName = room.name,
            extensionsToBuild;
        if (!controller || rcl === 0) {
            return;
        }
        if ((extensionsToBuild = [0, 5, 10, 20, 30, 40, 50, 60][rcl - 1] - (Cache.extensionsInRoom(room).length + _.filter(sites, (c) => c.structureType === STRUCTURE_EXTENSION).length)) > 0) {
            Utilities.buildStructures(room, STRUCTURE_EXTENSION, extensionsToBuild, spawn);
        }
        if (rcl >= 3 && Cache.towersInRoom(room).length === 0 && _.filter(sites, (c) => c.structureType === STRUCTURE_TOWER).length === 0) {
            Utilities.buildStructures(room, STRUCTURE_TOWER, 1, spawn);
        }
        if (rcl >= 3) {
            _.forEach(room.find(FIND_SOURCES), (source) => {
                var location = PathFinder.search(source.pos, {pos: spawnPos, range: 1}, {swampCost: 1}).path[0],
                    structures = location.lookFor(LOOK_STRUCTURES),
                    x = location.x,
                    y = location.y;

                if (
                    _.filter(structures, (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                    _.filter(sites, (s) => s.pos.x === x && s.pos.y === y && s.structureType === STRUCTURE_CONTAINER).length === 0
                ) {
                    _.forEach(_.filter(structures, (s) => [STRUCTURE_ROAD, STRUCTURE_WALL].indexOf(s.structureType) !== -1), (structure) => {
                        structure.destroy();
                    });
                    room.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                }
            });
        }
        if (rcl >= 4 && !storage && _.filter(sites, (c) => c.structureType === STRUCTURE_STORAGE).length === 0) {
            Utilities.buildStructures(room, STRUCTURE_STORAGE, 1, spawn);
        }
        if (rcl >= 6 && storage && !room.terminal && _.filter(sites, (c) => c.structureType === STRUCTURE_TERMINAL).length === 0) {
            Utilities.buildStructures(room, STRUCTURE_TERMINAL, 1, storage);
        }
        if (rcl >= 6 && minerals.length !== Cache.extractorsInRoom(room).length) {
            _.forEach(minerals, (mineral) => {
                var mineralPos = mineral.pos,
                    mineralX = mineralPos.x,
                    mineralY = mineralPos.y;
                
                if (
                    _.filter(mineralPos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_EXTRACTOR).length === 0 &&
                    _.filter(sites, (s) => s.pos.x === mineralX && s.pos.y === mineralY && s.structureType === STRUCTURE_EXTRACTOR).length === 0
                ) {
                    room.createConstructionSite(mineralX, mineralY, STRUCTURE_EXTRACTOR);
                }
            });
        }
        if (rcl >= 6) {
            _.forEach(minerals, (mineral) => {
                var location = PathFinder.search(mineral.pos, {pos: spawnPos, range: 1}, {swampCost: 1}).path[0],
                    structures = location.lookFor(LOOK_STRUCTURES),
                    x = location.x,
                    y = location.y;

                if (
                    _.filter(structures, (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                    _.filter(sites, (s) => s.pos.x === x && s.pos.y === y && s.structureType === STRUCTURE_CONTAINER).length === 0
                ) {
                    _.forEach(_.filter(structures, (s) => [STRUCTURE_ROAD, STRUCTURE_WALL].indexOf(s.structureType) !== -1), (structure) => {
                        structure.destroy();
                    });
                    room.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                }
            });
        }
        if (rcl >= 3) {
            _.forEach(_.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_TOWER || s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_TERMINAL), (structure) => {
                var structureX = structure.pos.x,
                    structureY = structure.pos.y;
                    
                _.forEach([new RoomPosition(structureX - 1, structureY, roomName), new RoomPosition(structureX + 1, structureY, roomName), new RoomPosition(structureX, structureY - 1, roomName), new RoomPosition(structureX, structureY + 1, roomName)], (pos) => {
                    var x = pos.x,
                        y = pos.y;
                    
                    if (
                        _.filter(pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_ROAD).length === 0 &&
                        _.filter(sites, (s) => s.pos.x === x && s.pos.y === y && s.structureType === STRUCTURE_ROAD).length === 0
                    ) {
                        room.createConstructionSite(x, y, STRUCTURE_ROAD);
                    }
                });
            });
        }
    }
    defend(room) {
        var roomName = room.name,
            roomMemory = room.memory,
            hostiles = _.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username !== "Invader"),
            armyName = `${roomName}-defense`,
            armySize, attackTicks, exits;

        if (hostiles.length > 0) {
            roomMemory.lastHostile = Game.time;
            if (!roomMemory.currentAttack) {
                roomMemory.currentAttack = Game.time;
            }
            if (!roomMemory.threats) {
                roomMemory.threats = {};
            }
            if (!roomMemory.edgeTicks) {
                roomMemory.edgeTicks = {
                    1: 0,
                    3: 0,
                    5: 0,
                    7: 0
                };
            }
            
            _.forEach(_.filter(_.map(hostiles, (h) => ({id: h.id, threat: _.filter(h.body, (b) => [ATTACK, RANGED_ATTACK, HEAL].indexOf(b) !== -1).length}))), (hostile) => {
                roomMemory.threats[hostile.id] = hostile.threat;
            });
            armySize = Math.min(Math.ceil(_.sum(roomMemory.threats) / 20), 3);

            if (_.filter(hostiles, (h) => h.pos.x === 0).length > 0) {
                roomMemory.edgeTicks[TOP]++;
            }

            if (_.filter(hostiles, (h) => h.pos.x === 49).length > 0) {
                roomMemory.edgeTicks[BOTTOM]++;
            }

            if (_.filter(hostiles, (h) => h.pos.y === 0).length > 0) {
                roomMemory.edgeTicks[LEFT]++;
            }

            if (_.filter(hostiles, (h) => h.pos.y === 49).length > 0) {
                roomMemory.edgeTicks[RIGHT]++;
            }

            if (armySize > 0) {
                if (!Memory.army[armyName]) {
                    Game.notify(`Warning! ${roomName} is under attack!`);
                    Commands.createArmy(armyName, {reinforce: false, region: roomMemory.region, boostRoom: roomName, buildRoom: roomName, stageRoom: roomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: armySize, units: 20}, ranged: {maxCreeps: 0, units: 20}});
                    Memory.army[armyName].creepCount = 0;
                } else {
                    attackTicks = Game.time - roomMemory.currentAttack;

                    if (attackTicks >= 500 && attackTicks < 2000) {
                        Memory.army[armyName].boostRoom = roomName;
                    } else if (attackTicks >= 2000 && attackTicks < 2500) {
                        _.forEach(_.filter(Game.rooms, (r) => r.memory && r.memory.region === roomMemory.region), (remoteRoom) => {
                            var remoteArmyName = `${remoteRoom.name}-defense-for-${roomName}`;
                            if (!Memory.army[`${remoteRoom.name}-defense`] && !Memory.army[remoteArmyName]) {
                                Commands.createArmy(remoteArmyName, {reinforce: false, region: roomMemory.region, boostRoom: roomName, buildRoom: roomName, stageRoom: roomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: armySize, units: 20}, ranged: {maxCreeps: 0, units: 20}});
                            }
                        });
                    } else if (attackTicks >= 2500) {
                        _.forEach(_.filter(Game.rooms, (r) => r.memory && r.memory.region === roomMemory.region), (remoteRoom) => {
                            var remoteArmyName = `${remoteRoom.name}-defense-for-${roomName}`;
                            if (Memory.army[remoteArmyName]) {
                                Memory.army[remoteArmyName].boostRoom = remoteRoom.name;
                            }
                        });
                    }
                    exits = Game.map.describeExits(roomName);
                    _.forEach(_.keys(exits), (dir) => {
                        var dirArmyName = `${roomName}-${dir.toString()}-border-defense`;
                        if (!Memory.army[dirArmyName] && roomMemory.edgeTicks[dir] >= 50) {
                            Commands.createArmy(dirArmyName, {reinforce: false, region: roomMemory.region, boostRoom: roomName, buildRoom: roomName, stageRoom: roomName, attackRoom: exits[dir], dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: armySize, units: 20}, ranged: {maxCreeps: 0, units: 20}});
                        }
                    });
                }
            }
        } else if (Memory.army[armyName]) {
            if (roomMemory.lastHostile + 50 < Game.time) {
                if (Memory.army[armyName]) {
                    Memory.army[armyName].directive = "attack";
                    Memory.army[armyName].success = true;
                }
                delete roomMemory.lastHostile;
                delete roomMemory.currentAttack;
                delete roomMemory.threats;
                delete roomMemory.edgeTicks;
            }
        }
    }

    transferEnergy(room) {
        var links = Utilities.objectsClosestToObj(Cache.linksInRoom(room), Cache.spawnsInRoom(room)[0]),
            firstLink = links[0];

        _.forEach(links, (link, index) => {
            if (index === 0) {
                return;
            }

            if (!firstLink.cooldown && firstLink.energy > 0 && link.energy <= 300) {
                firstLink.transferEnergy(link);
            }
        });
    }

    terminal(room, terminal) {
        var terminalStore = terminal.store,
            terminalEnergy = terminalStore[RESOURCE_ENERGY] || 0,
            storage = room.storage,
            roomName = room.name,
            memory = room.memory,
            buyQueue = memory.buyQueue,
            dealMade = false,
            flips = [],
            storageStore = {},
            market = Game.market,
            maxEnergy = Math.max(..._.map(_.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.storage && r.storage.my && r.terminal && r.terminal.my), (r) => (r.storage && r.storage.my) ? r.storage.store[RESOURCE_ENERGY] : 0)),
            bases, terminalMinerals, bestOrder, transCost, amount;
            
        if (storage) {
            storageStore = storage.store;
        }
        
        if (!terminal.cooldown && terminalEnergy >= 1000 && maxEnergy >= Memory.dealEnergy) {
            if (memory.buyQueue && (Cache.credits < Memory.minimumCredits || (storageStore[buyQueue.resource] || 0) + (terminalStore[buyQueue.resource] || 0) > (Memory.reserveMinerals[buyQueue.resource] || 0))) {
                delete memory.buyQueue;
                buyQueue = undefined;
            }

            if (buyQueue && maxEnergy > Memory.marketEnergy && Memory.buy) {
                bestOrder = (Market.getFilteredOrders().sell[buyQueue.resource] || [])[0];
                if (bestOrder) {
                    if (bestOrder.price > buyQueue.price) {
                        delete memory.buyQueue;
                        buyQueue = undefined;
                    } else {
                        transCost = market.calcTransactionCost(Math.min(buyQueue.amount, bestOrder.amount), roomName, bestOrder.roomName);
                            if (terminalEnergy > transCost && Cache.credits >= buyQueue.amount * bestOrder.price) {
                            Market.deal(bestOrder.id, Math.min(buyQueue.amount, bestOrder.amount), roomName);
                            dealMade = true;
                            buyQueue.amount -= Math.min(buyQueue.amount, bestOrder.amount);
                        } else {
                            if (terminalEnergy > 0) {
                                amount = Math.min(Math.floor(Math.min(buyQueue.amount, bestOrder.amount) * terminalEnergy / transCost), Math.floor(Cache.credits / bestOrder.price));
                                if (amount > 0) {
                                    Market.deal(bestOrder.id, amount, roomName);
                                    dealMade = true;
                                    buyQueue.amount -= amount;
                                }
                            }
                        }
                    }
                } else {
                    delete memory.buyQueue;
                    buyQueue = undefined;
                }

                if (buyQueue && buyQueue.amount <= 0) {
                    delete memory.buyQueue;
                    buyQueue = undefined;
                }
            } else {
                if (Cache.credits >= Memory.minimumCredits && Memory.buy) {
                    bases = _.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.terminal && r.terminal.my);
                    _.forEach(bases, (otherRoom) => {
                        var otherRoomName = otherRoom.name;

                        dealMade = false;
                        if (roomName === otherRoom.name) {
                            return;
                        }

                        _.forEach(_.filter(_.map(terminalStore, (s, k) => ({
                            resource: k,
                            amount: Math.min(Memory.reserveMinerals ? s + storageStore[k] - (k.startsWith("X") && k.length === 5 ? Memory.reserveMinerals[k] - 5000 : Memory.reserveMinerals[k]) : 0, s),
                            otherRoomAmount: (otherRoom.terminal.store[k] || 0) + (otherRoom.storage && otherRoom.storage.store[k] || 0),
                            needed: Memory.reserveMinerals ? (k.startsWith("X") && k.length === 5 ? Memory.reserveMinerals[k] - 5000 : Memory.reserveMinerals[k]) || 0 : 0
                        })), (r) => Memory.reserveMinerals[r.resource] && r.otherRoomAmount < r.needed && r.amount > 0 && r.needed - r.otherRoomAmount > 0 && Math.min(r.amount, r.needed - r.otherRoomAmount) >= 100), (resource) => {
                            var amount = Math.min(resource.amount, resource.needed - resource.otherRoomAmount);

                            transCost = market.calcTransactionCost(amount, roomName, otherRoomName);
                            if (terminalEnergy > transCost) {
                                if (room.terminal.send(resource.resource, amount, otherRoomName) === OK) {
                                    Cache.log.events.push(`Sending ${amount} ${resource.resource} from ${roomName} to ${otherRoomName}`);
                                    dealMade = true;
                                    return false;
                                }
                            } else {
                                if (terminalEnergy > 0) {
                                    amount = Math.floor(amount * terminalEnergy / transCost);
                                    if (amount > 0) {
                                        if (room.terminal.send(resource.resource, amount, otherRoomName) === OK) {
                                            Cache.log.events.push(`Sending ${amount} ${resource.resource} from ${roomName} to ${otherRoomName}`);
                                            dealMade = true;
                                            return false;
                                        }
                                    }
                                }
                            }
                        });

                        return !dealMade;
                    });
                }
                if (!dealMade) {
                    terminalMinerals = _.filter(_.map(terminalStore, (s, k) => {
                        return {resource: k, amount: Math.min(s, s - (Memory.reserveMinerals ? (k.startsWith("X") && k.length === 5 ? Memory.reserveMinerals[k] - 5000 : Memory.reserveMinerals[k]) || 0 : 0) + (storageStore[k] || 0))};
                    }), (s) => s.resource !== RESOURCE_ENERGY && s.amount > 0);

                    if (terminalMinerals.length > 0) {
                        _.forEach(terminalMinerals.sort((a, b) => b.amount - a.amount), (topResource) => {
                            var resource = topResource.resource;

                            bestOrder = _.filter(Market.getFilteredOrders().buy[resource] || [], (o) => (topResource.amount >= 5005 && Cache.credits < Memory.minimumCredits) || (!Memory.minimumSell[resource] && !Memory.flipPrice[resource]) || (Memory.minimumSell[resource] && o.price >= Memory.minimumSell[resource]) || (Memory.flipPrice[resource] && o.price >= Memory.flipPrice[resource].price) || (Memory.flipPrice[resource] && Game.time > Memory.flipPrice[resource].expiration))[0];
                            if (bestOrder) {
                                transCost = market.calcTransactionCost(Math.min(topResource.amount, bestOrder.amount), roomName, bestOrder.roomName);
                                if (terminalEnergy > transCost) {
                                    Market.deal(bestOrder.id, Math.min(topResource.amount, bestOrder.amount), roomName);
                                    dealMade = true;
                                    if (topResource.amount < 5005) {
                                        delete Memory.minimumSell[bestOrder.resourceType];
                                    }
                                    return false;
                                } else {
                                    if (terminalEnergy > 0) {
                                        amount = Math.floor(Math.min(topResource.amount, bestOrder.amount) * terminalEnergy / transCost);
                                        if (amount > 0) {
                                            Market.deal(bestOrder.id, amount, roomName);
                                            dealMade = true;
                                            return false;
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
                if (!dealMade && storage && maxEnergy > Memory.marketEnergy) {
                    _.forEach(Minerals, (children, resource) => {
                        var sellOrder, buyOrder;
                        if (!storageStore || storageStore[resource] < Memory.reserveMinerals[resource]) {
                            return;
                        }
                        if ([RESOURCE_ENERGY, SUBSCRIPTION_TOKEN].indexOf(resource) !== -1) {
                            return;
                        }
                        sellOrder = (Market.getFilteredOrders().sell[resource] || [])[0];
                        buyOrder = (Market.getFilteredOrders().buy[resource] || [])[0];

                        if (sellOrder && buyOrder && sellOrder.price < buyOrder.price && sellOrder.price < Cache.credits) {
                            flips.push({resource: resource, buy: buyOrder, sell: sellOrder});
                        }
                    });

                    _.forEach(flips.sort((a, b) => a.sell.price - a.buy.price - (b.sell.price - b.buy.price)), (flip, index) => {
                        var buy = flip.buy,
                            sell = flip.sell;

                        amount = Math.min(buy.amount, sell.amount);
                        if (amount * sell.price > Cache.credits) {
                            amount = Math.floor(Cache.credits / sell.price);
                        }

                        if (index === 0) {
                            Cache.log.events.push(`Biggest flip: ${flip.resource} x${amount} ${sell.price.toFixed(2)} to ${buy.price.toFixed(2)}`);
                        }
                        transCost = market.calcTransactionCost(amount, roomName, sell.roomName);
                        if (terminalEnergy > transCost) {
                            Market.deal(sell.id, amount, roomName);
                            Memory.flipPrice[flip.resource] = {price: sell.price, expiration: Game.time + 100};
                            dealMade = true;
                            return false;
                        }

                        if (terminalEnergy > 0) {
                            amount = Math.floor(amount * terminalEnergy / transCost);
                            if (amount > 0) {
                                Market.deal(sell.id, amount, roomName);
                                Memory.flipPrice[flip.resource] = {price: sell.price, expiration: Game.time + 100};
                                dealMade = true;
                                return false;
                            }
                        }
                    });
                }
            }
        }
    }

    tasks(room) {
        var terminal = room.terminal,
            dismantle = Memory.dismantle,
            roomName = room.name,
            terminalEnergy = 0,
            storageEnergy = 0,
            terminalId,

            workerList = Cache.creeps[roomName] && Cache.creeps[roomName].worker || [],
            workersWithEnergy = _.filter(workerList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && c.carry[RESOURCE_ENERGY] > 0).length > 0,
            workersWithMinerals = _.filter(workerList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && c.carry[RESOURCE_ENERGY] !== _.sum(c.carry)).length > 0,
            workersWithNothing = _.filter(workerList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && _.sum(c.carry) === 0).length > 0,

            collectorList = Cache.creeps[roomName] && Cache.creeps[roomName].collector || [],
            collectorsWithEnergy = _.filter(collectorList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && c.carry[RESOURCE_ENERGY] > 0).length > 0,
            collectorsWithNothing = _.filter(collectorList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && _.sum(c.carry) === 0).length > 0,
            
            storerList = Cache.creeps[roomName] && Cache.creeps[roomName].storer || [],
            storersWithEnergy = _.filter(storerList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && c.carry[RESOURCE_ENERGY] > 0).length > 0,
            storersWithMinerals = _.filter(storerList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && c.carry[RESOURCE_ENERGY] !== _.sum(c.carry)).length > 0,
            storersWithNothing = _.filter(storerList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && _.sum(c.carry) === 0).length > 0,

            scientistList = Cache.creeps[roomName] && Cache.creeps[roomName].scientist || [],
            scientistsWithEnergy = _.filter(scientistList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && c.carry[RESOURCE_ENERGY] > 0).length > 0,
            scientistsWithMinerals = _.filter(scientistList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && c.carry[RESOURCE_ENERGY] !== _.sum(c.carry)).length > 0,
            scientistsWithNothing = _.filter(scientistList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && _.sum(c.carry) === 0).length > 0,

            upgraderList = Cache.creeps[roomName] && Cache.creeps[roomName].upgrader || [],
            upgradersWithEnergy = _.filter(upgraderList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && c.carry[RESOURCE_ENERGY] > 0).length > 0,
            upgradersWithNothing = _.filter(upgraderList, (c) => (!c.memory.currentTask || c.memory.currentTask.unimportant) && _.sum(c.carry) === 0).length > 0,

            dismantlers = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].dismantler || []).length > 0,
            noWorkers = Game.time % 10 === 0 && workerList.length + collectorList.length === 0,
            tasks = {
                build: {
                    tasks: workersWithEnergy || collectorsWithEnergy ? TaskBuild.getTasks(room) : []
                },
                collectEnergy: {
                    tasks: workersWithNothing || storersWithNothing || scientistsWithNothing || collectorsWithNothing || upgradersWithNothing ? TaskCollectEnergy.getTasks(room) : [],
                    storerTasks: storersWithNothing ? TaskCollectEnergy.getStorerTasks(room) : []
                },
                collectMinerals: {
                    storerTasks: storersWithNothing || storersWithMinerals ? TaskCollectMinerals.getStorerTasks(room) : [],
                    labTasks: scientistsWithNothing || scientistsWithMinerals ? TaskCollectMinerals.getLabTasks(room) : [],
                    storageTasks: scientistsWithNothing || scientistsWithMinerals ? TaskCollectMinerals.getStorageTasks(room) : [],
                    terminalTasks: scientistsWithNothing || scientistsWithMinerals ? TaskCollectMinerals.getTerminalTasks(room) : []
                },
                fillEnergy: {
                    extensionTasks: workersWithEnergy || storersWithEnergy || scientistsWithEnergy || collectorsWithEnergy ? TaskFillEnergy.getExtensionTasks(room) : [],
                    spawnTasks: workersWithEnergy || storersWithEnergy || scientistsWithEnergy || collectorsWithEnergy ? TaskFillEnergy.getSpawnTasks(room) : [],
                    powerSpawnTasks: scientistsWithEnergy ? TaskFillEnergy.getPowerSpawnTasks(room) : [],
                    towerTasks: workersWithEnergy || scientistsWithEnergy || collectorsWithEnergy ? TaskFillEnergy.getTowerTasks(room) : [],
                    storageTasks: storersWithEnergy || scientistsWithEnergy || dismantlers ? TaskFillEnergy.getStorageTasks(room) : [],
                    containerTasks: dismantlers ? TaskFillEnergy.getContainerTasks(room) : [],
                    labTasks: scientistsWithEnergy ? TaskFillEnergy.getLabTasks(room) : [],
                    linkTasks: storersWithEnergy ? TaskFillEnergy.getLinkTasks(room) : [],
                    nukerTasks: scientistsWithEnergy ? TaskFillEnergy.getNukerTasks(room) : []
                },
                fillMinerals: {
                    labTasks: scientistsWithMinerals ? TaskFillMinerals.getLabTasks(room) : [],
                    storageTasks: workersWithMinerals || storersWithMinerals || scientistsWithMinerals || dismantlers ? TaskFillMinerals.getStorageTasks(room) : [],
                    terminalTasks: workersWithMinerals || storersWithMinerals || scientistsWithMinerals || dismantlers ? TaskFillMinerals.getTerminalTasks(room) : [],
                    nukerTasks: scientistsWithMinerals ? TaskFillMinerals.getNukerTasks(room) : [],
                    powerSpawnTasks: scientistsWithMinerals ? TaskFillMinerals.getPowerSpawnTasks(room) : []
                },
                heal: {
                    tasks: TaskHeal.getTasks(room)
                },
                rangedAttack: {
                    tasks: TaskRangedAttack.getTasks(room)
                },
                repair: {
                    tasks: noWorkers || workersWithEnergy || collectorsWithEnergy ? TaskRepair.getTasks(room) : [],
                    criticalTasks: noWorkers || workersWithEnergy || collectorsWithEnergy ? TaskRepair.getCriticalTasks(room) : [],
                    towerTasks: Memory.towerTasks[roomName] || Game.time % 10 === 0 ? TaskRepair.getTowerTasks(room) : []
                },
                upgradeController: {
                    tasks: workersWithEnergy || collectorsWithEnergy || upgradersWithEnergy ? TaskUpgradeController.getTasks(room) : [],
                    criticalTasks: noWorkers || workersWithEnergy || collectorsWithEnergy ? TaskUpgradeController.getCriticalTasks(room) : []
                },
                dismantle: {
                    tasks: []
                }
            };
        
        Memory.towerTasks[roomName] = tasks.repair.towerTasks.length;
        
        if (terminal && terminal.my) {
            terminalEnergy = terminal.store[RESOURCE_ENERGY] || 0;
            terminalId = terminal.id;
        }
        
        if (room.storage) {
            storageEnergy = room.storage.store[RESOURCE_ENERGY] || 0;
        }

        if ((storersWithNothing || scientistsWithNothing) && terminal && (!terminal.my || (terminalEnergy >= 5000 && (!room.memory.buyQueue || storageEnergy < Memory.marketEnergy || Cache.credits < Memory.minimumCredits)))) {
            tasks.collectEnergy.terminalTask = new TaskCollectEnergy(terminalId);
        }

        if ((workersWithEnergy || storersWithEnergy || scientistsWithEnergy) && terminal && terminal.my && terminalEnergy < 1000) {
            tasks.fillEnergy.terminalTask = new TaskFillEnergy(terminalId);
        }

        if (dismantle && dismantle[roomName] && dismantle[roomName].length > 0) {
            let completed = [];
            
            _.forEach(dismantle[roomName], (pos) => {
                var structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
                
                if (structures.length === 0) {
                    completed.push(pos);
                } else {
                    if (dismantlers) {
                        tasks.dismantle.tasks = tasks.dismantle.tasks.concat(_.map(structures, (s) => new TaskDismantle(s.id)));
                    }
                }
            });
            _.forEach(completed, (complete) => {
                _.remove(dismantle[roomName], (d) => d.x === complete.x && d.y === complete.y);
            });
        } else {
            _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].dismantler || [], (creep) => {
                creep.memory.role = "remoteWorker";
                creep.memory.container = Cache.containersInRoom(room)[0].id;
            });
        }

        return tasks;
    }

    spawn(room, canSpawnWorkers) {
        var dismantle = Memory.dismantle,
            roomName = room.name,
            controller = room.controller;

        RoleWorker.checkSpawn(room, canSpawnWorkers);
        RoleMiner.checkSpawn(room);
        RoleStorer.checkSpawn(room);
        RoleScientist.checkSpawn(room);
        if (dismantle && dismantle[roomName] && dismantle[roomName].length > 0) {
            RoleDismantler.checkSpawn(room);
        }
        RoleCollector.checkSpawn(room);
        RoleClaimer.checkSpawn(room);
        RoleConverter.checkSpawn(room);
        if (controller && (controller.level < 8 || _.filter(Game.rooms, (r) => r.controller && r.controller.my && r.controller.level < 8).length > 0)) {
            RoleUpgrader.checkSpawn(room);
        }
    }

    assignTasks(room, tasks) {
        RoleWorker.assignTasks(room, tasks);
        RoleMiner.assignTasks(room, tasks);
        RoleStorer.assignTasks(room, tasks);
        RoleScientist.assignTasks(room, tasks);
        RoleDismantler.assignTasks(room, tasks);
        RoleCollector.assignTasks(room, tasks);
        RoleClaimer.assignTasks(room, tasks);
        RoleConverter.assignTasks(room, tasks);
        RoleUpgrader.assignTasks(room, tasks);

        RoleTower.assignTasks(room, tasks);
    }

    labQueue(room, labQueue) {
        var memory = room.memory,
            labs = Cache.labsInRoom(room),
            labsInUse = memory.labsInUse,
            sourceLabs = labQueue.sourceLabs || [],
            children = labQueue.children || [],
            sourceLab0 = Game.getObjectById(sourceLabs[0]),
            sourceLab1 = Game.getObjectById(sourceLabs[1]),
            resource = labQueue.resource;
        
        switch (labQueue.status) {
            case "clearing":
                if (!labsInUse || labs.length - labsInUse.length > 2 && _.filter(labs, (l) => labsInUse.indexOf(l.id) === -1 && l.mineralAmount > 0).length === 0) {
                    labQueue.status = "moving";
                }
                break;
            case "moving":
                if (!labQueue.start || labQueue.start + 500 < Game.time) {
                    delete memory.labQueue;
                    labQueue = undefined;
                } else {
                    let moved = true;
                    _.forEach(children, (resource) => {
                        if (_.sum(_.filter(labs, (l) => l.mineralType === resource), (l) => l.mineralAmount) < labQueue.amount) {
                            moved = false;
                            return false;
                        }
                    });

                    if (sourceLab0.mineralType === children[0] && sourceLab1.mineralType === children[1]) {
                        _.forEach(_.filter(labs, (l) => sourceLabs.indexOf(l.id) === -1 && (!labsInUse || _.map(_.filter(labsInUse, (l) => l.resource !== resource), (l) => l.id).indexOf(l.id) === -1)), (lab) => {
                            if (lab.runReaction(sourceLab0, sourceLab1) === OK) {
                                labQueue.amount -= 5;
                            }
                        });
                    }

                    if (moved) {
                        labQueue.status = "creating";
                    }
                }
                break;
            case "creating":
                _.forEach(_.filter(labs, (l) => sourceLabs.indexOf(l.id) === -1 && (!labsInUse || _.map(_.filter(labsInUse, (l) => l.resource !== resource), (l) => l.id).indexOf(l.id) === -1)), (lab) => {
                    if (lab.mineralAmount === LAB_MINERAL_CAPACITY) {
                        labQueue.status = "returning";
                    }
                    if (lab.runReaction(sourceLab0, sourceLab1) === OK) {
                        labQueue.amount -= 5;
                    }
                });

                if (_.sum(_.filter(labs, (l) => sourceLabs.indexOf(l.id) !== -1), (l) => l.mineralAmount) === 0) {
                    labQueue.status = "returning";
                }
                break;
            case "returning":
                if (_.sum(_.filter(labs, (l) => l.mineralType === resource), (l) => l.mineralAmount) === 0) {
                    delete memory.labQueue;
                    labQueue = undefined;
                }
                break;
            default:
                labQueue.status = "clearing";
                labQueue.sourceLabs = Utilities.getSourceLabs(room);
                break;
        }
    }

    labsInUse(room, labsInUse) {
        var boosted = [];

        _.forEach(labsInUse, (queue) => {
            var lab = Game.getObjectById(queue.id);
            
            switch (queue.status) {
                case "emptying":
                    if (lab.mineralAmount === 0) {
                        queue.status = "filling";
                    }
                    break;
                case "filling":
                    if (lab.mineralAmount === queue.amount && lab.mineralType === queue.resource) {
                        queue.status = "waiting";
                    }
                    break;
                case "waiting":
                default:
                    let creep = Game.creeps[queue.creepToBoost];
                    
                    if (lab.pos.getRangeTo(creep) <= 1 && lab.mineralType === queue.resource && lab.mineralAmount >= queue.amount) {
                        if (lab.boostCreep(creep) === OK) {
                            _.remove(creep.memory.labs, (l) => l === queue.id);
                            if (!queue.status || queue.oldAmount === 0) {
                                boosted.push(queue);
                            } else {
                                queue.status = "refilling";
                            }
                        }
                    }
                    break;
                case "refilling":
                    if (lab.mineralAmount === queue.oldAmount && lab.mineralType === queue.oldResource) {
                        boosted.push(queue);
                    }
                    break;
            }
        });

        _.forEach(boosted, (queue) => {
            _.remove(labsInUse, (l) => l.id === queue.id);
        });
    }

    processPower(room) {
        _.forEach(Cache.powerSpawnsInRoom(room), (spawn) => {
            if (spawn.power >= 1 && spawn.energy >= 50) {
                spawn.processPower();
            }
        });
    }

    run(room) {
        var roomName, spawns, terminal, storage, memory, labQueue, labsInUse, tasks;
        if (room.unobservable) {
            Game.notify(`Base Room ${roomName} is unobservable, something is wrong!`);
            return;
        }

        roomName = room.name;
        spawns = Cache.spawnsInRoom(room);
        terminal = room.terminal;
        storage = room.storage;
        memory = room.memory;
        labQueue = memory.labQueue;
        labsInUse = memory.labsInUse;
        if (Game.time % 100 === 0 && spawns.length > 0) {
            this.manage(room);
        }
        this.defend(room);
        if (spawns.length > 0) {
            this.transferEnergy(room);
        }
        if (terminal) {
            this.terminal(room, terminal);
        }
        tasks = this.tasks(room);
        this.spawn(room, !storage || storage.store[RESOURCE_ENERGY] >= Memory.workerEnergy || room.controller.ticksToDowngrade < 3500 || room.find(FIND_MY_CONSTRUCTION_SITES).length > 0 || tasks.repair.criticalTasks && tasks.repair.criticalTasks.length > 0 || tasks.repair.tasks && _.filter(tasks.repair.tasks, (t) => (t.structure.structureType === STRUCTURE_WALL || t.structure.structureType === STRUCTURE_RAMPART) && t.structure.hits < 1000000).length > 0);
        this.assignTasks(room, tasks);
        if (storage && Cache.labsInRoom(room).length >= 3 && labQueue && !Utilities.roomLabsArePaused(room)) {
            this.labQueue(room, labQueue);
        }
        if (labsInUse) {
            this.labsInUse(room, labsInUse);
        }
        
        this.processPower(room);
    }

    toObj(room) {
        Memory.rooms[room.name].roomType = {
            type: this.type
        };
    }

    static fromObj(roomMemory) {
        return new Base();
    }
}

if (Memory.profiling) {
    __require(1,32).registerObject(Base, "RoomBase");
}
module.exports = Base;

return module.exports;
}
/********** End of module 32: ../src/room.base.js **********/
/********** Start module 33: ../src/room.cleanup.js **********/
__modules[33] = function(module, exports) {
var Cache = __require(3,33),
    Commands = __require(4,33),
    Utilities = __require(8,33),
    RoleRemoteDismantler = __require(22,33),
    RoleRemoteCollector = __require(21,33),
    TaskCollectEnergy = __require(39,33),
    TaskCollectMinerals = __require(40,33),
    TaskDismantle = __require(41,33),
    TaskFillEnergy = __require(42,33),
    TaskFillMinerals = __require(43,33),
    TaskPickupResource = __require(48,33);

class Cleanup {
    constructor(supportRoom) {
        this.type = "cleanup";
        this.supportRoom = supportRoom;
    }

    run(room) {
        var roomName = room.name,
            ramparts = [], structures = [], noEnergyStructures = [], energyStructures = [], completed = [], junk = [],
            supportRoom, tasks;
        if (!(supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom])) {
            return;
        }
        tasks = {
            collectEnergy: {
                cleanupTasks: []
            },
            collectMinerals: {
                cleanupTasks: []
            },
            fillEnergy: {
                storageTasks: TaskFillEnergy.getStorageTasks(supportRoom),
                containerTasks: TaskFillEnergy.getContainerTasks(supportRoom)
            },
            fillMinerals: {
                labTasks: TaskFillMinerals.getLabTasks(supportRoom),
                storageTasks: TaskFillMinerals.getStorageTasks(supportRoom),
                terminalTasks: TaskFillMinerals.getTerminalTasks(supportRoom)
            },
            remoteDismantle: {
                cleanupTasks: []
            },
            dismantle: {
                tasks: []
            },
            pickupResource: {
                tasks: []
            }
        };

        if (!room.unobservable) {
            if (Memory.dismantle && Memory.dismantle[room.name] && Memory.dismantle[room.name].length > 0) {
                _.forEach(Memory.dismantle[room.name], (pos) => {
                    var structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
                    if (structures.length === 0) {
                        completed.push(pos);
                    } else {
                        tasks.dismantle.tasks = tasks.dismantle.tasks.concat(_.map(structures, (s) => new TaskDismantle(s.id)));
                    }
                });
                _.forEach(completed, (complete) => {
                    _.remove(Memory.dismantle[roomName], (d) => d.x === complete.x && d.y === complete.y);
                });
            }
            ramparts = _.filter(room.find(FIND_STRUCTURES), (s) => s.structureType === STRUCTURE_RAMPART);
            structures = _.filter(room.find(FIND_STRUCTURES), (s) => !(s.structureType === STRUCTURE_RAMPART) && !(s.structureType === STRUCTURE_CONTROLLER) && !(s.structureType === STRUCTURE_ROAD) && !(s.structureType === STRUCTURE_WALL) && (ramparts.length === 0 || s.pos.getRangeTo(Utilities.objectsClosestToObj(ramparts, s)[0]) > 0));
            noEnergyStructures = _.filter(structures, (s) => s.structureType === STRUCTURE_NUKER || ((!s.energy || s.energy === 0) && (!s.store || _.sum(s.store) === 0) && (!s.mineralAmount || s.mineralAmount === 0)));
            energyStructures = _.filter(structures, (s) => s.structureType !== STRUCTURE_NUKER && (s.energy && s.energy > 0 || s.store && _.sum(s.store) > 0 || s.mineralAmount && s.mineralAmount > 0));
            junk = _.filter(room.find(FIND_STRUCTURES), (s) => [STRUCTURE_WALL, STRUCTURE_ROAD].indexOf(s.structureType) !== -1);
            tasks.collectEnergy.cleanupTasks = TaskCollectEnergy.getCleanupTasks(energyStructures);
            tasks.collectMinerals.cleanupTasks = TaskCollectMinerals.getCleanupTasks(energyStructures);
            tasks.pickupResource.tasks = TaskPickupResource.getTasks(room);
            tasks.remoteDismantle.cleanupTasks = [].concat.apply([], [TaskDismantle.getCleanupTasks(noEnergyStructures), TaskDismantle.getCleanupTasks(ramparts), TaskDismantle.getCleanupTasks(junk)]);

            if (energyStructures.length === 0 && tasks.remoteDismantle.cleanupTasks.length === 0 && tasks.pickupResource.tasks.length === 0) {
                Game.notify(`Cleanup Room ${room.name} is squeaky clean!`);
                _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].remoteCollector || [], (creep) => {
                    creep.memory.role = "storer";
                    creep.memory.home = supportRoom.name;
                });
                _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].remoteDismantler || [], (creep) => {
                    creep.memory.role = "upgrader";
                    creep.memory.home = supportRoom.name;
                });
                Commands.setRoomType(room.name);
            }
        }
        if (room.unobservable || structures.length > 0 || ramparts.length > 0 || junk.length > 0) {
            RoleRemoteDismantler.checkSpawn(room, supportRoom, Math.min(structures.length + ramparts.length + junk.length, 8));
        }
        RoleRemoteCollector.checkSpawn(room, supportRoom, (tasks.collectEnergy.cleanupTasks > 0 || tasks.collectMinerals.cleanupTasks) ? (supportRoom.controller ? supportRoom.controller.level : 3) : 1);
        RoleRemoteDismantler.assignTasks(room, tasks);
        RoleRemoteCollector.assignTasks(room, tasks);
    }

    toObj(room) {
        Memory.rooms[room.name].roomType = {
            type: this.type,
            supportRoom: this.supportRoom
        };
    }

    static fromObj(roomMemory) {
        return new Cleanup(roomMemory.roomType.supportRoom);
    }
}

if (Memory.profiling) {
    __require(1,33).registerObject(Cleanup, "RoomCleanup");
}
module.exports = Cleanup;

return module.exports;
}
/********** End of module 33: ../src/room.cleanup.js **********/
/********** Start module 34: ../src/room.mine.js **********/
__modules[34] = function(module, exports) {
var Cache = __require(3,34),
    Commands = __require(4,34),
    Utilities = __require(8,34),
    RoleDismantler = __require(17,34),
    RoleRemoteBuilder = __require(20,34),
    RoleRemoteMiner = __require(23,34),
    RoleRemoteReserver = __require(24,34),
    RoleRemoteStorer = __require(25,34),
    RoleRemoteWorker = __require(26,34),
    TaskBuild = __require(37,34),
    TaskDismantle = __require(41,34),
    TaskFillEnergy = __require(42,34),
    TaskFillMinerals = __require(43,34);

class Mine {
    constructor(supportRoom, stage) {
        this.type = "mine";
        this.supportRoom = supportRoom;
        this.stage = stage || 1;
    }

    convert(room, supportRoom) {
        var roomName = room.name,
            memory = Memory.rooms[roomName],
            oldRoomType = memory.roomType.type;

        Commands.setRoomType(roomName, {type: "base", region: memory.region});
        Commands.claimRoom(this.supportRoom, roomName, false);
        
        switch (oldRoomType) {
            case "mine":
                _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].all || [], (creep) => {
                    var creepMemory = creep.memory;
                    
                    switch (creepMemory.role) {
                        case "remoteBuilder":
                        case "remoteWorker":
                            creepMemory.role = "worker";
                            creepMemory.home = roomName;
                            creepMemory.homeSource = Utilities.objectsClosestToObj(room.find(FIND_SOURCES), creep)[0].id;
                            break;
                        case "remoteReserver":
                            creep.suicide();
                            break;
                        case "remoteStorer":
                            creepMemory.role = "storer";
                            creepMemory.home = this.supportRoom;
                            break;
                        case "dismantler":
                            creepMemory.home = roomName;
                            creepMemory.supportRoom = roomName;
                            break;
                    }
                });
        }
        return;
    }

    stage1Tasks(room, supportRoom) {
        var tasks = {
            fillEnergy: {
                storageTasks: TaskFillEnergy.getStorageTasks(supportRoom),
                containerTasks: TaskFillEnergy.getContainerTasks(supportRoom)
            },
            fillMinerals: {
                storageTasks: TaskFillMinerals.getStorageTasks(supportRoom),
                terminalTasks: TaskFillMinerals.getTerminalTasks(supportRoom)
            },
            dismantle: {
                tasks: []
            }
        };
        
        if (!room.unobservable) {
            tasks.build = {
                tasks: TaskBuild.getTasks(room)
            };
        }
        
        return tasks;
    }

    stage1Spawn(room) {
        RoleRemoteReserver.checkSpawn(room);
        RoleRemoteBuilder.checkSpawn(room);
    }

    stage1AssignTasks(room, tasks) {
        RoleRemoteReserver.assignTasks(room, tasks);
        RoleRemoteBuilder.assignTasks(room);
        RoleRemoteMiner.assignTasks(room, tasks);
        RoleRemoteWorker.assignTasks(room, tasks);
        RoleRemoteStorer.assignTasks(room, tasks);
        RoleDismantler.assignTasks(room, tasks);
    }

    stage1Manage(room, supportRoom) {
        var supportRoomName = supportRoom.name,
            sources, containers, roomName, armyName, sites;
        
        if (!room.unobservable) {
            sources = [].concat.apply([], [room.find(FIND_SOURCES), /^[EW][1-9][0-9]*5[NS][1-9][0-9]*5$/.test(room.name) ? room.find(FIND_MINERALS) : []]);
            containers = Cache.containersInRoom(room);
            roomName = room.name;
            if (containers.length >= sources.length) {
                this.stage = 2;
                _.forEach(containers, (container) => {
                    var source = Utilities.objectsClosestToObj([].concat.apply([], [sources, room.find(FIND_MINERALS)]), container)[0];
                    if (source instanceof Mineral) {
                        return;
                    }
                    _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].remoteBuilder || [], (creep) => {
                        creep.memory.role = "remoteWorker";
                        creep.memory.container = Utilities.objectsClosestToObj(containers, source)[0].id;
                    });
                    return false;
                });

                return;
            }
            sites = room.find(FIND_MY_CONSTRUCTION_SITES);
            if (sites.length === 0) {
                _.forEach(sources, (source) => {
                    var location = PathFinder.search(source.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1}).path[0];

                    if (
                        _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                        _.filter(sites, (s) => s.pos.x === location.x && s.pos.y === location.y && s.structureType === STRUCTURE_CONTAINER).length === 0
                    ) {
                        room.createConstructionSite(location.x, location.y, STRUCTURE_CONTAINER);
                    }
                });
            } 

            armyName = `${roomName}-defense`;
            if (_.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username === "Invader").length > 0) {
                if (!Memory.army[armyName]) {
                    Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: undefined, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: 1, units: Math.min(Math.floor((supportRoom.energyCapacityAvailable - 300) / 300), 20)}, melee: {maxCreeps: 1, units: Math.min(Math.floor((supportRoom.energyCapacityAvailable - 300) / 130), 20)}, ranged: {maxCreeps: 0, units: 20}});
                }
            } else if (Memory.army[armyName]) {
                Memory.army[armyName].directive = "attack";
                Memory.army[armyName].success = true;
            }
        }
    }

    stage1(room, supportRoom) {
        var tasks = this.stage1Tasks(room, supportRoom);
        this.stage1Spawn(room);
        this.stage1AssignTasks(room, tasks);

        this.stage1Manage(room, supportRoom);
    }

    stage2Manage(room, supportRoom) {
        var roomName = room.name,
            supportRoomName = supportRoom.name,
            sources, armyName;
        if (room.unobservable) {
            if (
                (Cache.creeps[roomName] && Cache.creeps[roomName].remoteMiner || []).length === 0 &&
                (Cache.creeps[roomName] && Cache.creeps[roomName].remoteWorker || []).length === 0 &&
                (Cache.creeps[roomName] && Cache.creeps[roomName].remoteStorer || []).length === 0 &&
                (Cache.creeps[roomName] && Cache.creeps[roomName].remoteReserver || []).length === 0
            ) {
                this.stage = 1;
                return;
            }
        } else {
            sources = [].concat.apply([], [room.find(FIND_SOURCES), /^[EW][1-9][0-9]*5[NS][1-9][0-9]*5$/.test(room.name) ? room.find(FIND_MINERALS) : []]);
            if (Cache.containersInRoom(room).length < sources.length) {
                this.stage = 1;
                return;
            }

            armyName = `${roomName}-defense`;
            if (_.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username === "Invader").length > 0) {
                if (!Memory.army[armyName]) {
                    Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: undefined, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: 1, units: Math.min(Math.floor((supportRoom.energyCapacityAvailable - 300) / 300), 20)}, melee: {maxCreeps: 1, units: Math.min(Math.floor((supportRoom.energyCapacityAvailable - 300) / 130), 20)}, ranged: {maxCreeps: 0, units: 20}});
                }
            } else if (Memory.army[armyName]) {
                Memory.army[armyName].directive = "attack";
                Memory.army[armyName].success = true;
            }
        }
    }

    stage2Spawn(room, supportRoom) {
        var dismantle = Memory.dismantle;
        if (Cache.hostilesInRoom(room).length > 0) {
            return;
        }
        
        RoleRemoteReserver.checkSpawn(room);
        RoleRemoteMiner.checkSpawn(room);
        RoleRemoteWorker.checkSpawn(room);
        RoleRemoteStorer.checkSpawn(room);
        if (dismantle && dismantle[room.name] && dismantle[room.name].length > 0) {
            RoleDismantler.checkSpawn(room, supportRoom);
        }
    }

    stage2Tasks(room, supportRoom) {
        var roomName = room.name,
            creeps = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteWorker || []).length > 0 || Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteStorer || []).length > 0 || Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteDismantler || []).length > 0,
            tasks = {
                fillEnergy: {
                    storageTasks: creeps ? TaskFillEnergy.getStorageTasks(supportRoom) : [],
                    containerTasks: creeps ? TaskFillEnergy.getContainerTasks(supportRoom) : []
                },
                fillMinerals: {
                    storageTasks: creeps ? TaskFillMinerals.getStorageTasks(supportRoom) : [],
                    terminalTasks: creeps ? TaskFillMinerals.getTerminalTasks(supportRoom) : []
                }
            };
        if (!room.unobservable) {
            let dismantle = Memory.dismantle;
            tasks.dismantle = {
                tasks: []
            };

            if (dismantle && dismantle[roomName] && dismantle[roomName].length > 0) {
                let completed = [];
                
                _.forEach(dismantle[roomName], (pos) => {
                    var structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
                    if (structures.length === 0) {
                        completed.push(pos);
                    } else {
                        tasks.dismantle.tasks = tasks.dismantle.tasks.concat(_.map(structures, (s) => new TaskDismantle(s.id)));
                    }
                });
                _.forEach(completed, (complete) => {
                    _.remove(dismantle[roomName], (d) => d.x === complete.x && d.y === complete.y);
                });
            } else {
                _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].dismantler || [], (creep) => {
                    creep.memory.role = "remoteWorker";
                    creep.memory.container = Cache.containersInRoom(room)[0].id;
                });
            }
        }
        
        return tasks;
    }

    stage2AssignTasks(room, tasks) {
        RoleRemoteReserver.assignTasks(room, tasks);
        RoleRemoteMiner.assignTasks(room, tasks);
        RoleRemoteWorker.assignTasks(room, tasks);
        RoleRemoteStorer.assignTasks(room, tasks);
        RoleDismantler.assignTasks(room, tasks);
    }

    stage2(room, supportRoom) {
        var tasks;
        this.stage2Manage(room, supportRoom);
        if (this.stage === 1) {
            return;
        }
        if (!room.unobservable) {
            this.stage2Spawn(room, supportRoom);
        }
        tasks = this.stage2Tasks(room, supportRoom);
        this.stage2AssignTasks(room, tasks);
    }

    run(room) {
        var supportRoom;
        if (!room.unobservable && room.find(FIND_SOURCES).length === 0) {
            return;
        }
        if (!(supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom])) {
            return;
        }
        if (room.controller && room.controller.my) {
            this.convert(room, supportRoom);
            return;
        }

        if (this.stage === 1) {
            this.stage1(room, supportRoom);
        }

        if (this.stage === 2) {
            this.stage2(room, supportRoom);
        }
    }

    toObj(room) {
        Memory.rooms[room.name].roomType = {
            type: this.type,
            supportRoom: this.supportRoom,
            stage: this.stage
        };
    }

    static fromObj(roomMemory) {
        return new Mine(roomMemory.roomType.supportRoom, roomMemory.roomType.stage);
    }
}

if (Memory.profiling) {
    __require(1,34).registerObject(Mine, "RoomMine");
}
module.exports = Mine;

return module.exports;
}
/********** End of module 34: ../src/room.mine.js **********/
/********** Start module 35: ../src/room.source.js **********/
__modules[35] = function(module, exports) {
var Cache = __require(3,35),
    Commands = __require(4,35),
    Utilities = __require(8,35),
    RoleDefender = __require(16,35),
    RoleDismantler = __require(17,35),
    RoleHealer = __require(18,35),
    RoleRemoteBuilder = __require(20,35),
    RoleRemoteCollector = __require(21,35),
    RoleRemoteMiner = __require(23,35),
    RoleRemoteStorer = __require(25,35),
    RoleRemoteWorker = __require(26,35),
    TaskBuild = __require(37,35),
    TaskDismantle = __require(41,35),
    TaskFillEnergy = __require(42,35),
    TaskFillMinerals = __require(43,35);

class Source {
    constructor(supportRoom, stage) {
        this.type = "source";
        this.supportRoom = supportRoom;
        this.stage = stage || 1;
    }
    
    stage1Tasks(room, supportRoom) {
        var tasks = {
            fillEnergy: {
                storageTasks: TaskFillEnergy.getStorageTasks(supportRoom),
                containerTasks: TaskFillEnergy.getContainerTasks(supportRoom)
            },
            fillMinerals: {
                storageTasks: TaskFillMinerals.getStorageTasks(supportRoom),
                terminalTasks: TaskFillMinerals.getTerminalTasks(supportRoom)
            },
            dismantle: {
                tasks: []
            }
        };
        
        if (!room.unobservable) {
            tasks.build = {
                tasks: TaskBuild.getTasks(room)
            };
        }
        
        return tasks;
    }

    stage1Spawn(room) {
        var roomName = room.name;

        RoleDefender.checkSpawn(room);
        RoleHealer.checkSpawn(room);

        if (!Cache.creeps[roomName] || !Cache.creeps[roomName].defender || _.filter(Cache.creeps[roomName].defender, (c) => !c.spawning).length === 0) {
            return;
        }

        RoleRemoteBuilder.checkSpawn(room);
    }

    stage1AssignTasks(room, tasks) {
        RoleDefender.assignTasks(room, tasks);
        RoleHealer.assignTasks(room, tasks);
        RoleRemoteBuilder.assignTasks(room);
        RoleRemoteMiner.assignTasks(room, tasks);
        RoleRemoteWorker.assignTasks(room, tasks);
        RoleRemoteStorer.assignTasks(room, tasks);
        RoleRemoteCollector.assignTasks(room, tasks);
        RoleDismantler.assignTasks(room, tasks);
    }

    stage1Manage(room, supportRoom) {
        var supportRoomName = supportRoom.name,
            sources, containers, roomName, armyName, sites;
        
        if (!room.unobservable) {
            sources = [].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]);
            containers = Cache.containersInRoom(room);
            roomName = room.name;
            if (containers.length === sources.length) {
                this.stage = 2;
                _.forEach(containers, (container) => {
                    var source = Utilities.objectsClosestToObj([].concat.apply([], [sources, room.find(FIND_MINERALS)]), container)[0];
                    if (source instanceof Mineral) {
                        return;
                    }
                    _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].remoteBuilder || [], (creep) => {
                        creep.memory.role = "remoteWorker";
                        creep.memory.container = Utilities.objectsClosestToObj(containers, source)[0].id;
                    });
                    return false;
                });

                return;
            }
            sites = room.find(FIND_MY_CONSTRUCTION_SITES);
            if (sites.length === 0) {
                _.forEach(sources, (source) => {
                    var location = PathFinder.search(source.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1}).path[0];

                    if (
                        _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                        _.filter(sites, (s) => s.pos.x === location.x && s.pos.y === location.y && s.structureType === STRUCTURE_CONTAINER).length === 0
                    ) {
                        room.createConstructionSite(location.x, location.y, STRUCTURE_CONTAINER);
                    }
                });
            }

            armyName = `${roomName}-defense`;
            if (_.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username === "Invader").length > 0) {
                if (!Memory.army[armyName]) {
                    Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: undefined, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: 2, units: 17}, melee: {maxCreeps: 2, units: 20}, ranged: {maxCreeps: 0, units: 20}});
                }
            } else if (Memory.army[armyName]) {
                Memory.army[armyName].directive = "attack";
                Memory.army[armyName].success = true;
            }
        }
    }

    stage1(room, supportRoom) {
        var tasks = this.stage1Tasks(room, supportRoom);
        this.stage1Spawn(room);
        this.stage1AssignTasks(room, tasks);

        this.stage1Manage(room, supportRoom);
    }
    
    stage2Manage(room, supportRoom) {
        var roomName = room.name,
            supportRoomName = supportRoom.name,
            creeps = Cache.creeps[roomName],
            armyName;
        if (room.unobservable) {
            if (
                (creeps && creeps.remoteMiner || []).length === 0 &&
                (creeps && creeps.remoteWorker || []).length === 0 &&
                (creeps && creeps.remoteStorer || []).length === 0
            ) {
                this.stage = 1;
            }
        } else {
            let sources = [].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]);
            if (Cache.containersInRoom(room).length !== sources.length) {
                this.stage = 1;
            }

            armyName = `${roomName}-defense`;
            if (_.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username === "Invader").length > 0) {
                if (!Memory.army[armyName]) {
                    Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: undefined, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: 2, units: 17}, melee: {maxCreeps: 2, units: 20}, ranged: {maxCreeps: 0, units: 20}});
                }
            } else if (Memory.army[armyName]) {
                Memory.army[armyName].directive = "attack";
                Memory.army[armyName].success = true;
            }
        }
    }

    stage2Spawn(room, supportRoom) {
        var roomName = room.name,
            dismantle = Memory.dismantle;

        RoleDefender.checkSpawn(room);
        RoleHealer.checkSpawn(room);

        if (!Cache.creeps[roomName] || !Cache.creeps[roomName].defender || _.filter(Cache.creeps[roomName].defender, (c) => !c.spawning).length === 0) {
            return;
        }

        RoleRemoteMiner.checkSpawn(room);
        RoleRemoteWorker.checkSpawn(room);
        RoleRemoteStorer.checkSpawn(room);
        RoleRemoteCollector.checkSpawn(room, supportRoom);
        if (dismantle && dismantle[roomName] && dismantle[roomName].length > 0) {
            RoleDismantler.checkSpawn(room, supportRoom);
        }
    }

    stage2Tasks(room, supportRoom) {
        var roomName = room.name,
            creeps = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteWorker || []).length > 0 || Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteStorer || []).length > 0 || Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteDismantler || []).length > 0,
            tasks = {
                fillEnergy: {
                    storageTasks: creeps ? TaskFillEnergy.getStorageTasks(supportRoom) : [],
                    containerTasks: creeps ? TaskFillEnergy.getContainerTasks(supportRoom) : []
                },
                fillMinerals: {
                    storageTasks: creeps ? TaskFillMinerals.getStorageTasks(supportRoom) : [],
                    terminalTasks: creeps ? TaskFillMinerals.getTerminalTasks(supportRoom) : []
                }
            };
        if (!room.unobservable) {
            let dismantle = Memory.dismantle;
            tasks.dismantle = {
                tasks: []
            };

            if (dismantle && dismantle[roomName] && dismantle[roomName].length > 0) {
                let completed = [];
                
                _.forEach(dismantle[roomName], (pos) => {
                    var structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
                    if (structures.length === 0) {
                        completed.push(pos);
                    } else {
                        tasks.dismantle.tasks = tasks.dismantle.tasks.concat(_.map(structures, (s) => new TaskDismantle(s.id)));
                    }
                });
                _.forEach(completed, (complete) => {
                    _.remove(dismantle[roomName], (d) => d.x === complete.x && d.y === complete.y);
                });
            } else {
                _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].dismantler || [], (creep) => {
                    creep.memory.role = "remoteWorker";
                    creep.memory.container = Cache.containersInRoom(room)[0].id;
                });
            }
        }
        return tasks;
    }

    stage2AssignTasks(room, tasks) {
        RoleDefender.assignTasks(room, tasks);
        RoleHealer.assignTasks(room, tasks);
        RoleRemoteMiner.assignTasks(room, tasks);
        RoleRemoteWorker.assignTasks(room, tasks);
        RoleRemoteStorer.assignTasks(room, tasks);
        RoleRemoteCollector.assignTasks(room, tasks);
        RoleDismantler.assignTasks(room, tasks);
    }

    stage2(room, supportRoom) {
        var tasks;
        this.stage2Manage(room, supportRoom);
        if (this.stage === 1) {
            return;
        }
        if (!room.unobservable) {
            this.stage2Spawn(room, supportRoom);
        }
        tasks = this.stage2Tasks(room, supportRoom);
        this.stage2AssignTasks(room, tasks);
    }

    run(room) {
        var supportRoom;
        if (!room.unobservable && room.find(FIND_SOURCES).length === 0) {
            return;
        }
        if (!(supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom])) {
            return;
        }
        if (room.controller && room.controller.my) {
            this.convert(room, supportRoom);
            return;
        }

        if (this.stage === 1) {
            this.stage1(room, supportRoom);
        }

        if (this.stage === 2) {
            this.stage2(room, supportRoom);
        }
    }

    toObj(room) {
        Memory.rooms[room.name].roomType = {
            type: this.type,
            supportRoom: this.supportRoom,
            stage: this.stage
        };
    }

    static fromObj(roomMemory) {
        return new Source(roomMemory.roomType.supportRoom, roomMemory.roomType.stage);
    }
}

if (Memory.profiling) {
    __require(1,35).registerObject(Source, "RoomSource");
}
module.exports = Source;

return module.exports;
}
/********** End of module 35: ../src/room.source.js **********/
/********** Start module 36: ../src/task.attack.js **********/
__modules[36] = function(module, exports) {
var Cache = __require(3,36),
    Pathing = __require(55,36);

class Attack {
    constructor() {
        this.type = "attack";
    }

    canAssign(creep) {
        var controller = creep.room.controller;

        if (creep.spawning || creep.memory.role !== "converter" || !controller || controller.level === 0 || creep.getActiveBodyparts(CLAIM) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }

    run(creep) {
        if (!creep.room.controller || creep.room.controller.level === 0 || !creep.getActiveBodyparts(CLAIM) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        Pathing.moveTo(creep, creep.room.controller, 1);
        creep.attackController(creep.room.controller);
    }

    toObj(creep) {
        if (creep.room.controller) {
            creep.memory.currentTask = {
                type: this.type
            };
        } else {
            delete creep.memory.currentTask;
        }
    }

    static fromObj(creep) {
        return new Attack();
    }

    static getTask(creep) {
        if (creep.room.controller) {
            return new Attack();
        }
    }
}

if (Memory.profiling) {
    __require(1,36).registerObject(Attack, "TaskAttack");
}
module.exports = Attack;

return module.exports;
}
/********** End of module 36: ../src/task.attack.js **********/
/********** Start module 37: ../src/task.build.js **********/
__modules[37] = function(module, exports) {
var Cache = __require(3,37),
    Pathing = __require(55,37);

class Build {
    constructor(id) {
        this.type = "build";
        this.id = id;
        this.constructionSite = Game.getObjectById(id);
        this.force = true;
    }

    canAssign(creep) {
        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }

    run(creep) {
        var site = this.constructionSite;
        if (!creep.carry[RESOURCE_ENERGY] || !site || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        Pathing.moveTo(creep, site, Math.max(Math.min(creep.pos.getRangeTo(site) - 1, 3), 1));
        if (creep.build(site, RESOURCE_ENERGY) === OK) {
            if (Math.min(creep.getActiveBodyparts(WORK) * 5, creep.carry[RESOURCE_ENERGY]) >= site.progressTotal - site.progress || creep.carry[RESOURCE_ENERGY] <= Math.min(creep.getActiveBodyparts(WORK) * 5)) {
                delete creep.memory.currentTask;
                return;
            }
        }
    }

    toObj(creep) {
        if (this.constructionSite) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }

    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new Build(creep.memory.currentTask.id);
        } else {
            return;
        }
    }

    static getTasks(room) {
        return _.map(room.find(FIND_MY_CONSTRUCTION_SITES), (s) => new Build(s.id));
    }
}

if (Memory.profiling) {
    __require(1,37).registerObject(Build, "TaskBuild");
}
module.exports = Build;

return module.exports;
}
/********** End of module 37: ../src/task.build.js **********/
/********** Start module 38: ../src/task.claim.js **********/
__modules[38] = function(module, exports) {
var Cache = __require(3,38),
    Pathing = __require(55,38);

class Claim {
    constructor() {
        this.type = "claim";
    }

    canAssign(creep) {
        var controller = creep.room.controller;

        if (creep.spawning || creep.memory.role !== "claimer" || !controller || controller.my || creep.getActiveBodyparts(CLAIM) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }

    run(creep) {
        if (!creep.room.controller || creep.room.controller.my || !creep.getActiveBodyparts(CLAIM) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        Pathing.moveTo(creep, creep.room.controller, 1);
        creep.claimController(creep.room.controller);
    }

    toObj(creep) {
        if (creep.room.controller) {
            creep.memory.currentTask = {
                type: this.type
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        return new Claim();
    }

    static getTask(creep) {
        if (creep.room.controller) {
            return new Claim();
        }
    }
}

if (Memory.profiling) {
    __require(1,38).registerObject(Claim, "TaskClaim");
}
module.exports = Claim;

return module.exports;
}
/********** End of module 38: ../src/task.claim.js **********/
/********** Start module 39: ../src/task.collectEnergy.js **********/
__modules[39] = function(module, exports) {
var Cache = __require(3,39),
    Pathing = __require(55,39);

class CollectEnergy {
    constructor(id) {
        this.type = "collectEnergy";
        this.id = id;
        this.object = Game.getObjectById(id);
    }
    
    canAssign(creep) {
        var obj = this.object,
            energy;
        
        if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity) {
            return false;
        }
    
        if (!obj) {
            return false;
        }
        
        energy = obj.energy || (obj.store && obj.store[RESOURCE_ENERGY]) || 0;
    
        if (energy === 0) {
            return false;
        }
    
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var obj = this.object,
            energy, resources;
        if (creep.ticksToLive < 150 || !obj) {
            delete creep.memory.currentTask;
            return;
        }
    
        energy = obj.energy || (obj.store && obj.store[RESOURCE_ENERGY]) || 0;
        if (_.sum(creep.carry) === creep.carryCapacity || energy === 0) {
            delete creep.memory.currentTask;
            return;
        }
        Pathing.moveTo(creep, obj, 1);
        if (creep.pos.getRangeTo(obj) === 1) {
            if ((resources = _.filter(obj.pos.lookFor(LOOK_RESOURCES), (r) => r.amount > 50)).length > 0) {
                creep.pickup(resources[0]);
                return;
            }
        }
    
        if (creep.withdraw(obj, RESOURCE_ENERGY) === OK) {
            delete creep.memory.currentTask;
        }
    }
    
    toObj(creep) {
        if (this.object) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new CollectEnergy(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
    
    static getTasks(room) {
        var structures = _.filter(room.find(FIND_HOSTILE_STRUCTURES), (s) => (s.energy > 0 || (s.store && s.store[RESOURCE_ENERGY] > 0)) && s.structureType !== STRUCTURE_NUKER);
        
        if (structures.length > 0) {
            return _.map(structures, (s) => new CollectEnergy(s.id));
        }
    
        if (room.storage && room.storage.store[RESOURCE_ENERGY] > 0) {
            return [new CollectEnergy(room.storage.id)];
        }
    
        return _.map(_.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] >= 500).sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]), (c) => new CollectEnergy(c.id));
    }
    
    static getStorerTasks(room) {
        return _.map(_.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] && c.store[RESOURCE_ENERGY] >= 500), (c) => new CollectEnergy(c.id));
    }
    
    static getCleanupTasks(structures) {
        return _.map(_.filter(structures, (s) => s.energy || (s.store && s.store[RESOURCE_ENERGY])).sort((a, b) => (a.energy || a.store[RESOURCE_ENERGY]) - (b.energy || b.store[RESOURCE_ENERGY])), (s) => new CollectEnergy(s.id));
    }
}

if (Memory.profiling) {
    __require(1,39).registerObject(CollectEnergy, "TaskCollectEnergy");
}
module.exports = CollectEnergy;

return module.exports;
}
/********** End of module 39: ../src/task.collectEnergy.js **********/
/********** Start module 40: ../src/task.collectMinerals.js **********/
__modules[40] = function(module, exports) {
var Cache = __require(3,40),
    Pathing = __require(55,40),
    Utilities = __require(8,40);

class CollectMinerals {
    constructor(id, resource, amount) {
        this.type = "collectMinerals";
        this.id = id;
        this.resource = resource;
        this.amount = amount;
        this.object = Game.getObjectById(id);
    }
    
    canAssign(creep) {
        var obj = this.object;
    
        if (this.amount < 0 || creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity) {
            return false;
        }
        
        if (this.resource && this.amount) {
            if (obj.structureType === STRUCTURE_LAB && obj.mineralType !== this.resource && obj.mineralAmount < this.amount) {
                return false;
            }
    
            if (!(obj.structureType === STRUCTURE_LAB) && (obj.store[this.resource] || 0) < this.amount) {
                return false;
            }
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var obj = this.object,
            resource = this.resource,
            creepCarry = creep.carry,
            creepCarryCapacity = creep.carryCapacity,
            amount = this.amount,
            objStore, minerals;
        if (amount < 0 || creep.ticksToLive < 150 || !obj) {
            delete creep.memory.currentTask;
            return;
        }
    
        objStore = obj.store;
        if (_.sum(creep.carry) === creep.carryCapacity) {
            delete creep.memory.currentTask;
            return;
        }
        if (obj.structureType === STRUCTURE_LAB) {
            if (obj.mineralType === null) {
                delete creep.memory.currentTask;
                return;
            }
            minerals = [obj.mineralType];
        } else if (resource) {
            minerals = [resource];
        } else {
            minerals = _.filter(_.keys(objStore), (m) => m !== RESOURCE_ENERGY && objStore[m] > 0);
        }
        if (minerals.length === 0) {
            delete creep.memory.currentTask;
            return;
        }
        Pathing.moveTo(creep, obj, 1);
        if (amount) {
            if (creep.withdraw(obj, minerals[0], Math.min(amount, creepCarryCapacity - _.sum(creepCarry))) === OK) {
                delete creep.memory.currentTask;
            }
            return;
        }
    
        if (creep.withdraw(obj, minerals[0]) === OK) {
            delete creep.memory.currentTask;
            return;
        }
    }
    
    toObj(creep) {
        if (this.object) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id,
                resource: this.resource,
                amount: this.amount
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new CollectMinerals(creep.memory.currentTask.id, creep.memory.currentTask.resource, creep.memory.currentTask.amount);
        } else {
            return;
        }
    }
    
    static getStorerTasks(room) {
        return _.map(_.filter(Cache.containersInRoom(room), (c) => _.filter(_.keys(c.store), (m) => m !== RESOURCE_ENERGY && c.store[m] >= 500).length > 0).sort((a, b) => _.sum(b.store) - _.sum(a.store)), (c) => new CollectMinerals(c.id));
    }
    
    static getCleanupTasks(structures) {
        return _.map(_.filter(structures, (s) => (s.store || [STRUCTURE_LAB, STRUCTURE_NUKER, STRUCTURE_POWER_SPAWN].indexOf(s.structureType) !== -1) && ((_.sum(s.store) > 0 && s.store[RESOURCE_ENERGY] < _.sum(s.store)) || s.mineralAmount > 0 || s.ghodium > 0 || s.power > 0)).sort((a, b) => (a.mineralAmount || a.ghodium || a.power || (_.sum(a.store) - a.store[RESOURCE_ENERGY])) - (b.mineralAmount || b.ghodium || b.power || (_.sum(b.store) - b.store[RESOURCE_ENERGY]))), (s) => new CollectMinerals(s.id));
    }
    
    static getLabTasks(room) {
        var roomMemory = room.memory,
            labsInUse = roomMemory.labsInUse,
            labQueue = roomMemory.labQueue,
            roomStorage = room.storage,
            labs = Cache.labsInRoom(room),
            tasks = [],
            status, sourceLabs;
    
        if (labQueue) {
            status = labQueue.status,
            sourceLabs = labQueue.sourceLabs;
        }
    
        if (labsInUse) {
            _.forEach(labsInUse, (lab) => {
                if (!Game.creeps[lab.creepToBoost]) {
                    tasks.push(new CollectMinerals(lab.id));
                }
            });
    
            _.forEach(tasks, (task) => {
                _.remove(labsInUse, (l) => l.id === task.id);
            });
        }
    
        if (roomStorage && labQueue && status === "clearing") {
            _.forEach(_.filter(labs, (l) => _.map(labsInUse, (liu) => liu.id).indexOf(l.id) === -1 && l.mineralAmount > 0), (lab) => {
                tasks.push(new CollectMinerals(lab.id));
            });
        }
    
        if (roomStorage && labsInUse) {
            _.forEach(_.filter(labsInUse, (l) => (!l.status || l.status === "emptying") && Game.getObjectById(l.id).mineralType && Game.getObjectById(l.id).mineralType !== l.resource), (lab) => {
                tasks.push(new CollectMinerals(lab.id));
            });
        }
    
        if (roomStorage && labQueue && status === "creating" && !Utilities.roomLabsArePaused(room)) {
            if (Game.getObjectById(sourceLabs[0]).mineralAmount === 0 && Game.getObjectById(sourceLabs[1]).mineralAmount !== 0) {
                tasks.push(new CollectMinerals(sourceLabs[1]));
            }
            if (Game.getObjectById(sourceLabs[0]).mineralAmount !== 0 && Game.getObjectById(sourceLabs[1]).mineralAmount === 0) {
                tasks.push(new CollectMinerals(sourceLabs[0]));
            }
        }
    
        if (roomStorage && labQueue && status === "returning") {
            _.forEach(_.filter(labs, (l) => l.mineralType === labQueue.resource), (lab) => {
                tasks.push(new CollectMinerals(lab.id));
            });
        }
    
        return tasks;
    }
    
    static getStorageTasks(room) {
        var tasks = [],
            amount;
    
        if (room.controller && room.controller.level >= 6) {
            if (room.storage && room.memory.labsInUse) {
                _.forEach(_.filter(room.memory.labsInUse, (l) => (!l.status || ["filling", "refilling"].indexOf(l.status) !== -1) && (!Game.getObjectById(l.id).mineralType || Game.getObjectById(l.id).mineralType === (l.status === "refilling" ? l.oldResource : l.resource))), (l) => {
                    if ((l.status === "refilling" ? (l.oldAmount - Game.getObjectById(l.id).mineralAmount) : (l.amount - Game.getObjectById(l.id).mineralAmount)) > 0) {
                        tasks.push(new CollectMinerals(room.storage.id, l.status === "refilling" ? l.oldResource : l.resource, l.status === "refilling" ? (l.oldAmount - Game.getObjectById(l.id).mineralAmount) : (l.amount - Game.getObjectById(l.id).mineralAmount)));
                    }
                });
            }
            if (room.storage && room.memory.labQueue && room.memory.labQueue.status === "moving" && Cache.labsInRoom(room).length >= 3 && !Utilities.roomLabsArePaused(room)) {
                _.forEach(room.memory.labQueue.children, (resource) => {
                    if ((amount = _.sum(_.filter(Cache.labsInRoom(room), (l) => l.mineralType === resource), (l) => l.mineralAmount)) < room.memory.labQueue.amount) {
                        tasks.push(new CollectMinerals(room.storage.id, resource, room.memory.labQueue.amount - amount));
                    }
                });
            }
            if (room.storage && room.terminal && Memory.reserveMinerals) {
                _.forEach(room.storage.store, (amount, resource) => {
                    if (resource === RESOURCE_ENERGY) {
                        return;
                    }
                    if (!Memory.reserveMinerals[resource]) {
                        tasks.push(new CollectMinerals(room.storage.id, resource, amount));
                    } else if ((resource.startsWith("X") && resource.length === 5 ? Memory.reserveMinerals[resource] - 5000 : Memory.reserveMinerals[resource]) < amount) {
                        tasks.push(new CollectMinerals(room.storage.id, resource, amount - (resource.startsWith("X") && resource.length === 5 ? Memory.reserveMinerals[resource] - 5000 : Memory.reserveMinerals[resource])));
                    }
                });
            }
    
            if (Cache.nukersInRoom(room).length > 0 && room.controller.level >= 8) {
                _.forEach(Cache.nukersInRoom(room), (nuker) => {
                    if (nuker.ghodium < nuker.ghodiumCapacity) {
                        tasks.push(new CollectMinerals(room.storage.id, RESOURCE_GHODIUM, nuker.ghodiumCapacity - nuker.ghodium));
                    }
                });
                _.forEach(Cache.powerSpawnsInRoom(room), (spawn) => {
                    if (spawn.power < spawn.powerCapacity && room.storage.store[RESOURCE_POWER]) {
                        tasks.push(new CollectMinerals(room.storage.id, RESOURCE_POWER, Math.min(spawn.powerCapacity - spawn.power, room.storage.store[RESOURCE_POWER])));
                    }
                });
            }
        }
    
        return tasks;
    }
    
    static getTerminalTasks(room) {
        var tasks = [];
        if (room.storage && room.terminal && Memory.reserveMinerals) {
            _.forEach(room.terminal.store, (amount, resource) => {
                if (resource === RESOURCE_ENERGY) {
                    return;
                }
                if (!Memory.reserveMinerals[resource]) {
                    return;
                }
                if (!room.storage.store[resource]) {
                    tasks.push(new CollectMinerals(room.terminal.id, resource, Math.min(amount, (resource.startsWith("X") && resource.length === 5 ? Memory.reserveMinerals[resource] - 5000 : Memory.reserveMinerals[resource]))));
                } else if (room.storage.store[resource] < (resource.startsWith("X") && resource.length === 5 ? Memory.reserveMinerals[resource] - 5000 : Memory.reserveMinerals[resource])) {
                    tasks.push(new CollectMinerals(room.terminal.id, resource, Math.min(amount, (resource.startsWith("X") && resource.length === 5 ? Memory.reserveMinerals[resource] - 5000 : Memory.reserveMinerals[resource]) - room.storage.store[resource])));
                }
            });
        }
    
        return tasks;
    }
}

if (Memory.profiling) {
    __require(1,40).registerObject(CollectMinerals, "TaskCollectMinerals");
}
module.exports = CollectMinerals;

return module.exports;
}
/********** End of module 40: ../src/task.collectMinerals.js **********/
/********** Start module 41: ../src/task.dismantle.js **********/
__modules[41] = function(module, exports) {
var Cache = __require(3,41),
    Pathing = __require(55,41);

class Dismantle {
    constructor(id) {
        this.type = "dismantle";
        this.id = id;
        this.structure = Game.getObjectById(id);
        this.unimportant = true;
        this.force = true;
    }
    
    canAssign(creep) {
        if (creep.spawning || creep.carryCapacity > 0 && _.sum(creep.carry) === creep.carryCapacity || creep.spawning || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var structure = this.structure;
        if (creep.carryCapacity > 0 && _.sum(creep.carry) === creep.carryCapacity || !this.structure || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        Pathing.moveTo(creep, structure, 1);
        creep.dismantle(structure);
        if (Math.min(creep.getActiveBodyparts(WORK), creep.carry[RESOURCE_ENERGY]) * 50 >= structure.hits) {
            delete creep.memory.currentTask;
            return;
        }
    }
    
    toObj(creep) {
        if (this.structure) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.structure.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new Dismantle(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
    
    static getCleanupTasks(structures) {
        return _.map(structures, (s) => new Dismantle(s.id));
    }
}

if (Memory.profiling) {
    __require(1,41).registerObject(Dismantle, "TaskDismantle");
}
module.exports = Dismantle;

return module.exports;
}
/********** End of module 41: ../src/task.dismantle.js **********/
/********** Start module 42: ../src/task.fillEnergy.js **********/
__modules[42] = function(module, exports) {
var Cache = __require(3,42),
    Pathing = __require(55,42),
    Utilities = __require(8,42);

class FillEnergy {
    constructor(id) {
        this.type = "fillEnergy";
        this.id = id;
        this.object = Game.getObjectById(id);
    }
    
    canAssign(creep) {
        var minEnergy;
    
        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || (this.object.energyCapacity && this.object.energy === this.object.energyCapacity)) {
            return false;
        }
    
        if (this.object.structureType === STRUCTURE_EXTENSION) {
            switch (this.object.room.controller.level) {
                case 7:
                    minEnergy = 100;
                    break;
                case 8:
                    minEnergy = 200;
                    break;
                default:
                    minEnergy = 50;
                    break;
            }
            if (creep.carry[RESOURCE_ENERGY] < minEnergy) {
                return false;
            }
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var obj = this.object;
        if (!obj || (obj.energy || _.sum(obj.store)) === (obj.energyCapacity || obj.storeCapacity)) {
            delete creep.memory.currentTask;
            return;
        }
        if (!obj || !creep.carry[RESOURCE_ENERGY]) {
            delete creep.memory.currentTask;
            return;
        }
        Pathing.moveTo(creep, obj, 1);
        if (creep.transfer(obj, RESOURCE_ENERGY) === OK) {
            delete creep.memory.currentTask;
        }
    }
    
    toObj(creep) {
        if (this.object) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new FillEnergy(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
    
    static getExtensionTasks(room) {
        return _.map(_.filter(Cache.extensionsInRoom(room), (e) => e.energy < e.energyCapacity), (e) => new FillEnergy(e.id));
    }
    
    static getSpawnTasks(room) {
        return _.map(_.filter(Cache.spawnsInRoom(room), (s) => s.energy < s.energyCapacity), (s) => new FillEnergy(s.id));
    }
    
    static getTowerTasks(room) {
        return _.map(_.filter(Cache.towersInRoom(room), (t) => t.energy / t.energyCapacity < 0.8).sort((a, b) => a.energy - b.energy), (t) => new FillEnergy(t.id));
    }
    
    static getLabTasks(room) {
        return _.map(_.filter(Cache.labsInRoom(room), (t) => t.energy < t.energyCapacity), (t) => new FillEnergy(t.id));
    }
    
    static getContainerTasks(room) {
        var containers = _.filter(Cache.containersInRoom(room), (c) => _.sum(c.store) < c.storeCapacity);
        
        if (room.storage && room.storage.my && _.sum(room.storage.store) < room.storage.storeCapacity) {
            containers.unshift(room.storage);
        }
    
        return _.map(containers, (c) => new FillEnergy(c.id));
    }
    
    static getStorageTasks(room) {
        if (room.storage && room.storage.my && _.sum(room.storage.store) < room.storage.storeCapacity) {
            return [new FillEnergy(room.storage.id)];
        } else {
            return [];
        }
    }
    
    static getLinkTasks(room) {
        var links = Cache.linksInRoom(room),
            spawns = Cache.spawnsInRoom(room);
    
        if (links.length === 0 || spawns.length === 0) {
            return [];
        }
    
        links = Utilities.objectsClosestToObj(links, spawns[0]);
        return [new FillEnergy(links[0].id)];
    }
    
    static getNukerTasks(room) {
        var nukers = Cache.nukersInRoom(room);
    
        if (nukers.length === 0) {
            return [];
        }
    
        return [new FillEnergy(nukers[0].id)];
    }
    
    static getPowerSpawnTasks(room) {
        var spawns = Cache.powerSpawnsInRoom(room);
    
        if (spawns.length === 0) {
            return [];
        }
    
        return [new FillEnergy(spawns[0].id)];
    }
}

if (Memory.profiling) {
    __require(1,42).registerObject(FillEnergy, "TaskFillEnergy");
}
module.exports = FillEnergy;

return module.exports;
}
/********** End of module 42: ../src/task.fillEnergy.js **********/
/********** Start module 43: ../src/task.fillMinerals.js **********/
__modules[43] = function(module, exports) {
var Cache = __require(3,43),
    Pathing = __require(55,43),
    Utilities = __require(8,43);

class FillMinerals {
    constructor(id, resources) {
        this.type = "fillMinerals";
        this.id = id;
        this.resources = resources;
        this.object = Game.getObjectById(id);
    }
    
    canAssign(creep) {
        if (creep.spawning) {
            return false;
        }
        if (_.sum(creep.carry) === creep.carry[RESOURCE_ENERGY]) {
            return false;
        }
        if (this.resources && _.intersection(_.keys(this.resources), _.filter(_.keys(creep.carry), (c) => c !== RESOURCE_ENERGY && creep.carry[c])).length === 0) {
            return false;
        }
        if (this.object.structureType === STRUCTURE_NUKER && this.object.ghodium === this.object.ghodiumCapacity) {
            return false;
        }
        if (this.object.structureType === STRUCTURE_POWER_SPAWN && this.object.power === this.object.powerCapacity) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var obj = this.object,
            minerals;
        if (!obj) {
            delete creep.memory.currentTask;
            return;
        }
        if (obj.storeCapacity && _.filter(_.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0).length === 0 || (_.sum(obj.store) || 0) === obj.storeCapacity) {
            delete creep.memory.currentTask;
            return true;
        }
    
        if (!this.resources) {
            minerals = _.filter(_.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0);
            if (minerals.length === 0) {
                delete creep.memory.currentTask;
                return;
            }
            Pathing.moveTo(creep, obj, 1);
            if (creep.transfer(obj, minerals[0]) === OK) {
                if (_.filter(_.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0).length === 0) {
                    delete creep.memory.currentTask;
                }
            }
        } else {
            minerals = _.intersection(_.keys(this.resources), _.filter(_.keys(creep.carry), (c) => creep.carry[c])).sort((a, b) => {
                var ra = this.resources[a],
                    rb = this.resources[b];
                if (ra === rb) {
                    return 0;
                }
                if (ra === null) {
                    return 1;
                }
                if (rb === null) {
                    return -1;
                }
                return ra - rb;
            });
            if (minerals.length === 0) {
                delete creep.memory.currentTask;
                return;
            }
            Pathing.moveTo(creep, obj, 1);
            if (creep.transfer(obj, minerals[0], this.resources[minerals[0]] !== null ? Math.min(this.resources[minerals[0]], creep.carry[minerals[0]]) : undefined) === OK) {
                if (minerals.length === 1) {
                    delete creep.memory.currentTask;
                }
            }
        }
    }
    
    toObj(creep) {
        if (this.object) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id,
                resources: this.resources
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new FillMinerals(creep.memory.currentTask.id, creep.memory.currentTask.resources);
        } else {
            return;
        }
    }
    
    static getLabTasks(room) {
        var resources,
            tasks = [];
    
        _.forEach(_.filter(room.memory.labsInUse, (l) => (!l.status || ["filling", "refilling"].indexOf(l.status) !== -1) && (!Game.getObjectById(l.id).mineralType || Game.getObjectById(l.id).mineralType === (l.status === "refilling" ? l.oldResource : l.resource)) && (Game.getObjectById(l.id).mineralAmount < (l.status === "refilling" ? l.oldAmount : l.amount))), (lab) => {
            resources = {};
            resources[lab.status === "refilling" ? lab.oldResource : lab.resource] = (lab.status === "refilling" ? lab.oldAmount : lab.amount) - Game.getObjectById(lab.id).mineralAmount;
            tasks.push(new FillMinerals(lab.id, resources));
        });
    
        if (room.storage && Cache.labsInRoom(room).length >= 3 && room.memory.labQueue && room.memory.labQueue.status === "moving" && !Utilities.roomLabsArePaused(room)) {
            if (Game.getObjectById(room.memory.labQueue.sourceLabs[0]).mineralAmount < room.memory.labQueue.amount) {
                resources = {};
                resources[room.memory.labQueue.children[0]] = room.memory.labQueue.amount - Game.getObjectById(room.memory.labQueue.sourceLabs[0]).mineralAmount;
                tasks.push(new FillMinerals(room.memory.labQueue.sourceLabs[0], resources));
            }
            if (Game.getObjectById(room.memory.labQueue.sourceLabs[1]).mineralAmount < room.memory.labQueue.amount) {
                resources = {};
                resources[room.memory.labQueue.children[1]] = room.memory.labQueue.amount - Game.getObjectById(room.memory.labQueue.sourceLabs[1]).mineralAmount;
                tasks.push(new FillMinerals(room.memory.labQueue.sourceLabs[1], resources));
            }
        }
    
        return tasks;
    }
    
    static getStorageTasks(room) {
        var storage = room.storage,
            store,
            resources;
        if (storage && storage.my && (!room.terminal || !room.terminal.my)) {
            return [new FillMinerals(storage.id)];
        }
        if (storage && storage.my && _.sum(store = storage.store) < storage.storeCapacity && Memory.reserveMinerals) {
            resources = {};
            _.forEach(_.keys(Memory.reserveMinerals), (resource) => {
                var amount = (resource.startsWith("X") && resource.length === 5 ? Memory.reserveMinerals[resource] - 5000 : Memory.reserveMinerals[resource]) - (store[resource] || 0);
                if (amount > 0) {
                    resources[resource] = amount;
                }
            });
            return [new FillMinerals(storage.id, resources)];
        }
    }
    
    static getTerminalTasks(room) {
        if (room.terminal && room.terminal.my && _.sum(room.terminal.store) < room.terminal.storeCapacity) {
            return [new FillMinerals(room.terminal.id)];
        }
        return [];
    }
    
    static getNukerTasks(room) {
        var nukers = Cache.nukersInRoom(room),
            resources;
    
        if (nukers.length === 0) {
            return [];
        }
        
        resources = {};
        resources[RESOURCE_GHODIUM] = nukers[0].ghodiumCapacity - nukers[0].ghodium;
        
        if (resources[RESOURCE_GHODIUM] <= 0) {
            return [];
        }
    
        return [new FillMinerals(nukers[0].id, resources)];
    }
    
    static getPowerSpawnTasks(room) {
        var spawns = Cache.powerSpawnsInRoom(room),
            resources;
    
        if (spawns.length === 0) {
            return [];
        }
        
        resources = {};
        resources[RESOURCE_POWER] = spawns[0].powerCapacity - spawns[0].power;
        
        if (resources[RESOURCE_POWER] <= 0) {
            return [];
        }
    
        return [new FillMinerals(spawns[0].id, resources)];
    }
}

if (Memory.profiling) {
    __require(1,43).registerObject(FillMinerals, "TaskFillMinerals");
}
module.exports = FillMinerals;

return module.exports;
}
/********** End of module 43: ../src/task.fillMinerals.js **********/
/********** Start module 44: ../src/task.harvest.js **********/
__modules[44] = function(module, exports) {
var Cache = __require(3,44),
    Pathing = __require(55,44);

class Harvest {
    constructor(failIn, source) {
        this.type = "harvest";
        this.failIn = failIn || 10;
        this.source = source;
    }
    
    canAssign(creep) {
        var source = Game.getObjectById(creep.memory.homeSource);
    
        if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || !source || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }
    
        if (source.energy === 0) {
            source = creep.room.find(FIND_SOURCES_ACTIVE)[0];
            if (!source) {
                return false;
            }
        }
    
        this.source = source.id;
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var source = Game.getObjectById(this.source || creep.memory.homeSource);
        if (creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || !source || source.energy === 0 || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        Pathing.moveTo(creep, source, 1);
        if (creep.harvest(source) !== OK) {
            this.failIn--;
            if (this.failIn === 0) {
                delete creep.memory.currentTask;
            }
        }
    }
    
    toObj(creep) {
        creep.memory.currentTask = {
            type: this.type,
            failIn: this.failIn,
            source: this.source
        };
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.source)) {
            return new Harvest(creep.memory.currentTask.failIn, creep.memory.currentTask.source);
        } else {
            return;
        }
    }
}

if (Memory.profiling) {
    __require(1,44).registerObject(Harvest, "TaskHarvest");
}
module.exports = Harvest;

return module.exports;
}
/********** End of module 44: ../src/task.harvest.js **********/
/********** Start module 45: ../src/task.heal.js **********/
__modules[45] = function(module, exports) {
var Cache = __require(3,45),
    Pathing = __require(55,45);

class Heal {
    constructor(id) {
        this.type = "heal";
        this.id = id;
        this.ally = Game.getObjectById(id);
        this.unimportant = true;
    }
    
    canAssign(creep, tasks) {
        if (creep.spawning || creep.getActiveBodyparts(HEAL) === 0) {
            return false;
        }
    
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var ally = this.ally;
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }
        if (!ally) {
            delete creep.memory.currentTask;
            return true;
        }
        Pathing.moveTo(creep, ally);
    
        if (ally.hits !== ally.hitsMax && creep.id !== ally.id) {
            if (creep.pos.getRangeTo(ally) <= 1) {
                creep.heal(ally);
            } else if (creep.pos.getRangeTo(ally) <= 3) {
                creep.rangedHeal(ally);
            }
        }
    }
    
    toObj(creep) {
        if (this.ally) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.ally.id,
                unimportant: this.unimportant
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new Heal(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
    
    static getTasks(room) {
        return _.map(_.filter(room.find(FIND_MY_CREEPS), (c) => c.hits < c.hitsMax).sort((a, b) => a.hits - b.hits), (c) => new Heal(c.id));
    }
    
    static getDefenderTask(creep) {
        return _.map(_.filter(creep.room.find(FIND_MY_CREEPS), (c) => c.hits < c.hitsMax && c.id !== creep.id).sort((a, b) => a.hits - b.hits), (c) => new Heal(c.id))[0];
    }
}

if (Memory.profiling) {
    __require(1,45).registerObject(Heal, "TaskHeal");
}
module.exports = Heal;

return module.exports;
}
/********** End of module 45: ../src/task.heal.js **********/
/********** Start module 46: ../src/task.meleeAttack.js **********/
__modules[46] = function(module, exports) {
var Cache = __require(3,46),
    Pathing = __require(55,46);

class Melee {
    constructor(id) {
        this.type = "meleeAttack";
        this.id = id;
        this.enemy = Game.getObjectById(id);
    }
    
    canAssign(creep) {
        if (creep.spawning || creep.getActiveBodyparts(ATTACK) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        if (!this.enemy) {
            creep.say("Get Rekt!", true);
            delete creep.memory.currentTask;
            return;
        }
        if (creep.getActiveBodyparts(ATTACK) === 0) {
            creep.say("Help!");
            delete creep.memory.currentTask;
            return;
        }
        Pathing.moveTo(creep, this.enemy);
        if (creep.attack(this.enemy) === ERR_NOT_IN_RANGE) {
            if (creep.hits < creep.hitsMax && creep.getActiveBodyparts(HEAL) > 0) {
                creep.heal(creep);
            }
        }
        if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
            creep.rangedAttack(this.enemy);
        }
    }
    
    toObj(creep) {
        if (this.enemy) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new Melee(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
    
    static getTasks(room) {
        return _.map(Cache.hostilesInRoom(room).sort((a, b) => a.hits - b.hits), (h) => new Melee(h.id));
    }
}

if (Memory.profiling) {
    __require(1,46).registerObject(Melee, "TaskMeleeAttack");
}
module.exports = Melee;

return module.exports;
}
/********** End of module 46: ../src/task.meleeAttack.js **********/
/********** Start module 47: ../src/task.mine.js **********/
__modules[47] = function(module, exports) {
var Cache = __require(3,47),
    Pathing = __require(55,47),
    Utilities = __require(8,47);

class Mine {
    constructor(id) {
        this.type = "mine";
        this.id = id;
        this.source = Game.getObjectById(id);
        this.force = true;
    }
    
    canAssign(creep) {
        var container = Game.getObjectById(creep.memory.container);
    
        if (creep.spawning || !container || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var container = Game.getObjectById(creep.memory.container),
            source;
        if (!container) {
            delete creep.memory.currentTask;
            return;
        }
        if (container.pos.x !== creep.pos.x || container.pos.y !== creep.pos.y || container.pos.roomName !== creep.pos.roomName) {
            Pathing.moveTo(creep, container, 0);
        }
        if (container.pos.x === creep.pos.x && container.pos.y === creep.pos.y && container.pos.roomName === creep.pos.roomName) {
            if (this.source) {
                source = this.source;
            } else if (Memory.containerSource[creep.memory.container]) {
                source = Game.getObjectById(Memory.containerSource[creep.memory.container]);
                this.id = source.id;
            } else {
                source = Utilities.objectsClosestToObj([].concat.apply([], [container.room.find(FIND_SOURCES), container.room.find(FIND_MINERALS)]), creep)[0];
                this.id = source.id;
            }
    
            if (source instanceof Mineral && source.mineralAmount === 0) {
                creep.say(":(", true);
                creep.suicide();
            }
            if (source instanceof Mineral && _.sum(container.store) >= 1500) {
                return;
            }

            creep.harvest(source);
            if (_.filter([].concat.apply([], [Cache.creeps[creep.room.name] && Cache.creeps[creep.room.name].miner || [], Cache.creeps[creep.room.name] && Cache.creeps[creep.room.name].remoteMiner || []]), (c) => c.room.name === creep.room.name && c.memory.container === creep.memory.container && c.pos.getRangeTo(creep) === 1 && c.ticksToLive > creep.ticksToLive && c.fatigue === 0).length > 0) {
                creep.say(":(", true);
                creep.suicide();
            }
        }
    }
    
    toObj(creep) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.id
        };
    }
    
    static fromObj(creep) {
        if (!creep.memory.currentTask.id || Game.getObjectById(creep.memory.currentTask.id)) {
            return new Mine(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
}

if (Memory.profiling) {
    __require(1,47).registerObject(Mine, "TaskMine");
}
module.exports = Mine;

return module.exports;
}
/********** End of module 47: ../src/task.mine.js **********/
/********** Start module 48: ../src/task.pickupResource.js **********/
__modules[48] = function(module, exports) {
var Cache = __require(3,48),
    TaskCollectEnergy = __require(39,48),
    Utilities = __require(8,48),
    Pathing = __require(55,48);

class Pickup {
    constructor(id) {
        this.type = "pickupResource";
        this.id = id;
        this.resource = Game.getObjectById(id);
        this.force = true;
    }
    
    canAssign(creep) {
        if (creep.spawning || creep.ticksToLive < 150 || !this.resource || _.sum(creep.carry) === creep.carryCapacity || this.resource.amount < creep.pos.getRangeTo(this.resource) || this.resource.resourceType === RESOURCE_ENERGY && this.resource.amount < 50 || this.resource.room.controller && Memory.allies.indexOf(Utilities.getControllerOwner(this.resource.room.controller)) !== -1) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        if (!this.resource || _.sum(creep.carry) === creep.carryCapacity) {
            delete creep.memory.currentTask;
            return;
        }
        Pathing.moveTo(creep, this.resource, 1);
        if (creep.pickup(this.resource) === OK) {
            delete creep.memory.currentTask;
            let structures = _.filter(creep.room.lookForAt(LOOK_STRUCTURES, this.resource), (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY]);
            if (structures.length > 0) {
                let task = new TaskCollectEnergy(structures[0].id);
                task.canAssign(creep);
            }
        }
    }
    
    toObj(creep) {
        if (this.resource) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.resource.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new Pickup(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
    
    static getTasks(room) {
        return _.map(Cache.resourcesInRoom(room), (r) => new Pickup(r.id));
    }

    static getCollectorTasks(room) {
        return _.map(_.filter(Cache.resourcesInRoom(room), (r) => r.resourceType === RESOURCE_ENERGY), (r) => new Pickup(r.id));
    }
}

if (Memory.profiling) {
    __require(1,48).registerObject(Pickup, "TaskPickupResource");
}
module.exports = Pickup;

return module.exports;
}
/********** End of module 48: ../src/task.pickupResource.js **********/
/********** Start module 49: ../src/task.rally.js **********/
__modules[49] = function(module, exports) {
var Cache = __require(3,49),
    Pathing = __require(55,49);

class Rally {
    constructor(id, creep) {
        this.type = "rally";
        this.id = id;
        this.creep = creep;
        if (id instanceof RoomPosition) {
            this.rallyPoint = new RoomPosition(id.x, id.y, id.roomName);
        } else {
            this.rallyPoint = Game.getObjectById(id);
            if (!this.rallyPoint) {
                this.rallyPoint = new RoomPosition(25, 25, id);
                this.range = 5;
            }
        }
        this.unimportant = true;
    }
    
    canAssign(creep) {
        if (creep.spawning) {
            return false;
        }
    
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var rallyPoint = this.rallyPoint,
            range;
        if (!rallyPoint) {
            delete creep.memory.currentTask;
            return;
        }
        range = creep.room.name === rallyPoint.roomName || !(rallyPoint instanceof RoomPosition) || rallyPoint.pos && creep.room.name === rallyPoint.pos.roomName ? this.range || 0 : 20;
        if (creep.pos.getRangeTo(rallyPoint) <= range) {
            if (creep.pos.x === 0) {
                creep.move(RIGHT);
            } else if (creep.pos.x === 49) {
                creep.move(LEFT);
            } else if (creep.pos.y === 0) {
                creep.move(BOTTOM);
            } else if (creep.pos.y === 49) {
                creep.move(TOP);
            } else if (_.filter(creep.pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER).length > 0) {
                creep.move(Math.floor(Math.random() * 8));
            }
        } else {
            Pathing.moveTo(creep, rallyPoint, range);
        }
        if (creep.getActiveBodyparts(HEAL) > 0) {
            if (this.heal) {
                creep.heal(Game.getObjectById(this.heal));
            } else if (this.rangedHeal) {
                creep.rangedHeal(Game.getObjectById(this.rangedHeal));
            } else if (creep.hits < creep.hitsMax) {
                creep.heal(creep);
            }
        }
        if (creep.getActiveBodyparts(ATTACK) > 0) {
            if (this.attack) {
                creep.attack(Game.getObjectById(this.attack));
            }
        }
        if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
            if (this.rangedAttack) {
                creep.rangedAttack(Game.getObjectById(this.rangedAttack));
            } else {
                creep.rangedMassAttack();
            }
        }
    }
    
    toObj(creep) {
        if (this.rallyPoint) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id,
                unimportant: this.unimportant,
                range: this.range
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        var task;
    
        if (creep.memory.currentTask.id.roomName) {
            task = new Rally(new RoomPosition(creep.memory.currentTask.id.x, creep.memory.currentTask.id.y, creep.memory.currentTask.id.roomName));
        } else {
            task = new Rally(creep.memory.currentTask.id);
        }
    
        if (task && creep.memory.currentTask.range) {
            task.range = creep.memory.currentTask.range;
        }
    
        return task;
    }
    
    static getHarvesterTasks(creeps) {
        return _.map(_.filter(creeps, (c) => !c.spawning && c.ticksToLive >= 150 && c.memory.homeSource), (c) => new Rally(c.memory.homeSource, c));
    }
    
    static getDefenderTask(creep) {
        var source = Cache.sourceKeepersInRoom(creep.room).sort((a, b) => a.ticksToSpawn - b.ticksToSpawn)[0];
    
        if (source && creep.room.name === creep.memory.home) {
            return new Rally(source.id, creep);
        } else {
            return new Rally(creep.memory.home, creep);
        }
    }
    
    static getClaimerTask(creep) {
        return new Rally(creep.memory.claim, creep);
    }
}

if (Memory.profiling) {
    __require(1,49).registerObject(Rally, "TaskRally");
}
module.exports = Rally;

return module.exports;
}
/********** End of module 49: ../src/task.rally.js **********/
/********** Start module 50: ../src/task.rangedAttack.js **********/
__modules[50] = function(module, exports) {
var Cache = __require(3,50),
    Pathing = __require(55,50);

class Ranged {
    constructor(id) {
        this.type = "rangedAttack";
        this.id = id;
        this.enemy = Game.getObjectById(id);
    }
    
    canAssign(creep) {
        if (creep.spawning || creep.getActiveBodyparts(RANGED_ATTACK) === 0) {
            return false;
        }
    
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        if (!this.enemy) {
            creep.say("Get Rekt!", true);
            delete creep.memory.currentTask;
            return;
        }
        if (creep.getActiveBodyparts(RANGED_ATTACK) === 0) {
            creep.say("Help!");
            delete creep.memory.currentTask;
            return;
        }
        if (creep.getActiveBodyparts(ATTACK) > 0) {
            Pathing.moveTo(creep, this.enemy);
            if (creep.attack(this.enemy) === ERR_NOT_IN_RANGE) {
                if (creep.hits < creep.hitsMax && creep.getActiveBodyparts(HEAL) > 0) {
                    creep.heal(creep);
                }
            }
            if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                creep.rangedAttack(this.enemy);
            }
        } else {
            Pathing.moveTo(creep, this.enemy, 3);
            
            creep.rangedAttack(this.enemy);
            if (creep.hits < creep.hitsMax && creep.getActiveBodyparts(HEAL) > 0) {
                creep.heal(creep);
            }
        } 
    }
    
    toObj(creep) {
        if (this.enemy) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new Ranged(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
    
    static getTasks(room) {
        return _.map(Cache.hostilesInRoom(room).sort((a, b) => a.hits - b.hits), (h) => new Ranged(h.id));
    }
}

if (Memory.profiling) {
    __require(1,50).registerObject(Ranged, "TaskRangedAttack");
}
module.exports = Ranged;

return module.exports;
}
/********** End of module 50: ../src/task.rangedAttack.js **********/
/********** Start module 51: ../src/task.repair.js **********/
__modules[51] = function(module, exports) {
var Cache = __require(3,51),
    Pathing = __require(55,51);

class Repair {
    constructor(id) {
        this.type = "repair";
        this.id = id;
        this.structure = Game.getObjectById(id);
        this.force = true;
    }
    
    canAssign(creep) {
        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.carry[RESOURCE_ENERGY] === 0 || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }
        if (this.structure.hits >= 1000000 && creep.memory.role === "worker" && creep.room.name === creep.memory.home && creep.room.controller.level < 8 && !_.find(creep.body, (b) => b.type === WORK && [RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_HYDRIDE].indexOf(b.boost) !== -1)) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var structure = this.structure;
        if (!creep.carry[RESOURCE_ENERGY] || !structure || structure.hits === structure.hitsMax || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        Pathing.moveTo(creep, structure, Math.max(Math.min(creep.pos.getRangeTo(structure) - 1, 3), 1));
        if (creep.repair(structure) === OK) {
            if (Math.min(creep.getActiveBodyparts(WORK), creep.carry[RESOURCE_ENERGY]) * 100 >= structure.hitsMax - structure.hits) {
                delete creep.memory.currentTask;
                return;
            }
        }
    }
    
    toObj(creep) {
        if (this.structure) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.structure.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new Repair(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
    
    static getTowerTasks(room) {
        return _.map(_.take(_.filter(Cache.sortedRepairableStructuresInRoom(room), (s) => s.hits < 10000 && s.hits / s.hitsMax < 0.25), 5), (s) => new Repair(s.id));
    }
    
    static getCriticalTasks(room) {
        return _.map(_.take(_.filter(Cache.sortedRepairableStructuresInRoom(room), (s) => s.hits < 125000 && s.hits / s.hitsMax < 0.5), 5), (s) => new Repair(s.id));
    }
    
    static getTasks(room) {
        return _.map(_.take(_.filter(Cache.sortedRepairableStructuresInRoom(room), (s) => s.hits / s.hitsMax < 0.9 || s.hitsMax - s.hits > 100000), 5), (s) => new Repair(s.id));
    }
}

if (Memory.profiling) {
    __require(1,51).registerObject(Repair, "TaskRepair");
}
module.exports = Repair;

return module.exports;
}
/********** End of module 51: ../src/task.repair.js **********/
/********** Start module 52: ../src/task.reserve.js **********/
__modules[52] = function(module, exports) {
var Cache = __require(3,52),
    Pathing = __require(55,52);

class Reserve {
    constructor(id) {
        this.type = "reserve";
        this.force = true;
    }
    
    canAssign(creep) {
        if (creep.spawning || creep.getActiveBodyparts(CLAIM) === 0) {
            return false;
        }
    
        if (!Game.rooms[creep.memory.home] || !Game.rooms[creep.memory.home].controller || Game.rooms[creep.memory.home].controller.my) {
            return false;
        }
    
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        creep.say(["You", "spin", "me", "right", "round", "baby", "right", "round", "like a", "record", "baby", "right", "round", "round", "round", ""][Game.time % 16], true);
        if (!Game.rooms[creep.memory.home] || !Game.rooms[creep.memory.home].controller || Game.rooms[creep.memory.home].controller.my || creep.getActiveBodyparts(CLAIM) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        
        Pathing.moveTo(creep, Game.rooms[creep.memory.home].controller, 1);
        creep.reserveController(Game.rooms[creep.memory.home].controller);
    
        if (Memory.signs && Memory.signs[creep.room.name] && (!creep.room.controller.sign || creep.room.controller.sign.username !== "roncli")) {
            creep.signController(creep.room.controller, Memory.signs[creep.room.name]);
        }
    }
    
    toObj(creep) {
        creep.memory.currentTask = {
            type: this.type
        };
    }
    
    static fromObj(creep) {
        return new Reserve();
    }
    
    static getTask(creep) {
        if (creep.room.controller) {
            return new Reserve();
        }
    }
    
    static getRemoteTask(creep) {
        if (Game.rooms[creep.memory.home] && Game.rooms[creep.memory.home].controller) {
            return new Reserve();
        }
    }
}

if (Memory.profiling) {
    __require(1,52).registerObject(Reserve, "TaskReserve");
}
module.exports = Reserve;

return module.exports;
}
/********** End of module 52: ../src/task.reserve.js **********/
/********** Start module 53: ../src/task.upgradeController.js **********/
__modules[53] = function(module, exports) {
var Cache = __require(3,53),
    Pathing = __require(55,53),
    Utilities = __require(8,53);

class Upgrade {
    constructor(room) {
        this.type = "upgradeController";
        this.room = room;
        this.controller = Game.rooms[room].controller;
        this.force = true;
    }
    
    canAssign(creep) {
        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.memory.role !== "upgrader" && _.sum(creep.carry) !== creep.carryCapacity && creep.ticksToLive >= 150 && this.controller.ticksToDowngrade >= 1000 || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        creep.say(["I've", "got to", "celebrate", "you baby", "I've got", "to praise", "GCL like", "I should!", ""][Game.time % 9], true);
        if (!this.controller || !creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        if (creep.memory.role === "upgrader") {
            let links = Utilities.objectsClosestToObj(Cache.linksInRoom(creep.room), creep);
    
            if (links.length > 0 && links[0].energy > 0 && creep.pos.getRangeTo(links[0]) <= 1) {
                creep.withdraw(links[0], RESOURCE_ENERGY);
            }
        }
        Pathing.moveTo(creep, this.controller, Math.max(Math.min(creep.pos.getRangeTo(this.controller) - 1, 3), 1));
        creep.transfer(this.controller, RESOURCE_ENERGY);
    
        if (Memory.signs && Memory.signs[creep.room.name] && (!this.controller.sign || this.controller.sign.username !== "roncli")) {
            creep.signController(this.controller, Memory.signs[creep.room.name]);
        }
        if (creep.carry[RESOURCE_ENERGY] <= creep.getActiveBodyparts(WORK)) {
            delete creep.memory.currentTask;
            return;
        }
    }
    
    toObj(creep) {
        creep.memory.currentTask = {
            type: this.type,
            room: this.room
        };
    }
    
    static fromObj(creep) {
        return new Upgrade(creep.memory.currentTask.room);
    }
    
    static getCriticalTasks(room) {
        var ttdLimit;
        
        if (room.controller && room.controller.my) {
            switch (room.controller.level) {
                case 1:
                    ttdLimit = 10000;
                    break;
                case 2:
                    ttdLimit = 3500;
                    break;
                case 3:
                    ttdLimit = 5000;
                    break;
                case 4:
                    ttdLimit = 10000;
                    break;
                case 5:
                    ttdLimit = 20000;
                    break;
                case 6:
                    ttdLimit = 30000;
                    break;
                case 7:
                    ttdLimit = 50000;
                    break;
                case 8:
                    ttdLimit = 100000;
                    break;
            }
        
            if (room.controller.ticksToDowngrade < ttdLimit) {
                return [new Upgrade(room.name)];
            }
        }
    
        return [];
    }
    
    static getTasks(room) {
        if (room.controller && room.controller.my) {
            return [new Upgrade(room.name)];
        }
    }
}

if (Memory.profiling) {
    __require(1,53).registerObject(Upgrade, "TaskUpgradeController");
}
module.exports = Upgrade;

return module.exports;
}
/********** End of module 53: ../src/task.upgradeController.js **********/
/********** Start module 54: ../src/assign.js **********/
__modules[54] = function(module, exports) {
const Cache = __require(3,54),
    Utilities = __require(8,54),
    TaskMeleeAttack = __require(46,54),
    TaskDismantle = __require(41,54),
    TaskHeal = __require(45,54),
    TaskRally = __require(49,54),
    TaskRangedAttack = __require(50,54);
/**
 * A set of static functions that assigns creeps in an array to tasks.
 */
class Assign {
    /**
     * Assigns creeps to attack other creeps.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToAttack The list of creeps to attack.
     * @param {string} say Text to say on successful assignment.
     */
    static attack(creeps, creepsToAttack, say) {
        var firstCreep;
        if (!creepsToAttack || creepsToAttack.length === 0) {
            return;
        }
        
        _.forEach(creeps, (creep) => {
            var task;

            firstCreep = creepsToAttack[0];
            
            if (creep.pos.getRangeTo(firstCreep) <= 1) {
                task = new TaskMeleeAttack(firstCreep.id);
            } else {
                let closeCreeps = _.filter(creepsToAttack, (c) => creep.pos.getRangeTo(c) <= 1);
                task = new TaskRally(firstCreep.id);
                if (closeCreeps.length > 0) {
                    task.attack = closeCreeps[0].id;
                }
            }
            
            if (task.canAssign(creep)) {
                creep.memory.currentTask.priority = Game.time;
                creep.say(say);
            }
        });
    }
    /**
     * Assigns creeps to dismantle a target from the army dismantle list if available.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} roomName The name of the room.
     * @param {string[]} dismantle An array of object IDs to dismantle.
     * @param {string} say Text to say on successful assignment.
     */
    static dismantleArmyTarget(creeps, roomName, dismantle, say) {
        if (Game.rooms[roomName] && dismantle && dismantle.length > 0) {
            let task = new TaskDismantle(dismantle[0]);

            _.forEach(creeps, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say(say);
                }
            });
        }
    }
    /**
     * Assigns creeps to dismantle a hostile structure.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} roomName The name of the room.
     * @param {string} say Text to say on successful assignment.
     */
    static dismantleHostileStructures(creeps, roomName, say) {
        var room;
        if (room = Game.rooms[roomName]) {
            let structures = _.filter(room.find(FIND_HOSTILE_STRUCTURES), (s) => [STRUCTURE_CONTROLLER, STRUCTURE_RAMPART, STRUCTURE_KEEPER_LAIR].indexOf(s.structureType) === -1);

            if (structures.length > 0) {
                let task = new TaskDismantle(structures[0].id);

                _.forEach(creeps, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say(say);
                    }
                });
            }
        }
    }
    /**
     * Assigns creeps to escort another, and heal it if it's hurt.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment for healing only.
     */
    static escort(creeps, say) {
        _.forEach(_.filter(creeps, (c) => !c.spawning && c.memory.escorting), (creep) => {
            var escorting = Game.getObjectById(creep.memory.escorting);
            if (!escorting) {
                delete creep.memory.escorting;
                return;
            }
            if (escorting.hitsMax - escorting.hits === 0 || escorting.hits / escorting.hitsMax > creep.hits / creep.hitsMax || !new TaskHeal(escorting.id).canAssign(creep)) {
                new TaskRally(escorting.id).canAssign(creep);
            } else {
                creep.say(say);
            }
        });
    }
    /**
     * Assigns creeps to rally to a lab if they require a boost.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     */
    static getBoost(creeps, say) {
        _.forEach(_.filter(creeps, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
            var task = new TaskRally(creep.memory.labs[0]);
            if (task.canAssign(creep)) {
                creep.memory.currentTask.priority = Game.time;
                creep.say(say);
            }
        });
    }
    /**
     * Assigns creeps to heal other creeps.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToHeal The list of creeps to heal.
     * @param {string} say Text to say on successful assignment.
     */
    static heal(creeps, creepsToHeal, say) {
        var mostHurtCreep;
        if (!creepsToHeal || creepsToHeal.length === 0) {
            return;
        }
        
        _.forEach(creeps, (creep) => {
            var task;

            mostHurtCreep = creepsToHeal[0];
            
            if (creep.id === mostHurtCreep.id && creepsToHeal.length >= 2) {
                task = new TaskRally(creepsToHeal[1].id);
            } else if (creep.pos.getRangeTo(mostHurtCreep) <= 3) {
                task = new TaskHeal(mostHurtCreep.id);
            } else {
                let closeCreeps;
                task = new TaskRally(mostHurtCreep.id);
                if (creep.hits === creep.hitsMax) {
                    closeCreeps = _.filter(creepsToHeal, (c) => creep.pos.getRangeTo(c) <= 1);
                    if (closeCreeps.length > 0) {
                        task.heal = closeCreeps[0].id;
                    } else {
                        closeCreeps = _.filter(creepsToHeal, (c) => creep.pos.getRangeTo(c) <= 3);
                        if (closeCreeps.length > 0) {
                            task.rangedHeal = closeCreeps[0].id;
                        }
                    }
                }
            }
            
            if (task.canAssign(creep)) {
                creep.memory.currentTask.priority = Game.time;
                creep.say(say);
            }
        });
    }
    /**
     * Assigns all creeps to rally to a position.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {RoomPosition} pos The position to rally to.
     * @param {number|undefined} range The range to move within.
     * @param {string} say Text to say on successful assignment.
     */
    static moveToPos(creeps, pos, range, say) {
        var task = new TaskRally(pos);
        if (range) {
            task.range = range;
        }
        _.forEach(creeps, (creep) => {
            if (task.canAssign(creep)) {
                creep.say(say);
            }
        });
    }
    /**
     * Assigns all creeps to rally to a room.  Will go through portals if specified.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} roomName The name of the room to rally to.
     * @param {string} say Text to say on successful assignment.
     */
    static moveToRoom(creeps, roomName, say) {
        _.forEach(creeps, (creep) => {
            var portals = creep.memory.portals,
                task;
            if (creep.memory.portaling && portals[0] !== creep.room.name) {
                portals.shift();
            }
            if (portals && portals.length > 0) {
                if (portals[0] === creep.room.name) {
                    creep.memory.portaling = true;
                    task = new TaskRally(Cache.portalsInRoom(creep.room)[0].id);
                } else {
                    task = new TaskRally(portals[0]);
                }
            } else {
                task = new TaskRally(roomName);
            }
            if (task.canAssign(creep)) {
                creep.say(say);
            }
        });
    }
    /**
     * Assigns creeps to attack other creeps at range.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToAttack The list of creeps to attack.
     * @param {string} say Text to say on successful assignment.
     */
    static rangedAttack(creeps, creepsToAttack, say) {
        var firstCreep;
        if (!creepsToAttack || creepsToAttack.length === 0) {
            return;
        }
        
        _.forEach(creeps, (creep) => {
            var task;

            firstCreep = creepsToAttack[0];
            
            if (creep.pos.getRangeTo(firstCreep) <= 1) {
                task = new TaskRangedAttack(firstCreep.id);
            } else {
                let closeCreeps = _.filter(creepsToAttack, (c) => creep.pos.getRangeTo(c) <= 3);
                task = new TaskRally(firstCreep.id);
                if (closeCreeps.length > 0) {
                    task.rangedAttack = closeCreeps[0].id;
                }
            }
            
            if (task.canAssign(creep)) {
                creep.memory.currentTask.priority = Game.time;
                creep.say(say);
            }
        });
    }
    /**
     * Assigns an army unit to retreat when hurt.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} healers The healers to check against.
     * @param {string} stageRoomName The name of the staging room.
     * @param {string} attackRoomName The name of the attack room.
     * @param {number} minHealthPercent The minimum amount a health a unit must have to not retreat.
     * @param {string} say Text to say on successful assignment.
     */
    static retreatArmyUnit(creeps, healers, stageRoomName, attackRoomName, minHealthPercent, say) {
        if (!healers || healers.length === 0) {
            return;
        }
        if (stageRoomName !== attackRoomName) {
            let task = new TaskRally(stageRoomName);
            _.forEach(_.filter(creeps, (c) => (c.room.name === attackRoomName || c.pos.x <= 1 || c.pos.x >= 48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hits / c.hitsMax < minHealthPercent), (creep) => {
                if (task.canAssign(creep)) {
                    creep.memory.currentTask.priority = Game.time;
                    creep.say(say);
                }
            });
        }
    }
    /**
     * Assigns an army unit to retreat when hurt or move to a healer if too far from one.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} healers The healers to check against.
     * @param {string} stageRoomName The name of the staging room.
     * @param {string} attackRoomName The name of the attack room.
     * @param {number} minHealthPercent The minimum amount a health a unit must have to not retreat.
     * @param {string} say Text to say on successful assignment for retreating only.
     */
    static retreatArmyUnitOrMoveToHealer(creeps, healers, stageRoomName, attackRoomName, minHealthPercent, say) {
        var healersNotEscorting;
        if (!healers || healers.length === 0) {
            return;
        }
        if (stageRoomName !== attackRoomName) {
            let task = new TaskRally(stageRoomName);
            _.forEach(_.filter(creeps, (c) => (c.room.name === attackRoomName || c.pos.x <= 1 || c.pos.x >= 48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hits / c.hitsMax < minHealthPercent), (creep) => {
                if (task.canAssign(creep)) {
                    creep.memory.currentTask.priority = Game.time;
                    creep.say(say);
                }
            });
        }
        healersNotEscorting = _.filter(healers, (h) => !h.memory.escorting);
        if (healersNotEscorting.length > 0) {
            _.forEach(creeps, (creep) => {
                var closest = Utilities.objectsClosestToObj(healersNotEscorting, creep),
                    task;
                if (closest[0].pos.getRangeTo(creep) > 2) {
                    task = new TaskRally(closest[0].id);
                    if (task.canAssign(creep)) {
                        creep.memory.currentTask.priority = Game.time;
                    }
                }
            });
        }
    }
    /**
     * Assign creeps to stomp out hostile construction sites.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {ConstructionSite[]} sites 
     * @param {string} say Text to say on successful assignment.
     */
    static stomp(creeps, sites, say) {
        if (!sites || sites.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            if (new TaskRally(Utilities.objectsClosestToObj(sites, creep)[0]).canAssign(creep)) {
                creep.memory.currentTask.priority = Game.time;
                creep.say(say);
            }
        });
    }
    /**
     * Assigns a task from a list to each creep.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {object[]} tasks The tasks to assign.
     * @param {bool} multiAssign Assign the task to more than one creep.
     * @param {string} say Text to say on successful assignment.
     */
    static tasks(creeps, tasks, multiAssign, say) {
        _.forEach(tasks, (task) => {
            _.forEach(creeps, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say(say);
                }
                return multiAssign;
            });
        });
    }
}

if (Memory.profiling) {
    __require(1,54).registerObject(Assign, "Assign");
}
module.exports = Assign;

return module.exports;
}
/********** End of module 54: ../src/assign.js **********/
/********** Start module 55: ../src/pathing.js **********/
__modules[55] = function(module, exports) {
const direction = {
    1: {dx: 0, dy: -1},
    2: {dx: 1, dy: -1},
    3: {dx: 1, dy: 0},
    4: {dx: 1, dy: 1},
    5: {dx: 0, dy: 1},
    6: {dx: -1, dy: 1},
    7: {dx: -1, dy: 0},
    8: {dx: -1, dy: -1}
};

var Cache = __require(3,55),
    Segment = __require(56,55);

class Pathing {
    static moveTo(creep, pos, range) {
        var pathing = creep.memory._pathing,
            restartOn = [],
            creepPos = creep.pos,
            creepX = creepPos.x,
            creepY = creepPos.y,
            creepRoom = creepPos.roomName,
            tick = Game.time,
            posX, posY, posRoom, wasStationary, firstPos, multiplier, path, key;

        if (pos instanceof RoomObject) {
            pos = pos.pos;
        }
        
        posX = pos.x;
        posY = pos.y;
        posRoom = pos.roomName;
        if (!range) {
            range = 0;
        }
        if (creepPos.getRangeTo(pos) <= range) {
            return;
        }

        if (pathing) {
            if (pathing.dest.x !== posX || pathing.dest.y !== posY || pathing.dest.room !== posRoom) {
                delete creep.memory._pathing;
                pathing = undefined;
            }
        }
        if (pathing && pathing.restartOn && pathing.restartOn.indexOf(creepRoom) !== -1) {
            delete pathing.path;
            delete pathing.restartOn;
        }
        if (pathing) {
            wasStationary = creepX === pathing.start.x && creepY === pathing.start.y && creepRoom === pathing.start.room || (Math.abs(creepX - pathing.start.x) === 49 || Math.abs(creepY - pathing.start.y) === 49) && creepRoom !== pathing.start.room;
            
            pathing.stationary = wasStationary ? pathing.stationary + 1 : 0;

            if (pathing.stationary >= 2) {
                if (pathing.path && pathing.path.length > 0) {
                    let dir = direction[+pathing.path[0]];
                    
                    firstPos = {
                        x: creepX + dir.dx,
                        y: creepY + dir.dy,
                        room: creepRoom,
                        blockedUntil: tick + 12
                    };

                    if (firstPos.x !== creepX || firstPos.y !== creepY) {
                        if (!pathing.blocked) {
                            pathing.blocked = [];
                        }
                        pathing.blocked.push(firstPos);
                    }
                }

                pathing.stationary = 0;
                
                delete pathing.path;
                delete pathing.restartOn;
            } else if (pathing.path && !wasStationary) {
                if (pathing.path.length === 1) {
                    delete creep.memory._pathing;
                    pathing = undefined;
                } else {
                    pathing.start = {
                        x: creepX,
                        y: creepY,
                        room: creepRoom
                    };
                    pathing.path = pathing.path.substring(1);
                }
            }
        }
        if (!pathing || !pathing.path) {
            let moveParts = creep.getActiveBodyparts(MOVE),
                paths = new Segment(4);
            multiplier = 1 + (_.filter(creep.body, (b) => b.hits > 0 && [MOVE, CARRY].indexOf(b.type) === -1).length + Math.ceil(_.sum(creep.carry) / 50) - moveParts) / moveParts;
            if (pathing && pathing.blocked) {
                _.remove(pathing.blocked, (b) => b.blockedUntil <= tick);
            }

            key = `${creepRoom}.${creepX}.${creepY}.${posRoom}.${posX}.${posY}.${range}.${multiplier <= 1 ? 0 : 1}`;

            if ((!pathing || pathing.blocked.length === 0) && Memory.paths[key]) {
                if (pathing) {
                    pathing.path = Memory.paths[key][0];
                    pathing.restartOn = Memory.paths[key][1];
                } else {
                    pathing = {
                        start: {
                            x: creepX,
                            y: creepY,
                            room: creepRoom
                        },
                        dest: {
                            x: posX,
                            y: posY,
                            room: posRoom
                        },
                        path: Memory.paths[key][0],
                        stationary: 0,
                        blocked: [],
                        restartOn: Memory.paths[key][1]
                    };
                }
                Memory.paths[key][3] = tick;
            } else {
                path = PathFinder.search(creepPos, {pos: pos, range: range}, {
                    plainCost: Math.ceil(1 * multiplier),
                    swampCost: Math.ceil(5 * multiplier),
                    maxOps: creepRoom === posRoom ? 2000 : 100000,
                    roomCallback: (roomName) => {
                        var room = Game.rooms[roomName],
                            matrix;
                        if (creepRoom !== roomName && (Memory.avoidRooms.indexOf(roomName) !== -1 || creepRoom === posRoom && roomName !== posRoom && !creep.memory.role.startsWith("remote") && !creep.memory.role.startsWith("army"))) {
                            return false;
                        }

                        if (!room) {
                            restartOn.push(roomName);
                            return;
                        }

                        matrix = Cache.costMatrixForRoom(room);

                        if (pathing && roomName === creepRoom) {
                            _.forEach(pathing.blocked, (blocked) => {
                                if (roomName === blocked.room && tick < blocked.blockedUntil) {
                                    matrix.set(blocked.x, blocked.y, 255);
                                }
                            });
                        }

                        return matrix;
                    }
                });

                if (!path.path || path.path.length === 0) {
                    return;
                }
                if (pathing) {
                    pathing.path = this.serializePath(creepPos, path.path);
                    pathing.restartOn = restartOn;
                } else {
                    pathing = {
                        start: {
                            x: creepX,
                            y: creepY,
                            room: creepRoom
                        },
                        dest: {
                            x: posX,
                            y: posY,
                            room: posRoom
                        },
                        path: this.serializePath(creepPos, path.path),
                        stationary: 0,
                        blocked: [],
                        restartOn: restartOn
                    };
                }
                if (pathing.blocked.length === 0 && pathing.path.length > 10) {
                    Memory.paths[key] = [pathing.path, [], tick, tick];
                    if (restartOn && restartOn.length > 0) {
                        Memory.paths[key][1] = restartOn;
                    }
                    /*
                    paths.memory[key] = [pathing.path, [], tick, tick];
                    if (restartOn && restartOn.length > 0) {
                        paths.memory[key][1] = restartOn;
                    }
                    */
                }
            }
        }
        if (creep.move(+pathing.path[0]) !== OK) {
            pathing.stationary -= 1;
        }

        creep.memory._pathing = pathing;
    }

    static serializePath(start, path) {
        return _.map(path, (pos, index) => {
            var startPos;

            if (index === 0) {
                startPos = start;
            } else {
                startPos = path[index - 1];
            }

            switch (pos.x - startPos.x) {
                case 0:
                case -49:
                case 49:
                    switch (pos.y - startPos.y) {
                        case 0:
                        case -49:
                        case 49:
                            return "";
                        case 1:
                        case -48:
                            return BOTTOM.toString();
                        case -1:
                        case 48:
                            return TOP.toString();
                    }
                    break;
                case 1:
                case -48:
                    switch (pos.y - startPos.y) {
                        case 0:
                        case -49:
                        case 49:
                            return RIGHT.toString();
                        case 1:
                        case -48:
                            return BOTTOM_RIGHT.toString();
                        case -1:
                        case 48:
                            return TOP_RIGHT.toString();
                    }
                    break;
                case -1:
                case 48:
                    switch (pos.y - startPos.y) {
                        case 0:
                        case -49:
                        case 49:
                            return LEFT.toString();
                        case 1:
                        case -48:
                            return BOTTOM_LEFT.toString();
                        case -1:
                        case 48:
                            return TOP_LEFT.toString();
                    }
                    break;
            }
        }).join("");
    }
}

if (Memory.profiling) {
    __require(1,55).registerObject(Pathing, "Pathing");
}
module.exports = Pathing;

return module.exports;
}
/********** End of module 55: ../src/pathing.js **********/
/********** Start module 56: ../src/segment.js **********/
__modules[56] = function(module, exports) {
var memory = [];

class Segment {
    constructor(id) {
        this.id = id;
        
        if (!memory[id]) {
            try {
                memory[id] = JSON.parse(RawMemory.segments[id]);
            } catch (e) {
                memory[id] = undefined;
            }
        }
    }
    
    static init() {
        RawMemory.setActiveSegments([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
    
    get memory() {
        return memory[this.id];
    }
    
    set memory(value) {
        memory[this.id] = value;
    }
    
    set() {
        RawMemory.segments[this.id] = JSON.stringify(memory[this.id]);
    }
}

if (Memory.profiling) {
    __require(1,56).registerObject(Segment, "Segment");
}
module.exports = Segment;

return module.exports;
}
/********** End of module 56: ../src/segment.js **********/
/********** Footer **********/
if(typeof module === "object")
	module.exports = __require(0);
else
	return __require(0);
})();
/********** End of footer **********/
