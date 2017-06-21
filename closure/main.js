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
/********** Start module 0: /home/ubuntu/workspace/src/main.js **********/
__modules[0] = function(module, exports) {
const profiler = __require(1,0),
    Army = __require(2,0),
    Cache = __require(3,0),
    Commands = __require(4,0),
    Drawing = __require(5,0),
    Market = __require(6,0),
    Minerals = __require(7,0),
    Tower = __require(8,0),
    Utilities = __require(9,0),
    RoleArmyDismantler = __require(10,0),
    RoleArmyHealer = __require(11,0),
    RoleArmyMelee = __require(12,0),
    RoleArmyRanged = __require(13,0),
    RoleClaimer = __require(14,0),
    RoleCollector = __require(15,0),
    RoleDefender = __require(16,0),
    RoleDismantler = __require(17,0),
    RoleDowngrader = __require(18,0),
    RoleHealer = __require(19,0),
    RoleMiner = __require(20,0),
    RoleRemoteBuilder = __require(21,0),
    RoleRemoteCollector = __require(22,0),
    RoleRemoteDismantler = __require(23,0),
    RoleRemoteMiner = __require(24,0),
    RoleRemoteReserver = __require(25,0),
    RoleRemoteStorer = __require(26,0),
    RoleRemoteWorker = __require(27,0),
    RoleScientist = __require(28,0),
    RoleStorer = __require(29,0),
    RoleUpgrader = __require(30,0),
    RoleWorker = __require(31,0),
    RoomBase = __require(32,0),
    RoomCleanup = __require(33,0),
    RoomMine = __require(34,0),
    RoomSource = __require(35,0),
    TaskBuild = __require(36,0),
    TaskClaim = __require(37,0),
    TaskCollectEnergy = __require(38,0),
    TaskCollectMinerals = __require(39,0),
    TaskDismantle = __require(40,0),
    TaskDowngrade = __require(41,0),
    TaskFillEnergy = __require(42,0),
    TaskFillMinerals = __require(43,0),
    TaskFlee = __require(44,0),
    TaskHarvest = __require(45,0),
    TaskHeal = __require(46,0),
    TaskMeleeAttack = __require(47,0),
    TaskMine = __require(48,0),
    TaskPickupResource = __require(49,0),
    TaskRally = __require(50,0),
    TaskRangedAttack = __require(51,0),
    TaskRepair = __require(52,0),
    TaskReserve = __require(53,0),
    TaskSuicide = __require(54,0),
    TaskUpgradeController = __require(55,0);
/**
 * A class representing the main entry point of the scripts.
 */
class Main {
    /**
     * The main loop that runs every tick.
     * @return {void}
     */
    static loop() {
        const {cpu: gameCpu} = Game,
            {bucket} = gameCpu;

        if (bucket < gameCpu.tickLimit) {
            Game.notify(`Bucket at ${bucket.toFixed(0)}, aborting! ${Game.time.toFixed(0)}`);

            return;
        }

        const loop = () => {
            this.init();
            this.minerals();
            this.baseMatrixes();
            this.deserializeCreeps();
            this.deserializeRooms();
            this.deserializeArmies();
            this.balanceEnergy();
            this.rooms();
            this.army();
            this.creeps();

            if (Memory.debug) {
                this.debug();
            }

            if (Memory.visualizations) {
                this.drawGlobal();
            }

            this.finalize();
        };

        if (Memory.profiling) {
            profiler.wrap(loop);
        } else {
            loop();
        }
    }
    /**
     * Initializes the script.
     * @return {void}
     */
    static init() {
        const generationTick = Game.time % 1500;
        Cache.reset();
        if (!this.reset) {
            this.reset = true;
        }
        if (Cache.credits < Memory.minimumCredits) {
            delete Memory.buy;
        }

        if (Cache.credits >= Memory.minimumCredits * 1.5) {
            Memory.buy = true;
        }
        Game.cmd = {
            Army,
            Cache,
            Commands,
            Market,
            Minerals,
            RoleArmyDismantler,
            RoleArmyHealer,
            RoleArmyMelee,
            RoleArmyRanged,
            RoleClaimer,
            RoleCollector,
            RoleDefender,
            RoleDismantler,
            RoleDowngrader,
            RoleHealer,
            RoleMiner,
            RoleRemoteBuilder,
            RoleRemoteCollector,
            RoleRemoteDismantler,
            RoleRemoteMiner,
            RoleRemoteReserver,
            RoleRemoteStorer,
            RoleRemoteWorker,
            RoleScientist,
            RoleStorer,
            RoleUpgrader,
            RoleWorker,
            RoomBase,
            RoomCleanup,
            RoomMine,
            RoomSource,
            Tower,
            Utilities
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
        if (!Memory.ranges) {
            Memory.ranges = {};
        }

        if (!Memory.lengthToController) {
            Memory.lengthToController = {};
        }
        if (!Memory.lengthToContainer) {
            Memory.lengthToContainer = {};
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
     * @return {void}
     */
    static minerals() {
        const mineralOrders = {};

        if (Game.time % 10 === 0 || Game.cpu.bucket >= Memory.marketBucket) {
            Memory.mineralPrices = [
                {resource: RESOURCE_HYDROGEN, amount: 15000, priority: 1},
                {resource: RESOURCE_OXYGEN, amount: 15000, priority: 1},
                {resource: RESOURCE_ZYNTHIUM, amount: 15000, priority: 1},
                {resource: RESOURCE_KEANIUM, amount: 15000, priority: 1},
                {resource: RESOURCE_UTRIUM, amount: 15000, priority: 1},
                {resource: RESOURCE_LEMERGIUM, amount: 15000, priority: 1},
                {resource: RESOURCE_CATALYST, amount: 15000, priority: 1},
                {resource: RESOURCE_HYDROXIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_ZYNTHIUM_KEANITE, amount: 15000, priority: 1},
                {resource: RESOURCE_UTRIUM_LEMERGITE, amount: 15000, priority: 1},
                {resource: RESOURCE_GHODIUM, amount: 15000, priority: 1},
                {resource: RESOURCE_UTRIUM_HYDRIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_KEANIUM_OXIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_LEMERGIUM_HYDRIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_LEMERGIUM_OXIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_ZYNTHIUM_HYDRIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_ZYNTHIUM_OXIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_GHODIUM_HYDRIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_GHODIUM_OXIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_UTRIUM_ACID, amount: 15000, priority: 1},
                {resource: RESOURCE_KEANIUM_ALKALIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_LEMERGIUM_ACID, amount: 15000, priority: 1},
                {resource: RESOURCE_LEMERGIUM_ALKALIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_ZYNTHIUM_ACID, amount: 15000, priority: 1},
                {resource: RESOURCE_ZYNTHIUM_ALKALIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_GHODIUM_ACID, amount: 15000, priority: 1},
                {resource: RESOURCE_GHODIUM_ALKALIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_CATALYZED_UTRIUM_ACID, amount: 15000, priority: 1},
                {resource: RESOURCE_CATALYZED_KEANIUM_ALKALIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_CATALYZED_LEMERGIUM_ACID, amount: 15000, priority: 1},
                {resource: RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_CATALYZED_ZYNTHIUM_ACID, amount: 15000, priority: 1},
                {resource: RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_CATALYZED_GHODIUM_ACID, amount: 15000, priority: 1},
                {resource: RESOURCE_CATALYZED_GHODIUM_ALKALIDE, amount: 15000, priority: 1},
                {resource: RESOURCE_POWER, amount: 15000, priority: 2}
            ];

            Memory.reserveMinerals = {};

            const {reserveMinerals, mineralPrices: minerals} = Memory;
            _.forEach(minerals, (mineral) => {
                ({amount: reserveMinerals[mineral.resource]} = mineral);
            });
            _.forEach(_.uniq(_.map(Market.getAllOrders(), (o) => o.resourceType)), (resource) => {
                const {0: sellOrder} = Market.getFilteredOrders().sell[resource] || [],
                    mineral = _.find(minerals, (m) => m.resource === resource);

                mineralOrders[resource] = sellOrder ? sellOrder.price : Infinity;

                if (mineral) {
                    ({[resource]: mineral.marketPrice} = mineralOrders);
                }
            });
            _.forEach(minerals, (mineral) => {
                const {resource} = mineral,
                    {[resource]: mineralResource} = Minerals;

                if (!mineralResource || mineralResource.length === 0) {
                    ({[resource]: mineral.value} = mineralOrders);

                } else {
                    mineral.value = _.sum(_.map(mineralResource, (r) => mineralOrders[r] || Infinity)) * 1.2;
                    ({value: mineralOrders[resource]} = mineral);
                }
            });
            _.forEach(_.filter(Game.rooms, (r) => {
                const {memory: {roomType}} = r;

                return roomType && roomType.type === "base";
            }), (room) => {
                const {name: roomName, memory, storage, terminal} = room,
                    {creeps: {[roomName]: creeps}} = Cache,
                    allCreepsInRoom = creeps && creeps.all,
                    labs = Cache.labsInRoom(room);

                if (!storage || !storage.my || !terminal || !terminal.my || labs.length < 3) {
                    return;
                }

                const {store: storageStore} = storage,
                    {store: terminalStore} = terminal,
                    roomMinerals = _.cloneDeep(minerals);
                _.forEach(roomMinerals, (mineral) => {
                    const {resource} = mineral;

                    mineral.amountInRoom = (storageStore[resource] || 0) + (terminalStore[resource] || 0) + _.sum(allCreepsInRoom, (c) => c.carry[resource] || 0) + _.sum(labs, (l) => l.mineralType === resource ? l.mineralAmount : 0);
                });
                const mostNeededMineralsToBuy = _.filter(roomMinerals, (m) => m.marketPrice !== Infinity && m.value !== Infinity && m.marketPrice <= m.value).sort((a, b) => {
                    const priority = a.priority - b.priority;

                    if (priority) {
                        return priority;
                    }

                    return b.amount - b.amountInRoom - (a.amount - a.amountInRoom);
                });

                if (mostNeededMineralsToBuy.length === 0) {
                    delete memory.buyQueue;
                } else {
                    const {0: mineral} = mostNeededMineralsToBuy;

                    memory.buyQueue = {
                        resource: mineral.resource,
                        amount: mineral.amount - mineral.amountInRoom,
                        price: mineral.marketPrice,
                        start: Game.time
                    };
                }
                if (!memory.labQueue) {
                    const mineralsToCreate = _.filter(roomMinerals, (m) => {
                        const {resource} = m,
                            {[resource]: mineralResource} = Minerals;

                        if ((memory.buyQueue || !Memory.buy) && memory.buyQueue.resource === resource || !mineralResource || mineralResource.length === 0) {
                            return false;
                        }

                        const mineral0 = _.find(roomMinerals, (rm) => rm.resource === mineralResource[0]),
                            mineral1 = _.find(roomMinerals, (rm) => rm.resource === mineralResource[1]);

                        return m.amountInRoom < m.amount && mineral0 && mineral1 && mineral0.amountInRoom >= 5 && mineral1.amountInRoom >= 5;
                    }).sort((a, b) => b.amount - b.amountInRoom - (a.amount - a.amountInRoom));

                    if (mineralsToCreate.length > 0) {
                        const {0: mineralToCreate, 0: {resource}} = mineralsToCreate,
                            {[resource]: mineralResource} = Minerals;

                        memory.labQueue = {
                            resource,
                            amount: Math.min(5 * Math.floor(Math.min(Math.min(Math.min(mineralToCreate.amount - Math.floor(mineralToCreate.amountInRoom / 5) * 5, _.find(roomMinerals, (rm) => rm.resource === mineralResource[0]).amountInRoom), _.find(roomMinerals, (rm) => rm.resource === mineralResource[1]).amountInRoom), LAB_MINERAL_CAPACITY) / 5), LAB_MINERAL_CAPACITY),
                            children: mineralResource,
                            start: Game.time
                        };
                    }
                }
            });
        }
    }
    /**
     * Creates defensive CostMatrixes for base rooms that need them.
     * @return {void}
     */
    static baseMatrixes() {
        if (!Memory.baseMatrixes) {
            Memory.baseMatrixes = {};
        }

        _.forEach(Memory.baseMatrixes, (matrix, roomName) => {
            const {rooms: {[roomName]: room}} = Game;

            if (!room || room.unobservable || matrix.status === "complete" || Cache.spawnsInRoom(room).length === 0) {
                return true;
            }
            const repairableStructuresInRoom = Cache.repairableStructuresInRoom(room);

            if (!matrix.status) {
                const costMatrix = new PathFinder.CostMatrix();

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
                const {0: firstSpawn} = Cache.spawnsInRoom(room),
                    tempMatrix = PathFinder.CostMatrix.deserialize(matrix.tempMatrix),
                    costMatrix = PathFinder.CostMatrix.deserialize(matrix.costMatrix);

                for (; matrix.x < 50; matrix.x++) {
                    for (; matrix.y < 50; matrix.y++) {
                        if (Game.cpu.getUsed() >= 250) {
                            matrix.costMatrix = costMatrix.serialize();

                            return false;
                        }

                        if (PathFinder.search(new RoomPosition(matrix.x, matrix.y, roomName), {pos: firstSpawn.pos, range: 1}, {
                            roomCallback: () => tempMatrix,
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

            return true;
        });
    }
    /**
     * Deserialies creep tasks from memory into task objects.
     * @return {void}
     */
    static deserializeCreeps() {
        const {creepTasks} = Cache;
        _.forEach(Game.creeps, (creep) => {
            if (creep.memory.currentTask) {
                switch (creep.memory.currentTask.type) {
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
                    case "downgrade":
                        creepTasks[creep.name] = TaskDowngrade.fromObj(creep);
                        break;
                    case "fillEnergy":
                        creepTasks[creep.name] = TaskFillEnergy.fromObj(creep);
                        break;
                    case "fillMinerals":
                        creepTasks[creep.name] = TaskFillMinerals.fromObj(creep);
                        break;
                    case "flee":
                        creepTasks[creep.name] = TaskFlee.fromObj(creep);
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
                    case "suicide":
                        creepTasks[creep.name] = TaskSuicide.fromObj(creep);
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
     * @return {void}
     */
    static deserializeRooms() {
        const {rooms} = Cache,
            unobservableRooms = {};
        _.forEach(Memory.rooms, (roomMemory, name) => {
            if (!Game.rooms[name]) {
                unobservableRooms[name] = {
                    name,
                    unobservable: true,
                    memory: roomMemory
                };
            }

            if (roomMemory.roomType) {
                switch (roomMemory.roomType.type) {
                    case "base":
                        rooms[name] = RoomBase.fromObj(Game.rooms[name] || unobservableRooms[name]);
                        break;
                    case "cleanup":
                        rooms[name] = RoomCleanup.fromObj(Game.rooms[name] || unobservableRooms[name]);
                        break;
                    case "mine":
                        rooms[name] = RoomMine.fromObj(Game.rooms[name] || unobservableRooms[name]);
                        break;
                    case "source":
                        rooms[name] = RoomSource.fromObj(Game.rooms[name] || unobservableRooms[name]);
                        break;
                }
            }
        });

        this.unobservableRooms = _.values(unobservableRooms);
    }
    /**
     * Deserializes armies from memory into army objects.
     * @return {void}
     */
    static deserializeArmies() {
        const {armies} = Cache;

        _.forEach(Memory.army, (army, armyName) => {
            armies[armyName] = Army.fromObj(armyName, army);
        });
    }
    /**
     * Balance energy between rooms with terminals.
     * @return {void}
     */
    static balanceEnergy() {
        const rooms = _.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.storage && r.storage.my && r.terminal && r.terminal.my).sort((a, b) => a.storage.store[RESOURCE_ENERGY] + a.terminal.store[RESOURCE_ENERGY] - (b.storage.store[RESOURCE_ENERGY] + b.terminal.store[RESOURCE_ENERGY]));
        let energyGoal;

        if (rooms.length > 1) {
            energyGoal = Math.min(_.sum(_.map(rooms, (r) => r.storage.store[RESOURCE_ENERGY] + r.terminal.store[RESOURCE_ENERGY])) / rooms.length, 500000);
            _.forEach(rooms, (room, index) => {
                const {[rooms.length - index - 1]: otherRoom} = rooms,
                    {name: otherRoomName, storage: {store: {[RESOURCE_ENERGY]: otherRoomStorageEnergy}}, terminal: otherRoomTerminal, terminal: {store: {[RESOURCE_ENERGY]: otherRoomTerminalEnergy}}} = otherRoom,
                    {name: roomName, storage: {store: {[RESOURCE_ENERGY]: roomStorageEnergy}}} = room;
                let transCost;

                if (otherRoomTerminal.cooldown > 0) {
                    return true;
                }

                if (roomStorageEnergy >= otherRoomStorageEnergy || roomStorageEnergy + room.terminal.store[RESOURCE_ENERGY] > energyGoal || otherRoomStorageEnergy + otherRoomTerminalEnergy < energyGoal + 10000) {
                    return false;
                }

                if (otherRoomTerminalEnergy >= 1000) {
                    transCost = Game.market.calcTransactionCost(otherRoomTerminalEnergy, otherRoomName, roomName);

                    otherRoomTerminal.send(RESOURCE_ENERGY, Math.floor(otherRoomTerminalEnergy * (otherRoomTerminalEnergy / (otherRoomTerminalEnergy + transCost))), roomName);
                }

                return true;
            });
        }
    }
    /**
     * Process game rooms.
     * @return {void}
     */
    static rooms() {
        const roomOrder = ["base", "source", "mine", "cleanup", ""],
            {rooms: memoryRooms} = Memory;

        ({name: Memory.rushRoom} = _.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.controller && r.controller.level < 8).sort((a, b) => b.controller.level - a.controller.level || b.controller.progress - a.controller.progress)[0] || {name: ""});
        _.forEach(Array.prototype.concat.apply([], [_.filter(Game.rooms), this.unobservableRooms]).sort((a, b) => roomOrder.indexOf(memoryRooms[a.name] && memoryRooms[a.name].roomType && memoryRooms[a.name].roomType.type || "") - roomOrder.indexOf(memoryRooms[b.name] && memoryRooms[b.name].roomType && memoryRooms[b.name].roomType.type || "")), (room) => {
            const {name: roomName} = room,
                {rooms: {[roomName]: rooms}} = Cache,
                {[roomName]: roomMemory} = memoryRooms;

            if (rooms && roomMemory && roomMemory.roomType) {
                const {roomType: {type}} = roomMemory;
                if (Game.cpu.bucket >= 9700 || Game.time % 2 || type !== "base" || Cache.hostilesInRoom(room).length > 0) {
                    rooms.run();
                }

                if (type === rooms.type) {
                    rooms.toObj();
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
     * @return {void}
     */
    static drawRoom(room) {
        let {visual} = room,
            x, y;

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

        const towers = Cache.towersInRoom(room);

        if (towers.length > 0) {
            y += 0.7;
            visual.text("Towers", -0.5, y, {align: "left", font: "0.5 Arial"});
            Drawing.progressBar(visual, 2.5, y - 0.425, 5, 0.5, _.sum(_.map(towers, (t) => t.energy)), _.sum(_.map(towers, (t) => t.energyCapacity)), {background: "#808080", bar: "#00ff00", showDetails: false, color: "#ffffff", font: "0.5 Arial"});
        }

        const labs = Cache.labsInRoom(room);

        if (labs.length > 0) {
            y += 0.7;
            visual.text("Labs", -0.5, y, {align: "left", font: "0.5 Arial"});
            Drawing.progressBar(visual, 2.5, y - 0.425, 5, 0.5, _.sum(_.map(labs, (t) => t.energy)), _.sum(_.map(labs, (t) => t.energyCapacity)), {background: "#808080", bar: "#00ff00", showDetails: false, color: "#ffffff", font: "0.5 Arial"});
        }

        const nukers = Cache.nukersInRoom(room);

        if (nukers.length > 0) {
            y += 0.7;
            visual.text("Nuker", -0.5, y, {align: "left", font: "0.5 Arial"});
            Drawing.progressBar(visual, 2.5, y - 0.425, 5, 0.5, _.sum(_.map(nukers, (t) => t.energy)), _.sum(_.map(nukers, (t) => t.energyCapacity)), {background: "#808080", bar: "#00ff00", showDetails: false, color: "#ffffff", font: "0.5 Arial"});
            Drawing.progressBar(visual, 8.5, y - 0.425, 5, 0.5, _.sum(_.map(nukers, (t) => t.ghodium)), _.sum(_.map(nukers, (t) => t.ghodiumCapacity)), {background: "#808080", bar: "#ffff00", showDetails: false, color: "#ffffff", font: "0.5 Arial"});
        }

        const powerSpawns = Cache.powerSpawnsInRoom(room);

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
     * @return {void}
     */
    static army() {
        _.forEach(Cache.armies, (army) => {
            army.run();

            army.toObj();
        });
    }
    /**
     * Process creep tasks.
     * @return {void}
     */
    static creeps() {
        const {time} = Game;
        _.forEach(Game.creeps, (creep) => {
            if (creep.spawning || creep.memory.stop) {
                return;
            }

            const {ticksToLive: ttl, memory: creepMemory, room: {name: creepRoom}} = creep,
                {army} = creepMemory,
                {creepTasks: {[creep.name]: creepTask}} = Cache;
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

            if (creepMemory.currentTask && creepTask) {
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
                creepTask.run(creep);
                if (creepMemory.lastRoom && creepMemory.lastRoom !== creepRoom && (!creepTask || !creepTask.force)) {
                    delete creepMemory.currentTask;
                }
                creepMemory.lastRoom = creepRoom;
                if (creepMemory.currentTask && creepTask && creepMemory.currentTask.type === creepTask.type) {
                    creepTask.toObj(creep);
                }
                if (creep.carry[RESOURCE_ENERGY] > 0 && creep.getActiveBodyparts(WORK) > 0) {
                    _.forEach(_.filter(creep.pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax), (structure) => {
                        creep.repair(structure);
                    });
                }
                if (!creep.spawning && ttl < 150 && _.sum(creep.carry) === 0 && (!creepMemory.currentTask || creepMemory.currentTask.type === "rally") && ["armyDismantler", "armyHealer", "armyMelee", "armyRanged", "claimer", "downgrader", "defender", "healer", "remoteReserver"].indexOf(creep.memory.role) === -1) {
                    creep.suicide();
                }
            } else {
                delete creepMemory.currentTask;
                if (!creep.spawning && ttl < 150 && _.sum(creep.carry) === 0 && ["armyDismantler", "armyHealer", "armyMelee", "armyRanged", "claimer", "downgrader", "defender", "healer", "remoteReserver"].indexOf(creepMemory.role) === -1) {
                    creep.suicide();
                } else {
                    creep.say("Idle");
                }
            }
        });
    }
    /**
     * Show each creep name, role, and current task in their respective RoomVisual.
     * @return {void}
     */
    static debug() {
        _.forEach(Game.creeps, (creep) => {
            const {memory: creepMemory} = creep;

            creep.room.visual
                .text(creep.name, creep.pos.x, creep.pos.y + 1, {align: "center", font: "0.5 Arial"})
                .text(creepMemory.role, creep.pos.x, creep.pos.y + 1.5, {align: "center", font: "0.5 Arial"})
                .text(creepMemory.currentTask ? creepMemory.currentTask.type : "", creep.pos.x, creep.pos.y + 2, {align: "center", font: "0.5 Arial"});
        });
    }
    /**
     * Draw information onto the global visual.
     * @return {void}
     */
    static drawGlobal() {
        let y;
        Cache.globalVisual.text(`GCL ${Game.gcl.level}`, -0.5, 0.025, {align: "left", font: "0.5 Arial"});
        Drawing.progressBar(Cache.globalVisual, 2.5, -0.4, 20, 0.5, Game.gcl.progress, Game.gcl.progressTotal, {background: "#808080", bar: "#00ff00", showDetails: true, color: "#ffffff", font: "0.5 Arial"});
        Drawing.progressBar(Cache.globalVisual, 34.5, -0.4, 10, 0.5, Game.cpu.bucket, 10000, {label: "Bucket", background: "#808080", showMax: false, bar: Game.cpu.bucket >= 9990 ? "#00ffff" : Game.cpu.bucket >= 9000 ? "#00ff00" : Game.cpu.bucket >= 5000 ? "#cccc00" : "#ff0000", color: "#ffffff", font: "0.5 Arial"});
        Cache.globalVisual.text(`Tick ${Game.time}`, 49.5, 0.025, {align: "right", font: "0.5 Arial"})
            .text(Cache.time, 49.5, 0.725, {align: "right", font: "0.5 Arial"});
        Cache.globalVisual.text(`Credits ${Game.market.credits.toFixed(2)}`, -0.5, 0.725, {align: "left", font: "0.5 Arial"});
        Cache.globalVisual.text(`Creeps ${Object.keys(Game.creeps).length}`, -0.5, 1.425, {align: "left", font: "0.5 Arial"});
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
        Memory.stats.cpu[Memory.stats.cpu.length - 1] = Game.cpu.getUsed();
        Drawing.progressBar(Cache.globalVisual, 23.5, -0.4, 10, 0.5, Game.cpu.getUsed(), Game.cpu.limit, {label: "CPU", background: "#808080", valueDecimals: 2, bar: Game.cpu.getUsed() > Game.cpu.limit ? "#ff0000" : "#00ff00", color: "#ffffff", font: "0.5 Arial"});
    }
    /**
     * Finalize log data and write it to memory.
     * @return {void}
     */
    static finalize() {
    }
}
if (Memory.profiling) {
    profiler.registerObject(Main, "Main");
    profiler.enable();
}

module.exports = Main;

return module.exports;
}
/********** End of module 0: /home/ubuntu/workspace/src/main.js **********/
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
    const header = 'calls\t\ttime\t\tavg\t\tmax\t\tfunction';
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
        averageTime: functionCalls.time / functionCalls.calls,
        maxTime: functionCalls.maxTime
      };
    }).sort((val1, val2) => {
      return val2.totalTime - val1.totalTime;
    });

    const lines = stats.map(data => {
      return [
        data.calls,
        data.totalTime.toFixed(1),
        data.averageTime.toFixed(3),
        data.maxTime.toFixed(3),
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
        calls: 0,
        maxTime: 0
      };
    }
    Memory.profiler.map[functionName].calls++;
    Memory.profiler.map[functionName].time += time;
    Memory.profiler.map[functionName].maxTime = Math.max(Memory.profiler.map[functionName].maxTime, time);
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
    Utilities = __require(9,2),
    RoleArmyDismantler = __require(10,2),
    RoleArmyHealer = __require(11,2),
    RoleArmyMelee = __require(12,2),
    RoleArmyRanged = __require(13,2);
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
     * @return {void}
     */
    run() {
        const {name, dismantler, healer, melee, ranged} = this,
            allCreepsInArmy = Cache.creeps[name] && Cache.creeps[name].all || [],
            {rooms: {[this.attackRoom]: attackRoom}} = Game;
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
            ({safeMode: {stageRoom: this.stageRoom, attackRoom: this.attackRoom, dismantle: this.dismantle, safeMode: this.safeMode}} = this);
        }
        if (this.directive === "preparing") {
            const {boostRoom: boostRoomName} = this;

            if (boostRoomName) {
                const {rooms: {[boostRoomName]: boostedRoom}} = Game,
                    {storage: {store: boostRoomStorageStore}} = boostedRoom;

                if (!boostRoomStorageStore ||
                    (boostRoomStorageStore[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] || 0) >= 30 * 5 * (dismantler.maxCreeps + melee.maxCreeps + ranged.maxCreeps + healer.maxCreeps) &&
                    (boostRoomStorageStore[RESOURCE_CATALYZED_ZYNTHIUM_ACID] || 0) >= 30 * dismantler.units * dismantler.maxCreeps &&
                    (boostRoomStorageStore[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE] || 0) >= 30 * healer.units * healer.maxCreeps
                ) {
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
            this.hostileConstructionSites = Cache.hostileConstructionSitesInRoom(attackRoom);
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
            _.forEach(_.filter(Cache.creeps[name] && Cache.creeps[name].armyHealer || [], (c) => !c.memory.escorting && !c.spawning), (creep) => {
                const {0: escort} = Array.prototype.concat.apply([], [
                    dismantler.escort && Cache.creeps[name].armyDismantler ? _.filter(Cache.creeps[name].armyDismantler, (c) => (!c.memory.escortedBy || !Game.getObjectById(c.memory.escortedBy)) && !c.spawning) : [],
                    melee.escort && Cache.creeps[name].armyMelee ? _.filter(Cache.creeps[name].armyMelee, (c) => (!c.memory.escortedBy || !Game.getObjectById(c.memory.escortedBy)) && !c.spawning) : [],
                    ranged.escort && Cache.creeps[name].armyRanged ? _.filter(Cache.creeps[name].armyRanged, (c) => (!c.memory.escortedBy || !Game.getObjectById(c.memory.escortedBy)) && !c.spawning) : []
                ]);

                if (escort) {
                    ({id: creep.memory.escorting} = escort);
                    ({id: escort.memory.escortedBy} = creep);
                } else {
                    return false;
                }

                return true;
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
     * @return {void}
     */
    checkSpawn(role, max, successCallback) {
        const {name: armyName} = this,
            {length: count} = _.filter(Cache.creeps[armyName] && Cache.creeps[armyName][role] || [], (c) => c.spawning || c.ticksToLive > 300);

        if (count < max) {
            successCallback();
        }
        if (max > 0 || count > 0) {
        }
    }
    /**
     * Spawn a creep for this army from within the region.
     * @param {class} Role The class of the role to create the creep for.
     * @return {bool} Whether the creep was spawned.
     */
    spawnFromRegion(Role) {
        const settings = Role.spawnSettings(this),
            spawns = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(settings.body) && s.room.memory.region === this.region);
        let boostRoom, labsInUse, labsToBoostWith;
        if (spawns.length === 0) {
            return false;
        }
        if (this.boostRoom) {
            ({rooms: {[this.boostRoom]: boostRoom}} = Game);
            ({memory: {labsInUse}} = boostRoom);
            if (boostRoom && !(labsToBoostWith = Utilities.getLabToBoostWith(boostRoom, Object.keys(settings.boosts).length))) {
                return false;
            }
        }
        const name = spawns[0].createCreep(settings.body, `${settings.name}-${this.name}-${Game.time.toFixed(0).substring(4)}`, {role: settings.name, army: this.name, labs: boostRoom ? _.map(labsToBoostWith, (l) => l.id) : [], portals: this.portals});

        Cache.spawning[spawns[0].id] = typeof name !== "number";

        if (typeof name !== "number" && boostRoom) {
            let labIndex = 0;

            _.forEach(settings.boosts, (amount, resource) => {
                labsToBoostWith[labIndex].creepToBoost = name;
                labsToBoostWith[labIndex].resource = resource;
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
     * @return {void}
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
     * @return {void}
     */
    static reset() {
        this.extensions = {};
        this.hostileConstructionSites = {};
        this.hostiles = {};
        this.labs = {};
        this.spawns = {};
        this.resources = {};
        if (Game.time % 4 === 0 || !this.containers) {
            this.containers = {};
            this.costMatrixes = {};
            this.criticalRepairableStructures = {};
            this.extractors = {};
            this.links = {};
            this.nukers = {};
            this.portals = {};
            this.powerBanks = {};
            this.powerSpawns = {};
            this.repairableStructures = {};
            this.sortedRepairableStructures = {};
            this.sortedResources = {};
            this.sourceKeepers = {};
            this.towers = {};
        }
        this.armies = {};
        this.creepTasks = {};
        this.spawning = {};
        this.rooms = {};
        ({market: {credits: this.credits}} = Game);
        if (Memory.visualizations) {
            this.globalVisual = new RoomVisual();
            this.time = new Date()
                .toLocaleString("en-US", {timeZone: "America/Los_Angeles"})
                .replace(",", "");
        }
    }
    /**
     * Caches containers in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureContainer[]} The containers in the room.
     */
    static containersInRoom(room) {
        return this.containers[room.name] ? this.containers[room.name] : this.containers[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_CONTAINER});
    }
    /**
     * Caches the cost matrix for a room.
     * @param {Room} room The room to cache for.
     * @return {CostMatrix} The cost matrix for the room.
     */
    static costMatrixForRoom(room) {
        const {name: roomName} = room;

        if (!room || room.unobservable) {
            return new PathFinder.CostMatrix();
        }

        if (!this.costMatrixes[roomName]) {
            const matrix = new PathFinder.CostMatrix();

            _.forEach(room.find(FIND_STRUCTURES), (structure) => {
                const {pos} = structure;

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
                const {pos} = structure;

                matrix.set(pos.x, pos.y, Math.max(5, matrix.get(pos.x, pos.y)));
            });

            _.forEach(this.portalsInRoom(room), (structure) => {
                const {pos} = structure;

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
     * Caches critical repairable structures in a room.
     * @param {Room} room The room to cache for.
     * @return {Structure[]} The structures in need of critical repairs.
     */
    static criticalRepairableStructuresInRoom(room) {
        return this.criticalRepairableStructures[room.name] ? this.criticalRepairableStructures[room.name] : this.criticalRepairableStructures[room.name] = _.filter(this.sortedRepairableStructuresInRoom(room), (s) => s.hits < 125000 && s.hits / s.hitsMax < 0.5);
    }
    /**
     * Caches extensions in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureExtension[]} The extensions in the room.
     */
    static extensionsInRoom(room) {
        return this.extensions[room.name] ? this.extensions[room.name] : this.extensions[room.name] = room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_EXTENSION});
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
     * Caches hostile construction sites in a room.  Allies are excluded.
     * @param {Room} room The room to check for hostile construction sites in.
     * @return {ConstructionSite[]} The hostile construction sites in the room.
     */
    static hostileConstructionSitesInRoom(room) {
        return this.hostileConstructionSites[room.name] ? this.hostileConstructionSites[room.name] : this.hostileConstructionSites[room.name] = room.find(FIND_HOSTILE_CONSTRUCTION_SITES, {filter: (s) => !s.owner || Memory.allies.indexOf(s.owner.username) === -1});
    }
    /**
     * Caches hostiles in a room.  Allies are excluded.
     * @param {Room} room The room to cache for.
     * @return {Creep[]} The hostiles in the room.
     */
    static hostilesInRoom(room) {
        const {name: roomName} = room;

        if (this.hostiles[roomName]) {
            return this.hostiles[roomName];
        }

        if (!room || room.unobservable) {
            return [];
        }

        this.hostiles[roomName] = room.find(FIND_HOSTILE_CREEPS, {filter: (c) => !c.owner || Memory.allies.indexOf(c.owner.username) === -1});

        const {memory} = room,
            threat = _.groupBy(_.map(this.hostiles[roomName], (h) => ({
                id: h.id, threat: _.sum(h.body, (bodypart) => {
                    let threatValue;

                    switch (bodypart.type) {
                        case ATTACK:
                        case RANGED_ATTACK:
                        case HEAL:
                        case WORK:
                        case TOUGH:
                            ({[bodypart.type]: threatValue} = BODYPART_COST);
                            break;
                        default:
                            return 0;
                    }

                    const {[bodypart.type]: boosts} = BOOSTS;

                    if (bodypart.boost && boosts && boosts[bodypart.boost]) {
                        const {[bodypart.boost]: boost} = boosts;

                        switch (bodypart.type) {
                            case ATTACK:
                                if (boost.attack) {
                                    threatValue *= boost.attack;
                                }
                                break;
                            case RANGED_ATTACK:
                                if (boost.rangedAttack) {
                                    threatValue *= boost.rangedAttack;
                                }
                                break;
                            case HEAL:
                                if (boost.heal) {
                                    threatValue *= boost.heal;
                                }
                                break;
                            case WORK:
                                if (boost.dismantle) {
                                    threatValue *= boost.dismantle;
                                }
                                break;
                            case TOUGH:
                                if (boost.damage) {
                                    threatValue /= boost.damage;
                                }
                                break;
                        }
                    }

                    return threatValue;
                })
            })), (value) => value.id);

        memory.threat = _.sum(_.map(_.values(threat), (t) => t[0].threat));

        this.hostiles[roomName].sort((a, b) => threat[b.id].threat - threat[a.id].threat);

        if (memory) {
            if (!memory.hostiles) {
                memory.hostiles = [];
            }

            memory.hostiles = _.map(this.hostiles[roomName], (h) => h.id);
        }

        return this.hostiles[roomName];
    }
    /**
     * Caches labs in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureLab[]} The labs in the room.
     */
    static labsInRoom(room) {
        return this.labs[room.name] ? this.labs[room.name] : this.labs[room.name] = room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_LAB});
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
        return this.nukers[room.name] ? this.nukers[room.name] : this.nukers[room.name] = room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_NUKER});
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
        return this.powerSpawns[room.name] ? this.powerSpawns[room.name] : this.powerSpawns[room.name] = room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_POWER_SPAWN});
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
     * Caches resources in a room, sorted by whether it's a mineral and then by amount.
     * @param {Room} room The room to cache for.
     * @return {Resource[]} The resources in the room.
     */
    static sortedResourcesInRoom(room) {
        return this.sortedResources[room.name] ? this.sortedResources[room.name] : this.sortedResources[room.name] = room.find(FIND_DROPPED_RESOURCES).sort((a, b) => {
            if (a.resourceType === RESOURCE_ENERGY && b.resourceType !== RESOURCE_ENERGY) {
                return 1;
            }
            if (a.resourceType !== RESOURCE_ENERGY && b.resourceType === RESOURCE_ENERGY) {
                return -1;
            }

            return b.amount - a.amount;
        });
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
        return this.spawns[room.name] ? this.spawns[room.name] : this.spawns[room.name] = room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_SPAWN});
    }
    /**
     * Caches towers in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureTower[]} The towers in the room.
     */
    static towersInRoom(room) {
        return this.towers[room.name] ? this.towers[room.name] : this.towers[room.name] = room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_TOWER});
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
     * @return {void}
     */
    static addAlly(name) {
        Memory.allies.push(name);
    }
    /**
     * Adds a sign to a room.  When a reserver or upgrader is near the controller, it will apply the sign.
     * @param {string} roomName The name of the room to sign.
     * @param {string} text The text to sign.
     * @return {void}
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
     * Directs creeps to avoid a room.
     * @param {string} roomName The name of the room to avoid.
     * @param {bool} avoid Whether to avoid the room or not.
     * @return {void}
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
     * @return {void}
     */
    static avoidSquare(x, y, roomName, avoid) {
        if (avoid) {
            if (!Memory.avoidSquares[roomName]) {
                Memory.avoidSquares[roomName] = [];
            }
            Memory.avoidSquares[roomName].push({x, y});
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
     * @return {void}
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
     * @return {void}
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
     * @return {void}
     */
    static createArmy(armyName, options) {
        if (options === void 0) {
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
     * @return {void}
     */
    static dismantle(x, y, roomName) {
        if (!Memory.dismantle) {
            Memory.dismantle = {};
        }

        if (!Memory.dismantle[roomName]) {
            Memory.dismantle[roomName] = [];
        }

        Memory.dismantle[roomName].push({x, y});
    }
    /**
     * Downgrades the controller in a room.
     * @param {string} fromRoomName The name of the room to spawn the downgrader from.
     * @param {string} toRoomName The name of the room to downgrade the controller in.
     * @param {bool} downgrade Whether to downgrade the room's controller or not.
     * @return {void}
     */
    static downgradeRoomController(fromRoomName, toRoomName, downgrade) {
        if (!Memory.maxCreeps.downgrader) {
            Memory.maxCreeps.downgrader = {};
        }

        if (!Memory.maxCreeps.downgrader[fromRoomName]) {
            Memory.maxCreeps.downgrader[fromRoomName] = {};
        }

        if (downgrade) {
            Memory.maxCreeps.downgrader[fromRoomName][toRoomName] = true;
        } else {
            delete Memory.maxCreeps.downgrader[fromRoomName][toRoomName];
        }
    }
    /**
     * Recover from an emergency.
     * @return {void}
     */
    static recover() {
        _.forEach(Game.spawns, (spawn) => spawn.createCreep([MOVE, MOVE, CARRY, CARRY, CARRY, CARRY], `storer-emerg-${spawn.room.name}-${spawn.name}`, {role: "storer", home: spawn.room.name}));
    }
    /**
     * Removes an ally.
     * @param {string} name The ally to remove.
     * @return {void}
     */
    static removeAlly(name) {
        _.pull(Memory.allies, name);
    }
    /**
     * Resets a wartime cost matrix for a room.  It will be automatically recalculated.
     * @param {string} roomName The name of the room to reset the base matrix for.
     * @return {void}
     */
    static resetBaseMatrix(roomName) {
        Memory.baseMatrixes[roomName] = {};
    }
    /**
     * Set a container's source.  Useful when you want to have a container for a source be at a location different than default, ie: E36N11.
     * @param {string} containerId The container ID to assign to a source.
     * @param {string} sourceId The source ID to assign to a container.
     * @return {void}
     */
    static setContainerSource(containerId, sourceId) {
        Memory.containerSource[containerId] = sourceId;
    }
    /**
     * Set the room type.  Options should be an object containing at least a "type" key.
     * @param {string} roomName The name of the room.
     * @param {string} region The region of the room.
     * @param {object} options The options for the room.
     * @return {void}
     */
    static setRoomType(roomName, region, options) {
        if (options === void 0) {
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
     * @return {void}
     */
    static startAllCreeps() {
        _.forEach(Game.creeps, (creep) => {
            delete creep.memory.stop;
        });
    }
    /**
     * Starts a creep moving again.
     * @param {string} name The name of the creep to start moving.
     * @return {void}
     */
    static startCreep(name) {
        if (Game.creeps[name]) {
            delete Game.creeps[name].memory.stop;
        }
    }
    /**
     * Stops a creep from moving.
     * @param {string} name The name of the creep to stop moving.
     * @return {void}
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
     * @return {void}
     */
    static progressBar(visual, x, y, w, h, value, max, options) {
        if (options.showMax === void 0) {
            options.showMax = true;
        }
        if (options.valueDecimals === void 0) {
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
     * @return {void}
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
     * @return {void}
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
    Utilities = __require(9,6);
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
        const ret = Game.market.deal(orderId, amount, yourRoomName),
            order = _.find(Market.orders, (m) => m.id === orderId);

        if (ret === OK) {
            if (order) {
                if (order.type === "sell") {
                    Cache.credits -= order.amount * order.price;
                }
                if (order.amount <= amount) {
                    _.remove(Market.filteredOrders[order.type][order.resourceType], (m) => m.id === orderId);
                    _.remove(Market.orders, (m) => m.id === orderId);
                } else {
                    order.amount -= amount;
                }
            }
        } else if (order) {
            _.remove(Market.filteredOrders[order.type][order.resourceType], (m) => m.id === orderId);
            _.remove(Market.orders, (m) => m.id === orderId);
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
const Minerals = {};

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
Minerals[RESOURCE_POWER] = [];

module.exports = Minerals;

return module.exports;
}
/********** End of module 7: ../src/minerals.js **********/
/********** Start module 8: ../src/tower.js **********/
__modules[8] = function(module, exports) {
const Cache = __require(3,8);
/**
 * Represents a tower.
 */
class Tower {
    /**
     * Assigns tasks to the tower.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {tasks, room} = engine,
            towers = Cache.towersInRoom(room);
        if (_.filter(towers, (t) => t.energy === 0).length > 0) {
            return;
        }
        if (tasks.hostiles.length > 0 && _.filter(towers, (t) => t.energy < 500).length === 0) {
            _.forEach(towers, (tower) => {
                tower.attack(tasks.hostiles[0]);
            });

            return;
        }
        if (tasks.criticalRepairableStructures.length > 0) {
            _.forEach(towers, (tower) => {
                tower.repair(tasks.criticalRepairableStructures[0]);
            });

            return;
        }
        if (tasks.hurtCreeps.length > 0) {
            _.forEach(towers, (tower) => {
                tower.heal(tasks.hurtCreeps[0]);
            });
        }
    }
}

if (Memory.profiling) {
    __require(1,8).registerObject(Tower, "Tower");
}
module.exports = Tower;

return module.exports;
}
/********** End of module 8: ../src/tower.js **********/
/********** Start module 9: ../src/utilities.js **********/
__modules[9] = function(module, exports) {
const Cache = __require(3,9);
/**
 * A class of miscellaneous utilities.
 */
class Utilities {
    /**
     * Builds structures in a pattern around a central structure.
     * @param {Room} room The room to build in.
     * @param {string} structureType The structure type to build.
     * @param {number} structuresToBuild The number of structures to build.
     * @param {object} buildAroundObj The object to build around.
     * @return {void}
     */
    static buildStructures(room, structureType, structuresToBuild, buildAroundObj) {
        const {pos: {x: buildAroundX, y: buildAroundY}} = buildAroundObj;
        let distanceFromSpawn = 1;

        while (structuresToBuild > 0 && distanceFromSpawn < 50) {
            for (let x = buildAroundX - distanceFromSpawn; x <= buildAroundX + distanceFromSpawn; x += 2) {
                for (let y = buildAroundY - distanceFromSpawn; y <= buildAroundY + distanceFromSpawn; y += Math.abs(buildAroundX - x) === distanceFromSpawn ? 2 : 2 * distanceFromSpawn) {
                    if (x < 1 || x > 48 || y < 1 || y > 48) {
                        continue;
                    }
                    if (room.find(FIND_MY_CONSTRUCTION_SITES, {filter: (s) => s.pos.x === x && s.pos.y === y}).length > 0) {
                        continue;
                    }
                    const siteIsClear = Utilities.checkSiteIsClear(new RoomPosition(x, y, room.name));

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
    /**
     * Checks to see if a position is in a quadrant.
     * @param {RoomPosition} pos The room position to check.
     * @param {number} quadrant The quadrant to check.
     * @return {bool} Whether the position is in the quadrant.
     */
    static checkQuadrant(pos, quadrant) {
        switch (quadrant) {
            case 0:
            default:
                return pos.x < 25 && pos.y < 25;
            case 1:
                return pos.x < 25 && pos.y >= 25;
            case 2:
                return pos.x >= 25 && pos.y >= 25;
            case 3:
                return pos.x >= 25 && pos.y < 25;
        }
    }
    /**
     * Checks to see if a site is clear.
     * @param {RoomPosition} pos The site to check.
     * @return {bool|structures} Whether the site is clear or not, or a list of structures if it would be clear if those structures were destroyed.
     */
    static checkSiteIsClear(pos) {
        const {x, y, roomName} = pos,
            {rooms: {[roomName]: room}} = Game;
        let siteClear = true;
        if (new RoomPosition(x, y, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" || new RoomPosition(x - 1, y, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" && new RoomPosition(x + 1, y, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" || new RoomPosition(x, y - 1, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" && new RoomPosition(x, y + 1, roomName).lookFor(LOOK_TERRAIN)[0] === "wall") {
            return false;
        }
        _.forEach(room.find(FIND_SOURCES), (source) => siteClear = pos.getRangeTo(source) > 1);

        if (!siteClear) {
            return false;
        }
        _.forEach(room.find(FIND_MINERALS), (source) => siteClear = pos.getRangeTo(source) > 1);

        if (!siteClear) {
            return false;
        }
        if (pos.getRangeTo(room.controller) <= 4) {
            return false;
        }
        const structures = _.filter(pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType !== "rampart");

        if (structures.length === 0) {
            return true;
        }
        if (_.filter(structures, (s) => [STRUCTURE_ROAD, STRUCTURE_WALL].indexOf(s.structureType) !== -1).length !== structures.length) {
            return false;
        }
        return structures;
    }
    /**
     * Filters the creeps that have either an unimportant task or no task.
     * @param {Creep[]} creeps The creeps to filter.
     * @return {Creep[]} The filtered creeps.
     */
    static creepsWithNoTask(creeps) {
        return _.filter(creeps, (c) => !c.memory.currentTask || c.memory.currentTask.unimportant);
    }
    /**
     * Gets the energy cost of a creep's body parts.
     * @param {string[]} body The creep's body.
     * @return {number} The energy cost of the body.
     */
    static getBodypartCost(body) {
        return _.sum(_.map(body, (b) => BODYPART_COST[b]));
    }
    /**
     * Gets the owner or reserver of a controller.
     * @param {StructureController} controller The controller to check for an owner.
     * @return {string} The username of the owner.
     */
    static getControllerOwner(controller) {
        if (controller.owner) {
            return controller.owner.username;
        }
        if (controller.reservation) {
            return controller.reservation.owner;
        }

        return "";
    }
    /**
     * Gets available labs to boost creeps with.
     * @param {Room} room The room to check for labs.
     * @param {number} count The number of labs needed.
     * @return {object[]} The list of labs to use to boost creeps.
     */
    static getLabToBoostWith(room, count) {
        const {memory, memory: {labQueue}} = room,
            labs = [];
        let sourceLabs = labQueue && labQueue.sourceLabs || [];

        if (!count) {
            count = 1;
        }

        if (sourceLabs.length === 0) {
            sourceLabs = Utilities.getSourceLabs(room);
        }

        if (!memory.labsInUse) {
            memory.labsInUse = [];
        }

        for (let index = 0; index < count; index++) {
            const lab = _.filter(Cache.labsInRoom(room), (l) => sourceLabs.indexOf(l.id) === -1 && _.map(memory.labsInUse, (liu) => liu.id).indexOf(l.id) === -1 && _.map(labs, (liu) => liu.id).indexOf(l.id) === -1);
            let labToUse = {};

            if (lab.length > 0) {
                labToUse = {
                    id: lab[0].id,
                    pause: false
                };
            }
            if (!labToUse || !labToUse.id) {
                labToUse = {
                    id: _.filter(sourceLabs, (l) => _.map(memory.labsInUse, (liu) => liu.id).indexOf(l) === -1 && _.map(labs, (liu) => liu.id).indexOf(l) === -1)[0],
                    pause: true
                };

                if (!labToUse.id) {
                    return false;
                }

                const labUsed = Game.getObjectById(labToUse.id);

                if (labUsed.mineralAmount > 0) {
                    labToUse.status = "emptying";
                    ({mineralType: labToUse.oldResource, mineralAmount: labToUse.oldAmount} = labUsed);
                }
            }
            if (!labToUse.id) {
                return false;
            }

            labs.push(labToUse);
        }

        return labs;
    }
    /**
     * Gets the 2 source labs to use for reactions.
     * @param {Room} room The room to check for labs.
     * @return {string[]} The IDs of the labs to use as source labs.
     */
    static getSourceLabs(room) {
        const labs = Cache.labsInRoom(room),
            sourceLabs = [];

        _.forEach(labs, (lab) => {
            if (Utilities.objectsClosestToObj(labs, lab)[labs.length - 1].pos.getRangeTo(lab) <= 2) {
                sourceLabs.push(lab.id);
                if (sourceLabs.length >= 2) {
                    return false;
                }
            }

            return true;
        });

        return sourceLabs;
    }
    /**
     * A function that nests an object by a key.
     * @param {object[]} seq An array of objects to nest.
     * @param {function[]} keys Functions that define the keys.
     * @return {object} The nested object.
     */
    static nest(seq, keys) {
        if (!keys.length) {
            return seq;
        }

        return _.mapValues(_.groupBy(seq, keys[0]), (value) => Utilities.nest(value, keys.slice(1)));
    }
    /**
     * Sorts the objects by which ones are closest to another object.
     * @param {object[]} objects The objects to sort.
     * @param {object} obj The object to determine the range to.
     * @return {object[]} The sorted objects.
     */
    static objectsClosestToObj(objects, obj) {
        const {id} = obj;

        if (objects.length === 0) {
            return [];
        }

        if (!obj) {
            return objects;
        }

        const {ranges, ranges: {[id]: thisRange}} = Memory,
            objList = _.map(objects, (o) => {
                const {id: oId} = o;
                let range;

                if (ranges && ranges[id] && ranges[id][oId]) {
                    ({[oId]: range} = thisRange);
                } else {
                    range = obj.pos.getRangeTo(o);
                    if (!(o instanceof Creep) && !(obj instanceof Creep)) {
                        if (!ranges[id]) {
                            ranges[id] = {};
                        }
                        ranges[id][oId] = range;
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
    /**
     * Returns whether any labs in the room are paused.
     * @param {Room} room The room to check for paused labs.
     * @return {bool} Whether there are paused labs.
     */
    static roomLabsArePaused(room) {
        const {memory: {labsInUse}} = room;

        return labsInUse && _.filter(labsInUse, (l) => l.pause).length > 0;
    }
}

if (Memory.profiling) {
    __require(1,9).registerObject(Utilities, "Utilities");
}
module.exports = Utilities;

return module.exports;
}
/********** End of module 9: ../src/utilities.js **********/
/********** Start module 10: ../src/role.armyDismantler.js **********/
__modules[10] = function(module, exports) {
const Assign = __require(56,10),
    Cache = __require(3,10),
    Utilities = __require(9,10);
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
        const {dismantler: {units}} = army,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH];
        let boosts;

        body.push(...Array(units).fill(WORK));
        body.push(...Array(army.super ? 10 : units + 5).fill(MOVE));

        if (army.boostRoom) {
            boosts = {};
            boosts[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] = 5;
            boosts[RESOURCE_CATALYZED_ZYNTHIUM_ACID] = units;
            if (army.super) {
                boosts[RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE] = 10;
            }
        }

        return {
            body,
            boosts,
            name: "armyDismantler"
        };
    }
    /**
     * Assign tasks to creeps of this role.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache;
        Assign.getBoost(_.filter(creeps && creeps.armyDismantler || [], (c) => !c.spawning), "Boosting");

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
     * @return {void}
     */
    static assignBuildingTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyDismantler || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToRoom(creepsWithNoTask, army.buildRoom, "Building");
    }
    /**
     * Assignments for the staging directive.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignStagingTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyDismantler || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToRoom(_.filter(creepsWithNoTask, (c) => !c.spawning), army.stageRoom, "Staging");
    }
    /**
     * Assignments for the dismantle directive.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignDismantleTasks(army) {
        const {name: armyName, attackRoom: attackRoomName} = army,
            {creeps: {[armyName]: creeps}} = Cache,
            dismantlerCreeps = creeps && creeps.armyDismantler || [],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(dismantlerCreeps), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
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
     * @return {void}
     */
    static assignAttackTasks(army) {
        const {name: armyName, attackRoom: attackRoomName} = army,
            {creeps: {[armyName]: creeps}} = Cache,
            dismantlerCreeps = creeps && creeps.armyDismantler || [],
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(dismantlerCreeps), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
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

        const {restPosition} = army;

        if (restPosition) {
            Assign.moveToPos(creepsWithNoTask, new RoomPosition(restPosition.x, restPosition.y, restPosition.room), void 0, "Attacking");
        } else {
            Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
        }
    }
}

if (Memory.profiling) {
    __require(1,10).registerObject(RoleArmyDismantler, "RoleArmyDismantler");
}
module.exports = RoleArmyDismantler;

return module.exports;
}
/********** End of module 10: ../src/role.armyDismantler.js **********/
/********** Start module 11: ../src/role.armyHealer.js **********/
__modules[11] = function(module, exports) {
const Assign = __require(56,11),
    Cache = __require(3,11),
    Utilities = __require(9,11);
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
        const {healer: {units}} = army,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH];
        let boosts;

        body.push(...Array(units - 1).fill(HEAL));
        body.push(...Array(army.super ? 10 : units + 5).fill(MOVE));
        body.push(HEAL);

        if (army.boostRoom) {
            boosts = {};
            boosts[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] = 5;
            boosts[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE] = units;
            if (army.super) {
                boosts[RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE] = 10;
            }
        }

        return {
            body,
            boosts,
            name: "armyHealer"
        };
    }
    /**
     * Assign tasks to creeps of this role.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            armyHealers = creeps && creeps.armyHealer || [];
        Assign.getBoost(_.filter(armyHealers, (c) => !c.spawning), "Boosting");
        Assign.escort(_.filter(armyHealers, (c) => !c.memory.labs || c.memory.labs.length === 0), "Healing");

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
     * @return {void}
     */
    static assignBuildingTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyHealer || []), (c) => !c.spawning && !c.memory.escorting);

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
     * @return {void}
     */
    static assignStagingTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyHealer || []), (c) => !c.spawning && !c.memory.escorting);

        if (creepsWithNoTask.length === 0) {
            return;
        }
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
     * @return {void}
     */
    static assignDismantleTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            healerCreeps = creeps && creeps.armyHealer || [],
            {attackRoom: attackRoomName} = army,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(healerCreeps), (c) => !c.spawning && !c.memory.escorting);

        if (creepsWithNoTask.length === 0) {
            return;
        }
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
        if (Game.rooms[attackRoomName] && army.dismantle.length > 0) {
            const {dismantle: {0: id}} = army,
                obj = Game.getObjectById(id);
            if (obj) {
                Assign.moveToPos(creepsWithNoTask, obj.pos, 3, "Attacking");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }
            }
        }
        Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
    }
    /**
     * Assignments for the attack directive.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignAttackTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            healerCreeps = creeps && creeps.armyHealer || [],
            {attackRoom: attackRoomName} = army,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(healerCreeps), (c) => !c.spawning && !c.memory.escorting);

        if (creepsWithNoTask.length === 0) {
            return;
        }
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
        const {rooms: {[attackRoomName]: attackRoom}} = Game;

        if (attackRoom) {
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

        const {restPosition} = army;

        if (restPosition) {
            Assign.moveToPos(creepsWithNoTask, new RoomPosition(restPosition.x, restPosition.y, restPosition.room), void 0, "Attacking");
        } else {
            Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
        }
    }
}

if (Memory.profiling) {
    __require(1,11).registerObject(RoleArmyHealer, "RoleArmyHealer");
}
module.exports = RoleArmyHealer;

return module.exports;
}
/********** End of module 11: ../src/role.armyHealer.js **********/
/********** Start module 12: ../src/role.armyMelee.js **********/
__modules[12] = function(module, exports) {
const Assign = __require(56,12),
    Cache = __require(3,12),
    Utilities = __require(9,12);
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
        const {melee: {units}} = army,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH];
        let boosts;

        body.push(...Array(units).fill(ATTACK));
        body.push(...Array(army.super ? 10 : units + 5).fill(MOVE));

        if (army.boostRoom) {
            boosts = {};
            boosts[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] = 5;
            boosts[RESOURCE_CATALYZED_UTRIUM_ACID] = units;
            if (army.super) {
                boosts[RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE] = 10;
            }
        }

        return {
            body,
            boosts,
            name: "armyMelee"
        };
    }
    /**
     * Assign tasks to creeps of this role.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache;
        Assign.getBoost(_.filter(creeps && creeps.armyMelee || [], (c) => !c.spawning), "Boosting");

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
     * @return {void}
     */
    static assignBuildingTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyMelee || []), (c) => !c.spawning);

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
     * @return {void}
     */
    static assignStagingTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyMelee || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
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
     * @return {void}
     */
    static assignDismantleTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            meleeCreeps = creeps && creeps.armyMelee || [],
            {attackRoom: attackRoomName} = army,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(meleeCreeps), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
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
        const {dismantle} = army;

        if (Game.rooms[attackRoomName] && dismantle.length > 0) {
            const {0: id} = dismantle,
                obj = Game.getObjectById(id);

            if (obj) {
                Assign.moveToPos(creepsWithNoTask, obj.pos, 3, "Attacking");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }
            }
        }
        Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
    }
    /**
     * Assignments for the attack directive.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignAttackTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            meleeCreeps = creeps && creeps.armyMelee || [],
            {attackRoom: attackRoomName} = army,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(meleeCreeps), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
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

        const {restPosition} = army;

        if (restPosition) {
            Assign.moveToPos(creepsWithNoTask, new RoomPosition(restPosition.x, restPosition.y, restPosition.room), void 0, "Attacking");
        } else {
            Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
        }
    }
}

if (Memory.profiling) {
    __require(1,12).registerObject(RoleArmyMelee, "RoleArmyMelee");
}
module.exports = RoleArmyMelee;

return module.exports;
}
/********** End of module 12: ../src/role.armyMelee.js **********/
/********** Start module 13: ../src/role.armyRanged.js **********/
__modules[13] = function(module, exports) {
const Assign = __require(56,13),
    Cache = __require(3,13),
    Utilities = __require(9,13);
/**
 * Represents the ranged role in the army.
 */
class RoleArmyRanged {
    /**
     * Gets the settings for spawning a creep.
     * @param {Army} army The army to spawn the creep for.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(army) {
        const {ranged: {units}} = army,
            body = [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH];
        let boosts;

        body.push(...Array(units).fill(RANGED_ATTACK));
        body.push(...Array(army.super ? 10 : units + 5).fill(MOVE));

        if (army.boostRoom) {
            boosts = {};
            boosts[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] = 5;
            boosts[RESOURCE_CATALYZED_KEANIUM_ALKALIDE] = units;
            if (army.super) {
                boosts[RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE] = 10;
            }
        }

        return {
            body,
            boosts,
            name: "armyRanged"
        };
    }
    /**
     * Assign tasks to creeps of this role.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache;
        Assign.getBoost(_.filter(creeps && creeps.armyRanged || [], (c) => !c.spawning), "Boosting");

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
     * @return {void}
     */
    static assignBuildingTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyRanged || []), (c) => !c.spawning);

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
     * @return {void}
     */
    static assignStagingTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.armyRanged || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
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
     * @return {void}
     */
    static assignDismantleTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            rangedCreeps = creeps && creeps.armyRanged || [],
            {attackRoom: attackRoomName} = army,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(rangedCreeps), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
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
        const {dismantle} = army;

        if (Game.rooms[attackRoomName] && dismantle.length > 0) {
            const {0: id} = dismantle,
                obj = Game.getObjectById(id);

            if (obj) {
                Assign.moveToPos(creepsWithNoTask, obj.pos, 3, "Attacking");

                _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
                if (creepsWithNoTask.length === 0) {
                    return;
                }
            }
        }
        Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
    }
    /**
     * Assignments for the attack directive.
     * @param {Army} army The army to assign tasks to.
     * @return {void}
     */
    static assignAttackTasks(army) {
        const {creeps: {[army.name]: creeps}} = Cache,
            rangedCreeps = creeps && creeps.armyRanged || [],
            {attackRoom: attackRoomName} = army,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(rangedCreeps), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
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

        const {restPosition} = army;

        if (restPosition) {
            Assign.moveToPos(creepsWithNoTask, new RoomPosition(restPosition.x, restPosition.y, restPosition.room), void 0, "Attacking");
        } else {
            Assign.moveToRoom(creepsWithNoTask, attackRoomName, "Attacking");
        }
    }
}

if (Memory.profiling) {
    __require(1,13).registerObject(RoleArmyRanged, "RoleArmyRanged");
}
module.exports = RoleArmyRanged;

return module.exports;
}
/********** End of module 13: ../src/role.armyRanged.js **********/
/********** Start module 14: ../src/role.claimer.js **********/
__modules[14] = function(module, exports) {
const Assign = __require(56,14),
    Cache = __require(3,14),
    Utilities = __require(9,14);
/**
 * Represents the claimer role.
 */
class RoleClaimer {
    /**
     * Gets the settings for checking whether a creep should be spawned.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("claimer"),
            roomToClaim;

        if (settings) {
            return settings;
        }

        const {maxCreeps: {claimer}} = Memory,
            {room: {name: roomName}} = engine;

        if (!canSpawn) {
            return {
                name: "claimer",
                spawn: false,
                max: claimer && claimer[roomName] ? Object.keys(claimer[roomName]).length : 0
            };
        }

        const {creeps: {[roomName]: creeps}} = Cache,
            claimers = creeps && creeps.claimer || [];
        if (claimer) {
            _.forEach(claimer[roomName], (value, toRoom) => {
                if (_.filter(claimers, (c) => c.memory.claim === toRoom).length === 0) {
                    roomToClaim = toRoom;

                    return false;
                }

                return true;
            });
        }

        settings = {
            name: "claimer",
            spawn: !!roomToClaim,
            max: claimer && claimer[roomName] ? Object.keys(claimer[roomName]).length : 0,
            roomToClaim
        };

        if (claimers.length > 0) {
            engine.room.memory.maxCreeps.claimer = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(claimers, (c) => c.spawning ? 100 : Math.min(c.ticksToLive, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        return {
            body: [CLAIM, MOVE],
            memory: {
                role: "claimer",
                home: checkSettings.home,
                claim: checkSettings.roomToClaim
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {creeps: {[engine.room.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.claimer || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.claimController(creepsWithNoTask, "Claiming");
    }
}

if (Memory.profiling) {
    __require(1,14).registerObject(RoleClaimer, "RoleClaimer");
}
module.exports = RoleClaimer;

return module.exports;
}
/********** End of module 14: ../src/role.claimer.js **********/
/********** Start module 15: ../src/role.collector.js **********/
__modules[15] = function(module, exports) {
const Assign = __require(56,15),
    Cache = __require(3,15),
    Utilities = __require(9,15);
/**
 * Represents the collector role.
 */
class RoleCollector {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("collector"),
            sourceIdToCollectFrom;

        if (settings) {
            return settings;
        }

        const {room} = engine,
            {storage} = room,
            maxPerSource = 3;
        if (Cache.containersInRoom(room).length !== 0 && storage && storage.my) {
            return {
                name: "collector",
                spawn: false,
                max: 0
            };
        }
        const sources = room.find(FIND_SOURCES);

        if (sources.length <= 1) {
            return {
                name: "collector",
                spawn: false,
                max: 0
            };
        }

        const max = maxPerSource * (sources.length - 1);

        if (!canSpawn) {
            return {
                name: "collector",
                spawn: false,
                max
            };
        }

        const {creeps: {[room.name]: creeps}} = Cache,
            collectors = creeps && creeps.collector || [];
        _.forEach(Utilities.objectsClosestToObj(sources, Cache.spawnsInRoom(room)[0]), (source, index) => {
            if (index === 0) {
                return true;
            }

            const {id: sourceId} = source;

            if (_.filter(collectors, (c) => c.memory.homeSource === sourceId && (c.spawning || c.ticksToLive >= 150)).length < maxPerSource) {
                sourceIdToCollectFrom = sourceId;

                return false;
            }

            return true;
        });

        settings = {
            name: "collector",
            spawn: !!sourceIdToCollectFrom,
            max,
            spawnFromRegion: true,
            sourceIdToCollectFrom
        };

        if (collectors.length > 0) {
            engine.room.memory.maxCreeps.collector = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(collectors, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 150, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        const energy = Math.min(checkSettings.energyCapacityAvailable, 3300),
            units = Math.floor(energy / 200),
            remainder = energy % 200,
            body = [];

        body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
        body.push(...Array(units + (remainder >= 100 && remainder < 150 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + (remainder >= 50 ? 1 : 0)).fill(MOVE));

        return {
            body,
            memory: {
                role: "collector",
                home: checkSettings.home,
                homeSource: checkSettings.sourceIdToCollectFrom
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {room, tasks} = engine,
            {name: roomName, controller} = room,
            {creeps: {[roomName]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.collector || []), (c) => !c.spawning && c.ticksToLive > 150),
            allCreeps = creeps && creeps.all || [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.upgradeCriticalController(creepsWithNoTask, controller, "Upgrade");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillExtensions(creepsWithNoTask, allCreeps, room.controller.level, tasks.extensions, "Extension");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillSpawns(creepsWithNoTask, allCreeps, tasks.spawns, "Spawn");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillTowersWithEnergy(creepsWithNoTask, allCreeps, tasks.towers, "Tower");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.repairStructures(creepsWithNoTask, allCreeps, tasks.criticalRepairableStructures, "CritRepair");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.build(creepsWithNoTask, allCreeps, tasks.constructionSites, "Build");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.repairStructures(creepsWithNoTask, allCreeps, tasks.repairableStructures, "Repair");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.upgradeController(creepsWithNoTask, controller, "Upgrade");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.pickupResources(creepsWithNoTask, allCreeps, Cache.resourcesInRoom(room), tasks.hostiles, "Pickup");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectEnergy(creepsWithNoTask, allCreeps, tasks.structuresWithEnergy, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.harvest(creepsWithNoTask, "Harvesting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToHomeSource(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    __require(1,15).registerObject(RoleCollector, "RoleCollector");
}
module.exports = RoleCollector;

return module.exports;
}
/********** End of module 15: ../src/role.collector.js **********/
/********** Start module 16: ../src/role.defender.js **********/
__modules[16] = function(module, exports) {
const Assign = __require(56,16),
    Cache = __require(3,16),
    Utilities = __require(9,16);
/**
 * Represents the defender role.
 */
class RoleDefender {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("defender");

        if (settings) {
            return settings;
        }

        const max = 1;

        if (!canSpawn) {
            return {
                name: "defender",
                spawn: false,
                max
            };
        }

        const {creeps: {[engine.room.name]: creeps}} = Cache,
            defenders = creeps && creeps.defender || [];

        settings = {
            name: "defender",
            spawn: _.filter(defenders || [], (c) => c.spawning || c.ticksToLive >= 300).length < max,
            spawnFromRegion: true,
            max
        };

        if (defenders.length > 0) {
            engine.room.memory.maxCreeps.defender = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 25 : Math.min(..._.map(defenders, (c) => c.spawning ? 25 : Math.min(c.ticksToLive - 300, 25))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        return {
            body: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, HEAL, HEAL, HEAL, HEAL, HEAL],
            memory: {
                role: "defender",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                quadrant: 0
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {room: {name: roomName}, tasks} = engine,
            {creeps: {[roomName]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.defender || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.attackTarget(creepsWithNoTask, tasks.hostiles, "Die!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.attackInQuadrant(creepsWithNoTask, tasks.hostiles, "Die!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToSourceKeeper(creepsWithNoTask, tasks.keepers);

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToRoom(creepsWithNoTask, roomName);
        _.forEach(_.filter(creepsWithNoTask, (c) => !c.memory.currentTask || c.memory.currentTask.unimportant), (creep) => {
            creep.memory.quadrant = (creep.memory.quadrant + 1) % 4 || 0;
        });
    }
}

if (Memory.profiling) {
    __require(1,16).registerObject(RoleDefender, "RoleDefender");
}
module.exports = RoleDefender;

return module.exports;
}
/********** End of module 16: ../src/role.defender.js **********/
/********** Start module 17: ../src/role.dismantler.js **********/
__modules[17] = function(module, exports) {
const Assign = __require(56,17),
    Cache = __require(3,17),
    Utilities = __require(9,17);
/**
 * Represents the dismantler role.
 */
class RoleDismantler {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("dismantler");

        if (settings) {
            return settings;
        }

        const max = 1;

        if (!canSpawn) {
            return {
                name: "dismantler",
                spawn: false,
                max: 0
            };
        }

        const {creeps: {[engine.room.name]: creeps}} = Cache,
            dismantlers = creeps && creeps.dismantler || [];

        settings = {
            name: "dismantler",
            spawn: _.filter(dismantlers || [], (c) => c.spawning || c.ticksToLive >= 150).length < max,
            spawnFromRegion: true,
            max
        };

        if (dismantlers.length > 0) {
            engine.room.memory.maxCreeps.dismantler = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(dismantlers, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 300, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        const energy = Math.min(checkSettings.energyCapacityAvailable, 3300),
            units = Math.floor(energy / 200),
            remainder = energy % 200,
            body = [];

        body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
        body.push(...Array(units + (remainder >= 100 && remainder < 150 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + (remainder >= 50 ? 1 : 0)).fill(MOVE));

        return {
            body,
            memory: {
                role: "dismantler",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {room, tasks} = engine,
            {name: roomName} = room,
            {creeps: {[roomName]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.dismantler || []), (c) => !c.spawning && c.ticksToLive > 150),
            allCreeps = creeps && creeps.all || [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.dismantleTargets(creepsWithNoTask, room, "Dismantle");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.buildInCurrentRoom(creepsWithNoTask, allCreeps, false, "Build");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillStorageWithEnergy(creepsWithNoTask, allCreeps, room, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, room.storage, tasks.storageResourcesNeeded, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, room.terminal, void 0, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithEnergy(creepsWithNoTask, allCreeps, Cache.containersInRoom(room), "Container");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.pickupResources(creepsWithNoTask, allCreeps, Cache.resourcesInRoom(room), tasks.hostiles, "Pickup");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    __require(1,17).registerObject(RoleDismantler, "RoleDismantler");
}
module.exports = RoleDismantler;

return module.exports;
}
/********** End of module 17: ../src/role.dismantler.js **********/
/********** Start module 18: ../src/role.downgrader.js **********/
__modules[18] = function(module, exports) {
const Assign = __require(56,18),
    Cache = __require(3,18),
    Utilities = __require(9,18);
/**
 * Represents the downgrader role.
 */
class RoleDowngrader {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("downgrader"),
            roomToDowngrade;

        if (settings) {
            return settings;
        }

        const {maxCreeps: {downgrader}} = Memory,
            {room: {name: roomName}} = engine;

        if (!canSpawn) {
            return {
                name: "downgrader",
                spawn: false,
                max: downgrader && downgrader[roomName] ? Object.keys(downgrader[roomName]).length : 0
            };
        }

        const {creeps: {[roomName]: creeps}} = Cache,
            downgraders = creeps && creeps.downgrader || [];
        if (downgrader) {
            _.forEach(downgrader[roomName], (value, toRoom) => {
                if (_.filter(downgraders, (c) => c.memory.downgrade === toRoom).length === 0) {
                    roomToDowngrade = toRoom;

                    return false;
                }

                return true;
            });
        }

        settings = {
            name: "downgrader",
            spawn: !!roomToDowngrade,
            max: downgrader && downgrader[roomName] ? Object.keys(downgrader[roomName]).length : 0,
            roomToDowngrade
        };

        if (downgraders.length > 0) {
            engine.room.memory.maxCreeps.downgrader = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(downgraders, (c) => c.spawning ? 100 : Math.min(c.ticksToLive, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        const energy = Math.min(checkSettings.energyCapacityAvailable, 24400),
            units = Math.floor(energy / 3050),
            body = [];

        body.push(...Array(units * 5).fill(CLAIM));
        body.push(...Array(units).fill(MOVE));

        return {
            body,
            memory: {
                role: "downgrader",
                home: checkSettings.home,
                downgrade: checkSettings.roomToDowngrade
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {creeps: {[engine.room.name]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.downgrader || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.downgradeController(creepsWithNoTask, "Downgrade");
    }
}

if (Memory.profiling) {
    __require(1,18).registerObject(RoleDowngrader, "RoleDowngrader");
}
module.exports = RoleDowngrader;

return module.exports;
}
/********** End of module 18: ../src/role.downgrader.js **********/
/********** Start module 19: ../src/role.healer.js **********/
__modules[19] = function(module, exports) {
const Assign = __require(56,19),
    Cache = __require(3,19),
    Utilities = __require(9,19);
/**
 * Represents the healer role.
 */
class RoleHealer {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("healer");

        if (settings) {
            return settings;
        }

        const max = 1;

        if (!canSpawn) {
            return {
                name: "healer",
                spawn: false,
                max
            };
        }

        const {creeps: {[engine.room.name]: creeps}} = Cache,
            healers = creeps && creeps.healer || [];

        settings = {
            name: "healer",
            spawn: _.filter(healers, (c) => c.spawning || c.ticksToLive >= 300).length < max,
            spawnFromRegion: true,
            max
        };

        if (healers.length > 0) {
            engine.room.memory.maxCreeps.healer = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 25 : Math.min(..._.map(healers, (c) => c.spawning ? 25 : Math.min(c.ticksToLive - 300, 25))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        const energy = Math.min(checkSettings.energyCapacityAvailable, 4500),
            units = Math.floor(energy / 300),
            body = [];

        body.push(...Array(units).fill(MOVE));
        body.push(...Array(units).fill(HEAL));

        return {
            body,
            memory: {
                role: "healer",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {room: {name: roomName}, tasks} = engine,
            {creeps: {[roomName]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.healer || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.heal(creepsWithNoTask, tasks.hurtCreeps, "Heal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToSourceKeeper(creepsWithNoTask, tasks.keepers);

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToRoom(creepsWithNoTask, roomName);
    }
}

if (Memory.profiling) {
    __require(1,19).registerObject(RoleHealer, "RoleHealer");
}
module.exports = RoleHealer;

return module.exports;
}
/********** End of module 19: ../src/role.healer.js **********/
/********** Start module 20: ../src/role.miner.js **********/
__modules[20] = function(module, exports) {
const Assign = __require(56,20),
    Cache = __require(3,20),
    Utilities = __require(9,20);
/**
 * Represents the miner role.
 */
class RoleMiner {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("miner"),
            containerIdToMineOn, isMineralHarvester;

        if (settings) {
            return settings;
        }

        const {room} = engine,
            containers = Cache.containersInRoom(room),
            minerals = room.find(FIND_MINERALS),
            sources = Array.prototype.concat.apply([], [room.find(FIND_SOURCES), minerals]);
        if (containers.length === 0) {
            return {
                name: "miner",
                spawn: false,
                max: 0
            };
        }

        if (!canSpawn) {
            return {
                name: "miner",
                spawn: false,
                max: containers.length - _.filter(minerals, (m) => m.mineralAmount === 0).length
            };
        }

        const {containerSource} = Memory,
            {creeps: {[room.name]: creeps}} = Cache,
            miners = creeps && creeps.miner || [];
        _.forEach(containers, (container) => {
            const {id: containerId} = container;

            if (!containerSource[containerId]) {
                ({0: {id: containerSource[containerId]}} = Utilities.objectsClosestToObj(sources, container));
            }

            const source = Game.getObjectById(containerSource[containerId]),
                isMineral = source instanceof Mineral;
            if (isMineral && source.mineralAmount === 0) {
                return true;
            }
            if (_.filter(miners, (c) => (c.spawning || c.ticksToLive >= 150) && c.memory.container === containerId).length === 0) {
                containerIdToMineOn = containerId;
                isMineralHarvester = isMineral;

                return false;
            }

            return true;
        });

        settings = {
            name: "miner",
            spawn: !!containerIdToMineOn,
            max: containers.length - _.filter(minerals, (m) => m.mineralAmount === 0).length,
            containerIdToMineOn,
            isMineralHarvester
        };

        if (miners.length > 0) {
            engine.room.memory.maxCreeps.miner = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(miners, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 150, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        let body = [];

        if (checkSettings.isMineralHarvester) {
            const energy = Math.min(checkSettings.energyCapacityAvailable, 4500),
                units = Math.floor(energy / 450),
                remainder = energy % 450;

            body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(MOVE));
            body.push(...Array(units * 4 + (remainder >= 150 ? 1 : 0) + (remainder >= 250 ? 1 : 0) + (remainder >= 350 ? 1 : 0)).fill(WORK));
        } else {
            body = [MOVE, MOVE, WORK, WORK, WORK, WORK, WORK];
        }

        return {
            body,
            memory: {
                role: "miner",
                home: checkSettings.home,
                container: checkSettings.containerIdToMineOn
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {room: {name: roomName}} = engine,
            {creeps: {[roomName]: creeps}} = Cache,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(creeps && creeps.miner || []), (c) => !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.getBoost(creepsWithNoTask, "Boosting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.mine(creepsWithNoTask, "Mining");
    }
}

if (Memory.profiling) {
    __require(1,20).registerObject(RoleMiner, "RoleMiner");
}
module.exports = RoleMiner;

return module.exports;
}
/********** End of module 20: ../src/role.miner.js **********/
/********** Start module 21: ../src/role.remoteBuilder.js **********/
__modules[21] = function(module, exports) {
const Assign = __require(56,21),
    Cache = __require(3,21),
    Utilities = __require(9,21);
/**
 * Represents the remote builder role.
 */
class RoleRemoteBuilder {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("remoteBuilder");

        if (settings) {
            return settings;
        }

        const max = 2;

        if (!canSpawn) {
            return {
                name: "remoteBuilder",
                spawn: false,
                max
            };
        }

        const {creeps: {[engine.room.name]: creeps}} = Cache,
            remoteBuilders = creeps && creeps.remoteBuilder || [];

        settings = {
            name: "remoteBuilder",
            spawn: _.filter(remoteBuilders, (c) => c.spawning || c.ticksToLive >= 150).length < max,
            spawnFromRegion: true,
            max
        };

        if (remoteBuilders.length > 0) {
            engine.room.memory.maxCreeps.remoteBuilder = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(remoteBuilders, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 150, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        const energy = Math.min(checkSettings.energyCapacityAvailable, 3300),
            units = Math.floor(energy / 200),
            remainder = energy % 200,
            body = [];

        body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
        body.push(...Array(units + (remainder >= 100 && remainder < 150 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + (remainder >= 50 ? 1 : 0)).fill(MOVE));

        return {
            body,
            memory: {
                role: "remoteBuilder",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {creeps: {[engine.room.name]: creeps}} = Cache,
            {room, tasks} = engine,
            remoteBuilders = _.filter(creeps && creeps.remoteBuilder || [], (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            creepsWithNoTask = Utilities.creepsWithNoTask(remoteBuilders),
            allCreeps = creeps && creeps.all || [];

        if (remoteBuilders.length === 0) {
            return;
        }
        Assign.flee(remoteBuilders, "Run away!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.stomp(creepsWithNoTask, tasks.hostileConstructionSites, "Stomping");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.repairCriticalStructuresInCurrentRoom(creepsWithNoTask, "CritRepair");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.buildInCurrentRoom(creepsWithNoTask, allCreeps, false, "Build");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!room.unobservable) {
            Assign.pickupResources(creepsWithNoTask, allCreeps, Cache.sortedResourcesInRoom(room), Cache.hostilesInRoom(room), "Pickup");

            _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
            if (creepsWithNoTask.length === 0) {
                return;
            }
        }
        Assign.harvest(creepsWithNoTask, "Harvesting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToHomeSource(creepsWithNoTask);

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    __require(1,21).registerObject(RoleRemoteBuilder, "RoleRemoteBuilder");
}
module.exports = RoleRemoteBuilder;

return module.exports;
}
/********** End of module 21: ../src/role.remoteBuilder.js **********/
/********** Start module 22: ../src/role.remoteCollector.js **********/
__modules[22] = function(module, exports) {
const Assign = __require(56,22),
    Cache = __require(3,22),
    Utilities = __require(9,22);
/**
 * Represents the remote collector role.
 */
class RoleRemoteCollector {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("remoteCollector");

        if (settings) {
            return settings;
        }

        const max = engine.type === "cleanup" ? 5 : 1;

        if (!canSpawn) {
            return {
                name: "remoteCollector",
                spawn: false,
                max
            };
        }

        const {creeps: {[engine.room.name]: creeps}} = Cache,
            remoteCollectors = creeps && creeps.remoteCollector || [];

        settings = {
            name: "remoteCollector",
            spawn: _.filter(remoteCollectors, (c) => c.spawning || c.ticksToLive >= 300).length < max,
            spawnFromRegion: true,
            max
        };

        if (remoteCollectors.length > 0) {
            engine.room.memory.maxCreeps.remoteCollector = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(remoteCollectors, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 300, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        const energy = Math.min(checkSettings.energyCapacityAvailable, 2400),
            units = Math.floor(energy / 150),
            body = [];

        body.push(...Array(units * 2).fill(CARRY));
        body.push(...Array(units).fill(MOVE));

        return {
            body,
            memory: {
                role: "remoteCollector",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {room: {name: roomName}, supportRoom} = engine,
            {creeps: {[roomName]: creeps}} = Cache,
            creepsWithNoTask = Utilities.creepsWithNoTask(creeps && creeps.remoteCollector || []),
            allCreeps = creeps && creeps.all || [];

        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.pickupResourcesInCurrentRoom(creepsWithNoTask, allCreeps, "Pickup");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectMinerals(creepsWithNoTask, allCreeps, engine.tasks.mineralStructures, void 0, void 0, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectEnergy(creepsWithNoTask, allCreeps, engine.tasks.energyStructures, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillStorageWithEnergy(creepsWithNoTask, allCreeps, supportRoom, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, supportRoom.storage, Cache.rooms[supportRoom.name].tasks.storageResourcesNeeded, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, supportRoom.terminal, void 0, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithEnergy(creepsWithNoTask, allCreeps, Cache.containersInRoom(supportRoom), "Container");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToHomeOrSupport(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    __require(1,22).registerObject(RoleRemoteCollector, "RoleRemoteCollector");
}
module.exports = RoleRemoteCollector;

return module.exports;
}
/********** End of module 22: ../src/role.remoteCollector.js **********/
/********** Start module 23: ../src/role.remoteDismantler.js **********/
__modules[23] = function(module, exports) {
const Assign = __require(56,23),
    Cache = __require(3,23),
    Utilities = __require(9,23);
/**
 * Represents the remote dismantler role.
 */
class RoleRemoteDismantler {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("remoteDismantler");

        if (settings) {
            return settings;
        }

        const {room} = engine,
            max = !room.unobservable && engine.type === "cleanup" ? Math.min(room.find(FIND_STRUCTURES).length - 1, 8) : 1;

        if (!canSpawn) {
            return {
                name: "remoteDismantler",
                spawn: false,
                max
            };
        }

        const {creeps: {[room.name]: creeps}} = Cache,
            remoteDismantlers = creeps && creeps.remoteDismantler || [];

        settings = {
            name: "remoteDismantler",
            spawn: _.filter(remoteDismantlers, (c) => c.spawning || c.ticksToLive >= 300).length < max,
            spawnFromRegion: true,
            max
        };

        if (remoteDismantlers.length > 0) {
            engine.room.memory.maxCreeps.remoteDismantler = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(remoteDismantlers, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 300, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        const energy = Math.min(checkSettings.energyCapacityAvailable, 3750),
            units = Math.floor(energy / 150),
            body = [];

        body.push(...Array(units).fill(WORK));
        body.push(...Array(units).fill(MOVE));

        return {
            body,
            memory: {
                role: "remoteDismantler",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {room: {name: roomName}, tasks} = engine,
            {creeps: {[roomName]: creeps}} = Cache,
            remoteDismantlers = creeps && creeps.remoteDismantler,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(remoteDismantlers || []), (c) => _.sum(c.carry) > 0 || !c.spawning);

        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.stomp(creepsWithNoTask, tasks.hostileConstructionSites, "Stomping");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.dismantleStructures(creepsWithNoTask, remoteDismantlers, tasks.dismantle, "Dismantle");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    __require(1,23).registerObject(RoleRemoteDismantler, "RoleRemoteDismantler");
}
module.exports = RoleRemoteDismantler;

return module.exports;
}
/********** End of module 23: ../src/role.remoteDismantler.js **********/
/********** Start module 24: ../src/role.remoteMiner.js **********/
__modules[24] = function(module, exports) {
const Assign = __require(56,24),
    Cache = __require(3,24),
    Utilities = __require(9,24);
/**
 * Represents the remote miner role.
 */
class RoleRemoteMiner {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("remoteMiner"),
            containerIdToMineOn, isMineralHarvester;

        if (settings) {
            return settings;
        }

        const {room} = engine,
            containers = Cache.containersInRoom(room),
            minerals = room.find(FIND_MINERALS),
            sources = Array.prototype.concat.apply([], [room.find(FIND_SOURCES), minerals]);
        if (containers.length === 0 || sources.length === 0) {
            return {
                name: "remoteMiner",
                spawn: false,
                max: 0
            };
        }

        if (!canSpawn) {
            return {
                name: "remoteMiner",
                spawn: false,
                max: containers.length - _.filter(minerals, (m) => m.mineralAmount === 0).length
            };
        }

        const {lengthToContainer, containerSource} = Memory,
            {supportRoom} = engine,
            {name: supportRoomName} = supportRoom,
            spawnsInRoom = Cache.spawnsInRoom(supportRoom),
            {creeps: {[room.name]: creeps}} = Cache,
            remoteMiners = creeps && creeps.remoteMiner || [];
        _.forEach(containers, (container) => {
            const {id: containerId} = container;
            if (!lengthToContainer[containerId]) {
                lengthToContainer[containerId] = {};
            }

            const {[containerId]: lengthToThisContainer} = lengthToContainer;

            if (!lengthToThisContainer[supportRoomName]) {
                ({path: {length: lengthToThisContainer[supportRoomName]}} = PathFinder.search(container.pos, {pos: spawnsInRoom[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}));
            }

            if (!containerSource[containerId]) {
                ({0: {id: containerSource[containerId]}} = Utilities.objectsClosestToObj(sources, container));
            }

            const source = Game.getObjectById(containerSource[containerId]),
                isMineral = source instanceof Mineral;
            if (isMineral && source.mineralAmount === 0) {
                return true;
            }
            if (_.filter(remoteMiners, (c) => (c.spawning || c.ticksToLive >= 300) && c.memory.container === containerId).length === 0) {
                containerIdToMineOn = containerId;
                isMineralHarvester = isMineral;

                return false;
            }

            return true;
        });

        settings = {
            name: "remoteMiner",
            spawn: !!containerIdToMineOn,
            max: containers.length - _.filter(minerals, (m) => m.mineralAmount === 0).length,
            spawnFromRegion: true,
            containerIdToMineOn,
            isMineralHarvester
        };

        if (remoteMiners.length > 0) {
            engine.room.memory.maxCreeps.remoteMiner = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(remoteMiners, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 300, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        let body = [];

        if (checkSettings.isMineralHarvester) {
            const energy = Math.min(checkSettings.energyCapacityAvailable, 4500),
                units = Math.floor(energy / 450),
                remainder = energy % 450;

            body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(MOVE));
            body.push(...Array(units * 4 + (remainder >= 150 ? 1 : 0) + (remainder >= 250 ? 1 : 0) + (remainder >= 350 ? 1 : 0)).fill(WORK));
        } else {
            body = checkSettings.isSourceRoom ? [MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK] : [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK];
        }

        return {
            body,
            memory: {
                role: "remoteMiner",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                container: checkSettings.containerIdToMineOn
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {creeps: {[engine.room.name]: creeps}} = Cache,
            remoteMiners = _.filter(creeps && creeps.remoteMiner || [], (c) => !c.spawning),
            creepsWithNoTask = Utilities.creepsWithNoTask(remoteMiners);

        if (remoteMiners.length === 0) {
            return;
        }
        Assign.flee(remoteMiners, "Run away!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.mine(creepsWithNoTask, "Mining");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    __require(1,24).registerObject(RoleRemoteMiner, "RoleRemoteMiner");
}
module.exports = RoleRemoteMiner;

return module.exports;
}
/********** End of module 24: ../src/role.remoteMiner.js **********/
/********** Start module 25: ../src/role.remoteReserver.js **********/
__modules[25] = function(module, exports) {
const Assign = __require(56,25),
    Cache = __require(3,25),
    Utilities = __require(9,25);
/**
 * Represents the remote reserver role.
 */
class RoleRemoteReserver {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("remoteReserver");

        if (settings) {
            return settings;
        }

        const {room} = engine,
            {controller} = room,
            max = 1;

        if (!controller) {
            return {
                name: "remoteReserver",
                spawn: false,
                max: 0
            };
        }

        if (!canSpawn) {
            return {
                name: "remoteReserver",
                spawn: false,
                max
            };
        }

        const {reservation} = controller;

        if (reservation && reservation.ticksToEnd >= 4000) {
            return {
                name: "remoteReserver",
                spawn: false,
                max: 0
            };
        }

        const {lengthToController} = Memory,
            {id: controllerId} = controller,
            {supportRoom} = engine,
            {name: supportRoomName} = supportRoom,
            {creeps: {[room.name]: creeps}} = Cache,
            remoteReservers = creeps && creeps.remoteReserver || [];

        if (!lengthToController[controllerId]) {
            lengthToController[controllerId] = {};
        }

        const {[controllerId]: lengthToThisController} = lengthToController;

        if (!lengthToThisController[supportRoomName]) {
            ({path: {length: lengthToThisController[supportRoomName]}} = PathFinder.search(controller.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1, maxOps: 100000}));
        }

        settings = {
            name: "remoteReserver",
            spawn: _.filter(remoteReservers, (c) => c.spawning || c.ticksToLive > lengthToThisController[supportRoomName]).length < max,
            max,
            spawnFromRegion: true
        };

        if (remoteReservers.length > 0) {
            engine.room.memory.maxCreeps.remoteReserver = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(remoteReservers, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 150, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        const energy = Math.min(checkSettings.energyCapacityAvailable, 3250),
            units = Math.floor(energy / 650),
            body = [];

        body.push(...Array(units).fill(CLAIM));
        body.push(...Array(units).fill(MOVE));

        return {
            body,
            memory: {
                role: "remoteReserver",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {room} = engine,
            {creeps: {[room.name]: creeps}} = Cache,
            remoteReservers = _.filter(creeps && creeps.remoteReserver || [], (c) => !c.spawning),
            creepsWithNoTask = Utilities.creepsWithNoTask(remoteReservers);

        if (remoteReservers.length === 0) {
            return;
        }
        Assign.flee(remoteReservers, "Run away!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.reserveController(creepsWithNoTask, room, "Reserving");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    __require(1,25).registerObject(RoleRemoteReserver, "RoleRemoteReserver");
}
module.exports = RoleRemoteReserver;

return module.exports;
}
/********** End of module 25: ../src/role.remoteReserver.js **********/
/********** Start module 26: ../src/role.remoteStorer.js **********/
__modules[26] = function(module, exports) {
const Assign = __require(56,26),
    Cache = __require(3,26),
    Utilities = __require(9,26);
/**
 * Represents the remote storer role.
 */
class RoleRemoteStorer {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("remoteStorer"),
            max = 0,
            foundFirstSource, containerIdToCollectFrom;

        if (settings) {
            return settings;
        }

        const {room} = engine,
            containers = Cache.containersInRoom(room);
        if (containers.length === 0) {
            return {
                name: "remoteStorer",
                spawn: false,
                max: 0
            };
        }

        const {containerSource, lengthToContainer} = Memory,
            sources = Array.prototype.concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]),
            {supportRoom} = engine,
            {name: supportRoomName} = supportRoom,
            {controller: {level: supportRoomRcl}} = supportRoom,
            {creeps: {[room.name]: creeps}} = Cache,
            remoteStorers = creeps && creeps.remoteStorer || [];

        foundFirstSource = false;
        _.forEach(containers, (container) => {
            const {id: containerId} = container;
            let count = 0;

            if (!containerSource[containerId]) {
                ({0: {id: containerSource[containerId]}} = Utilities.objectsClosestToObj(sources, container));
            }

            const source = Game.getObjectById(containerSource[containerId]);

            if (source instanceof Mineral) {
                if (source.mineralAmount === 0) {
                    return;
                }
            } else if (!foundFirstSource) {
                count = -1;
                foundFirstSource = true;
            }
            const length = lengthToContainer[containerId] ? lengthToContainer[containerId][supportRoomName] : 0;
            count += Math.max(Math.ceil(length / [18, 18, 18, 18, 30, 44, 54, 62, 62][supportRoomRcl]), 0);
            max += count;
            if (canSpawn && !containerIdToCollectFrom && _.filter(remoteStorers, (c) => (c.spawning || c.ticksToLive >= 150 + length * 2) && c.memory.container === containerId).length < count) {
                containerIdToCollectFrom = containerId;
            }
        });

        if (!canSpawn) {
            return {
                name: "remoteStorer",
                spawn: false,
                max
            };
        }

        settings = {
            name: "remoteStorer",
            spawn: !!containerIdToCollectFrom,
            max,
            spawnFromRegion: true,
            containerIdToCollectFrom,
            supportRoomRcl
        };

        if (remoteStorers.length > 0) {
            engine.room.memory.maxCreeps.remoteStorer = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(remoteStorers, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 300, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        let body;

        switch (checkSettings.supportRoomRcl) {
            case 3:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 4:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 5:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 6:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
            case 7:
            case 8:
                body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                break;
        }

        return {
            body,
            memory: {
                role: "remoteStorer",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                container: checkSettings.containerIdToCollectFrom
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {creeps: {[engine.room.name]: creeps}} = Cache,
            remoteStorers = _.filter(creeps && creeps.remoteStorer || [], (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            creepsWithNoTask = Utilities.creepsWithNoTask(remoteStorers),
            allCreeps = creeps && creeps.all || [],
            {supportRoom} = engine;

        if (remoteStorers.length === 0) {
            return;
        }
        Assign.flee(remoteStorers, "Run away!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.pickupResourcesInCurrentRoom(creepsWithNoTask, allCreeps, "Pickup");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillStorageWithEnergy(creepsWithNoTask, allCreeps, supportRoom, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, supportRoom.storage, Cache.rooms[supportRoom.name].tasks.storageResourcesNeeded, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, supportRoom.terminal, void 0, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithEnergy(creepsWithNoTask, allCreeps, Cache.containersInRoom(supportRoom), "Container");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectEnergyFromHomeContainer(creepsWithNoTask, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectMineralsFromHomeContainer(creepsWithNoTask, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToHomeOrSupport(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    __require(1,26).registerObject(RoleRemoteStorer, "RoleRemoteStorer");
}
module.exports = RoleRemoteStorer;

return module.exports;
}
/********** End of module 26: ../src/role.remoteStorer.js **********/
/********** Start module 27: ../src/role.remoteWorker.js **********/
__modules[27] = function(module, exports) {
const Assign = __require(56,27),
    Cache = __require(3,27),
    Utilities = __require(9,27);
/**
 * Represents the remote worker role.
 */
class RoleRemoteWorker {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("remoteWorker"),
            spawn = false,
            containerIdToCollectFrom;

        if (settings) {
            return settings;
        }

        const {room} = engine,
            containers = Cache.containersInRoom(room),
            max = 1;
        if (containers.length === 0) {
            return {
                name: "remoteWorker",
                spawn: false,
                max: 0
            };
        }

        if (!canSpawn) {
            return {
                name: "remoteWorker",
                spawn: false,
                max
            };
        }

        const sources = Array.prototype.concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]),
            {lengthToContainer} = Memory,
            {creeps: {[room.name]: creeps}} = Cache,
            remoteWorkers = creeps && creeps.remoteWorker || [],
            {supportRoom: {name: supportRoomName}} = engine;
        _.forEach(containers, (container) => {
            const {0: source} = Utilities.objectsClosestToObj(sources, container),
                {id: containerId} = container,
                {[containerId]: lengthToThisAContainer} = lengthToContainer;
            if (source instanceof Mineral) {
                return true;
            }

            if (_.filter(remoteWorkers, (c) => (c.spawning || c.ticksToLive >= 150 + (lengthToThisAContainer && lengthToThisAContainer[supportRoomName] ? lengthToThisAContainer[supportRoomName] : 0) * 2) && c.memory.container === containerId).length === 0) {
                containerIdToCollectFrom = containerId;
                spawn = true;
            }
            return false;
        });

        settings = {
            name: "remoteWorker",
            spawn,
            max,
            spawnFromRegion: true,
            containerIdToCollectFrom
        };

        if (remoteWorkers.length > 0) {
            engine.room.memory.maxCreeps.remoteWorker = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(remoteWorkers, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 300, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        const energy = Math.min(checkSettings.energyCapacityAvailable, 3000),
            units = Math.floor(Math.min(energy, 2000) / 200),
            secondUnits = Math.floor(Math.max(energy - 2000, 0) / 150),
            remainder = Math.min(energy, 2000) % 200,
            secondRemainder = Math.max(energy - 2000, 0) % 150,
            body = [];

        body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
        body.push(...Array(units + secondUnits * 2 + (remainder >= 100 && remainder < 150 ? 1 : 0) + (secondRemainder > 100 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + secondUnits + (remainder >= 50 ? 1 : 0) + (secondRemainder >= 50 ? 1 : 0)).fill(MOVE));

        return {
            body,
            memory: {
                role: "remoteWorker",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                container: checkSettings.containerIdToCollectFrom
            }
        };
    }
    /**
     * Assigns tasks to creeps of this role.
     * @param {RoomEngine} engine The room engine to assign tasks for.
     * @return {void}
     */
    static assignTasks(engine) {
        const {creeps: {[engine.room.name]: creeps}} = Cache,
            remoteWorkers = _.filter(creeps && creeps.remoteWorker || [], (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            creepsWithNoTask = Utilities.creepsWithNoTask(remoteWorkers),
            allCreeps = creeps && creeps.all || [],
            {supportRoom} = engine;

        if (remoteWorkers.length === 0) {
            return;
        }
        Assign.flee(remoteWorkers, "Run away!");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.buildInCurrentRoom(creepsWithNoTask, allCreeps, true, "Build");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.repairCriticalStructuresInCurrentRoom(creepsWithNoTask, "CritRepair");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.buildInCurrentRoom(creepsWithNoTask, allCreeps, false, "Build");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillStorageWithEnergy(creepsWithNoTask, allCreeps, supportRoom, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, supportRoom.storage, Cache.rooms[supportRoom.name].tasks.storageResourcesNeeded, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, supportRoom.terminal, void 0, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithEnergy(creepsWithNoTask, allCreeps, Cache.containersInRoom(supportRoom), "Container");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.pickupResourcesInCurrentRoom(creepsWithNoTask, allCreeps, "Pickup");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectEnergyFromHomeContainer(creepsWithNoTask, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.harvest(creepsWithNoTask, "Harvesting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToHomeRoom(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    __require(1,27).registerObject(RoleRemoteWorker, "RoleRemoteWorker");
}
module.exports = RoleRemoteWorker;

return module.exports;
}
/********** End of module 27: ../src/role.remoteWorker.js **********/
/********** Start module 28: ../src/role.scientist.js **********/
__modules[28] = function(module, exports) {
const Assign = __require(56,28),
    Cache = __require(3,28),
    Utilities = __require(9,28);
/**
 * Represents the scientist role.
 */
class RoleScientist {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("scientist");

        if (settings) {
            return settings;
        }

        const {room} = engine,
            max = 1;

        if (!canSpawn) {
            return {
                name: "scientist",
                spawn: false,
                max
            };
        }

        const {creeps: {[room.name]: creeps}} = Cache,
            scientists = creeps && creeps.scientist || [];

        settings = {
            name: "scientist",
            spawn: _.filter(scientists, (c) => c.spawning || c.ticksToLive >= 150).length < max,
            max
        };

        if (scientists.length > 0) {
            engine.room.memory.maxCreeps.scientist = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(scientists, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 150, 100))))
            };
        }

        return settings;
    }
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
        Assign.fillTowersWithEnergy(creepsWithNoTask, allCreeps, tasks.towers, "Tower");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectMinerals(creepsWithNoTask, allCreeps, tasks.labsCollectMinerals, void 0, void 0, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, tasks.labsFillMinerals, tasks.labsFillMineralsResourcesNeeded, "Lab");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, tasks.nuker, tasks.nukerResourcesNeeded, "NukeG");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, tasks.powerSpawn, tasks.powerSpawnResourcesNeeded, "PowerPower");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, room.storage, tasks.storageResourcesNeeded, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, room.terminal, void 0, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithEnergy(creepsWithNoTask, Cache.labsInRoom(room), "LabEnergy");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithEnergy(creepsWithNoTask, Cache.nukersInRoom(room), "NukeEnergy");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithEnergy(creepsWithNoTask, Cache.powerSpawnsInRoom(room), "PwrEnergy");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithEnergy(creepsWithNoTask, tasks.terminalsFillWithEnergy, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillExtensions(creepsWithNoTask, allCreeps, room.controller.level, tasks.extensions, "Extension");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillSpawns(creepsWithNoTask, allCreeps, tasks.spawns, "Spawn");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillStorageWithEnergy(creepsWithNoTask, allCreeps, room, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectMinerals(creepsWithNoTask, allCreeps, tasks.terminalCollectMinerals, tasks.terminalCollectMineralsResource, tasks.terminalCollectMineralsAmount, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectMinerals(creepsWithNoTask, allCreeps, tasks.storageCollectMinerals, tasks.storageCollectMineralsResource, tasks.storageCollectMineralsAmount, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.pickupResources(creepsWithNoTask, allCreeps, Cache.resourcesInRoom(room), tasks.hostiles, "Pickup");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectEnergy(creepsWithNoTask, allCreeps, tasks.terminalsCollectEnergy, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectMinerals(creepsWithNoTask, allCreeps, tasks.structuresWithMinerals, void 0, void 0, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectEnergy(creepsWithNoTask, allCreeps, tasks.structuresWithEnergy, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (room.terminal) {
            Assign.moveToPos(creepsWithNoTask, room.terminal.pos, 1);
        }
    }
}

if (Memory.profiling) {
    __require(1,28).registerObject(RoleScientist, "RoleScientist");
}
module.exports = RoleScientist;

return module.exports;
}
/********** End of module 28: ../src/role.scientist.js **********/
/********** Start module 29: ../src/role.storer.js **********/
__modules[29] = function(module, exports) {
const Assign = __require(56,29),
    Cache = __require(3,29),
    Utilities = __require(9,29);
/**
 * Represents the storer role.
 */
class RoleStorer {
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
        if (containers.length === 0 || !room.storage || !room.storage.my) {
            return {
                name: "storer",
                spawn: false,
                max: 0
            };
        }

        const {containerSource, lengthToStorage} = Memory,
            sources = Array.prototype.concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]),
            {controller} = room,
            {level: rcl} = controller,
            {creeps: {[room.name]: creeps}} = Cache,
            storers = creeps && creeps.storer || [];
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
        Assign.fillWithEnergy(creepsWithNoTask, tasks.links, "Link");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillExtensions(creepsWithNoTask, allCreeps, room.controller.level, tasks.extensions, "Extension");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillSpawns(creepsWithNoTask, allCreeps, tasks.spawns, "Spawn");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithEnergy(creepsWithNoTask, Cache.labsInRoom(room), "LabEnergy");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithEnergy(creepsWithNoTask, tasks.terminalsFillWithEnergy, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillStorageWithEnergy(creepsWithNoTask, allCreeps, room, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, room.storage, tasks.storageResourcesNeeded, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, room.terminal, void 0, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectMinerals(creepsWithNoTask, allCreeps, tasks.structuresWithMinerals, void 0, void 0, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectEnergy(creepsWithNoTask, allCreeps, tasks.structuresWithEnergy, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectEnergy(creepsWithNoTask, allCreeps, tasks.terminalsCollectEnergy, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToTerminalOrRoom(creepsWithNoTask, room);
    }
}

if (Memory.profiling) {
    __require(1,29).registerObject(RoleStorer, "RoleStorer");
}
module.exports = RoleStorer;

return module.exports;
}
/********** End of module 29: ../src/role.storer.js **********/
/********** Start module 30: ../src/role.upgrader.js **********/
__modules[30] = function(module, exports) {
const Assign = __require(56,30),
    Cache = __require(3,30),
    Utilities = __require(9,30);
/**
 * Represents the upgrader role.
 */
class RoleUpgrader {
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        let settings = engine.checkSpawnSettingsCache("upgrader"),
            max, spawnForRoom;

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
            spawnForRoom = roomName;
        }
        if (!spawnForRoom) {
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
                    spawnForRoom = otherRoomName;

                    return false;
                }

                return true;
            });
        }

        settings = {
            name: "upgrader",
            spawn: !!spawnForRoom,
            max,
            spawnFromRegion: controller.level < 6,
            spawnForRoom
        };

        if (upgraders.length > 0) {
            engine.room.memory.maxCreeps.upgrader = {
                cache: settings,
                cacheUntil: Game.time + (settings.spawn ? 100 : Math.min(..._.map(upgraders, (c) => c.spawning ? 100 : Math.min(c.ticksToLive - 150, 100))))
            };
        }

        return settings;
    }
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        const {rooms: {[checkSettings.home]: room}} = Game,
            links = Cache.linksInRoom(room),
            {controller, storage} = room,
            {store} = storage,
            spawns = Cache.spawnsInRoom(room),
            body = [],
            boosts = {};
        let {energyCapacityAvailable: energy} = room,
            units = Math.floor(energy / 200),
            remainder = energy % 200;
        if (links >= 2 && Utilities.objectsClosestToObj(links, controller)[0].pos.getRangeTo(controller) <= 2) {
            const carryUnits = Math.ceil(energy / 3200);

            energy = Math.min(energy, controller.level === 8 ? 1950 : 4100);
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
            body,
            boosts,
            memory: {
                role: "upgrader",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                homeSource: spawns ? Utilities.objectsClosestToObj(room.find(FIND_SOURCES), spawns[0])[0].id : room.find(FIND_SOURCES)[0]
            }
        };
    }
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
        Assign.getBoost(creepsWithNoTask, "Boosting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.upgradeController(creepsWithNoTask, room.controller, "Upgrade");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectEnergy(upgraders, [], Utilities.objectsClosestToObj(Cache.linksInRoom(room), room.controller), "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.pickupResources(creepsWithNoTask, allCreeps, Cache.resourcesInRoom(room), tasks.hostiles, "Pickup");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectEnergy(creepsWithNoTask, allCreeps, tasks.structuresWithEnergy, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.harvest(creepsWithNoTask, "Harvesting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToPos(creepsWithNoTask, room.controller.pos, 1);
    }
}

if (Memory.profiling) {
    __require(1,30).registerObject(RoleUpgrader, "RoleUpgrader");
}
module.exports = RoleUpgrader;

return module.exports;
}
/********** End of module 30: ../src/role.upgrader.js **********/
/********** Start module 31: ../src/role.worker.js **********/
__modules[31] = function(module, exports) {
const Assign = __require(56,31),
    Cache = __require(3,31),
    Utilities = __require(9,31);
/**
 * Represents the worker role.
 */
class RoleWorker {
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
        if (!roomToSpawnFor) {
            _.forEach(_.filter(Game.rooms, (gameRoom) => {
                const {memory, controller} = gameRoom,
                    {roomType} = memory;

                return memory && roomType && roomType.type === "base" && memory.region === room.memory.region && gameRoom.name !== roomName && controller && controller.level < 6;
            }), (otherRoom) => {
                const {name: otherRoomName} = otherRoom,
                    {creeps: {[otherRoom.name]: otherCreeps}} = Cache;

                if (_.filter(otherCreeps && otherCreeps.worker || [], (c) => {
                    const {memory} = c;

                    return memory.supportRoom !== memory.home;
                }).length === 0) {
                    roomToSpawnFor = otherRoomName;
                }
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
            {store} = storage,
            spawns = Cache.spawnsInRoom(room),
            body = [],
            boosts = {};

        body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
        body.push(...Array(units + (remainder >= 100 && remainder < 150 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + (remainder >= 50 ? 1 : 0)).fill(MOVE));

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
                role: "worker",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom,
                homeSource: spawns ? Utilities.objectsClosestToObj(room.find(FIND_SOURCES), spawns[0])[0].id : room.find(FIND_SOURCES)[0]
            }
        };
    }
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
        Assign.getBoost(creepsWithNoTask, "Boosting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, room.storage, tasks.storageResourcesNeeded, "Storage");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillWithMinerals(creepsWithNoTask, room.terminal, void 0, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.upgradeCriticalController(creepsWithNoTask, controller, "Upgrade");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!room.storage || storers.length === 0) {
            Assign.fillExtensions(creepsWithNoTask, allCreeps, room.controller.level, tasks.extensions, "Extension");
        }

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!room.storage || storers.length === 0) {
            Assign.fillSpawns(creepsWithNoTask, allCreeps, tasks.spawns, "Spawn");
        }

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.fillTowersWithEnergy(creepsWithNoTask, allCreeps, tasks.towers, "Tower");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.build(creepsWithNoTask, allCreeps, tasks.quickConstructionSites, "Build");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.repairCriticalStructuresInCurrentRoom(creepsWithNoTask, "CritRepair");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.build(creepsWithNoTask, allCreeps, tasks.constructionSites, "Build");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.repairStructures(creepsWithNoTask, allCreeps, tasks.repairableStructures, "Repair");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (controller && controller.level < 8) {
            Assign.upgradeController(creepsWithNoTask, controller, "Upgrade");
        }

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        if (!controller || controller.level < 6) {
            Assign.pickupResources(creepsWithNoTask, allCreeps, Cache.resourcesInRoom(room), tasks.hostiles, "Pickup");
        }

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectEnergy(creepsWithNoTask, allCreeps, tasks.terminalsCollectEnergy, "Terminal");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.collectEnergy(creepsWithNoTask, allCreeps, tasks.structuresWithEnergy, "Collecting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.harvest(creepsWithNoTask, "Harvesting");

        _.remove(creepsWithNoTask, (c) => c.memory.currentTask && (!c.memory.currentTask.unimportant || c.memory.currentTask.priority === Game.time));
        if (creepsWithNoTask.length === 0) {
            return;
        }
        Assign.moveToHomeSource(creepsWithNoTask);
    }
}

if (Memory.profiling) {
    __require(1,31).registerObject(RoleWorker, "RoleWorker");
}
module.exports = RoleWorker;

return module.exports;
}
/********** End of module 31: ../src/role.worker.js **********/
/********** Start module 32: ../src/room.base.js **********/
__modules[32] = function(module, exports) {
const Cache = __require(3,32),
    Commands = __require(4,32),
    Market = __require(6,32),
    Minerals = __require(7,32),
    RoomEngine = __require(57,32),
    Tower = __require(8,32),
    Utilities = __require(9,32),
    RoleClaimer = __require(14,32),
    RoleCollector = __require(15,32),
    RoleDismantler = __require(17,32),
    RoleDowngrader = __require(18,32),
    RoleMiner = __require(20,32),
    RoleScientist = __require(28,32),
    RoleStorer = __require(29,32),
    RoleUpgrader = __require(30,32),
    RoleWorker = __require(31,32);
/**
 * A class that represents a base room.
 */
class RoomBase extends RoomEngine {
    /**
     * Creates a new base room.
     * @param {Room} room The room.
     */
    constructor(room) {
        super();
        this.type = "base";
        this.room = room;
        if (!room.memory.maxCreeps) {
            room.memory.maxCreeps = {};
        }
    }
    /**
     * Run the room.
     * @return {void}
     */
    run() {
        const {room} = this,
            {name: roomName} = room;

        if (room.unobservable) {
            Game.notify(`Base Room ${roomName} is unobservable, something is wrong!`);

            return;
        }

        const spawns = Cache.spawnsInRoom(room),
            {terminal, storage, memory} = room,
            {labQueue, labsInUse} = memory;
        if (Game.time % 100 === 0 && spawns.length > 0) {
            this.manage();
        }
        this.defend();
        if (spawns.length > 0) {
            this.transferEnergy();
        }
        if (terminal && !terminal.cooldown) {
            this.terminal();
        }
        this.tasks();
        this.spawn(_.filter(Game.spawns, (s) => !Cache.spawning[s.id] && !s.spawning && s.room.memory.region === memory.region).length > 0);
        this.assignTasks();
        if (storage && Cache.labsInRoom(room).length >= 3 && labQueue && !Utilities.roomLabsArePaused(room)) {
            this.labQueue();
        }
        if (labsInUse) {
            this.labsInUse();
        }

        this.processPower();
    }
    /**
     * Manage the room's layout.
     * @return {void}
     */
    manage() {
        const {room} = this,
            {controller, storage, name: roomName} = room,
            {level: rcl} = controller,
            sites = room.find(FIND_MY_CONSTRUCTION_SITES),
            extensionsToBuild = [0, 5, 10, 20, 30, 40, 50, 60][rcl - 1] - (Cache.extensionsInRoom(room).length + _.filter(sites, (c) => c.structureType === STRUCTURE_EXTENSION).length),
            {0: spawn} = Cache.spawnsInRoom(room),
            {pos: spawnPos} = spawn,
            minerals = room.find(FIND_MINERALS);
        if (extensionsToBuild > 0) {
            Utilities.buildStructures(room, STRUCTURE_EXTENSION, extensionsToBuild, spawn);
        }
        if (rcl >= 3 && Cache.towersInRoom(room).length === 0 && _.filter(sites, (c) => c.structureType === STRUCTURE_TOWER).length === 0) {
            Utilities.buildStructures(room, STRUCTURE_TOWER, 1, spawn);
        }
        if (rcl >= 3) {
            _.forEach(room.find(FIND_SOURCES), (source) => {
                const {path: {0: location}} = PathFinder.search(source.pos, {pos: spawnPos, range: 1}, {swampCost: 1}),
                    structures = location.lookFor(LOOK_STRUCTURES),
                    {x, y} = location;

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
                const {pos: mineralPos} = mineral,
                    {x, y} = mineralPos;

                if (
                    _.filter(mineralPos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_EXTRACTOR).length === 0 &&
                    _.filter(sites, (s) => s.pos.x === x && s.pos.y === y && s.structureType === STRUCTURE_EXTRACTOR).length === 0
                ) {
                    room.createConstructionSite(x, y, STRUCTURE_EXTRACTOR);
                }
            });
        }
        if (rcl >= 6) {
            _.forEach(minerals, (mineral) => {
                const {path: {0: location}} = PathFinder.search(mineral.pos, {pos: spawnPos, range: 1}, {swampCost: 1}),
                    structures = location.lookFor(LOOK_STRUCTURES),
                    {x, y} = location;

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
            _.forEach(room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_TOWER || s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_TERMINAL}), (structure) => {
                const {pos: {x: structureX, y: structureY}} = structure;

                _.forEach([new RoomPosition(structureX - 1, structureY, roomName), new RoomPosition(structureX + 1, structureY, roomName), new RoomPosition(structureX, structureY - 1, roomName), new RoomPosition(structureX, structureY + 1, roomName)], (pos) => {
                    const {x, y} = pos;

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
    /**
     * Defend the room.
     * Basic philosophy: We want to respond appropriately to incoming threats, but we also don't want to overdo it.
     * 0-50 ticks - Enemy is being annoying, let towers deal with them.
     * 50-500 ticks - Enemy is proving to be at least a basic threat, deal with them using a standard army.
     * 500-2000 ticks - Light threat.  Use boosts with the standard army.
     * 2000-2500 ticks - Moderate threat.  All bases in the region should send an army to any rooms identified as a threat.
     * 2500+ ticks - Massive sustained threat.  Use boosts with all armies.
     * NYI - Casualties taken? - Create an army of similar size that respects the base matrixes.  If a base matrix has not yet been created, queue one for creation.
     * Enemy spending a lot of time on 0/49 tiles? - Create an army of similar size that goes after creeps in the border room they are trying to drain from.
     * @return {void}
     */
    defend() {
        const {room} = this,
            hostiles = _.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username !== "Invader"),
            {name: roomName, memory: roomMemory} = room,
            armyName = `${roomName}-defense`,
            {armies: {[armyName]: army}} = Cache;

        if (hostiles.length > 0) {
            ({time: roomMemory.lastHostile} = Game);

            if (!roomMemory.currentAttack) {
                ({time: roomMemory.currentAttack} = Game);
            }
            if (!roomMemory.edgeTicks) {
                roomMemory.edgeTicks = {
                    1: 0,
                    3: 0,
                    5: 0,
                    7: 0
                };
            }

            const {threat, edgeTicks} = roomMemory,
                armySize = Math.ceil(threat / (BODYPART_COST[ATTACK] * 200));

            if (_.filter(hostiles, (h) => h.pos.x === 0).length > 0) {
                edgeTicks[TOP]++;
            }

            if (_.filter(hostiles, (h) => h.pos.x === 49).length > 0) {
                edgeTicks[BOTTOM]++;
            }

            if (_.filter(hostiles, (h) => h.pos.y === 0).length > 0) {
                edgeTicks[LEFT]++;
            }

            if (_.filter(hostiles, (h) => h.pos.y === 49).length > 0) {
                edgeTicks[RIGHT]++;
            }

            if (armySize > 0) {
                if (army) {
                    const attackTicks = Game.time - roomMemory.currentAttack,
                        exits = Game.map.describeExits(roomName);

                    if (attackTicks >= 500) {
                        army.boostRoom = roomName;

                        if (attackTicks >= 2000) {
                            const rooms = _.filter(Game.rooms, (r) => {
                                const {memory} = r;

                                return memory && memory.roomType && memory.roomType.type === "base" && memory.region === roomMemory.region;
                            });

                            _.forEach(rooms, (remoteRoom) => {
                                const {name: remoteRoomName} = remoteRoom,
                                    remoteArmyName = `${remoteRoomName}-defense-for-${roomName}`;

                                if (!Memory.army[`${remoteRoomName}-defense`] && !Memory.army[remoteArmyName]) {
                                    Commands.createArmy(remoteArmyName, {reinforce: false, region: roomMemory.region, boostRoom: roomName, buildRoom: roomName, stageRoom: roomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: 0, units: 20}, ranged: {maxCreeps: armySize, units: 20}});
                                }
                            });

                            if (attackTicks >= 2500) {
                                _.forEach(rooms, (remoteRoom) => {
                                    const {name: remoteRoomName} = remoteRoom,
                                        remoteArmyName = `${remoteRoomName}-defense-for-${roomName}`;

                                    if (Memory.army[remoteArmyName]) {
                                        Memory.army[remoteArmyName].boostRoom = remoteRoomName;
                                    }
                                });
                            }
                        }
                    }
                    _.forEach(Object.keys(exits), (dir) => {
                        const dirArmyName = `${roomName}-${dir.toString()}-border-defense`;

                        if (!Memory.army[dirArmyName] && edgeTicks[dir] >= 50) {
                            Commands.createArmy(dirArmyName, {reinforce: false, region: roomMemory.region, boostRoom: roomName, buildRoom: roomName, stageRoom: roomName, attackRoom: exits[dir], dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: 0, units: 20}, ranged: {maxCreeps: armySize, units: 20}});
                        }
                    });
                } else {
                    Game.notify(`Warning! ${roomName} is under attack!`);
                    Commands.createArmy(armyName, {reinforce: false, region: roomMemory.region, boostRoom: roomName, buildRoom: roomName, stageRoom: roomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: 0, units: 20}, ranged: {maxCreeps: armySize, units: 20}, creepCount: 0});
                }
            }
        } else if (army) {
            if (roomMemory.lastHostile + 50 < Game.time) {
                if (army) {
                    army.directive = "attack";
                    army.success = true;
                }
                delete roomMemory.lastHostile;
                delete roomMemory.currentAttack;
                delete roomMemory.edgeTicks;
            }
        } else {
            delete roomMemory.lastHostile;
            delete roomMemory.currentAttack;
            delete roomMemory.edgeTicks;
        }
    }
    /**
     * Transfers energy from links closest to the first spawn to remote links.
     * @return {void}
     */
    transferEnergy() {
        const {room} = this,
            links = Utilities.objectsClosestToObj(Cache.linksInRoom(room), Cache.spawnsInRoom(room)[0]),
            {0: firstLink} = links;

        _.forEach(links, (link, index) => {
            if (index === 0) {
                return;
            }

            if (!firstLink.cooldown && firstLink.energy > 0 && link.energy <= 300) {
                firstLink.transferEnergy(link);
            }
        });
    }
    /**
     * Make resource deals in the terminal.
     * @return {void}
     */
    terminal() {
        const {room} = this,
            {terminal, storage, name: roomName, memory} = room,
            {store: terminalStore} = terminal,
            terminalEnergy = terminalStore[RESOURCE_ENERGY] || 0,
            {market} = Game,
            maxEnergy = Math.max(..._.map(_.filter(Game.rooms, (r) => {
                const {memory: roomMemory, storage: roomStorage, terminal: roomTerminal} = r;

                return roomMemory && roomMemory.roomType && roomMemory.roomType.type === "base" && roomStorage && roomStorage.my && roomTerminal && roomTerminal.my;
            }), (r) => {
                const {storage: roomStorage} = r;

                return roomStorage && roomStorage.my ? roomStorage.store[RESOURCE_ENERGY] : 0;
            })),
            flips = [];
        let {buyQueue} = memory,
            dealMade = false,
            storageStore = {};

        if (storage) {
            ({store: storageStore} = storage);
        }

        if (terminalEnergy >= 1000 && maxEnergy >= Memory.dealEnergy) {
            const {reserveMinerals, mineralPrices} = Memory;

            if (buyQueue && maxEnergy > Memory.marketEnergy && Memory.buy) {
                const {resource: buyResource} = buyQueue,
                    {0: bestOrder} = Market.getFilteredOrders().sell[buyResource] || [];

                if (bestOrder) {
                    const {price: bestPrice} = bestOrder;

                    if (bestPrice > buyQueue.price) {
                        delete memory.buyQueue;
                        buyQueue = void 0;
                    } else {
                        const {amount: bestAmount} = bestOrder,
                            transCost = market.calcTransactionCost(Math.min(buyQueue.amount, bestAmount), roomName, bestOrder.roomName);

                        if (terminalEnergy > transCost && Cache.credits >= buyQueue.amount * bestPrice) {
                            Market.deal(bestOrder.id, Math.min(buyQueue.amount, bestAmount), roomName);
                            dealMade = true;
                            buyQueue.amount -= Math.min(buyQueue.amount, bestAmount);
                        } else if (terminalEnergy > 0) {
                            const amount = Math.min(Math.floor(Math.min(buyQueue.amount, bestAmount) * terminalEnergy / transCost), Math.floor(Cache.credits / bestPrice));

                            if (amount > 0) {
                                Market.deal(bestOrder.id, amount, roomName);
                                dealMade = true;
                                buyQueue.amount -= amount;
                            }
                        }
                    }
                } else {
                    delete memory.buyQueue;
                    buyQueue = void 0;
                }

                if (buyQueue && buyQueue.amount <= 0) {
                    delete memory.buyQueue;
                    buyQueue = void 0;
                }
            } else {
                if (Cache.credits >= Memory.minimumCredits) {
                    _.forEach(_.filter(Game.rooms, (gameRoom) => {
                        const {memory: gameRoomMemory, terminal: gameRoomTerminal} = gameRoom;

                        return gameRoomMemory && gameRoomMemory.roomType && gameRoomMemory.roomType.type === "base" && gameRoomTerminal && gameRoomTerminal.my;
                    }), (otherRoom) => {
                        const {name: otherRoomName, storage: otherRoomStorage} = otherRoom;

                        dealMade = false;
                        if (roomName === otherRoomName) {
                            return true;
                        }

                        _.forEach(_.filter(_.map(terminalStore, (s, k) => ({
                            resource: k,
                            amount: Math.min(reserveMinerals ? s + storageStore[k] - (k.startsWith("X") && k.length === 5 ? reserveMinerals[k] - 5000 : reserveMinerals[k]) : 0, s),
                            otherRoomAmount: (otherRoom.terminal.store[k] || 0) + (otherRoomStorage && otherRoomStorage.store[k] || 0),
                            needed: reserveMinerals ? (k.startsWith("X") && k.length === 5 ? reserveMinerals[k] - 5000 : reserveMinerals[k]) || 0 : 0
                        })), (r) => {
                            const {otherRoomAmount, needed, amount} = r;

                            return reserveMinerals[r.resource] && otherRoomAmount < needed && amount > 0 && needed - otherRoomAmount > 0 && Math.min(amount, needed - otherRoomAmount) >= 100;
                        }), (resource) => {
                            const {resource: resourceResource} = resource;
                            let amount = Math.min(resource.amount, resource.needed - resource.otherRoomAmount);
                            const transCost = market.calcTransactionCost(amount, roomName, otherRoomName);

                            if (terminalEnergy > transCost) {
                                if (terminal.send(resourceResource, amount, otherRoomName) === OK) {
                                    dealMade = true;

                                    return false;
                                }
                            } else if (terminalEnergy > 0) {
                                amount = Math.floor(amount * terminalEnergy / transCost);
                                if (amount > 0) {
                                    if (terminal.send(resourceResource, amount, otherRoomName) === OK) {
                                        dealMade = true;

                                        return false;
                                    }
                                }
                            }

                            return true;
                        });

                        return !dealMade;
                    });
                }
                if (!dealMade) {
                    const terminalMinerals = _.filter(_.map(terminalStore, (s, k) => ({resource: k, amount: Math.min(s, s - (reserveMinerals ? (k.startsWith("X") && k.length === 5 ? reserveMinerals[k] - 5000 : reserveMinerals[k]) || 0 : 0) + (storageStore[k] || 0))})), (s) => s.resource !== RESOURCE_ENERGY && s.amount > 0);

                    if (terminalMinerals.length > 0) {
                        _.forEach(terminalMinerals.sort((a, b) => b.amount - a.amount), (topResource) => {
                            const {resource} = topResource,
                                mineralPrice = _.find(mineralPrices, (m) => m.resource === resource),
                                {0: bestOrder} = _.filter(Market.getFilteredOrders().buy[resource] || [], (o) => topResource.amount >= 5005 && Cache.credits < Memory.minimumCredits || mineralPrice && o.price > mineralPrice.value);

                            if (bestOrder) {
                                const {amount: bestAmount} = bestOrder,
                                    transCost = market.calcTransactionCost(Math.min(topResource.amount, bestAmount), roomName, bestOrder.roomName);

                                if (terminalEnergy > transCost) {
                                    Market.deal(bestOrder.id, Math.min(topResource.amount, bestAmount), roomName);
                                    dealMade = true;

                                    return false;
                                } else if (terminalEnergy > 0) {
                                    const amount = Math.floor(Math.min(topResource.amount, bestAmount) * terminalEnergy / transCost);

                                    if (amount > 0) {
                                        Market.deal(bestOrder.id, amount, roomName);
                                        dealMade = true;

                                        return false;
                                    }
                                }
                            }

                            return true;
                        });
                    }
                }
                if (!dealMade && storage && maxEnergy > Memory.marketEnergy && (!Memory.buy || _.filter(Game.rooms, (r) => r.memory.buyQueue).length === 0)) {
                    const filteredOrders = Market.getFilteredOrders();

                    _.forEach(Minerals, (children, resource) => {
                        if (!storageStore || (storageStore[resource] || 0) < reserveMinerals[resource]) {
                            return;
                        }
                        if ([RESOURCE_ENERGY, SUBSCRIPTION_TOKEN].indexOf(resource) !== -1) {
                            return;
                        }
                        const {0: sellOrder} = filteredOrders.sell[resource] || [],
                            {0: buyOrder} = filteredOrders.buy[resource] || [],
                            mineralPrice = _.find(mineralPrices, (m) => m.resource === resource);

                        if (sellOrder && buyOrder && sellOrder.price < buyOrder.price && sellOrder.price < Cache.credits && (!mineralPrice || sellOrder.price <= mineralPrice.value && buyOrder.price >= mineralPrice.value)) {
                            flips.push({resource, buy: buyOrder, sell: sellOrder});
                        }
                    });

                    _.forEach(flips.sort((a, b) => a.sell.price - a.buy.price - (b.sell.price - b.buy.price)), (flip, index) => {
                        const {sell, buy} = flip,
                            {price: sellPrice} = sell;
                        let amount = Math.min(buy.amount, sell.amount);

                        if (amount * sellPrice > Cache.credits) {
                            amount = Math.floor(Cache.credits / sellPrice);
                        }

                        if (index === 0) {
                        }
                        const transCost = market.calcTransactionCost(amount, roomName, sell.roomName);

                        if (terminalEnergy > transCost) {
                            Market.deal(sell.id, amount, roomName);
                            dealMade = true;

                            return false;
                        }

                        if (terminalEnergy > 0) {
                            amount = Math.floor(amount * terminalEnergy / transCost);
                            if (amount > 0) {
                                Market.deal(sell.id, amount, roomName);
                                dealMade = true;

                                return false;
                            }
                        }

                        return true;
                    });
                }
            }
        }
    }
    /**
     * Compile the tasks available for this room.
     * @return {void}
     */
    tasks() {
        const {room} = this,
            {controller, storage, terminal, memory: roomMemory, name: roomName} = room,
            rcl = controller ? controller.level : void 0,
            extensionEnergyCapacity = rcl ? EXTENSION_ENERGY_CAPACITY[rcl] : 0,
            {0: nuker} = Cache.nukersInRoom(room),
            {0: powerSpawn} = Cache.powerSpawnsInRoom(room),
            terminalEnergy = terminal ? terminal.store[RESOURCE_ENERGY] : 0,
            store = storage ? storage.store : void 0,
            {labsInUse, labQueue} = roomMemory,
            labs = Cache.labsInRoom(room),
            labAmount = labQueue ? labQueue.amount : void 0,
            {reserveMinerals} = Memory,
            links = Cache.linksInRoom(room),
            spawns = Cache.spawnsInRoom(room);
        let status, sourceLabs, lab0, lab1;

        this.tasks = {
            constructionSites: room.find(FIND_MY_CONSTRUCTION_SITES),
            criticalRepairableStructures: Cache.criticalRepairableStructuresInRoom(room),
            extensions: _.filter(Cache.extensionsInRoom(room), (e) => e.energy < extensionEnergyCapacity),
            hostiles: Cache.hostilesInRoom(room),
            hurtCreeps: _.filter(Game.creeps, (c) => c.room.name === roomName && c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax),
            labsCollectMinerals: [],
            nuker,
            nukerResourcesNeeded: {},
            powerSpawn,
            powerSpawnResourcesNeeded: {},
            repairableStructures: _.filter(Cache.sortedRepairableStructuresInRoom(room), (s) => s.hits / s.hitsMax < 0.9 || s.hitsMax - s.hits > 100000),
            spawns: _.filter(Cache.spawnsInRoom(room), (s) => s.energy < SPAWN_ENERGY_CAPACITY),
            structuresWithEnergy: [...storage && storage.my ? [storage] : [], ..._.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] >= 500).sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY])],
            structuresWithMinerals: _.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] < _.sum(c.store)).sort((a, b) => _.sum(b.store) - _.sum(a.store)),
            terminalsCollectEnergy: terminal && (!terminal.my || terminalEnergy >= 10000 && (!roomMemory.buyQueue || !storage || store[RESOURCE_ENERGY] < Memory.marketEnergy || Cache.credits < Memory.minimumCredits)) ? [terminal] : [],
            terminalsFillWithEnergy: terminal && terminal.my && terminalEnergy < 5000 ? [terminal] : [],
            towers: _.filter(Cache.towersInRoom(room), (t) => t.energy < TOWER_CAPACITY * 0.8)
        };

        const {tasks} = this;

        if (tasks.structuresWithEnergy.length > 0) {
            _.forEach(Cache.creeps[roomName].storer, (storer) => {
                storer.memory.lastCollectEnergyWasStorage = false;
            });
        }

        tasks.quickConstructionSites = _.filter(tasks.constructionSites, (s) => s.progressTotal === 1);
        if (storage && storage.my) {
            if (!terminal || !terminal.my) {
                tasks.storageResourcesNeeded = void 0;
            } else if (_.sum(store) < storage.storeCapacity && reserveMinerals) {
                tasks.storageResourcesNeeded = {};
                _.forEach(Object.keys(reserveMinerals), (resource) => {
                    const {[resource]: reserveMineralsResource} = reserveMinerals,
                        amount = (resource.startsWith("X") && resource.length === 5 ? reserveMineralsResource - 5000 : reserveMineralsResource) - (store[resource] || 0);

                    if (amount > 0) {
                        tasks.storageResourcesNeeded[resource] = amount;
                    }
                });
            }
        }
        if (nuker) {
            tasks.nukerResourcesNeeded[RESOURCE_GHODIUM] = nuker.ghodiumCapacity - nuker.ghodium;
        }
        if (powerSpawn.power / powerSpawn.powerCapacity < 0.5) {
            tasks.powerSpawnResourcesNeeded[RESOURCE_POWER] = powerSpawn.powerCapacity - powerSpawn.power;
        }
        if (labQueue) {
            ({status, sourceLabs} = labQueue);
            if (sourceLabs) {
                lab0 = Game.getObjectById(sourceLabs[0]);
                lab1 = Game.getObjectById(sourceLabs[1]);
            }
        }

        const {labsCollectMinerals} = tasks;

        if (labsInUse) {
            _.forEach(labsInUse, (lab) => {
                if (!Game.creeps[lab.creepToBoost]) {
                    labsCollectMinerals.push(Game.getObjectById(lab.id));
                }
            });

            _.forEach(labsCollectMinerals, (task) => {
                _.remove(labsInUse, (l) => l.id === task.id);
            });
        }

        if (storage && labQueue && status === "clearing") {
            _.forEach(_.filter(labs, (l) => _.map(labsInUse, (liu) => liu.id).indexOf(l.id) === -1 && l.mineralAmount > 0), (lab) => {
                labsCollectMinerals.push(lab);
            });
        }

        if (storage && labsInUse) {
            _.forEach(_.filter(labsInUse, (l) => {
                const lab = Game.getObjectById(l.id);

                return (!l.status || l.status === "emptying") && lab && lab.mineralType && lab.mineralType !== l.resource;
            }), (lab) => {
                labsCollectMinerals.push(Game.getObjectById(lab.id));
            });
        }

        if (storage && labQueue && sourceLabs && status === "creating" && !Utilities.roomLabsArePaused(room)) {
            const {mineralAmount: lab0Amount} = lab0,
                {mineralAmount: lab1Amount} = lab1;

            if (lab0Amount === 0 && lab1Amount !== 0) {
                labsCollectMinerals.push(lab1);
            }
            if (lab0Amount !== 0 && lab1Amount === 0) {
                labsCollectMinerals.push(lab0);
            }
        }

        if (storage && (!labQueue || status === "returning")) {
            _.forEach(_.filter(labs, (l) => (!labQueue || l.mineralType === labQueue.resource) && (!labsInUse || _.filter(labsInUse, (liu) => liu.id === l.id).length === 0)), (lab) => {
                labsCollectMinerals.push(lab);
            });
        }
        if (labsInUse) {
            _.forEach(_.filter(labsInUse, (l) => {
                const lab = Game.getObjectById(l.id),
                    {status: labStatus} = l;

                return (!labStatus || ["filling", "refilling"].indexOf(labStatus) !== -1) && (!lab.mineralType || lab.mineralType === (labStatus === "refilling" ? l.oldResource : l.resource)) && lab.mineralAmount < (labStatus === "refilling" ? l.oldAmount : l.amount);
            }), (labInUse) => {
                const {status: labStatus} = labInUse,
                    lab = Game.getObjectById(labInUse.id);

                tasks.labsFillMinerals = lab;
                tasks.labsFillMineralsResourcesNeeded = {};
                tasks.labsFillMineralsResourcesNeeded[labStatus === "refilling" ? labInUse.oldResource : labInUse.resource] = (labStatus === "refilling" ? labInUse.oldAmount : labInUse.amount) - lab.mineralAmount;

                return false;
            });
        }

        if (!tasks.labsFillMinerals && storage && labs.length >= 3 && labQueue && ["moving", "creating"].indexOf(labQueue.status) !== -1 && sourceLabs && !Utilities.roomLabsArePaused(room)) {
            if (lab0.mineralAmount < labAmount) {
                tasks.labsFillMinerals = lab0;
                tasks.labsFillMineralsResourcesNeeded = {};
                tasks.labsFillMineralsResourcesNeeded[labQueue.children[0]] = labAmount - lab0.mineralAmount;
            }
            if (!tasks.labsFillMinerals && lab1.mineralAmount < labAmount) {
                tasks.labsFillMinerals = lab1;
                tasks.labsFillMineralsResourcesNeeded = {};
                tasks.labsFillMineralsResourcesNeeded[labQueue.children[1]] = labAmount - lab1.mineralAmount;
            }
        }
        if (storage && terminal && reserveMinerals) {
            _.forEach(terminal.store, (amount, resource) => {
                if (resource === RESOURCE_ENERGY) {
                    return;
                }

                const {[resource]: reserveMineralsResource} = reserveMinerals;

                if (!reserveMineralsResource) {
                    return;
                }
                if (!store[resource]) {
                    tasks.terminalCollectMinerals = [terminal];
                    tasks.terminalCollectMineralsResource = resource;
                    tasks.terminalCollectMineralsAmount = Math.min(amount, resource.startsWith("X") && resource.length === 5 ? reserveMineralsResource - 5000 : reserveMineralsResource);
                } else if (store[resource] < (resource.startsWith("X") && resource.length === 5 ? Memory.reserveMinerals[resource] - 5000 : Memory.reserveMinerals[resource])) {
                    tasks.terminalCollectMinerals = [terminal];
                    tasks.terminalCollectMineralsResource = resource;
                    tasks.terminalCollectMineralsAmount = Math.min(amount, (resource.startsWith("X") && resource.length === 5 ? reserveMineralsResource - 5000 : reserveMineralsResource) - store[resource]);
                }
            });
        }
        if (controller && rcl >= 6) {
            if (storage && labsInUse) {
                _.forEach(_.filter(labsInUse, (l) => {
                    const {status: labStatus} = l,
                        lab = Game.getObjectById(l.id);

                    return (!labStatus || ["filling", "refilling"].indexOf(labStatus) !== -1) && (!lab.mineralType || lab.mineralType === (labStatus === "refilling" ? l.oldResource : l.resource));
                }), (l) => {
                    const {status: labStatus} = l,
                        lab = Game.getObjectById(l.id);

                    if ((labStatus === "refilling" ? l.oldAmount - lab.mineralAmount : l.amount - lab.mineralAmount) > 0) {
                        tasks.storageCollectMinerals = [storage];
                        tasks.storageCollectMineralsResource = labStatus === "refilling" ? l.oldResource : l.resource;
                        tasks.storageCollectMineralsAmount = labStatus === "refilling" ? l.oldAmount - lab.mineralAmount : l.amount - lab.mineralAmount;

                        return false;
                    }

                    return true;
                });
            }
            if (!tasks.storageCollectMinerals && storage && labQueue && ["moving", "creating"].indexOf(labQueue.status) !== -1 && labs.length >= 3 && !Utilities.roomLabsArePaused(room)) {
                _.forEach(labQueue.children, (resource) => {
                    const amount = _.sum(_.filter(labs, (l) => l.mineralType === resource), (l) => l.mineralAmount);

                    if (amount < labAmount) {
                        tasks.storageCollectMinerals = [storage];
                        tasks.storageCollectMineralsResource = resource;
                        tasks.storageCollectMineralsAmount = labAmount - amount;

                        return false;
                    }

                    return true;
                });
            }
            if (!tasks.storageCollectMinerals && storage && terminal && reserveMinerals) {
                _.forEach(store, (amount, resource) => {
                    if (resource === RESOURCE_ENERGY) {
                        return true;
                    }

                    const {[resource]: reserveMineralsResource} = reserveMinerals;

                    if (!reserveMineralsResource) {
                        tasks.storageCollectMinerals = [storage];
                        tasks.storageCollectMineralsResource = resource;
                        tasks.storageCollectMineralsAmount = amount;

                        return false;
                    } else if ((resource.startsWith("X") && resource.length === 5 ? reserveMineralsResource - 5000 : reserveMineralsResource) < amount) {
                        tasks.storageCollectMinerals = [storage];
                        tasks.storageCollectMineralsResource = resource;
                        tasks.storageCollectMineralsAmount = amount - (resource.startsWith("X") && resource.length === 5 ? reserveMineralsResource - 5000 : reserveMineralsResource);

                        return false;
                    }

                    return true;
                });
            }

            if (!tasks.storageCollectMinerals) {
                if (nuker && rcl >= 8 && nuker.ghodium < nuker.ghodiumCapacity && store[RESOURCE_GHODIUM]) {
                    tasks.storageCollectMinerals = [storage];
                    tasks.storageCollectMineralsResource = RESOURCE_GHODIUM;
                    tasks.storageCollectMineralsAmount = Math.min(nuker.ghodiumCapacity - nuker.ghodium, store[RESOURCE_GHODIUM]);
                } else if (powerSpawn && rcl >= 8 && powerSpawn.power / powerSpawn.powerCapacity < 0.5 && store[RESOURCE_POWER]) {
                    tasks.storageCollectMinerals = [storage];
                    tasks.storageCollectMineralsResource = RESOURCE_POWER;
                    tasks.storageCollectMineralsAmount = Math.min(powerSpawn.powerCapacity - powerSpawn.power, store[RESOURCE_POWER]);
                }
            }
        }
        if (links.length > 1 && spawns.length > 0) {
            tasks.links = Utilities.objectsClosestToObj(links, spawns[0]);
        }
    }
    /**
     * Spawns needed creeps.
     * @param {bool} canSpawn Whether to spawn creeps this turn.
     * @return {void}
     */
    spawn(canSpawn) {
        const {room, tasks} = this,
            {storage, storage: {store: {[RESOURCE_ENERGY]: energy}}, controller, name: roomName} = room,
            {level: rcl} = controller,
            {dismantle} = Memory;

        this.checkSpawn(RoleWorker, canSpawn && (!storage || energy >= Memory.workerEnergy || controller.ticksToDowngrade < 3500 || room.find(FIND_MY_CONSTRUCTION_SITES).length > 0 || tasks.criticalRepairableStructures && tasks.criticalRepairableStructures.length > 0 || tasks.repairableStructures && _.filter(tasks.repairableStructures, (s) => [STRUCTURE_WALL, STRUCTURE_RAMPART].indexOf(s.structureType) !== 1 && s.hits < 1000000).length > 0));
        this.checkSpawn(RoleMiner, canSpawn);
        this.checkSpawn(RoleStorer, canSpawn);
        this.checkSpawn(RoleScientist, canSpawn && rcl >= 6);
        this.checkSpawn(RoleDismantler, canSpawn && !!(dismantle && dismantle[roomName] && dismantle[roomName].length > 0));
        this.checkSpawn(RoleCollector, canSpawn);
        this.checkSpawn(RoleClaimer, canSpawn);
        this.checkSpawn(RoleDowngrader, canSpawn);
        this.checkSpawn(RoleUpgrader, canSpawn && (energy >= Memory.upgradeEnergy || rcl < 8 || _.filter(Game.rooms, (r) => {
            const {controller: roomController} = r;

            return roomController && roomController.my && roomController.level < 8;
        }).length > 0));
    }
    /**
     * Assigns tasks to creeps.
     * @return {void}
     */
    assignTasks() {
        RoleWorker.assignTasks(this);
        RoleMiner.assignTasks(this);
        RoleStorer.assignTasks(this);
        RoleScientist.assignTasks(this);
        RoleDismantler.assignTasks(this);
        RoleCollector.assignTasks(this);
        RoleClaimer.assignTasks(this);
        RoleDowngrader.assignTasks(this);
        RoleUpgrader.assignTasks(this);

        Tower.assignTasks(this);
    }
    /**
     * Processes the lab queue.
     * @return {void}
     */
    labQueue() {
        const {room, room: {memory}} = this;
        let {labQueue} = memory;
        const {status} = labQueue;

        if (status === "clearing") {
            const {labsInUse} = memory,
                labs = Cache.labsInRoom(room);

            if (!labsInUse || labs.length - labsInUse.length > 2 && _.filter(labs, (l) => _.filter(labsInUse, (u) => u.id === l.id).length === 0 && l.mineralAmount > 0).length === 0) {
                labQueue.status = "moving";
            }
        } else if (status === "moving") {
            if (!labQueue.start || labQueue.start + 500 < Game.time) {
                delete memory.labQueue;
                labQueue = void 0;
            } else {
                const children = labQueue.children || [],
                    labs = Cache.labsInRoom(room),
                    sourceLabs = labQueue.sourceLabs || [],
                    sourceLab0 = Game.getObjectById(sourceLabs[0]),
                    sourceLab1 = Game.getObjectById(sourceLabs[1]),
                    {labsInUse} = memory;
                let moved = true;

                _.forEach(children, (resource) => {
                    if (_.sum(_.filter(labs, (l) => l.mineralType === resource), (l) => l.mineralAmount) < labQueue.amount) {
                        moved = false;
                    }

                    return moved;
                });

                if (sourceLab0.mineralType === children[0] && sourceLab1.mineralType === children[1]) {
                    _.forEach(_.filter(labs, (l) => sourceLabs.indexOf(l.id) === -1 && (!labsInUse || _.map(_.filter(labsInUse, (liu) => liu.resource !== labQueue.resource), (liu) => liu.id).indexOf(l.id) === -1)), (lab) => {
                        if (lab.runReaction(sourceLab0, sourceLab1) === OK) {
                            labQueue.amount -= 5;
                        }
                    });
                }

                if (moved) {
                    labQueue.status = "creating";
                }
            }
        } else if (status === "creating") {
            const labs = Cache.labsInRoom(room),
                sourceLabs = labQueue.sourceLabs || [],
                {labsInUse} = memory,
                sourceLab0 = Game.getObjectById(sourceLabs[0]),
                sourceLab1 = Game.getObjectById(sourceLabs[1]);

            _.forEach(_.filter(labs, (l) => sourceLabs.indexOf(l.id) === -1 && (!labsInUse || _.map(_.filter(labsInUse, (liu) => liu.resource !== labQueue.resource), (liu) => liu.id).indexOf(l.id) === -1)), (lab) => {
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

            if (labQueue.amount <= 0) {
                delete memory.labQueue;
                labQueue = void 0;
            }
        } else if (status === "returning") {
            if (_.sum(_.filter(Cache.labsInRoom(room), (l) => l.mineralType === labQueue.resource), (l) => l.mineralAmount) === 0) {
                delete memory.labQueue;
                labQueue = void 0;
            }
        } else {
            labQueue.status = "clearing";
            labQueue.sourceLabs = Utilities.getSourceLabs(room);
        }
    }
    /**
     * Checks for labs in use and updates the queue with what needs to be done with them.
     * @return {void}
     */
    labsInUse() {
        const {room: {memory: {labsInUse}}} = this,
            boosted = [];

        _.forEach(labsInUse, (queue) => {
            const {status} = queue,
                lab = Game.getObjectById(queue.id);

            if (status === "emptying") {
                if (lab.mineralAmount === 0 || lab.mineralType === queue.resource) {
                    queue.status = "filling";
                }
            } else if (status === "filling") {
                if (lab.mineralAmount === queue.amount && lab.mineralType === queue.resource) {
                    queue.status = "waiting";
                }
            } else if (status === "refilling") {
                if (lab.mineralAmount === queue.oldAmount && lab.mineralType === queue.oldResource) {
                    boosted.push(queue);
                }
            } else {
                const {creeps: {[queue.creepToBoost]: creep}} = Game;

                if (lab.pos.getRangeTo(creep) <= 1 && lab.mineralType === queue.resource && lab.mineralAmount >= queue.amount) {
                    if (lab.boostCreep(creep) === OK) {
                        _.remove(creep.memory.labs, (l) => l === queue.id);
                        if (!status || queue.oldAmount === 0) {
                            boosted.push(queue);
                        } else {
                            queue.status = "refilling";
                        }
                    }
                }
            }
        });

        _.forEach(boosted, (queue) => {
            _.remove(labsInUse, (l) => l.id === queue.id);
        });
    }
    /**
     * Processes power in the room.
     * @return {void}
     */
    processPower() {
        _.forEach(Cache.powerSpawnsInRoom(this.room), (spawn) => {
            if (spawn.power >= 1 && spawn.energy >= 50) {
                spawn.processPower();
            }
        });
    }
    /**
     * Serialize the room to an object.
     * @return {void}
     */
    toObj() {
        Memory.rooms[this.room.name].roomType = {type: this.type};
    }
    /**
     * Deserializes room from an object.
     * @param {Room} room The room to deserialize from.
     * @return {RoomBase} The deserialized room.
     */
    static fromObj(room) {
        return new RoomBase(room);
    }
}

if (Memory.profiling) {
    __require(1,32).registerObject(RoomBase, "RoomBase");
}
module.exports = RoomBase;

return module.exports;
}
/********** End of module 32: ../src/room.base.js **********/
/********** Start module 33: ../src/room.cleanup.js **********/
__modules[33] = function(module, exports) {
const Cache = __require(3,33),
    Commands = __require(4,33),
    RoomEngine = __require(57,33),
    Utilities = __require(9,33),
    RoleRemoteDismantler = __require(23,33),
    RoleRemoteCollector = __require(22,33);
/**
 * A class that represents a cleanup room.
 */
class RoomCleanup extends RoomEngine {
    /**
     * Creates a new cleanup room.
     * @param {Room} room The room.
     */
    constructor(room) {
        super();
        this.type = "cleanup";
        this.room = room;
        ({rooms: {[Memory.rooms[room.name].roomType.supportRoom]: this.supportRoom}} = Game);
        if (!room.memory.maxCreeps) {
            room.memory.maxCreeps = {};
        }
    }
    /**
     * Run the room.
     * @return {void}
     */
    run() {
        if (!this.supportRoom) {
            return;
        }
        if (!this.room.unobservable) {
            this.tasks();
        }
        this.spawn();
        this.assignTasks();
    }
    tasks() {
        const {supportRoom, room, room: {name: roomName}} = this;

        this.tasks = {};
        const {tasks} = this;
        tasks.ramparts = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_RAMPART});
        tasks.structures = room.find(FIND_STRUCTURES, {filter: (s) => !(s.structureType === STRUCTURE_RAMPART) && !(s.structureType === STRUCTURE_CONTROLLER) && !(s.structureType === STRUCTURE_ROAD) && !(s.structureType === STRUCTURE_WALL) && (tasks.ramparts.length === 0 || s.pos.getRangeTo(Utilities.objectsClosestToObj(tasks.ramparts, s)[0]) > 0)});
        tasks.noResourceStructures = _.filter(tasks.structures, (s) => s.structureType === STRUCTURE_NUKER || (!s.energy || s.energy < 50) && (!s.store || _.sum(s.store) === 0) && (!s.mineralAmount || s.mineralAmount === 0));
        tasks.resourceStructures = _.filter(tasks.structures, (s) => s.structureType !== STRUCTURE_NUKER && (s.energy && s.energy > 0 || s.store && _.sum(s.store) > 0 || s.mineralAmount && s.mineralAmount > 0));
        tasks.junk = room.find(FIND_STRUCTURES, {filter: (s) => [STRUCTURE_WALL, STRUCTURE_ROAD].indexOf(s.structureType) !== -1});
        tasks.energyStructures = _.filter(tasks.resourceStructures, (s) => s.energy || s.store && s.store[RESOURCE_ENERGY]).sort((a, b) => (a.energy || a.store[RESOURCE_ENERGY]) - (b.energy || b.store[RESOURCE_ENERGY]));
        tasks.mineralStructures = _.filter(tasks.resourceStructures, (s) => (s.store || [STRUCTURE_LAB, STRUCTURE_POWER_SPAWN].indexOf(s.structureType) !== -1) && (_.sum(s.store) > 0 && s.store[RESOURCE_ENERGY] < _.sum(s.store) || s.mineralAmount > 0 || s.power > 0)).sort((a, b) => (a.mineralAmount || a.power || _.sum(a.store) - a.store[RESOURCE_ENERGY]) - (b.mineralAmount || b.power || _.sum(b.store) - b.store[RESOURCE_ENERGY]));
        tasks.resources = Cache.resourcesInRoom(room);
        tasks.dismantle = Array.prototype.concat.apply([], [tasks.noResourceStructures, tasks.ramparts, tasks.junk]);
        tasks.hostileConstructionSites = Cache.hostileConstructionSitesInRoom(room);

        if (tasks.resourceStructures.length === 0 && tasks.dismantle.length === 0 && tasks.resources.length === 0) {
            const {creeps: {[roomName]: creeps}} = Cache;
            Game.notify(`Cleanup Room ${roomName} is squeaky clean!`);
            _.forEach(creeps && creeps.remoteCollector || [], (creep) => {
                const {memory} = creep;

                memory.role = "storer";
                ({name: memory.home} = supportRoom);
            });
            _.forEach(creeps && creeps.remoteDismantler || [], (creep) => {
                creep.suicide();
            });
            Commands.setRoomType(roomName);

            delete Cache.rooms[roomName];
        }
    }
    spawn() {
        const {tasks} = this;
        this.checkSpawn(RoleRemoteDismantler, this.room.unobservable || tasks.structures.length > 0 || tasks.ramparts.length > 0 || tasks.length > 0);
        this.checkSpawn(RoleRemoteCollector, true);
    }
    /**
     * Assign tasks to creeps.
     * @return {void}
     */
    assignTasks() {
        RoleRemoteDismantler.assignTasks(this);
        RoleRemoteCollector.assignTasks(this);
    }
    /**
     * Serialize the room to an object.
     * @return {void}
     */
    toObj() {
        Memory.rooms[this.room.name].roomType = {
            type: this.type,
            supportRoom: this.supportRoom.name
        };
    }
    /**
     * Deserializes room from an object.
     * @param {Room} room The room to deserialize from.
     * @return {RoomCleanup} The deserialized room.
     */
    static fromObj(room) {
        return new RoomCleanup(room);
    }
}

if (Memory.profiling) {
    __require(1,33).registerObject(RoomCleanup, "RoomCleanup");
}
module.exports = RoomCleanup;

return module.exports;
}
/********** End of module 33: ../src/room.cleanup.js **********/
/********** Start module 34: ../src/room.mine.js **********/
__modules[34] = function(module, exports) {
const Cache = __require(3,34),
    Commands = __require(4,34),
    RoomEngine = __require(57,34),
    Utilities = __require(9,34),
    RoleDismantler = __require(17,34),
    RoleRemoteBuilder = __require(21,34),
    RoleRemoteMiner = __require(24,34),
    RoleRemoteReserver = __require(25,34),
    RoleRemoteStorer = __require(26,34),
    RoleRemoteWorker = __require(27,34);
/**
 * A class that represents a mine room.
 */
class RoomMine extends RoomEngine {
    /**
     * Creates a new mine room.
     * @param {Room} room The room.
     */
    constructor(room) {
        const {rooms: {[room.name]: roomMemory}} = Memory,
            {roomType} = roomMemory;

        super();
        this.type = "mine";
        this.room = room;
        ({rooms: {[roomType.supportRoom]: this.supportRoom}} = Game);
        this.stage = roomType.stage || 1;
        if (!room.memory.maxCreeps) {
            room.memory.maxCreeps = {};
        }
    }
    /**
     * Runs the room.
     * @return {void}
     */
    run() {
        const {room, room: {controller}} = this;
        if (!room.unobservable && room.find(FIND_SOURCES).length === 0) {
            return;
        }
        if (!Game.rooms[Memory.rooms[room.name].roomType.supportRoom]) {
            return;
        }
        if (this.type === "mine" && controller && controller.my) {
            this.convert();

            return;
        }

        if (this.stage === 1) {
            this.stage1();
        }

        if (this.stage === 2) {
            this.stage2();
        }
    }
    /**
     * Converts the mine to a base.
     * @return {void}
     */
    convert() {
        const {supportRoom: {name: supportRoomName}, room, room: {name: roomName}} = this,
            {rooms: {[roomName]: memory}} = Memory,
            {creeps: {[roomName]: creeps}} = Cache;

        Commands.claimRoom(supportRoomName, roomName, false);
        Commands.setRoomType(roomName, {type: "base", region: memory.region});

        _.forEach(creeps && creeps.all || [], (creep) => {
            const {memory: creepMemory} = creep;

            switch (creepMemory.role) {
                case "remoteBuilder":
                case "remoteWorker":
                    creepMemory.role = "worker";
                    creepMemory.home = roomName;
                    ({0: {id: creepMemory.homeSource}} = Utilities.objectsClosestToObj(room.find(FIND_SOURCES), creep));
                    break;
                case "remoteReserver":
                    creep.suicide();
                    break;
                case "remoteStorer":
                    creepMemory.role = "storer";
                    creepMemory.home = supportRoomName;
                    break;
                case "dismantler":
                    creepMemory.home = roomName;
                    creepMemory.supportRoom = roomName;
                    break;
            }
        });
    }
    /**
     * Runs the room while it is in stage 1.
     * @return {void}
     */
    stage1() {
        this.stage1Tasks();
        this.stage1Spawn();
        this.stage1AssignTasks();

        if (!this.room.unobservable) {
            this.stage1Manage();
            this.defend();
        }
    }
    /**
     * Tasks to perform while the room is in stage 1.
     * @return {void}
     */
    stage1Tasks() {
        const {room} = this;

        this.tasks = {};

        if (!room.unobservable) {
            this.tasks.hostiles = Cache.hostilesInRoom(room);
            this.tasks.hostileConstructionSites = Cache.hostileConstructionSitesInRoom(room);
        }
    }
    /**
     * Spawns creeps while the room is in stage 1.
     * @return {void}
     */
    stage1Spawn() {
        this.checkSpawn(RoleRemoteReserver, this.room.controller);
        this.checkSpawn(RoleRemoteBuilder, true);
    }
    /**
     * Assigns tasks to creeps while the room is in stage 1.
     * @return {void}
     */
    stage1AssignTasks() {
        const {room} = this;

        if (room.controller) {
            RoleRemoteReserver.assignTasks(this);
        }
        RoleRemoteBuilder.assignTasks(this);
        RoleRemoteMiner.assignTasks(this);
        RoleRemoteWorker.assignTasks(this);
        RoleRemoteStorer.assignTasks(this);
        RoleDismantler.assignTasks(this);
    }
    /**
     * Manages the room while it is in stage 1.
     * @return {void}
     */
    stage1Manage() {
        const {room, room: {name: roomName}} = this,
            minerals = room.find(FIND_MINERALS),
            energySources = room.find(FIND_SOURCES),
            sources = Array.prototype.concat.apply([], [energySources, (/^[EW][0-9]*[4-6][NS][0-9]*[4-6]$/).test(roomName) ? minerals : []]),
            containers = Cache.containersInRoom(room),
            allSources = Array.prototype.concat.apply([], [energySources, minerals]),
            {creeps: {[roomName]: creeps}} = Cache;
        if (containers.length >= sources.length) {
            this.stage = 2;
            _.forEach(containers, (container) => {
                const {0: source} = Utilities.objectsClosestToObj(allSources, container);
                if (source instanceof Mineral) {
                    return true;
                }
                _.forEach(creeps && creeps.remoteBuilder || [], (creep) => {
                    const {memory} = creep;

                    memory.role = "remoteWorker";
                    ({0: {id: memory.container}} = Utilities.objectsClosestToObj(containers, source));
                });

                return false;
            });

            return;
        }
        const sites = room.find(FIND_MY_CONSTRUCTION_SITES);

        if (sites.length === 0) {
            _.forEach(sources, (source) => {
                const {path: {0: location}} = PathFinder.search(source.pos, {pos: Cache.spawnsInRoom(this.supportRoom)[0].pos, range: 1}, {swampCost: 1});

                if (
                    _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                    _.filter(sites, (s) => s.pos.x === location.x && s.pos.y === location.y && s.structureType === STRUCTURE_CONTAINER).length === 0
                ) {
                    room.createConstructionSite(location.x, location.y, STRUCTURE_CONTAINER);
                }
            });
        }
    }
    /**
     * Defends the room from invaders.
     * @return {void}
     */
    defend() {
        const {room, room: {name: roomName, memory: {threat}}, supportRoom, supportRoom: {name: supportRoomName}} = this,
            armyName = `${roomName}-defense`,
            hostiles = Cache.hostilesInRoom(room),
            {armies: {[armyName]: army}} = Cache;

        if (_.filter(hostiles, (h) => h.owner && h.owner.username !== "Invader").length > 0 && threat && threat > 0) {
            const maxCreeps = Math.ceil(threat / (BODYPART_COST[ATTACK] * 300));

            if (army) {
                army.boostRoom = supportRoomName;
                army.healer.maxCreeps = 2 * maxCreeps;
                army.melee.maxCreeps = maxCreeps;
                army.melee.escort = true;
                army.ranged.maxCreeps = maxCreeps;
                army.ranged.escort = true;
                army.success = false;
                army.reinforce = true;
            } else {
                Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: supportRoomName, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: maxCreeps * 2, units: 20}, melee: {maxCreeps, units: 20, escort: true}, ranged: {maxCreeps, units: 20, escort: true}});
            }
        } else if (_.filter(hostiles, (h) => h.owner && h.owner.username === "Invader").length > 0) {
            if (!army) {
                const {energyCapacityAvailable} = supportRoom;

                Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: void 0, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: 1, units: Math.min(Math.floor((energyCapacityAvailable - 300) / 300), 20)}, melee: {maxCreeps: 1, units: Math.min(Math.floor((energyCapacityAvailable - 300) / 130), 20)}, ranged: {maxCreeps: 0, units: 20}});
            }
        } else if (army) {
            army.directive = "attack";
            army.success = true;
            army.reinforce = false;
        }
    }
    /**
     * Runs the room while it is in stage 2.
     * @return {void}
     */
    stage2() {
        this.stage2Manage();
        this.defend();

        if (this.stage === 1) {
            return;
        }
        this.stage2Tasks();
        if (!this.room.unobservable) {
            this.stage2Spawn();
        }
        this.stage2AssignTasks();
    }
    /**
     * Manages the room while it is in stage 2.
     * @return {void}
     */
    stage2Manage() {
        const {room, room: {name: roomName}} = this,
            {creeps: {[roomName]: creeps}} = Cache;
        if (room.unobservable) {
            if (
                (creeps && creeps.remoteMiner || []).length === 0 &&
                (creeps && creeps.remoteWorker || []).length === 0 &&
                (creeps && creeps.remoteStorer || []).length === 0 &&
                (creeps && creeps.remoteReserver || []).length === 0
            ) {
                this.stage = 1;
            }
        } else if (Cache.containersInRoom(room).length < Array.prototype.concat.apply([], [room.find(FIND_SOURCES), (/^[EW][0-9]*[4-6][NS][0-9]*[4-6]$/).test(room.name) ? room.find(FIND_MINERALS) : []]).length) {
            this.stage = 1;
        }
    }
    /**
     * Tasks to perform while the room is in stage 2.
     * @return {void}
     */
    stage2Tasks() {
        const {room} = this;

        this.tasks = {};

        if (!room.unobservable) {
            this.tasks.hostiles = Cache.hostilesInRoom(room);
            this.tasks.hostileConstructionSites = Cache.hostileConstructionSitesInRoom(room);
            this.tasks.energyStructures = Cache.containersInRoom(room);
            this.tasks.mineralStructures = Cache.containersInRoom(room);
        }
    }
    /**
     * Spawns creeps while the room is in stage 2.
     * @return {void}
     */
    stage2Spawn() {
        const {room} = this;
        if (Cache.hostilesInRoom(room).length > 0) {
            return;
        }

        const {dismantle, dismantle: {[room.name]: dismantleRoom}} = Memory;

        this.checkSpawn(RoleRemoteReserver, room.controller);
        this.checkSpawn(RoleRemoteMiner, true);
        this.checkSpawn(RoleRemoteWorker, true);
        this.checkSpawn(RoleRemoteStorer, true);
        this.checkSpawn(RoleDismantler, !!(dismantle && dismantleRoom && dismantleRoom.length > 0));
    }
    /**
     * Assigns tasks to creeps while the room is in stage 2.
     * @return {void}
     */
    stage2AssignTasks() {
        const {room} = this;

        if (room.controller) {
            RoleRemoteReserver.assignTasks(this);
        }
        RoleRemoteMiner.assignTasks(this);
        RoleRemoteWorker.assignTasks(this);
        RoleRemoteStorer.assignTasks(this);
        RoleDismantler.assignTasks(this);
    }
    /**
     * Serialize the room to an object.
     * @return {void}
     */
    toObj() {
        Memory.rooms[this.room.name].roomType = {
            type: this.type,
            supportRoom: this.supportRoom.name,
            stage: this.stage
        };
    }
    /**
     * Deserializes room from an object.
     * @param {Room} room The room to deserialize from.
     * @return {RoomMine} The deserialized room.
     */
    static fromObj(room) {
        return new RoomMine(room);
    }
}

if (Memory.profiling) {
    __require(1,34).registerObject(RoomMine, "RoomMine");
}
module.exports = RoomMine;

return module.exports;
}
/********** End of module 34: ../src/room.mine.js **********/
/********** Start module 35: ../src/room.source.js **********/
__modules[35] = function(module, exports) {
const Cache = __require(3,35),
    Commands = __require(4,35),
    RoomMine = __require(34,35),
    RoleDefender = __require(16,35),
    RoleHealer = __require(19,35),
    RoleRemoteCollector = __require(22,35);
/**
 * A class that represents a source room.
 */
class RoomSource extends RoomMine {
    /**
     * Creates a new source room.
     * @param {Room} room The room.
     */
    constructor(room) {
        super(room);

        this.type = "source";
        delete this.convert;
    }
    /**
     * Tasks to perform while the room is in stage 1.
     * @return {void}
     */
    stage1Tasks() {
        const {room} = this;

        super.stage1Tasks();

        if (!room.unobservable) {
            this.tasks.keepers = Cache.sourceKeepersInRoom(room);
            this.tasks.hurtCreeps = _.filter(Game.creeps, (c) => c.room.name === room.name && c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax);
        }
    }
    /**
     * Spawns creeps while the room is in stage 1.
     * @return {void}
     */
    stage1Spawn() {
        const {room, room: {name: roomName}} = this,
            {creeps: {[roomName]: creeps}} = Cache,
            defenders = creeps && creeps.defender || [];

        if (!room.unobservable) {
            this.checkSpawn(RoleDefender, true);
            this.checkSpawn(RoleHealer, true);

            if (!creeps || !defenders || _.filter(defenders, (c) => !c.spawning).length === 0) {
                return;
            }
        }
        super.stage1Spawn();
    }
    /**
     * Assigns tasks to creeps while the room is in stage 1.
     * @return {void}
     */
    stage1AssignTasks() {
        RoleDefender.assignTasks(this);
        RoleHealer.assignTasks(this);
        super.stage1AssignTasks(this);
    }
    /**
     * Defends the room from invaders.
     * @return {void}
     */
    defend() {
        const {room, room: {name: roomName}, supportRoom: {name: supportRoomName}} = this,
            armyName = `${roomName}-defense`,
            {army: {[armyName]: army}} = Memory;

        if (_.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username === "Invader").length > 0) {
            if (!army) {
                Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: void 0, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: 2, units: 17}, melee: {maxCreeps: 2, units: 20}, ranged: {maxCreeps: 0, units: 20}});
            }
        } else if (army) {
            army.directive = "attack";
            army.success = true;
        }
    }
    /**
     * Tasks to perform while the room is in stage 2.
     * @return {void}
     */
    stage2Tasks() {
        const {room} = this;

        super.stage2Tasks();

        if (!room.unobservable) {
            this.tasks.keepers = Cache.sourceKeepersInRoom(room).sort((a, b) => {
                if (a.ticksToSpawn && !b.ticksToSpawn) {
                    return -1;
                }

                if (!a.ticksToSpawn && b.ticksToSpawn) {
                    return 1;
                }

                return a.ticksToSpawn - b.ticksToSpawn;
            });
            this.tasks.hurtCreeps = _.filter(Game.creeps, (c) => c.room.name === room.name && c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax);
        }
    }
    /**
     * Spawns creeps while the room is in stage 2.
     * @return {void}
     */
    stage2Spawn() {
        const {room, room: {name: roomName}} = this,
            {creeps: {[roomName]: creeps}} = Cache,
            defenders = creeps && creeps.defender || [];

        if (!room.unobservable) {
            this.checkSpawn(RoleDefender, true);
            this.checkSpawn(RoleHealer, true);

            if (!creeps || !defenders || _.filter(defenders, (c) => !c.spawning).length === 0) {
                return;
            }
            super.stage2Spawn();

            this.checkSpawn(RoleRemoteCollector, true);
        }
    }
    /**
     * Assigns tasks to creeps while the room is in stage 2.
     * @return {void}
     */
    stage2AssignTasks() {
        RoleDefender.assignTasks(this);
        RoleHealer.assignTasks(this);
        super.stage2AssignTasks();

        RoleRemoteCollector.assignTasks(this);
    }
    /**
     * Deserializes room from an object.
     * @param {Room} room The room to deserialize from.
     * @return {RoomSource} The deserialized room.
     */
    static fromObj(room) {
        return new RoomSource(room);
    }
}

if (Memory.profiling) {
    __require(1,35).registerObject(RoomSource, "RoomSource");
}
module.exports = RoomSource;

return module.exports;
}
/********** End of module 35: ../src/room.source.js **********/
/********** Start module 36: ../src/task.build.js **********/
__modules[36] = function(module, exports) {
const Cache = __require(3,36),
    Pathing = __require(58,36);
/**
 * A class that performs building.
 */
class TaskBuild {
    /**
     * Creates a new task.
     * @param {string} id The ID of the construction site.
     */
    constructor(id) {
        this.type = "build";
        this.id = id;
        this.constructionSite = Game.getObjectById(id);
        this.force = true;
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {constructionSite: site} = this;
        if (!creep.carry[RESOURCE_ENERGY] || !site || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;

            return;
        }
        Pathing.moveTo(creep, site, Math.max(Math.min(creep.pos.getRangeTo(site) - 1, 3), 1));
        if (creep.build(site, RESOURCE_ENERGY) === OK) {
            if (Math.min(creep.getActiveBodyparts(WORK) * 5, creep.carry[RESOURCE_ENERGY]) >= site.progressTotal - site.progress || creep.carry[RESOURCE_ENERGY] <= Math.min(creep.getActiveBodyparts(WORK) * 5)) {
                delete creep.memory.currentTask;
            }
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
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
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskBuild|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskBuild(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,36).registerObject(TaskBuild, "TaskBuild");
}
module.exports = TaskBuild;

return module.exports;
}
/********** End of module 36: ../src/task.build.js **********/
/********** Start module 37: ../src/task.claim.js **********/
__modules[37] = function(module, exports) {
const Cache = __require(3,37),
    Pathing = __require(58,37);
/**
 * A class that performs claiming a controller.
 */
class TaskClaim {
    /**
     * Creates a new task.
     * @param {string} id The ID of the controller.
     * @param {RoomPosition} [pos] The position of the controller.
     */
    constructor(id, pos) {
        const controller = Game.getObjectById(id);

        this.id = id;
        this.controller = controller;

        if (controller) {
            ({pos: this.pos} = controller);
        } else {
            this.pos = pos;
        }
        this.type = "claim";
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        const {controller} = this;

        if (creep.spawning || creep.memory.role !== "claimer" || !controller || controller.my || creep.getActiveBodyparts(CLAIM) === 0) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        if (!creep.getActiveBodyparts(CLAIM) === 0) {
            delete creep.memory.currentTask;

            return;
        }
        const {controller} = this;

        Pathing.moveTo(creep, this.pos, 1);
        if (controller) {
            creep.claimController(controller);
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
    toObj(creep) {
        creep.memory.currentTask = {
            id: this.id,
            x: this.x,
            y: this.y,
            roomName: this.roomName,
            type: this.type
        };
    }
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskClaim} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: task}} = creep;

        return new TaskClaim(task.id, new RoomPosition(task.x, task.y, task.roomName));
    }
}

if (Memory.profiling) {
    __require(1,37).registerObject(TaskClaim, "TaskClaim");
}
module.exports = TaskClaim;

return module.exports;
}
/********** End of module 37: ../src/task.claim.js **********/
/********** Start module 38: ../src/task.collectEnergy.js **********/
__modules[38] = function(module, exports) {
const Cache = __require(3,38),
    Pathing = __require(58,38);
/**
 * A class that performs collecting energy from a structure.
 */
class TaskCollectEnergy {
    /**
     * Creates a new task.
     * @param {string} id The ID of the structure.
     */
    constructor(id) {
        this.type = "collectEnergy";
        this.id = id;
        this.object = Game.getObjectById(id);
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        const {object: obj} = this;

        if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity) {
            return false;
        }

        if (!obj) {
            return false;
        }

        const energy = obj.energy || obj.store && obj.store[RESOURCE_ENERGY] || 0;

        if (energy === 0) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {object: obj} = this;
        if (creep.ticksToLive < 150 || !obj) {
            delete creep.memory.currentTask;

            return;
        }

        const energy = obj.energy || obj.store && obj.store[RESOURCE_ENERGY] || 0;
        if (_.sum(creep.carry) === creep.carryCapacity || energy === 0) {
            delete creep.memory.currentTask;

            return;
        }
        Pathing.moveTo(creep, obj, 1);
        if (creep.pos.getRangeTo(obj) === 1) {
            const resources = _.filter(obj.pos.lookFor(LOOK_RESOURCES), (r) => r.amount > 50);

            if (resources.length > 0) {
                creep.pickup(resources[0]);

                return;
            }
        }

        if (creep.withdraw(obj, RESOURCE_ENERGY) === OK) {
            delete creep.memory.currentTask;
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
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
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskCollectEnergy|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskCollectEnergy(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,38).registerObject(TaskCollectEnergy, "TaskCollectEnergy");
}
module.exports = TaskCollectEnergy;

return module.exports;
}
/********** End of module 38: ../src/task.collectEnergy.js **********/
/********** Start module 39: ../src/task.collectMinerals.js **********/
__modules[39] = function(module, exports) {
const Cache = __require(3,39),
    Pathing = __require(58,39);
/**
 * A class that performs collecting minerals from a structure.
 */
class TaskCollectMinerals {
    /**
     * Creates a new task.
     * @param {string} id The ID of the structure.
     * @param {string} [resource] The resource to collect.
     * @param {number} [amount] The amount of resource to collect.
     */
    constructor(id, resource, amount) {
        this.type = "collectMinerals";
        this.id = id;
        this.resource = resource;
        this.amount = amount;
        this.object = Game.getObjectById(id);
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        const {object: obj} = this;

        if (!obj || this.amount < 0 || creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || creep.carry[RESOURCE_ENERGY] > 0) {
            return false;
        }

        const isLab = obj.structureType === STRUCTURE_LAB,
            {mineralAmount, store} = obj;

        if (isLab && mineralAmount === 0 || obj.store && _.sum(store) === store[RESOURCE_ENERGY]) {
            return false;
        }

        const {resource, amount} = this;

        if (resource && this.amount) {
            if (isLab && obj.mineralType !== resource && mineralAmount < amount) {
                return false;
            }

            if (!isLab && (store[resource] || 0) < amount) {
                return false;
            }
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {object: obj, resource, amount} = this,
            {carryCapacity} = creep,
            carry = _.sum(creep.carry);
        let minerals;
        if (amount < 0 || creep.ticksToLive < 150 || !obj) {
            delete creep.memory.currentTask;

            return;
        }

        const {store: objStore} = obj;
        if (carry === carryCapacity) {
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
            minerals = _.filter(Object.keys(objStore), (m) => m !== RESOURCE_ENERGY && objStore[m] > 0);
        }
        if (minerals.length === 0) {
            delete creep.memory.currentTask;

            return;
        }
        Pathing.moveTo(creep, obj, 1);
        if (amount) {
            if (creep.withdraw(obj, minerals[0], Math.min(amount, carryCapacity - carry)) === OK) {
                delete creep.memory.currentTask;
            }

            return;
        }

        if (creep.withdraw(obj, minerals[0]) === OK) {
            delete creep.memory.currentTask;
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
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
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskCollectMinerals|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask, currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskCollectMinerals(id, currentTask.resource, currentTask.amount);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,39).registerObject(TaskCollectMinerals, "TaskCollectMinerals");
}
module.exports = TaskCollectMinerals;

return module.exports;
}
/********** End of module 39: ../src/task.collectMinerals.js **********/
/********** Start module 40: ../src/task.dismantle.js **********/
__modules[40] = function(module, exports) {
const Cache = __require(3,40),
    Pathing = __require(58,40);
/**
 * A class that performs dismantling on a structure.
 */
class TaskDismantle {
    /**
     * Creates a new task.
     * @param {string} id The ID of the structure.
     */
    constructor(id) {
        this.type = "dismantle";
        this.id = id;
        this.structure = Game.getObjectById(id);
        this.unimportant = true;
        this.force = true;
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        if (creep.spawning || creep.carryCapacity > 0 && _.sum(creep.carry) === creep.carryCapacity || creep.spawning || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {structure} = this,
            {carry, carryCapacity} = creep;
        if (carryCapacity > 0 && _.sum(carry) === carryCapacity || !structure || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;

            return;
        }
        Pathing.moveTo(creep, structure, 1);
        creep.dismantle(structure);
        if (Math.min(creep.getActiveBodyparts(WORK), carry[RESOURCE_ENERGY]) * 50 >= structure.hits) {
            delete creep.memory.currentTask;
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
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
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskDismantle|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskDismantle(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,40).registerObject(TaskDismantle, "TaskDismantle");
}
module.exports = TaskDismantle;

return module.exports;
}
/********** End of module 40: ../src/task.dismantle.js **********/
/********** Start module 41: ../src/task.downgrade.js **********/
__modules[41] = function(module, exports) {
const Cache = __require(3,41),
    Pathing = __require(58,41);
/**
 * A class that performs downgrading on a constructor.
 */
class TaskDowngrade {
    /**
     * Creates a new task.
     * @param {string} id The ID of the controller.
     * @param {RoomPosition} [pos] The position of the controller.
     */
    constructor(id, pos) {
        const controller = Game.getObjectById(id);

        this.id = id;
        this.controller = controller;

        if (controller) {
            ({pos: this.pos} = controller);
        } else {
            this.pos = pos;
        }
        this.type = "downgrade";
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        const {controller} = this;

        if (creep.spawning || creep.memory.role !== "downgrader" || !controller || !controller.level || creep.getActiveBodyparts(CLAIM) === 0) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        if (!creep.getActiveBodyparts(CLAIM) === 0) {
            delete creep.memory.currentTask;

            return;
        }

        const {controller} = this;
        Pathing.moveTo(creep, new RoomPosition(this.x, this.y, this.roomName), 1);
        if (controller) {
            creep.attackController(controller);
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
    toObj(creep) {
        creep.memory.currentTask = {
            id: this.controller.id,
            x: this.x,
            y: this.y,
            roomName: this.roomName,
            type: this.type
        };
    }
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskDowngrade} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: task}} = creep;

        return new TaskDowngrade(task.id, new RoomPosition(task.x, task.y, task.roomName));
    }
}

if (Memory.profiling) {
    __require(1,41).registerObject(TaskDowngrade, "TaskDowngrade");
}
module.exports = TaskDowngrade;

return module.exports;
}
/********** End of module 41: ../src/task.downgrade.js **********/
/********** Start module 42: ../src/task.fillEnergy.js **********/
__modules[42] = function(module, exports) {
const Cache = __require(3,42),
    Pathing = __require(58,42);
/**
 * A class that performs filling a structure with energy.
 */
class TaskFillEnergy {
    /**
     * Creates a new task.
     * @param {string} id The ID of the structure.
     */
    constructor(id) {
        this.type = "fillEnergy";
        this.id = id;
        this.object = Game.getObjectById(id);
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        const {object: obj} = this;
        let minEnergy;

        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || obj.energyCapacity && obj.energy === obj.energyCapacity) {
            return false;
        }

        if (obj.structureType === STRUCTURE_EXTENSION) {
            switch (obj.room.controller.level) {
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
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {object: obj} = this;
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
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
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
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskFillEnergy|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskFillEnergy(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,42).registerObject(TaskFillEnergy, "TaskFillEnergy");
}
module.exports = TaskFillEnergy;

return module.exports;
}
/********** End of module 42: ../src/task.fillEnergy.js **********/
/********** Start module 43: ../src/task.fillMinerals.js **********/
__modules[43] = function(module, exports) {
const Cache = __require(3,43),
    Pathing = __require(58,43);
/**
 * A class that performs filling a structure with minerals.
 */
class TaskFillMinerals {
    /**
     * Creates a new task.
     * @param {string} id The ID of the structure.
     * @param {object} resources The resources to fill.
     */
    constructor(id, resources) {
        this.type = "fillMinerals";
        this.id = id;
        this.resources = resources;
        this.object = Game.getObjectById(id);
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        if (creep.spawning) {
            return false;
        }

        const {carry} = creep;
        if (_.sum(carry) === carry[RESOURCE_ENERGY]) {
            return false;
        }

        const {resources} = this;
        if (resources && _.intersection(Object.keys(resources), _.filter(Object.keys(carry), (c) => c !== RESOURCE_ENERGY && carry[c])).length === 0) {
            return false;
        }

        const {object: obj, object: {structureType}} = this;
        if (structureType === STRUCTURE_NUKER && obj.ghodium === obj.ghodiumCapacity) {
            return false;
        }
        if (structureType === STRUCTURE_POWER_SPAWN && obj.power === obj.powerCapacity) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {object: obj} = this;
        if (!obj) {
            delete creep.memory.currentTask;

            return;
        }
        const {storeCapacity} = obj,
            {carry} = creep;

        if (storeCapacity && _.filter(Object.keys(carry), (m) => m !== RESOURCE_ENERGY && carry[m] > 0).length === 0 || (_.sum(obj.store) || 0) === storeCapacity) {
            delete creep.memory.currentTask;

            return;
        }

        const {resources} = this;

        if (resources) {
            const minerals = _.intersection(Object.keys(resources), _.filter(Object.keys(carry), (c) => carry[c])).sort((a, b) => {
                const {[a]: ra, [b]: rb} = resources;

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

            const {0: firstMineral} = minerals,
                {[firstMineral]: firstResources} = resources;

            if (creep.transfer(obj, firstMineral, firstResources === null ? void 0 : Math.min(firstResources, carry[firstMineral])) === OK) {
                if (minerals.length === 1) {
                    delete creep.memory.currentTask;
                }
            }
        } else {
            const minerals = _.filter(Object.keys(carry), (m) => m !== RESOURCE_ENERGY && carry[m] > 0);
            if (minerals.length === 0) {
                delete creep.memory.currentTask;

                return;
            }
            Pathing.moveTo(creep, obj, 1);
            if (creep.transfer(obj, minerals[0]) === OK) {
                if (_.filter(Object.keys(carry), (m) => m !== RESOURCE_ENERGY && carry[m] > 0).length === 0) {
                    delete creep.memory.currentTask;
                }
            }
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
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
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskFillMinerals|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask, currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskFillMinerals(id, currentTask.resources);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,43).registerObject(TaskFillMinerals, "TaskFillMinerals");
}
module.exports = TaskFillMinerals;

return module.exports;
}
/********** End of module 43: ../src/task.fillMinerals.js **********/
/********** Start module 44: ../src/task.flee.js **********/
__modules[44] = function(module, exports) {
const Cache = __require(3,44),
    Pathing = __require(58,44);
/**
 * A class that performs fleeing from a location.
 */
class TaskFlee {
    /**
     * Creates a new task.
     * @param {RoomPosition} pos The position to flee from.
     */
    constructor(pos) {
        this.type = "flee";
        this.pos = pos;
        this.unimportant = true;
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        if (creep.spawning) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        Pathing.moveTo(creep, this.pos, 10, true, Cache.hostilesInRoom(creep.room));
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
    toObj(creep) {
        creep.memory.currentTask = {
            type: this.type,
            x: this.pos.x,
            y: this.pos.y,
            roomName: this.pos.roomName,
            unimportant: this.unimportant
        };
    }
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskFlee} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {x, y, roomName}}} = creep;

        return new TaskFlee(new RoomPosition(x, y, roomName));
    }
}

if (Memory.profiling) {
    __require(1,44).registerObject(TaskFlee, "TaskFlee");
}
module.exports = TaskFlee;

return module.exports;
}
/********** End of module 44: ../src/task.flee.js **********/
/********** Start module 45: ../src/task.harvest.js **********/
__modules[45] = function(module, exports) {
const Cache = __require(3,45),
    Pathing = __require(58,45);
/**
 * A class that performs harvesting on a source.
 */
class TaskHarvest {
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the source to harvest.
     * @param {number} [failIn=10] The number of ticks to fail in.
     */
    constructor(id, failIn) {
        this.type = "harvest";
        this.id = id;
        this.failIn = failIn || 10;
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        let source = Game.getObjectById(creep.memory.homeSource);

        if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }

        if (["miner", "remoteMiner"].indexOf(creep.role) === -1 && (!source || source.energy === 0)) {
            ({0: source} = creep.room.find(FIND_SOURCES_ACTIVE));
            if (!source) {
                return false;
            }
        }

        ({id: this.id} = source);

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const source = Game.getObjectById(this.id || creep.memory.homeSource);
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
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
    toObj(creep) {
        creep.memory.currentTask = {
            type: this.type,
            failIn: this.failIn,
            id: this.id
        };
    }
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskHarvest|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask}} = creep;

        if (Game.getObjectById(currentTask.id)) {
            return new TaskHarvest(currentTask.id, currentTask.failIn);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,45).registerObject(TaskHarvest, "TaskHarvest");
}
module.exports = TaskHarvest;

return module.exports;
}
/********** End of module 45: ../src/task.harvest.js **********/
/********** Start module 46: ../src/task.heal.js **********/
__modules[46] = function(module, exports) {
const Cache = __require(3,46),
    Pathing = __require(58,46);
/**
 * A class that performs healing on a creep.
 */
class TaskHeal {
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the creep to heal.
     */
    constructor(id) {
        this.type = "heal";
        this.id = id;
        this.ally = Game.getObjectById(id);
        this.unimportant = true;
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        if (creep.spawning || creep.getActiveBodyparts(HEAL) === 0) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {ally} = this;
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }
        if (!ally) {
            delete creep.memory.currentTask;

            return;
        }
        Pathing.moveTo(creep, ally);

        if (ally.hits !== ally.hitsMax && creep.id !== ally.id) {
            const range = creep.pos.getRangeTo(ally);

            if (range <= 1) {
                creep.heal(ally);
            } else if (range <= 3) {
                creep.rangedHeal(ally);
            }
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
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
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskHeal|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskHeal(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,46).registerObject(TaskHeal, "TaskHeal");
}
module.exports = TaskHeal;

return module.exports;
}
/********** End of module 46: ../src/task.heal.js **********/
/********** Start module 47: ../src/task.meleeAttack.js **********/
__modules[47] = function(module, exports) {
const Cache = __require(3,47),
    Pathing = __require(58,47);
/**
 * A class that performs a melee attack on a creep.
 */
class TaskMelee {
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the creep to attack.
     */
    constructor(id) {
        this.type = "meleeAttack";
        this.id = id;
        this.enemy = Game.getObjectById(id);
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        if (creep.spawning || creep.getActiveBodyparts(ATTACK) === 0) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
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
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
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
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskMelee|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskMelee(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,47).registerObject(TaskMelee, "TaskMeleeAttack");
}
module.exports = TaskMelee;

return module.exports;
}
/********** End of module 47: ../src/task.meleeAttack.js **********/
/********** Start module 48: ../src/task.mine.js **********/
__modules[48] = function(module, exports) {
const Cache = __require(3,48),
    Pathing = __require(58,48),
    Utilities = __require(9,48);
/**
 * A class that performs mining on a source.
 */
class TaskMine {
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the source to mine.
     */
    constructor(id) {
        this.type = "mine";
        this.id = id;
        this.source = Game.getObjectById(id);
        this.force = true;
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        const container = Game.getObjectById(creep.memory.container);

        if (creep.spawning || !container || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {memory: {container: containerId}} = creep,
            container = Game.getObjectById(containerId);
        if (!container) {
            delete creep.memory.currentTask;

            return;
        }
        const {pos: {x: containerPosX, y: containerPosY, roomName: containerPosRoomName}} = container,
            {pos: {x: creepPosX, y: creepPosY, roomName: creepPosRoomName}} = creep;

        if (containerPosX !== creepPosX || containerPosY !== creepPosY || containerPosRoomName !== creepPosRoomName) {
            Pathing.moveTo(creep, container, 0);
        }
        if (containerPosX === creepPosX && containerPosY === creepPosY && containerPosRoomName === creepPosRoomName) {
            const {containerSource: {[containerId]: containerSourceId}} = Memory;
            let source;

            if (this.source) {
                ({source} = this);
            } else if (containerSourceId) {
                source = Game.getObjectById(containerSourceId);
                ({id: this.id} = source);
            } else {
                const {room: containerRoom} = container;

                ({0: source} = Utilities.objectsClosestToObj(Array.prototype.concat.apply([], [containerRoom.find(FIND_SOURCES), containerRoom.find(FIND_MINERALS)]), creep));
                ({id: this.id} = source);
            }

            if (source instanceof Mineral && source.mineralAmount === 0) {
                creep.say(":(");
                creep.suicide();
            }
            if (source instanceof Mineral && _.sum(container.store) >= 1500) {
                return;
            }

            creep.harvest(source);
            const {creeps: {[creepPosRoomName]: creeps}} = Cache;

            if (_.filter(Array.prototype.concat.apply([], [creeps && creeps.miner || [], creeps && creeps.remoteMiner || []]), (c) => c.room.name === creepPosRoomName && c.memory.container === containerId && c.pos.getRangeTo(creep) === 1 && c.ticksToLive > creep.ticksToLive && c.fatigue === 0).length > 0) {
                creep.say(":(");
                creep.suicide();
            }
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
    toObj(creep) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.id
        };
    }
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskMine|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (!creep.memory.currentTask.id || id) {
            return new TaskMine(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,48).registerObject(TaskMine, "TaskMine");
}
module.exports = TaskMine;

return module.exports;
}
/********** End of module 48: ../src/task.mine.js **********/
/********** Start module 49: ../src/task.pickupResource.js **********/
__modules[49] = function(module, exports) {
const Cache = __require(3,49),
    TaskCollectEnergy = __require(38,49),
    Utilities = __require(9,49),
    Pathing = __require(58,49);
/**
 * A class that performs picking up resources.
 */
class TaskPickupResource {
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the resource to pickup.
     */
    constructor(id) {
        this.type = "pickupResource";
        this.id = id;
        this.resource = Game.getObjectById(id);
        this.force = true;
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        const {resource} = this;

        if (!resource) {
            return false;
        }

        const {amount, room: {controller}} = resource;

        if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || amount < creep.pos.getRangeTo(resource) || resource.resourceType === RESOURCE_ENERGY && amount < 50 || controller && Memory.allies.indexOf(Utilities.getControllerOwner(controller)) !== -1) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {resource} = this;
        if (!resource || _.sum(creep.carry) === creep.carryCapacity) {
            delete creep.memory.currentTask;

            return;
        }
        Pathing.moveTo(creep, resource, 1);
        if (creep.pickup(resource) === OK) {
            delete creep.memory.currentTask;
            const structures = _.filter(creep.room.lookForAt(LOOK_STRUCTURES, resource), (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY]);

            if (structures.length > 0) {
                new TaskCollectEnergy(structures[0].id).canAssign(creep);
            }
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
    toObj(creep) {
        const {resource} = this;

        if (resource) {
            creep.memory.currentTask = {
                type: this.type,
                id: resource.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskPickupResource|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskPickupResource(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,49).registerObject(TaskPickupResource, "TaskPickupResource");
}
module.exports = TaskPickupResource;

return module.exports;
}
/********** End of module 49: ../src/task.pickupResource.js **********/
/********** Start module 50: ../src/task.rally.js **********/
__modules[50] = function(module, exports) {
const Cache = __require(3,50),
    Pathing = __require(58,50);
/**
 * A class that performs rallying to a location.
 */
class TaskRally {
    /**
     * Creates a new task.
     * @param {string|RoomPosition} id Either the name of the room, or the room position to rally to.
     * @param {string} rallyTo The type of position we are rallying to.
     */
    constructor(id, rallyTo) {
        this.type = "rally";
        this.id = id;
        this.rallyTo = rallyTo;
        switch (rallyTo) {
            case "position":
                this.rallyPoint = new RoomPosition(id.x, id.y, id.roomName);
                this.range = 1;
                break;
            case "id":
                this.rallyPoint = Game.getObjectById(id);
                this.range = 1;
                break;
            case "room":
                this.rallyPoint = new RoomPosition(25, 25, id);
                this.range = 5;
        }
        this.unimportant = true;
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        if (creep.spawning) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {rallyPoint} = this;
        if (!rallyPoint) {
            delete creep.memory.currentTask;

            return;
        }
        const {pos: creepPos, pos: {x: creepX, y: creepY}} = creep,
            {range} = this;

        if (creepPos.getRangeTo(rallyPoint) <= range) {
            if (creepX === 0) {
                creep.move(RIGHT);
            } else if (creepX === 49) {
                creep.move(LEFT);
            } else if (creepY === 0) {
                creep.move(BOTTOM);
            } else if (creepY === 49) {
                creep.move(TOP);
            } else if (_.filter(creepPos.lookFor(LOOK_STRUCTURES), (s) => [STRUCTURE_ROAD, STRUCTURE_CONTAINER].indexOf(s.structureType) !== -1).length > 0) {
                creep.move(Math.floor(Math.random() * 8));
            }
        } else {
            Pathing.moveTo(creep, rallyPoint, range);
        }
        if (creep.getActiveBodyparts(HEAL) > 0) {
            const {heal, rangedHeal} = this;

            if (heal) {
                creep.heal(Game.getObjectById(heal));
            } else if (rangedHeal) {
                creep.rangedHeal(Game.getObjectById(rangedHeal));
            } else if (creep.hits < creep.hitsMax) {
                creep.heal(creep);
            }
        }
        if (creep.getActiveBodyparts(ATTACK) > 0) {
            const {attack} = this;

            if (attack) {
                creep.attack(Game.getObjectById(attack));
            }
        }
        if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
            const {rangedAttack} = this;

            if (rangedAttack) {
                creep.rangedAttack(Game.getObjectById(rangedAttack));
            } else {
                creep.rangedMassAttack();
            }
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
    toObj(creep) {
        if (this.rallyPoint) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id,
                rallyTo: this.rallyTo,
                unimportant: this.unimportant,
                range: this.range
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskRally} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id, rallyTo, range}}} = creep;
        let task;

        switch (rallyTo) {
            case "position":
                task = new TaskRally(new RoomPosition(id.x, id.y, id.roomName), rallyTo);
                break;
            case "id":
            case "room":
                task = new TaskRally(id, rallyTo);
                break;
            default:
                return void 0;
        }

        if (task && range) {
            task.range = range;
        }

        return task;
    }
}

if (Memory.profiling) {
    __require(1,50).registerObject(TaskRally, "TaskRally");
}
module.exports = TaskRally;

return module.exports;
}
/********** End of module 50: ../src/task.rally.js **********/
/********** Start module 51: ../src/task.rangedAttack.js **********/
__modules[51] = function(module, exports) {
const Cache = __require(3,51),
    Pathing = __require(58,51);
/**
 * A class that performs attacking creeps at range.
 */
class TaskRangedAttack {
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the creep to attack.
     */
    constructor(id) {
        this.type = "rangedAttack";
        this.id = id;
        this.enemy = Game.getObjectById(id);
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        if (creep.spawning || creep.getActiveBodyparts(RANGED_ATTACK) === 0) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
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
        const {enemy} = this;

        if (creep.getActiveBodyparts(ATTACK) > 0) {
            Pathing.moveTo(creep, enemy);
            if (creep.attack(enemy) === ERR_NOT_IN_RANGE) {
                if (creep.hits < creep.hitsMax && creep.getActiveBodyparts(HEAL) > 0) {
                    creep.heal(creep);
                }
            }
            if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                creep.rangedAttack(enemy);
            }
        } else {
            if (creep.pos.getRangeTo(enemy) > 3) {
                Pathing.moveTo(creep, enemy, 3);
            } else {
                Pathing.moveTo(creep, enemy, 3, true, [enemy]);
            }

            creep.rangedAttack(enemy);
            if (creep.hits < creep.hitsMax && creep.getActiveBodyparts(HEAL) > 0) {
                creep.heal(creep);
            }
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
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
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskRangedAttack|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskRangedAttack(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,51).registerObject(TaskRangedAttack, "TaskRangedAttack");
}
module.exports = TaskRangedAttack;

return module.exports;
}
/********** End of module 51: ../src/task.rangedAttack.js **********/
/********** Start module 52: ../src/task.repair.js **********/
__modules[52] = function(module, exports) {
const Cache = __require(3,52),
    Pathing = __require(58,52);
/**
 * A class that performs repairing a structure.
 */
class TaskRepair {
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the structure to repair.
     */
    constructor(id) {
        this.type = "repair";
        this.id = id;
        this.structure = Game.getObjectById(id);
        this.force = true;
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        if (!this.structure || creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }
        const {memory, room} = creep;

        if (this.structure.hits >= 1000000 && memory.role === "worker" && room.name === memory.home && room.controller.level < 8 && !_.find(creep.body, (b) => b.type === WORK && [RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_HYDRIDE].indexOf(b.boost) !== -1)) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {carry: {[RESOURCE_ENERGY]: energy}} = creep,
            {structure, structure: {hits, hitsMax}} = this;
        if (!energy || !structure || hits === hitsMax || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;

            return;
        }
        Pathing.moveTo(creep, structure, Math.max(Math.min(creep.pos.getRangeTo(structure) - 1, 3), 1));
        if (creep.repair(structure) === OK) {
            if (Math.min(creep.getActiveBodyparts(WORK), energy) * 100 >= hitsMax - hits) {
                delete creep.memory.currentTask;
            }
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
    toObj(creep) {
        const {structure} = this;

        if (structure) {
            creep.memory.currentTask = {
                type: this.type,
                id: structure.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskRepair|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskRepair(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    __require(1,52).registerObject(TaskRepair, "TaskRepair");
}
module.exports = TaskRepair;

return module.exports;
}
/********** End of module 52: ../src/task.repair.js **********/
/********** Start module 53: ../src/task.reserve.js **********/
__modules[53] = function(module, exports) {
const Cache = __require(3,53),
    Pathing = __require(58,53);
/**
 * A class that performs reservation of a controller.
 */
class TaskReserve {
    /**
     * Creates a new task.
     */
    constructor() {
        this.type = "reserve";
        this.force = true;
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        if (creep.spawning || creep.getActiveBodyparts(CLAIM) === 0) {
            return false;
        }

        const {rooms: {[creep.memory.home]: room}} = Game;

        if (!room || !room.controller || room.controller.my) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {memory: {home: roomName}} = creep,
            {rooms: {[creep.memory.home]: room}} = Game;
        creep.say(["You", "spin", "me", "right", "round", "baby", "right", "round", "like a", "record", "baby", "right", "round", "round", "round", ""][Game.time % 16], true);
        if (!room || !room.controller || room.controller.my || creep.getActiveBodyparts(CLAIM) === 0) {
            delete creep.memory.currentTask;

            return;
        }

        const {signs, signs: {[roomName]: signInRoom}} = Memory,
            {controller, controller: {sign}} = room;

        Pathing.moveTo(creep, controller, 1);
        creep.reserveController(controller);

        if (signs && signInRoom && (!sign || sign.username !== "roncli")) {
            creep.signController(controller, signInRoom);
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
    toObj(creep) {
        creep.memory.currentTask = {type: this.type};
    }
    /**
     * Deserializes the task from the creep's memory.
     * @return {TaskReserve} The deserialized object.
     */
    static fromObj() {
        return new TaskReserve();
    }
}

if (Memory.profiling) {
    __require(1,53).registerObject(TaskReserve, "TaskReserve");
}
module.exports = TaskReserve;

return module.exports;
}
/********** End of module 53: ../src/task.reserve.js **********/
/********** Start module 54: ../src/task.suicide.js **********/
__modules[54] = function(module, exports) {
const Cache = __require(3,54);
/**
 * A class that makes a creep suicide.
 */
class TaskSuicide {
    /**
     * Creates a new task.
     */
    constructor() {
        this.type = "suicide";
        this.force = true;
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        creep.suicide();
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
    toObj(creep) {
        creep.memory.currentTask = {type: this.type};
    }
    /**
     * Deserializes the task from the creep's memory.
     * @return {TaskSuicide} The deserialized object.
     */
    static fromObj() {
        return new TaskSuicide();
    }
}

if (Memory.profiling) {
    __require(1,54).registerObject(TaskSuicide, "TaskSuicide");
}
module.exports = TaskSuicide;

return module.exports;
}
/********** End of module 54: ../src/task.suicide.js **********/
/********** Start module 55: ../src/task.upgradeController.js **********/
__modules[55] = function(module, exports) {
const Cache = __require(3,55),
    Pathing = __require(58,55),
    Utilities = __require(9,55);
/**
 * A class that performs upgrading of a controller.
 */
class TaskUpgrade {
    /**
     * Creates a new task.
     * @param {string} roomName The name of the room with the controller to upgrade.
     */
    constructor(roomName) {
        const {rooms: {[roomName]: room}} = Game;

        this.type = "upgradeController";
        this.room = roomName;
        ({controller: this.controller} = room);
        this.force = true;
    }
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.memory.role !== "upgrader" && _.sum(creep.carry) !== creep.carryCapacity && creep.ticksToLive >= 150 && this.controller.ticksToDowngrade >= 1000 || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {controller} = this;

        creep.say(["I've", "got to", "celebrate", "you baby", "I've got", "to praise", "GCL like", "I should!", ""][Game.time % 9], true);
        if (!controller || !creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;

            return;
        }
        const {pos, room, room: {name: roomName}} = creep,
            {signs, signs: {[roomName]: signInRoom}} = Memory,
            {sign} = controller;

        if (creep.memory.role === "upgrader") {
            const {0: link} = Utilities.objectsClosestToObj(Cache.linksInRoom(room), creep);

            if (link && link.energy > 0 && pos.getRangeTo(link) <= 1) {
                creep.withdraw(link, RESOURCE_ENERGY);
            }
        }
        Pathing.moveTo(creep, controller, Math.max(Math.min(pos.getRangeTo(controller) - 1, 3), 1));
        creep.transfer(this.controller, RESOURCE_ENERGY);

        if (signs && signInRoom && (!sign || sign.username !== "roncli")) {
            creep.signController(controller, signInRoom);
        }
        if (creep.carry[RESOURCE_ENERGY] <= creep.getActiveBodyparts(WORK)) {
            delete creep.memory.currentTask;
        }
    }
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
    toObj(creep) {
        creep.memory.currentTask = {
            type: this.type,
            room: this.room
        };
    }
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskUpgrade} The deserialized object.
     */
    static fromObj(creep) {
        return new TaskUpgrade(creep.memory.currentTask.room);
    }
}

if (Memory.profiling) {
    __require(1,55).registerObject(TaskUpgrade, "TaskUpgradeController");
}
module.exports = TaskUpgrade;

return module.exports;
}
/********** End of module 55: ../src/task.upgradeController.js **********/
/********** Start module 56: ../src/assign.js **********/
__modules[56] = function(module, exports) {
const Cache = __require(3,56),
    Commands = __require(4,56),
    Utilities = __require(9,56),
    TaskBuild = __require(36,56),
    TaskClaim = __require(37,56),
    TaskCollectEnergy = __require(38,56),
    TaskCollectMinerals = __require(39,56),
    TaskDismantle = __require(40,56),
    TaskDowngrade = __require(41,56),
    TaskFillEnergy = __require(42,56),
    TaskFillMinerals = __require(43,56),
    TaskFlee = __require(44,56),
    TaskHarvest = __require(45,56),
    TaskHeal = __require(46,56),
    TaskMine = __require(48,56),
    TaskMeleeAttack = __require(47,56),
    TaskPickupResource = __require(49,56),
    TaskRally = __require(50,56),
    TaskRangedAttack = __require(51,56),
    TaskRepair = __require(52,56),
    TaskReserve = __require(53,56),
    TaskSuicide = __require(54,56),
    TaskUpgradeController = __require(55,56);
/**
 * A set of static functions that assigns creeps in an array to tasks.
 */
class Assign {
    /**
     * Assigns creeps to attack other creeps.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToAttack The list of creeps to attack.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static attack(creeps, creepsToAttack, say) {
        let firstCreep;
        if (!creepsToAttack || creepsToAttack.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            let task;

            ({0: firstCreep} = creepsToAttack);

            if (!firstCreep) {
                return;
            } else if (creep.pos.getRangeTo(firstCreep) <= 1) {
                task = new TaskMeleeAttack(firstCreep.id);
            } else {
                const closeCreeps = _.filter(creepsToAttack, (c) => creep.pos.getRangeTo(c) <= 1);
                task = new TaskRally(firstCreep.pos, "position");
                if (closeCreeps.length > 0) {
                    ({0: {id: task.attack}} = closeCreeps);
                }
            }

            if (task.canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns creeps to attack other creeps in a quadrant of a room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToAttack The list of creeps to attack.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static attackInQuadrant(creeps, creepsToAttack, say) {
        let firstCreep;
        if (!creepsToAttack || creepsToAttack.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            let task;

            ({0: firstCreep} = _.filter(creepsToAttack, (c) => Utilities.checkQuadrant(c.pos, creep.memory.quadrant)));

            if (!firstCreep) {
                return;
            }
            ({id: creep.memory.target} = firstCreep);

            if (creep.pos.getRangeTo(firstCreep) <= 1) {
                task = new TaskMeleeAttack(firstCreep.id);
            } else {
                const closeCreeps = _.filter(creepsToAttack, (c) => creep.pos.getRangeTo(c) <= 1);
                task = new TaskRally(firstCreep.pos, "position");
                if (closeCreeps.length > 0) {
                    ({0: {id: task.attack}} = closeCreeps);
                }
            }

            if (task.canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns creeps to attack a set target.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToAttack The list of creeps to attack.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static attackTarget(creeps, creepsToAttack, say) {
        _.forEach(creeps, (creep) => {
            let task;

            if (!creep.memory.target) {
                return;
            }

            const target = Game.getObjectById(creep.memory.target);

            if (!target) {
                delete creep.memory.target;

                return;
            }

            if (creep.pos.getRangeTo(target) <= 1) {
                task = new TaskMeleeAttack(target.id);
            } else {
                const closeCreeps = _.filter(creepsToAttack, (c) => creep.pos.getRangeTo(c) <= 1);
                task = new TaskRally(target.pos, "position");
                if (closeCreeps.length > 0) {
                    ({0: {id: task.attack}} = closeCreeps);
                }
            }

            if (task.canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns creeps to build structures.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {ConstructionSite[]} sites The construction sites to build.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static build(creeps, allCreeps, sites, say) {
        if (!sites || sites.length === 0) {
            return;
        }

        _.forEach(sites, (site) => {
            let progressMissing = site.progressTotal - site.progress - _.sum(_.map(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "build" && c.memory.currentTask.id === site.id), (c) => c.carry[RESOURCE_ENERGY]));

            if (progressMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creeps, site), (creep) => {
                    if (new TaskBuild(site.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }
                        progressMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (progressMissing <= 0) {
                            return false;
                        }
                    }

                    return true;
                });
            }
        });
    }
    /**
     * Assigns creeps to build structures in their current room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {bool} quickOnly Only build quick construction sites.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static buildInCurrentRoom(creeps, allCreeps, quickOnly, say) {
        const creepsByRoom = _.groupBy(creeps, (c) => c.room.name);

        _.forEach(Object.keys(creepsByRoom), (roomName) => {
            const sites = _.filter(Game.rooms[roomName].find(FIND_MY_CONSTRUCTION_SITES), (s) => !quickOnly || s.progressTotal === 1),
                {[roomName]: creepsInRoom} = creepsByRoom;

            _.forEach(sites, (site) => {
                let progressMissing = site.progressTotal - site.progress - _.sum(_.map(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "build" && c.memory.currentTask.id === site.id), (c) => c.carry[RESOURCE_ENERGY]));

                if (progressMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsInRoom, site), (creep) => {
                        if (new TaskBuild(site.id).canAssign(creep)) {
                            if (say) {
                                creep.say(say);
                            }
                            progressMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            _.remove(creepsInRoom, (c) => c.id === creep.id);
                            if (progressMissing <= 0) {
                                return false;
                            }
                        }

                        return true;
                    });
                }
            });
        });
    }
    /**
     * Assigns creeps to claim a controller from their memory.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static claimController(creeps, say) {
        _.forEach(creeps, (creep) => {
            const {memory: {claim: roomName}} = creep,
                {rooms: {[roomName]: room}} = Game;

            if (room) {
                const {controller} = room;
                if (!controller || controller.my) {
                    delete Memory.maxCreeps.claimer[roomName];
                    if (new TaskSuicide().canAssign(creep)) {
                        creep.say("RIP :(");
                    }

                    return;
                }
                if (new TaskClaim(controller.id).canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            } else {
                this.moveToRoom([creep], roomName, say);
            }
        });
    }
    /**
     * Assigns creeps to collect energy from a structure.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Structure[]} structures The structures to collect energy from.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static collectEnergy(creeps, allCreeps, structures, say) {
        if (!structures || structures.length === 0) {
            return;
        }

        _.forEach(structures, (structure) => {
            let energy = (structure.store ? structure.store[RESOURCE_ENERGY] : structure.energy) - _.sum(_.map(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "collectEnergy" && c.memory.currentTask.id === structure.id), (c) => c.carryCapacity - _.sum(c.carry)));

            if (energy > 0) {
                _.forEach(creeps, (creep) => {
                    if (!creep) {
                        return true;
                    }

                    if (new TaskCollectEnergy(structure.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                            _.remove(creeps, (c) => c.id === creep.id);
                        }

                        if (creep.memory.role === "storer") {
                            creep.memory.lastCollectEnergyWasStorage = structure.structureType === STRUCTURE_STORAGE;
                        }

                        energy -= creep.carryCapacity - _.sum(creep.carry) || 0;
                        if (energy <= 0) {
                            return false;
                        }
                    }

                    return true;
                });
            }
        });
    }
    /**
     * Assigns creeps to collect energy from their home container.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static collectEnergyFromHomeContainer(creeps, say) {
        _.forEach(creeps, (creep) => {
            if (new TaskCollectEnergy(creep.memory.container).canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns creeps to collect minerals from a structure.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Structure[]} structures The structures to collect minerals from.
     * @param {string} resource The resource to collect.  Leave undefined to just pick up anything.
     * @param {number} amount The amount of resources to collect.  Leave undefined to get all.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static collectMinerals(creeps, allCreeps, structures, resource, amount, say) {
        if (!structures || structures.length === 0) {
            return;
        }

        _.forEach(structures, (structure) => {
            let minerals = structure.store ? _.sum(structure.store) - structure.store[RESOURCE_ENERGY] - _.sum(_.map(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "collectMinerals" && c.memory.currentTask.id === structure.id), (c) => c.carryCapacity - _.sum(c.carry))) : structure.mineralAmount;

            if (minerals > 0) {
                _.forEach(creeps, (creep) => {
                    if (new TaskCollectMinerals(structure.id, resource, amount).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }
                        minerals -= creep.carryCapacity - _.sum(creep.carry) || 0;
                        if (minerals <= 0) {
                            return false;
                        }
                    }

                    return true;
                });
            }
        });
    }
    /**
     * Assigns creeps to collect energy from their home container.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static collectMineralsFromHomeContainer(creeps, say) {
        _.forEach(creeps, (creep) => {
            if (new TaskCollectMinerals(creep.memory.container).canAssign(creep)) {
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
     * @return {void}
     */
    static dismantleArmyTarget(creeps, roomName, dismantle, say) {
        if (!Game.rooms[roomName] || !dismantle || dismantle.length === 0) {
            return;
        }

        const task = new TaskDismantle(dismantle[0]);

        _.forEach(creeps, (creep) => {
            if (task.canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns creeps to dismantle a hostile structure.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} roomName The name of the room.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static dismantleHostileStructures(creeps, roomName, say) {
        const {rooms: {[roomName]: room}} = Game;

        if (!room) {
            return;
        }

        const structures = room.find(FIND_HOSTILE_STRUCTURES, {filter: (s) => [STRUCTURE_CONTROLLER, STRUCTURE_RAMPART, STRUCTURE_KEEPER_LAIR].indexOf(s.structureType) === -1});

        if (structures.length > 0) {
            const task = new TaskDismantle(structures[0].id);

            _.forEach(creeps, (creep) => {
                if (task.canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            });
        }
    }
    /**
     * Assigns creeps to dismantle a structure from a list of structures.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Structure[]} structures An array of structures to dismantle.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static dismantleStructures(creeps, allCreeps, structures, say) {
        if (!structures || structures.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            _.forEach(structures, (structure) => {
                if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "dismantle" && c.memory.currentTask.id === structure.id).length === 0) {
                    if (new TaskDismantle(structure.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        return false;
                    }
                }

                return true;
            });

            if (!creep.memory.currentTask) {
                if (new TaskDismantle(structures[0].id).canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            }
        });
    }
    /**
     * Assigns creeps to dismantle targets in a room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Room} room The room to dismantle targets in.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static dismantleTargets(creeps, room, say) {
        const {dismantle} = Memory,
            {name: roomName} = room,
            convert = () => {
                _.forEach(creeps, (creep) => {
                    const {memory} = creep;

                    memory.role = "worker";
                    ({0: {id: memory.container}} = Cache.containersInRoom(Game.rooms[memory.supportRoom]));
                    delete Cache.creepTasks[creep.name];
                });
            };

        if (!dismantle || !dismantle[roomName] || !dismantle[roomName].length === 0) {
            convert();

            return;
        }

        while (dismantle[roomName].length > 0) {
            const {[roomName]: dismantleRoom} = dismantle,
                {0: pos} = dismantleRoom,
                structures = _.filter(room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y), (s) => s.hits);

            if (structures.length === 0) {
                dismantle[roomName].shift();
                continue;
            }

            _.forEach(creeps, (creep) => {
                if (new TaskDismantle(structures[0].id).canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            });

            return;
        }

        convert();
    }
    /**
     * Assigns creeps to downgrade a controller.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static downgradeController(creeps, say) {
        _.forEach(creeps, (creep) => {
            const {memory: {downgrade: roomName}} = creep,
                {rooms: {[roomName]: room}} = Game;

            if (room) {
                const {controller} = room;
                if (!controller || !controller.level) {
                    delete Memory.maxCreeps.downgrader[roomName];
                    if (new TaskSuicide().canAssign(creep)) {
                        creep.say("RIP :(");
                    }

                    return;
                }
                if (new TaskDowngrade(controller.id).canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            } else {
                this.moveToRoom([creep], roomName, say);
            }
        });
    }
    /**
     * Assigns creeps to escort another, and heal it if it's hurt.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment for healing only.
     * @return {void}
     */
    static escort(creeps, say) {
        _.forEach(_.filter(creeps, (c) => !c.spawning && c.memory.escorting), (creep) => {
            const escorting = Game.getObjectById(creep.memory.escorting);
            if (!escorting) {
                delete creep.memory.escorting;

                return;
            }
            if (escorting.hitsMax - escorting.hits === 0 || escorting.hits / escorting.hitsMax > creep.hits / creep.hitsMax || !new TaskHeal(escorting.id).canAssign(creep)) {
                new TaskRally(escorting.pos, "position").canAssign(creep);
            } else if (say) {
                creep.say(say);
            }
        });
    }
    /**
     * Assigns creeps to fill extensions.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {number} rcl The room controller level.
     * @param {StructureExtension[]} extensions The extensions to fill.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillExtensions(creeps, allCreeps, rcl, extensions, say) {
        if (!extensions || extensions.length === 0) {
            return;
        }

        _.forEach(_.filter(creeps, (c) => c.carry[RESOURCE_ENERGY] >= EXTENSION_ENERGY_CAPACITY[rcl]), (creep) => {
            _.forEach(extensions.sort((a, b) => a.pos.getRangeTo(creep) - b.pos.getRangeTo(creep)), (extension) => {
                if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === extension.id).length === 0) {
                    if (new TaskFillEnergy(extension.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        return false;
                    }
                }

                return true;
            });
        });
    }
    /**
     * Assigns creeps to fill spawns.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {StructureSpawn[]} spawns The spawns to fill.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillSpawns(creeps, allCreeps, spawns, say) {
        if (!spawns || spawns.length === 0) {
            return;
        }

        _.forEach(_.filter(creeps, (c) => c.carry[RESOURCE_ENERGY] > 0), (creep) => {
            _.forEach(spawns.sort((a, b) => a.pos.getRangeTo(creep) - b.pos.getRangeTo(creep)), (spawn) => {
                if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === spawn.id).length === 0) {
                    if (new TaskFillEnergy(spawn.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        return false;
                    }
                }

                return true;
            });
        });
    }
    /**
     * Assigns creeps to fill storage with energy.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Room} room The room to check for storage.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillStorageWithEnergy(creeps, allCreeps, room, say) {
        if (!room || !room.storage) {
            return;
        }

        _.forEach(_.filter(creeps, (c) => c.carry[RESOURCE_ENERGY] > 0), (creep) => {
            if ((!room.terminal || !creep.memory.lastCollectEnergyWasStorage) && new TaskFillEnergy(room.storage.id).canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns creeps to fill a terminal.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Room} room The room to check for a terminal.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillTerminal(creeps, allCreeps, room, say) {
        if (!room || !room.terminal) {
            return;
        }

        _.forEach(_.filter(creeps, (c) => c.carry[RESOURCE_ENERGY] > 0), (creep) => {
            if (new TaskFillEnergy(room.terminal.id).canAssign(creep)) {
                creep.say(say);
            }
        });
    }
    /**
     * Assings creeps to fill towers with energy.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {StructureTower[]} towers The towers to fill.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillTowersWithEnergy(creeps, allCreeps, towers, say) {
        if (!towers || towers.length === 0) {
            return;
        }

        _.forEach(_.filter(creeps, (c) => c.carry[RESOURCE_ENERGY] > 0), (creep) => {
            _.forEach(towers.sort((a, b) => a.energy - b.energy), (tower) => {
                if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === tower.id).length === 0) {
                    if (new TaskFillEnergy(tower.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        return false;
                    }
                }

                return true;
            });
        });
    }
    /**
     * Assigns creeps to fill structures with energy.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Structure[]} structures The structures to fill.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillWithEnergy(creeps, structures, say) {
        if (!structures || structures.length === 0) {
            return;
        }

        _.forEach(_.filter(creeps, (c) => c.carry[RESOURCE_ENERGY] > 0), (creep) => {
            _.forEach(structures, (structure) => {
                if (new TaskFillEnergy(structure.id).canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }

                    return false;
                }

                return true;
            });
        });
    }
    /**
     * Assign creeps to fill a structure with minerals.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Structure} structure The structure to fill with minerals.
     * @param {object} resourcesNeeded An object with the resources needed by the structure.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillWithMinerals(creeps, structure, resourcesNeeded, say) {
        if (!structure) {
            return;
        }

        _.forEach(creeps, (creep) => {
            if (new TaskFillMinerals(structure.id, resourcesNeeded).canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns creeps to flee from nearby hostiles.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static flee(creeps, say) {

        _.forEach(creeps, (creep) => {
            const hostiles = Cache.hostilesInRoom(creep.room);

            if (!hostiles || hostiles.length === 0) {
                return;
            }

            const {0: closest} = Utilities.objectsClosestToObj(hostiles, creep);

            if (closest.pos.getRangeTo(creep) < 10) {
                const task = new TaskFlee(closest.pos);

                if (task.canAssign(creep)) {
                    ({time: creep.memory.currentTask.priority} = Game);
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns creeps to rally to a lab if they require a boost.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static getBoost(creeps, say) {
        _.forEach(_.filter(creeps, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
            const {memory: {labs: {0: id}}} = creep,
                lab = Game.getObjectById(id);
            if (!lab) {
                creep.memory.labs.shift();

                return;
            }

            const {room: {memory: {labsInUse}}} = lab;
            if (!labsInUse || _.filter(labsInUse, (l) => l.id === id).length === 0) {
                creep.memory.labs.shift();

                return;
            }

            const task = new TaskRally(id, "id");

            if (task.canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                creep.say(say);
            }
        });
    }
    /**
     * Assigns creeps to harvest.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static harvest(creeps, say) {
        _.forEach(creeps, (creep) => {
            const task = new TaskHarvest();

            if (creep.room.name !== creep.memory.home) {
                return;
            }

            if (task.canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns creeps to heal other creeps.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToHeal The list of creeps to heal.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static heal(creeps, creepsToHeal, say) {
        let mostHurtCreep;
        if (!creepsToHeal || creepsToHeal.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            let task;

            ({0: mostHurtCreep} = creepsToHeal);

            if (creep.id === mostHurtCreep.id && creepsToHeal.length >= 2) {
                task = new TaskRally(creepsToHeal[1].pos, "position");
            } else if (creep.pos.getRangeTo(mostHurtCreep) <= 3) {
                task = new TaskHeal(mostHurtCreep.id);
            } else {
                let closeCreeps;
                task = new TaskRally(mostHurtCreep.pos, "position");
                if (creep.hits === creep.hitsMax) {
                    closeCreeps = _.filter(creepsToHeal, (c) => creep.pos.getRangeTo(c) <= 1);
                    if (closeCreeps.length > 0) {
                        ({0: {id: task.heal}} = closeCreeps);
                    } else {
                        closeCreeps = _.filter(creepsToHeal, (c) => creep.pos.getRangeTo(c) <= 3);
                        if (closeCreeps.length > 0) {
                            ({0: {id: task.rangedHeal}} = closeCreeps);
                        }
                    }
                }
            }

            if (task.canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns all creeps to mine.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static mine(creeps, say) {
        _.forEach(creeps, (creep) => {
            if (new TaskMine().canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns all creeps to rally to their home or support room depending on whether they are carrying resources or not.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @return {void}
     */
    static moveToHomeOrSupport(creeps) {
        _.forEach(creeps, (creep) => {
            let task;

            if (_.sum(creep.carry) > 0) {
                task = new TaskRally(creep.memory.supportRoom, "room");
            } else {
                task = new TaskRally(creep.memory.home, "room");
            }
            task.canAssign(creep);
        });
    }
    /**
     * Assigns all creeps to rally to their home room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @return {void}
     */
    static moveToHomeRoom(creeps) {
        _.forEach(_.filter(creeps, (c) => !c.spawning && c.ticksToLive >= 150 && c.memory.home), (creep) => {
            new TaskRally(creep.memory.home, "room").canAssign(creep);
        });
    }
    /**
     * Assigns all creeps to rally to their home source.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @return {void}
     */
    static moveToHomeSource(creeps) {
        _.forEach(_.filter(creeps, (c) => !c.spawning && c.ticksToLive >= 150 && c.memory.homeSource), (creep) => {
            new TaskRally(creep.memory.homeSource, "id").canAssign(creep);
        });
    }
    /**
     * Assigns all creeps to rally to a position.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {RoomPosition} pos The position to rally to.
     * @param {number|undefined} range The range to move within.
     * @return {void}
     * @param {string} say Text to say on successful assignment.
     */
    static moveToPos(creeps, pos, range, say) {
        const task = new TaskRally(pos, "position");

        if (range) {
            task.range = range;
        }
        _.forEach(creeps, (creep) => {
            if (task.canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns all creeps to rally to a room.  Will go through portals if specified.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} roomName The name of the room to rally to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static moveToRoom(creeps, roomName, say) {
        _.forEach(creeps, (creep) => {
            let task;

            const {memory: {portals}} = creep;
            if (creep.memory.portaling && portals[0] !== creep.room.name) {
                portals.shift();
            }
            if (portals && portals.length > 0) {
                if (portals[0] === creep.room.name) {
                    creep.memory.portaling = true;
                    task = new TaskRally(Cache.portalsInRoom(creep.room)[0].pos, "position");
                } else {
                    task = new TaskRally(portals[0], "room");
                    task.range = 20;
                }
            } else {
                task = new TaskRally(roomName, "room");
                task.range = 20;
            }
            if (task.canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns creeps to move to a source keeper.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {StructureKeeperLair[]} keepers The source keepers to move to.
     * @return {void}
     */
    static moveToSourceKeeper(creeps, keepers) {
        if (!keepers || keepers.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            _.forEach(_.filter(keepers, (k) => k.ticksToSpawn < 200 && (creep.memory.role !== "defender" || Utilities.checkQuadrant(k.pos, creep.memory.quadrant))).sort((a, b) => a.ticksToSpawn - b.ticksToSpawn), (keeper) => {
                const task = new TaskRally(keeper.pos, "position");

                task.range = 1;
                if (task.canAssign(creep)) {
                    ({time: creep.memory.currentTask.priority} = Game);

                    return false;
                }

                return true;
            });
        });
    }
    /**
     * Assigns creeps to move to a terminal or the room if there is no terminal.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Room} room The room to move to.
     * @return {void}
     */
    static moveToTerminalOrRoom(creeps, room) {
        if (room.terminal) {
            _.forEach(creeps, (creep) => {
                new TaskRally(room.terminal.pos, "position").canAssign(creep);
            });
        } else {
            _.forEach(creeps, (creep) => {
                new TaskRally(room.name, "room").canAssign(creep);
            });
        }
    }
    /**
     * Assigns creeps to pickup resources in the room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Resource[]} resources The resources to pickup.
     * @param {Creep[]} hostiles Hostile creeps.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static pickupResources(creeps, allCreeps, resources, hostiles, say) {
        if (hostiles && hostiles.length > 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            _.forEach(_.filter(resources, (r) => r.amount > creep.pos.getRangeTo(r)), (resource) => {
                if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === resource.id).length > 0) {
                    return true;
                }
                if (new TaskPickupResource(resource.id).canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }

                    return false;
                }

                return true;
            });
        });
    }
    /**
     * Assigns creeps to pickup resources in their current room.
     * @param {Creeps[]} creeps The creeps to assign this task to.
     * @param {Creeps[]} allCreeps All creeps.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static pickupResourcesInCurrentRoom(creeps, allCreeps, say) {
        const creepsByRoom = _.groupBy(creeps, (c) => c.room.name);

        _.forEach(Object.keys(creepsByRoom), (roomName) => {
            const {rooms: {[roomName]: room}} = Game,
                hostiles = Cache.hostilesInRoom(room);

            if (hostiles.length > 0) {
                return;
            }

            const resources = Cache.sortedResourcesInRoom(room);

            _.forEach(creepsByRoom[roomName], (creep) => {
                _.forEach(_.filter(resources, (r) => r.amount > creep.pos.getRangeTo(r)), (resource) => {
                    if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === resource.id).length > 0) {
                        return true;
                    }
                    if (new TaskPickupResource(resource.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        return false;
                    }

                    return true;
                });
            });
        });
    }
    /**
     * Assigns creeps to attack other creeps at range.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToAttack The list of creeps to attack.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static rangedAttack(creeps, creepsToAttack, say) {
        let firstCreep;
        if (!creepsToAttack || creepsToAttack.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            let task;

            ({0: firstCreep} = creepsToAttack);

            if (!firstCreep) {
                return;
            } else if (creep.pos.getRangeTo(firstCreep) <= 1) {
                task = new TaskRangedAttack(firstCreep.id);
            } else {
                const closeCreeps = _.filter(creepsToAttack, (c) => creep.pos.getRangeTo(c) <= 3);
                task = new TaskRally(firstCreep.pos, "position");
                if (closeCreeps.length > 0) {
                    ({0: {id: task.rangedAttack}} = closeCreeps);
                }
            }

            if (task.canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns creeps to repair a structure in the current room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static repairCriticalStructuresInCurrentRoom(creeps, say) {
        const creepsByRoom = _.groupBy(creeps, (c) => c.room.name);

        _.forEach(Object.keys(creepsByRoom), (roomName) => {
            const structures = Cache.criticalRepairableStructuresInRoom(Game.rooms[roomName]),
                {[roomName]: creepsInRoom} = creepsByRoom;

            _.forEach(structures, (structure) => {
                _.forEach(Utilities.objectsClosestToObj(creepsInRoom, structure), (creep) => {
                    if (new TaskRepair(structure.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }
                        _.remove(creepsInRoom, (c) => c.id === creep.id);

                        return false;
                    }

                    return true;
                });
            });
        });
    }
    /**
     * Assigns creeps to repair a structure.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Structure[]} structures The structures to repair.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static repairStructures(creeps, allCreeps, structures, say) {
        if (!structures || structures.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            _.forEach(structures, (structure) => {
                if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === structure.id).length === 0) {
                    if (new TaskRepair(structure.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        return false;
                    }
                }

                return true;
            });
        });
    }
    /**
     * Assigns creeps to reserve a controller in a room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Room} room The room of the controller to observe.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static reserveController(creeps, room, say) {
        if (room && !room.unobservable && room.controller) {
            _.forEach(creeps, (creep) => {
                if (room.controller.my) {
                    Commands.setRoomType(room.name, {type: "base"});
                    if (new TaskSuicide().canAssign(creep)) {
                        creep.say("RIP :(");
                    }

                    return;
                }
                if (new TaskReserve().canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            });
        }
    }
    /**
     * Assigns an army unit to retreat when hurt.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} healers The healers to check against.
     * @param {string} stageRoomName The name of the staging room.
     * @param {string} attackRoomName The name of the attack room.
     * @param {number} minHealthPercent The minimum amount a health a unit must have to not retreat.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static retreatArmyUnit(creeps, healers, stageRoomName, attackRoomName, minHealthPercent, say) {
        if (!healers || healers.length === 0) {
            return;
        }
        if (stageRoomName !== attackRoomName) {
            const task = new TaskRally(stageRoomName, "room");
            _.forEach(_.filter(creeps, (c) => (c.room.name === attackRoomName || c.pos.x <= 1 || c.pos.x >= 48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hits / c.hitsMax < minHealthPercent), (creep) => {
                if (task.canAssign(creep)) {
                    ({time: creep.memory.currentTask.priority} = Game);
                    if (say) {
                        creep.say(say);
                    }
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
     * @return {void}
     */
    static retreatArmyUnitOrMoveToHealer(creeps, healers, stageRoomName, attackRoomName, minHealthPercent, say) {
        if (!healers || healers.length === 0) {
            return;
        }
        if (stageRoomName !== attackRoomName) {
            const task = new TaskRally(stageRoomName, "room");
            _.forEach(_.filter(creeps, (c) => (c.room.name === attackRoomName || c.pos.x <= 2 || c.pos.x >= 47 || c.pos.y <= 2 || c.pos.y >= 47) && c.hits / c.hitsMax < minHealthPercent), (creep) => {
                if (task.canAssign(creep)) {
                    ({time: creep.memory.currentTask.priority} = Game);
                    if (say) {
                        creep.say(say);
                    }
                }
            });
        }
        const healersNotEscorting = _.filter(healers, (h) => !h.memory.escorting);

        if (healersNotEscorting.length > 0) {
            _.forEach(creeps, (creep) => {
                const closest = Utilities.objectsClosestToObj(healersNotEscorting, creep);
                let task;
                if (closest[0].pos.getRangeTo(creep) > 2) {
                    task = new TaskRally(closest[0].pos, "position");
                    if (task.canAssign(creep)) {
                        ({time: creep.memory.currentTask.priority} = Game);
                    }
                }
            });
        }
    }
    /**
     * Assign creeps to stomp out hostile construction sites.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {ConstructionSite[]} sites The list of construction sites to stomp.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static stomp(creeps, sites, say) {
        if (!sites || sites.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            if (new TaskRally(Utilities.objectsClosestToObj(sites, creep)[0].pos, "position").canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                if (say) {
                    creep.say(say);
                }
            }
        });
    }
    /**
     * Assigns creeps to upgrade controllers.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {StructureController} controller The controller to upgrade.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static upgradeController(creeps, controller, say) {
        if (controller.my) {
            const task = new TaskUpgradeController(controller.room.name);

            _.forEach(creeps, (creep) => {
                if (task.canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            });
        }
    }
    /**
     * Assigns creeps to upgrade controllers that are critically low.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {StructureController} controller The controller to upgrade.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static upgradeCriticalController(creeps, controller, say) {
        if (controller.my && controller.ticksToDowngrade < [0, 10000, 3500, 5000, 10000, 20000, 30000, 50000, 100000][controller.level]) {
            if (new TaskUpgradeController(controller.room.name).canAssign(creeps[0])) {
                if (say) {
                    creeps[0].say(say);
                }
            }
        }
    }
}

if (Memory.profiling) {
    __require(1,56).registerObject(Assign, "Assign");
}
module.exports = Assign;

return module.exports;
}
/********** End of module 56: ../src/assign.js **********/
/********** Start module 57: ../src/roomEngine.js **********/
__modules[57] = function(module, exports) {
const Cache = __require(3,57),
    Utilities = __require(9,57);
/**
 * A class representing a room engine.
 */
class RoomEngine {
    /**
     * Creates a new room engine.
     */
    constructor() {}
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
        if (checkSettings.max > 0 || count > 0) {
        }
        if (!checkSettings.spawn) {
            return;
        }

        const {memory, memory: {roomType}} = room,
            supportRoomName = checkSettings.supportRoom || (roomType && roomType.supportRoom ? roomType.supportRoom : roomName),
            {rooms: {[supportRoomName]: supportRoom}} = Game;
        checkSettings.home = checkSettings.roomToSpawnFor || roomName;
        checkSettings.supportRoom = supportRoomName;
        ({energyCapacityAvailable: checkSettings.energyCapacityAvailable} = supportRoom);
        const spawnSettings = Role.spawnSettings(checkSettings);
        if (spawnSettings.boosts && supportRoom && Cache.labsInRoom(supportRoom).length > 0) {
            labsToBoostWith = Utilities.getLabToBoostWith(supportRoom, Object.keys(spawnSettings.boosts).length);

            canBoost = !!labsToBoostWith;
        }
        if (checkSettings.spawnFromRegion) {
            ({0: spawnToUse} = _.filter(Game.spawns, (s) => !Cache.spawning[s.id] && !s.spawning && s.room.memory.region === room.memory.region && s.room.energyAvailable >= Utilities.getBodypartCost(spawnSettings.body)).sort((a, b) => (a.room.name === roomName ? 0 : 1) - (b.room.name === roomName ? 0 : 1)));
        } else {
            ({0: spawnToUse} = _.filter(Game.spawns, (s) => !Cache.spawning[s.id] && !s.spawning && s.room.name === roomName && s.room.energyAvailable >= Utilities.getBodypartCost(spawnSettings.body)));
        }
        if (!spawnToUse) {
            return;
        }

        spawnSettings.memory.labs = canBoost ? _.map(labsToBoostWith, (l) => l.id) : [];
        const name = spawnToUse.createCreep(spawnSettings.body, `${checkSettings.name}-${checkSettings.roomToSpawnFor || roomName}-${Game.time.toFixed(0).substring(4)}`, spawnSettings.memory),
            spawning = typeof name !== "number";

        if (spawning) {
            delete memory.maxCreeps[checkSettings.name];
        }

        Cache.spawning[spawnToUse.id] = spawning;

        if (canBoost && typeof spawning) {
            const {memory: {labsInUse}} = supportRoom;
            let labIndex = 0;

            _.forEach(spawnSettings.boosts, (amount, resource) => {
                labsToBoostWith[labIndex].creepToBoost = name;
                labsToBoostWith[labIndex].resource = resource;
                labsToBoostWith[labIndex].amount = 30 * amount;
                labsInUse.push(labsToBoostWith[labIndex]);

                labIndex++;
            });
            if (Cache.creeps[supportRoomName]) {
                _.forEach(_.filter(Cache.creeps[supportRoomName].all, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && _.map(labsToBoostWith, (l) => l.id).indexOf(c.memory.currentTask.id) !== -1), (creep) => {
                    delete creep.memory.currentTask;
                });
            }
        }
    }
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
    __require(1,57).registerObject(RoomEngine, "RoomEngine");
}
module.exports = RoomEngine;

return module.exports;
}
/********** End of module 57: ../src/roomEngine.js **********/
/********** Start module 58: ../src/pathing.js **********/
__modules[58] = function(module, exports) {
const Cache = __require(3,58),
    direction = {
        1: {dx: 0, dy: -1},
        2: {dx: 1, dy: -1},
        3: {dx: 1, dy: 0},
        4: {dx: 1, dy: 1},
        5: {dx: 0, dy: 1},
        6: {dx: -1, dy: 1},
        7: {dx: -1, dy: 0},
        8: {dx: -1, dy: -1}
    };
/**
 * A class for efficient creep pathing.
 */
class Pathing {
    /**
     * Moves a creep to a position.
     * @param {Creep} creep The creep to move.
     * @param {object} pos The position or object to path to.
     * @param {number} [range=0] The range to path within.
     * @param {bool} [flee=false] Whether to flee from the position.
     * @param {Creep[]} [fleeFrom] All creeps to flee from.
     * @return {void}
     */
    static moveTo(creep, pos, range, flee, fleeFrom) {
        const {memory: creepMemory, pos: creepPos} = creep,
            {x: creepX, y: creepY, roomName: creepRoom} = creepPos,
            {time: tick} = Game,
            restartOn = [];
        let {_pathing: pathing} = creepMemory,
            wasStationary, firstPos, multiplier;

        if (pos instanceof RoomObject) {
            ({pos} = pos);
        }

        const creepRange = creepPos.getRangeTo(pos);
        if (!range) {
            range = 0;
        }
        if (!flee && creepRange <= range || flee && creepRange >= range) {
            return;
        }

        const {x: posX, y: posY, roomName: posRoom} = pos;

        if (pathing) {
            if (pathing.dest.x !== posX || pathing.dest.y !== posY || pathing.dest.room !== posRoom) {
                delete creepMemory._pathing;
                pathing = void 0;
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
                    const {[+pathing.path[0]]: dir} = direction;

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
                    delete creepMemory._pathing;
                    pathing = void 0;
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
            const moveParts = creep.getActiveBodyparts(MOVE),
                {paths} = Memory;
            let newPath;
            multiplier = 1 + (_.filter(creep.body, (b) => b.hits > 0 && [MOVE, CARRY].indexOf(b.type) === -1).length + Math.ceil(_.sum(creep.carry) / 50) - moveParts) / moveParts;
            if (pathing && pathing.blocked) {
                _.remove(pathing.blocked, (b) => b.blockedUntil <= tick);
            }

            const key = `${creepRoom}.${creepX}.${creepY}.${posRoom}.${posX}.${posY}.${range}.${multiplier <= 1 ? 0 : 1}`,
                {[key]: path} = paths;

            if ((!pathing || pathing.blocked.length === 0) && path && !flee) {
                if (pathing) {
                    pathing.path = this.decodePath(path[0]);
                    ({1: pathing.restartOn} = path);
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
                        path: this.decodePath(path[0]),
                        stationary: 0,
                        blocked: [],
                        restartOn: path[1]
                    };
                }
                path[3] = tick;
            } else {
                newPath = PathFinder.search(creepPos, flee ? _.map(fleeFrom, (c) => ({pos: c.pos, range})) : {pos, range}, {
                    plainCost: Math.ceil(1 * multiplier),
                    swampCost: Math.ceil(5 * multiplier),
                    flee,
                    maxOps: creepRoom === posRoom ? 2000 : 100000,
                    roomCallback: (roomName) => {
                        const {rooms: {[roomName]: room}} = Game;
                        if (creepRoom !== roomName && (Memory.avoidRooms.indexOf(roomName) !== -1 || creepRoom === posRoom && roomName !== posRoom && !creepMemory.role.startsWith("remote") && !creepMemory.role.startsWith("army"))) {
                            return false;
                        }

                        if (!room) {
                            restartOn.push(roomName);

                            return true;
                        }

                        const matrix = Cache.costMatrixForRoom(room);

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

                if (!newPath.path || newPath.path.length === 0) {
                    return;
                }
                if (pathing) {
                    pathing.path = this.serializePath(creepPos, newPath.path);
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
                        path: this.serializePath(creepPos, newPath.path),
                        stationary: 0,
                        blocked: [],
                        restartOn
                    };
                }
                if (pathing.blocked.length === 0 && pathing.path.length > 10 && !flee) {
                    paths[key] = [this.encodePath(pathing.path), [], tick, tick];
                    if (restartOn && restartOn.length > 0) {
                        paths[key][1] = restartOn;
                    }
                }
            }
        }
        if (creep.move(+pathing.path[0]) !== OK) {
            pathing.stationary -= 1;
        }

        creepMemory._pathing = pathing;
    }
    /**
     * Serializes the path to a string.
     * @param {RoomPosition} start The starting location of the path.
     * @param {RoomPosition[]} path Every location along the path.
     * @return {string} A serialized path.
     */
    static serializePath(start, path) {
        return _.map(path, (pos, index) => {
            let startPos;

            if (index === 0) {
                startPos = start;
            } else {
                ({[index - 1]: startPos} = path);
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

            return "";
        }).join("");
    }
    /**
     * Encodes a path to reduce size by ~50%.
     * @param {string} path The path to encode.
     * @return {string} The encoded path.
     */
    static encodePath(path) {
        const codes = [];
        let index;

        for (index = 0; index < path.length; index += 2) {
            if (index === path.length - 1) {
                codes.push(path.charCodeAt(index) - 17);
            } else {
                codes.push((path.charCodeAt(index) - 49) * 8 + (path.charCodeAt(index + 1) - 49) + 40);
            }
        }

        return String.fromCharCode(...codes);
    }
    /**
     * Decodes an encoded path.
     * @param {string} path The path to decode.
     * @return {string} The decoded path.
     */
    static decodePath(path) {
        const codes = [];
        let index;

        for (index = 0; index < path.length; index++) {
            const char = path.charCodeAt(index);

            if (char < 40) {
                codes.push(char + 17);
            } else {
                codes.push(Math.floor((char - 40) / 8) + 49);
                codes.push((char - 40) % 8 + 49);
            }
        }

        return String.fromCharCode(...codes);
    }
}

if (Memory.profiling) {
    __require(1,58).registerObject(Pathing, "Pathing");
}
module.exports = Pathing;

return module.exports;
}
/********** End of module 58: ../src/pathing.js **********/
/********** Footer **********/
if(typeof module === "object")
	module.exports = __require(0);
else
	return __require(0);
})();
/********** End of footer **********/
