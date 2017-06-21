const profiler = require("screeps-profiler"),
    Army = require("army"),
    Cache = require("cache"),
    Commands = require("commands"),
    Drawing = require("drawing"),
    Market = require("market"),
    Minerals = require("minerals"),
    // Segment = require("segment"),
    Tower = require("tower"),
    Utilities = require("utilities"),
    RoleArmyDismantler = require("role.armyDismantler"),
    RoleArmyHealer = require("role.armyHealer"),
    RoleArmyMelee = require("role.armyMelee"),
    RoleArmyRanged = require("role.armyRanged"),
    RoleClaimer = require("role.claimer"),
    RoleCollector = require("role.collector"),
    RoleDefender = require("role.defender"),
    RoleDismantler = require("role.dismantler"),
    RoleDowngrader = require("role.downgrader"),
    RoleHealer = require("role.healer"),
    RoleMiner = require("role.miner"),
    RoleRemoteBuilder = require("role.remoteBuilder"),
    RoleRemoteCollector = require("role.remoteCollector"),
    RoleRemoteDismantler = require("role.remoteDismantler"),
    RoleRemoteMiner = require("role.remoteMiner"),
    RoleRemoteReserver = require("role.remoteReserver"),
    RoleRemoteStorer = require("role.remoteStorer"),
    RoleRemoteWorker = require("role.remoteWorker"),
    RoleScientist = require("role.scientist"),
    RoleStorer = require("role.storer"),
    RoleUpgrader = require("role.upgrader"),
    RoleWorker = require("role.worker"),
    RoomBase = require("room.base"),
    RoomCleanup = require("room.cleanup"),
    RoomMine = require("room.mine"),
    RoomSource = require("room.source"),
    TaskBuild = require("task.build"),
    TaskClaim = require("task.claim"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskCollectMinerals = require("task.collectMinerals"),
    TaskDismantle = require("task.dismantle"),
    TaskDowngrade = require("task.downgrade"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals"),
    TaskFlee = require("task.flee"),
    TaskHarvest = require("task.harvest"),
    TaskHeal = require("task.heal"),
    TaskMeleeAttack = require("task.meleeAttack"),
    TaskMine = require("task.mine"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),
    TaskRepair = require("task.repair"),
    TaskReserve = require("task.reserve"),
    TaskSuicide = require("task.suicide"),
    TaskUpgradeController = require("task.upgradeController");

//  #   #           #
//  #   #
//  ## ##   ###    ##    # ##
//  # # #      #    #    ##  #
//  #   #   ####    #    #   #
//  #   #  #   #    #    #   #
//  #   #   ####   ###   #   #
/**
 * A class representing the main entry point of the scripts.
 */
class Main {
    // ##
    //  #
    //  #     ##    ##   ###
    //  #    #  #  #  #  #  #
    //  #    #  #  #  #  #  #
    // ###    ##    ##   ###
    //                   #
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

    //  #           #     #
    //                    #
    // ##    ###   ##    ###
    //  #    #  #   #     #
    //  #    #  #   #     #
    // ###   #  #  ###     ##
    /**
     * Initializes the script.
     * @return {void}
     */
    static init() {
        const generationTick = Game.time % 1500;

        // Init memory.
        // Segment.init();

        // Reset the cache.
        Cache.reset();

        // Detect a system reset.
        if (!this.reset) {
            this.reset = true;
            // TODO: Notify of system reset.
        }

        // Set and unset Memory.buy.
        if (Cache.credits < Memory.minimumCredits) {
            delete Memory.buy;
        }

        if (Cache.credits >= Memory.minimumCredits * 1.5) {
            Memory.buy = true;
        }

        // Export global objects to Game.cmd for use from console.
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
        if (!Memory.avoidSquares) {
            Memory.avoidSquares = {};
        }
        if (!Memory.paths) {
            Memory.paths = {};
        }

        // this.paths = new Segment(4);
        // if (!this.paths.memory) {
        //     this.paths.memory = Memory.paths;
        // }

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

        // Clear old memory every 10 ticks.
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

            // Paths are good for 500 ticks if unused, 1500 ticks if used.
            _.forEach(Memory.paths, (value, id) => {
                if (value[3] <= Game.time - 500 || value[2] <= Game.time - 1500) {
                    delete Memory.paths[id];
                }
            });
            // _.forEach(this.paths, (value, id) => {
            //    if (value[3] <= Game.time - 500 || value[2] <= Game.time - 1500) {
            //         delete this.paths.memory[id];
            //     }
            // });
        }

        delete Memory.flags;

        // Every generation, clear cache.
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

        // Setup cached creeps.
        Cache.creeps = Utilities.nest(_.filter(Game.creeps, (c) => c.memory.home || c.memory.army), [(c) => c.memory.home || c.memory.army, (c) => c.memory.role]);
        _.forEach(Cache.creeps, (creeps, entity) => {
            Cache.creeps[entity].all = _.flatten(_.values(creeps));
        });
    }

    //        #                            ##
    //                                      #
    // # #   ##    ###    ##   ###    ###   #     ###
    // ####   #    #  #  # ##  #  #  #  #   #    ##
    // #  #   #    #  #  ##    #     # ##   #      ##
    // #  #  ###   #  #   ##   #      # #  ###   ###
    /**
     * Gets data on minerals needed for rooms, including what labs should buy or create.
     * @return {void}
     */
    static minerals() {
        const mineralOrders = {};

        if (Game.time % 10 === 0 || Game.cpu.bucket >= Memory.marketBucket) {
            // Determine the minerals we need.
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

            // Determine how many of each mineral needs to be saved in each room.
            _.forEach(minerals, (mineral) => {
                ({amount: reserveMinerals[mineral.resource]} = mineral);
            });

            // Get market price for each mineral.
            _.forEach(_.uniq(_.map(Market.getAllOrders(), (o) => o.resourceType)), (resource) => {
                const {0: sellOrder} = Market.getFilteredOrders().sell[resource] || [],
                    mineral = _.find(minerals, (m) => m.resource === resource);

                mineralOrders[resource] = sellOrder ? sellOrder.price : Infinity;

                if (mineral) {
                    ({[resource]: mineral.marketPrice} = mineralOrders);
                }
            });

            // Get the value of each resource.
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

            // Get resources to buy or create.
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

                // Set the amount of each resource in the room.
                _.forEach(roomMinerals, (mineral) => {
                    const {resource} = mineral;

                    mineral.amountInRoom = (storageStore[resource] || 0) + (terminalStore[resource] || 0) + _.sum(allCreepsInRoom, (c) => c.carry[resource] || 0) + _.sum(labs, (l) => l.mineralType === resource ? l.mineralAmount : 0);
                });

                // Buy the most needed resource.
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

                // Create the most needed resource.
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

    // #                        #  #         #           #
    // #                        ####         #
    // ###    ###   ###    ##   ####   ###  ###   ###   ##    #  #   ##    ###
    // #  #  #  #  ##     # ##  #  #  #  #   #    #  #   #     ##   # ##  ##
    // #  #  # ##    ##   ##    #  #  # ##   #    #      #     ##   ##      ##
    // ###    # #  ###     ##   #  #   # #    ##  #     ###   #  #   ##   ###
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

            // Step 1, create the room's initial matrix with structures defined.
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

            // Step 2, try to get to each position within the room.  If it fails, set the terrain as unwalkable.
            if (matrix.status === "building") {
                const {0: firstSpawn} = Cache.spawnsInRoom(room),
                    tempMatrix = PathFinder.CostMatrix.deserialize(matrix.tempMatrix),
                    costMatrix = PathFinder.CostMatrix.deserialize(matrix.costMatrix);

                for (; matrix.x < 50; matrix.x++) {
                    for (; matrix.y < 50; matrix.y++) {
                        // Break if CPU is too high, try again later.
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

                // Set ramparts back to 0.
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

    //    #                            #          ##     #                 ##
    //    #                                        #                      #  #
    //  ###   ##    ###    ##   ###   ##     ###   #    ##    ####   ##   #     ###    ##    ##   ###    ###
    // #  #  # ##  ##     # ##  #  #   #    #  #   #     #      #   # ##  #     #  #  # ##  # ##  #  #  ##
    // #  #  ##      ##   ##    #      #    # ##   #     #     #    ##    #  #  #     ##    ##    #  #    ##
    //  ###   ##   ###     ##   #     ###    # #  ###   ###   ####   ##    ##   #      ##    ##   ###   ###
    //                                                                                            #
    /**
     * Deserialies creep tasks from memory into task objects.
     * @return {void}
     */
    static deserializeCreeps() {
        const {creepTasks} = Cache;

        // Loop through each creep to deserialize their task.
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

    //    #                            #          ##     #                ###
    //    #                                        #                      #  #
    //  ###   ##    ###    ##   ###   ##     ###   #    ##    ####   ##   #  #   ##    ##   # #    ###
    // #  #  # ##  ##     # ##  #  #   #    #  #   #     #      #   # ##  ###   #  #  #  #  ####  ##
    // #  #  ##      ##   ##    #      #    # ##   #     #     #    ##    # #   #  #  #  #  #  #    ##
    //  ###   ##   ###     ##   #     ###    # #  ###   ###   ####   ##   #  #   ##    ##   #  #  ###
    /**
     * Deserialize rooms from memory into room objects.
     * @return {void}
     */
    static deserializeRooms() {
        const {rooms} = Cache,
            unobservableRooms = {};

        // Loop through each room in memory to deserialize their type and find rooms that aren't observable.
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

    //    #                            #          ##     #                 ##                #
    //    #                                        #                      #  #
    //  ###   ##    ###    ##   ###   ##     ###   #    ##    ####   ##   #  #  ###   # #   ##     ##    ###
    // #  #  # ##  ##     # ##  #  #   #    #  #   #     #      #   # ##  ####  #  #  ####   #    # ##  ##
    // #  #  ##      ##   ##    #      #    # ##   #     #     #    ##    #  #  #     #  #   #    ##      ##
    //  ###   ##   ###     ##   #     ###    # #  ###   ###   ####   ##   #  #  #     #  #  ###    ##   ###
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

    // #           ##                            ####
    // #            #                            #
    // ###    ###   #     ###  ###    ##    ##   ###   ###    ##   ###    ###  #  #
    // #  #  #  #   #    #  #  #  #  #     # ##  #     #  #  # ##  #  #  #  #  #  #
    // #  #  # ##   #    # ##  #  #  #     ##    #     #  #  ##    #      ##    # #
    // ###    # #  ###    # #  #  #   ##    ##   ####  #  #   ##   #     #       #
    //                                                                    ###   #
    /**
     * Balance energy between rooms with terminals.
     * @return {void}
     */
    static balanceEnergy() {
        // See if there is some energy balancing we can do.
        const rooms = _.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.storage && r.storage.my && r.terminal && r.terminal.my).sort((a, b) => a.storage.store[RESOURCE_ENERGY] + a.terminal.store[RESOURCE_ENERGY] - (b.storage.store[RESOURCE_ENERGY] + b.terminal.store[RESOURCE_ENERGY]));
        let energyGoal;

        if (rooms.length > 1) {
            energyGoal = Math.min(_.sum(_.map(rooms, (r) => r.storage.store[RESOURCE_ENERGY] + r.terminal.store[RESOURCE_ENERGY])) / rooms.length, 500000);
            _.forEach(rooms, (room, index) => {
                const otherIndex = rooms.length - index - 1,
                    {[otherIndex]: {name: otherRoomName, storage: {store: {[RESOURCE_ENERGY]: otherRoomStorageEnergy}}, terminal: otherRoomTerminal, terminal: {store: {[RESOURCE_ENERGY]: otherRoomTerminalEnergy}}}} = rooms,
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
                    // TODO: Notify of energy transfer.
                    // Cache.log.events.push(`Sending ${Math.floor(otherRoomTerminalEnergy * (otherRoomTerminalEnergy / (otherRoomTerminalEnergy + transCost)))} energy from ${otherRoomName} to ${roomName}`);
                }

                return true;
            });
        }
    }

    // ###    ##    ##   # #    ###
    // #  #  #  #  #  #  ####  ##
    // #     #  #  #  #  #  #    ##
    // #      ##    ##   #  #  ###
    /**
     * Process game rooms.
     * @return {void}
     */
    static rooms() {
        const roomOrder = ["base", "source", "mine", "cleanup", ""],
            {rooms: memoryRooms} = Memory;

        ({name: Memory.rushRoom} = _.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.controller && r.controller.level < 8).sort((a, b) => b.controller.level - a.controller.level || b.controller.progress - a.controller.progress)[0] || {name: ""});

        // Loop through each room to determine the required tasks for the room, and then serialize the room.
        _.forEach(Array.prototype.concat.apply([], [_.filter(Game.rooms), this.unobservableRooms]).sort((a, b) => roomOrder.indexOf(memoryRooms[a.name] && memoryRooms[a.name].roomType && memoryRooms[a.name].roomType.type || "") - roomOrder.indexOf(memoryRooms[b.name] && memoryRooms[b.name].roomType && memoryRooms[b.name].roomType.type || "")), (room) => {
            const {name: roomName} = room,
                {rooms: {[roomName]: rooms}} = Cache,
                {[roomName]: roomMemory} = memoryRooms;

            if (rooms && roomMemory && roomMemory.roomType) {
                const {roomType: {type}} = roomMemory;

                // Run rooms.
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

    //    #                    ###
    //    #                    #  #
    //  ###  ###    ###  #  #  #  #   ##    ##   # #
    // #  #  #  #  #  #  #  #  ###   #  #  #  #  ####
    // #  #  #     # ##  ####  # #   #  #  #  #  #  #
    //  ###  #      # #  ####  #  #   ##    ##   #  #
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

    //  ###  ###   # #   #  #
    // #  #  #  #  ####  #  #
    // # ##  #     #  #   # #
    //  # #  #     #  #    #
    //                    #
    /**
     * Process armies.
     * @return {void}
     */
    static army() {
        // Loop through each army and run it.
        _.forEach(Cache.armies, (army) => {
            // Run army, then serialize it.
            army.run();

            army.toObj();
        });
    }

    //  ##   ###    ##    ##   ###    ###
    // #     #  #  # ##  # ##  #  #  ##
    // #     #     ##    ##    #  #    ##
    //  ##   #      ##    ##   ###   ###
    //                         #
    /**
     * Process creep tasks.
     * @return {void}
     */
    static creeps() {
        const {time} = Game;

        // Loop through each creep to run its current task, prioritizing most energy being carried first, and then serialize it.
        _.forEach(Game.creeps, (creep) => {

            // Don't do anything if the creep is spawning or stopped.
            if (creep.spawning || creep.memory.stop) {
                return;
            }

            const {ticksToLive: ttl, memory: creepMemory, room: {name: creepRoom}} = creep,
                {army} = creepMemory,
                {creepTasks: {[creep.name]: creepTask}} = Cache;

            // Countdown to death!
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

            // Army creeps know who their friends are.
            if (army && Cache.armies[army] && creepRoom === Cache.armies[army].attackRoom) {
                creep.say(["All", "my", "friends", "are", "heathens,", "take", "it", "slow.", "", "Wait", "for", "them", "to", "ask", "you", "who", "you", "know.", "", "Please", "don't", "make", "any", "sudden", "moves.", "", "You", "don't", "know", "the", "half", "of", "the", "abuse.", ""][time % 35], true);
            }

            // Happy new million!
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

                // Run creeps.
                creepTask.run(creep);

                // Purge current task if the creep is in a new room.
                if (creepMemory.lastRoom && creepMemory.lastRoom !== creepRoom && (!creepTask || !creepTask.force)) {
                    delete creepMemory.currentTask;
                }
                creepMemory.lastRoom = creepRoom;

                // Only serialize if the task wasn't completed.
                if (creepMemory.currentTask && creepTask && creepMemory.currentTask.type === creepTask.type) {
                    creepTask.toObj(creep);
                }

                // If the creep has a work part, try to repair any road that may be under it.
                if (creep.carry[RESOURCE_ENERGY] > 0 && creep.getActiveBodyparts(WORK) > 0) {
                    _.forEach(_.filter(creep.pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax), (structure) => {
                        creep.repair(structure);
                    });
                }

                // Suicide a rallying creep if necessary.
                if (!creep.spawning && ttl < 150 && _.sum(creep.carry) === 0 && (!creepMemory.currentTask || creepMemory.currentTask.type === "rally") && ["armyDismantler", "armyHealer", "armyMelee", "armyRanged", "claimer", "downgrader", "defender", "healer", "remoteReserver"].indexOf(creep.memory.role) === -1) {
                    creep.suicide();
                }
            } else {
                delete creepMemory.currentTask;

                // RIP & Pepperonis :(
                if (!creep.spawning && ttl < 150 && _.sum(creep.carry) === 0 && ["armyDismantler", "armyHealer", "armyMelee", "armyRanged", "claimer", "downgrader", "defender", "healer", "remoteReserver"].indexOf(creepMemory.role) === -1) {
                    creep.suicide();
                } else {
                    creep.say("Idle");
                }
            }
        });

        // this.paths.store();
    }

    //    #        #
    //    #        #
    //  ###   ##   ###   #  #   ###
    // #  #  # ##  #  #  #  #  #  #
    // #  #  ##    #  #  #  #   ##
    //  ###   ##   ###    ###  #
    //                          ###
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

    //    #                     ##   ##          #           ##
    //    #                    #  #   #          #            #
    //  ###  ###    ###  #  #  #      #     ##   ###    ###   #
    // #  #  #  #  #  #  #  #  # ##   #    #  #  #  #  #  #   #
    // #  #  #     # ##  ####  #  #   #    #  #  #  #  # ##   #
    //  ###  #      # #  ####   ###  ###    ##   ###    # #  ###
    /**
     * Draw information onto the global visual.
     * @return {void}
     */
    static drawGlobal() {
        let y;

        // GCL & Progress
        Cache.globalVisual.text(`GCL ${Game.gcl.level}`, -0.5, 0.025, {align: "left", font: "0.5 Arial"});
        Drawing.progressBar(Cache.globalVisual, 2.5, -0.4, 20, 0.5, Game.gcl.progress, Game.gcl.progressTotal, {background: "#808080", bar: "#00ff00", showDetails: true, color: "#ffffff", font: "0.5 Arial"});

        // Bucket
        Drawing.progressBar(Cache.globalVisual, 34.5, -0.4, 10, 0.5, Game.cpu.bucket, 10000, {label: "Bucket", background: "#808080", showMax: false, bar: Game.cpu.bucket >= 9990 ? "#00ffff" : Game.cpu.bucket >= 9000 ? "#00ff00" : Game.cpu.bucket >= 5000 ? "#cccc00" : "#ff0000", color: "#ffffff", font: "0.5 Arial"});

        // Time
        Cache.globalVisual.text(`Tick ${Game.time}`, 49.5, 0.025, {align: "right", font: "0.5 Arial"})
            .text(Cache.time, 49.5, 0.725, {align: "right", font: "0.5 Arial"});

        // Credits
        Cache.globalVisual.text(`Credits ${Game.market.credits.toFixed(2)}`, -0.5, 0.725, {align: "left", font: "0.5 Arial"});

        // Creeps
        Cache.globalVisual.text(`Creeps ${Object.keys(Game.creeps).length}`, -0.5, 1.425, {align: "left", font: "0.5 Arial"});

        // Energy
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

        // Stat logging for graphs
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

        // Graphs
        Drawing.sparkline(Cache.globalVisual, 23.5, 1, 18, 2, _.map(Memory.stats.cpu, (v, i) => ({cpu: Memory.stats.cpu[i], bucket: Memory.stats.bucket[i], limit: Game.cpu.limit})), [{key: "limit", min: Game.cpu.limit * 0.5, max: Game.cpu.limit * 1.5, stroke: "#c0c0c0", opacity: 0.25}, {key: "cpu", min: Game.cpu.limit * 0.5, max: Game.cpu.limit * 1.5, stroke: "#ffff00", opacity: 0.5}, {key: "bucket", min: 0, max: 10000, stroke: "#00ffff", opacity: 0.5, font: "0.5 Arial"}]);

        // Update CPU
        Memory.stats.cpu[Memory.stats.cpu.length - 1] = Game.cpu.getUsed();

        // CPU
        Drawing.progressBar(Cache.globalVisual, 23.5, -0.4, 10, 0.5, Game.cpu.getUsed(), Game.cpu.limit, {label: "CPU", background: "#808080", valueDecimals: 2, bar: Game.cpu.getUsed() > Game.cpu.limit ? "#ff0000" : "#00ff00", color: "#ffffff", font: "0.5 Arial"});
    }

    //   #    #                ##     #
    //  # #                     #
    //  #    ##    ###    ###   #    ##    ####   ##
    // ###    #    #  #  #  #   #     #      #   # ##
    //  #     #    #  #  # ##   #     #     #    ##
    //  #    ###   #  #   # #  ###   ###   ####   ##
    /**
     * Finalize log data and write it to memory.
     * @return {void}
     */
    static finalize() {
        // TODO: Write statistics to memory
        // log.cpuUsed = Game.cpu.getUsed();
        // log.date = new Date();
    }
}

// Don't forget to reload global when reactivating the profiler.
if (Memory.profiling) {
    profiler.registerObject(Main, "Main");
    profiler.enable();
}

module.exports = Main;
