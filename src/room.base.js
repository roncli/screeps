const Cache = require("cache"),
    Commands = require("commands"),
    Market = require("market"),
    Minerals = require("minerals"),
    RoomEngine = require("roomEngine"),
    Tower = require("tower"),
    Utilities = require("utilities"),
    RoleClaimer = require("role.claimer"),
    RoleCollector = require("role.collector"),
    RoleDismantler = require("role.dismantler"),
    RoleDowngrader = require("role.downgrader"),
    RoleMiner = require("role.miner"),
    RoleScientist = require("role.scientist"),
    RoleStorer = require("role.storer"),
    RoleUpgrader = require("role.upgrader"),
    RoleWorker = require("role.worker");

//  ####                        ####
//  #   #                        #  #
//  #   #   ###    ###   ## #    #  #   ###    ###    ###
//  ####   #   #  #   #  # # #   ###       #  #      #   #
//  # #    #   #  #   #  # # #   #  #   ####   ###   #####
//  #  #   #   #  #   #  # # #   #  #  #   #      #  #
//  #   #   ###    ###   #   #  ####    ####  ####    ###
/**
 * A class that represents a base room.
 */
class RoomBase extends RoomEngine {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new base room.
     * @param {Room} room The room.
     */
    constructor(room) {
        super();
        this.type = "base";
        this.room = room;

        // Initialize memory.
        if (!room.memory.maxCreeps) {
            room.memory.maxCreeps = {};
        }
    }

    // ###   #  #  ###
    // #  #  #  #  #  #
    // #     #  #  #  #
    // #      ###  #  #
    /**
     * Run the room.
     * @return {void}
     */
    run() {
        const {room} = this,
            {name: roomName} = room;

        if (room.unobservable) {
            // Something is supremely wrong.  Notify and bail.
            Game.notify(`Base Room ${roomName} is unobservable, something is wrong!`);

            return;
        }

        const spawns = Cache.spawnsInRoom(room),
            {terminal, storage, memory} = room,
            {labQueue, labsInUse} = memory;

        // Manage room.
        if (Game.time % 100 === 0 && spawns.length > 0) {
            this.manage();
        }

        // Defend base.
        this.defend();

        // Transfer energy from near link to far link.
        if (spawns.length > 0) {
            this.transferEnergy();
        }

        // Check to see if we can do a deal in the terminal.
        if (terminal && !terminal.cooldown) {
            if (Game.cpu.bucket >= 5000) {
                this.terminal();
            }
        }

        // Get the tasks needed for this room.
        this.tasks();

        // Spawn new creeps if there are available spawns in the region.
        this.spawn(_.filter(Game.spawns, (s) => !Cache.spawning[s.id] && !s.spawning && s.room.memory.region === memory.region).length > 0);

        // Assign tasks to creeps and towers.
        this.assignTasks();

        // Update lab queue if necessary.
        if (storage && Cache.labsInRoom(room).length >= 3 && labQueue && !Utilities.roomLabsArePaused(room)) {
            this.labQueue();
        }

        // Update labs in use.
        if (labsInUse) {
            this.labsInUse();
        }

        this.processPower();
    }

    // # #    ###  ###    ###   ###   ##
    // ####  #  #  #  #  #  #  #  #  # ##
    // #  #  # ##  #  #  # ##   ##   ##
    // #  #   # #  #  #   # #  #      ##
    //                          ###
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

        // Build extensions.
        if (extensionsToBuild > 0) {
            Utilities.buildStructures(room, STRUCTURE_EXTENSION, extensionsToBuild, spawn);
        }

        // At RCL3, build first tower.
        if (rcl >= 3 && Cache.towersInRoom(room).length === 0 && _.filter(sites, (c) => c.structureType === STRUCTURE_TOWER).length === 0) {
            Utilities.buildStructures(room, STRUCTURE_TOWER, 1, spawn);
        }

        // At RC3, build containers by source.
        if (rcl >= 3) {
            _.forEach(room.find(FIND_SOURCES), (source) => {
                const {path: {0: location}} = PathFinder.search(source.pos, {pos: spawnPos, range: 1}, {swampCost: 1}),
                    structures = location.lookFor(LOOK_STRUCTURES),
                    {x, y} = location;

                if (
                    _.filter(structures, (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                    _.filter(sites, (s) => s.pos.x === x && s.pos.y === y && s.structureType === STRUCTURE_CONTAINER).length === 0
                ) {
                    // Destroy roads and walls at this location.
                    _.forEach(_.filter(structures, (s) => [STRUCTURE_ROAD, STRUCTURE_WALL].indexOf(s.structureType) !== -1), (structure) => {
                        structure.destroy();
                    });

                    room.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                }
            });
        }

        // At RCL4, build storage.
        if (rcl >= 4 && !storage && _.filter(sites, (c) => c.structureType === STRUCTURE_STORAGE).length === 0) {
            Utilities.buildStructures(room, STRUCTURE_STORAGE, 1, spawn);
        }

        // At RCL6, build terminal.
        if (rcl >= 6 && storage && !room.terminal && _.filter(sites, (c) => c.structureType === STRUCTURE_TERMINAL).length === 0) {
            Utilities.buildStructures(room, STRUCTURE_TERMINAL, 1, storage);
        }

        // At RCL6, build extractor.
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

        // At RCL6, build containers by minerals.
        if (rcl >= 6) {
            _.forEach(minerals, (mineral) => {
                const {path: {0: location}} = PathFinder.search(mineral.pos, {pos: spawnPos, range: 1}, {swampCost: 1}),
                    structures = location.lookFor(LOOK_STRUCTURES),
                    {x, y} = location;

                if (
                    _.filter(structures, (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                    _.filter(sites, (s) => s.pos.x === x && s.pos.y === y && s.structureType === STRUCTURE_CONTAINER).length === 0
                ) {
                    // Destroy roads and walls at this location.
                    _.forEach(_.filter(structures, (s) => [STRUCTURE_ROAD, STRUCTURE_WALL].indexOf(s.structureType) !== -1), (structure) => {
                        structure.destroy();
                    });

                    room.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                }
            });
        }

        // At RCL3, build roads around our structures.
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

    //    #          #                  #
    //    #         # #                 #
    //  ###   ##    #     ##   ###    ###
    // #  #  # ##  ###   # ##  #  #  #  #
    // #  #  ##     #    ##    #  #  #  #
    //  ###   ##    #     ##   #  #   ###
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
                        army.boostRoom = "any";

                        if (attackTicks >= 2000) {
                            const rooms = _.filter(Game.rooms, (r) => {
                                const {memory} = r;

                                return memory && memory.roomType && memory.roomType.type === "base" && memory.region === roomMemory.region;
                            });

                            _.forEach(rooms, (remoteRoom) => {
                                const {name: remoteRoomName} = remoteRoom,
                                    remoteArmyName = `${remoteRoomName}-defense-for-${roomName}`;

                                if (!Memory.army[`${remoteRoomName}-defense`] && !Memory.army[remoteArmyName]) {
                                    Commands.createArmy(remoteArmyName, {reinforce: false, region: roomMemory.region, boostRoom: "any", buildRoom: roomName, stageRoom: roomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: 0, units: 20}, ranged: {maxCreeps: armySize, units: 20}});
                                }
                            });

                            if (attackTicks >= 2500) {
                                _.forEach(rooms, (remoteRoom) => {
                                    const {name: remoteRoomName} = remoteRoom,
                                        remoteArmyName = `${remoteRoomName}-defense-for-${roomName}`;

                                    if (Memory.army[remoteArmyName]) {
                                        Memory.army[remoteArmyName].boostRoom = "any";
                                    }
                                });
                            }
                        }
                    }

                    // Check edgeTicks, if any are over 50, spawn an army for that room, or update it if one already exists.
                    _.forEach(Object.keys(exits), (dir) => {
                        const dirArmyName = `${roomName}-${dir.toString()}-border-defense`;

                        if (!Memory.army[dirArmyName] && edgeTicks[dir] >= 50) {
                            Commands.createArmy(dirArmyName, {reinforce: false, region: roomMemory.region, boostRoom: "any", buildRoom: roomName, stageRoom: roomName, attackRoom: exits[dir], dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: 0, units: 20}, ranged: {maxCreeps: armySize, units: 20}});
                        }
                    });

                    // TODO: Test army casualties taken.  If 4 or more units are lost, reduce army size, defend with ranged only, and queue & respect base matrix.
                } else {
                    Game.notify(`Warning! ${roomName} is under attack!`);
                    Commands.createArmy(armyName, {reinforce: false, region: roomMemory.region, boostRoom: "any", buildRoom: roomName, stageRoom: roomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: 0, units: 20}, ranged: {maxCreeps: armySize, units: 20}, creepCount: 0});
                }
            }
        } else if (army) {
            // This is a true success only if 50 ticks have passed since the last hostile was seen.
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

    //  #                               #               ####
    //  #                              # #              #
    // ###   ###    ###  ###    ###    #     ##   ###   ###   ###    ##   ###    ###  #  #
    //  #    #  #  #  #  #  #  ##     ###   # ##  #  #  #     #  #  # ##  #  #  #  #  #  #
    //  #    #     # ##  #  #    ##    #    ##    #     #     #  #  ##    #      ##    # #
    //   ##  #      # #  #  #  ###     #     ##   #     ####  #  #   ##   #     #       #
    //                                                                           ###   #
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

    //  #                       #                ##
    //  #                                         #
    // ###    ##   ###   # #   ##    ###    ###   #
    //  #    # ##  #  #  ####   #    #  #  #  #   #
    //  #    ##    #     #  #   #    #  #  # ##   #
    //   ##   ##   #     #  #  ###   #  #   # #  ###
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
                // Buy what we need to for the lab queue.
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
                // Transfer what we have in excess to rooms in need if we have the minimum credits.
                // TODO: Transfer the first excess mineral to the room that needs it the most.
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
                            amount: Math.min(reserveMinerals ? s + (storageStore[k] || 0) - (k.startsWith("X") && k.length === 5 ? reserveMinerals[k] - 5000 : reserveMinerals[k]) : 0, s),
                            otherRoomAmount: (otherRoom.terminal.store[k] || 0) + (otherRoomStorage && otherRoomStorage.store[k] || 0),
                            needed: reserveMinerals ? (k.startsWith("X") && k.length === 5 ? reserveMinerals[k] - 5000 : reserveMinerals[k]) || 0 : 0
                        })), (r) => {
                            const {otherRoomAmount, needed, amount} = r;

                            return reserveMinerals[r.resource] && otherRoomAmount < needed && amount > 0 && Math.min(amount, needed - otherRoomAmount) >= 100;
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

                // Sell what we have in excess.
                if (!dealMade) {
                    const terminalMinerals = _.filter(_.map(terminalStore, (s, k) => ({resource: k, amount: Math.min(s, s - (reserveMinerals ? (k.startsWith("X") && k.length === 5 ? reserveMinerals[k] - 5000 : reserveMinerals[k]) || 0 : 0) + (storageStore[k] || 0))})), (s) => s.resource !== RESOURCE_ENERGY && s.amount > 0);

                    if (terminalMinerals.length > 0) {
                        _.forEach(terminalMinerals.sort((a, b) => b.amount - a.amount), (topResource) => {
                            const {resource} = topResource,
                                mineralPrice = _.find(mineralPrices, (m) => m.resource === resource),
                                {0: bestOrder} = _.filter(Market.getFilteredOrders().buy[resource] || [], (o) => topResource.amount >= 5005 && !Memory.buy || mineralPrice && o.price > mineralPrice.value);

                            if (bestOrder) {
                                const {amount: bestAmount} = bestOrder;
                                let amount = Math.min(topResource.amount >= 5005 ? topResource.amount - 5000 : topResource.amount, bestAmount);
                                const transCost = market.calcTransactionCost(amount, roomName, bestOrder.roomName);

                                if (terminalEnergy > transCost) {
                                    Market.deal(bestOrder.id, amount, roomName);
                                    dealMade = true;

                                    return false;
                                } else if (terminalEnergy > 0) {
                                    amount = Math.floor(amount * terminalEnergy / transCost);

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

                // Find an order to flip if we haven't made a deal and we have enough energy.
                if (!dealMade && storage && maxEnergy > Memory.marketEnergy && (!Memory.buy || _.filter(Game.rooms, (r) => r.memory.buyQueue).length === 0)) {
                    const filteredOrders = Market.getFilteredOrders();

                    _.forEach(Minerals, (children, resource) => {
                        // Energy and tokens are not to be traded.
                        if ([RESOURCE_ENERGY, SUBSCRIPTION_TOKEN].indexOf(resource) !== -1) {
                            return;
                        }

                        // Only flip what we are full on and deal in.
                        if (!storageStore || !reserveMinerals[resource] || (storageStore[resource] || 0) < reserveMinerals[resource]) {
                            return;
                        }

                        // Do not flip anything we have too much of.
                        if ((terminalStore[resource] || 0) >= 5000) {
                            return;
                        }

                        // Get all the orders that can be flipped.
                        const {0: sellOrder} = filteredOrders.sell[resource] || [],
                            {0: buyOrder} = filteredOrders.buy[resource] || [],
                            mineralPrice = _.find(mineralPrices, (m) => m.resource === resource);

                        if (sellOrder && buyOrder && sellOrder.price < buyOrder.price && sellOrder.price < Cache.credits && (!mineralPrice || sellOrder.price <= mineralPrice.value && buyOrder.price >= mineralPrice.value)) {
                            flips.push({resource, buy: buyOrder, sell: sellOrder});
                        }
                    });

                    _.forEach(flips.sort((a, b) => a.sell.price - a.buy.price - (b.sell.price - b.buy.price)), (flip, index) => {
                        const {sell, buy, resource} = flip,
                            {price: sellPrice} = sell;
                        let amount = Math.min(buy.amount, sell.amount, 5000 - (terminalStore[resource] || 0));

                        if (amount * sellPrice > Cache.credits) {
                            amount = Math.floor(Cache.credits / sellPrice);
                        }

                        if (index === 0) {
                            Memory.messages.push({
                                date: new Date(),
                                tick: Game.time,
                                message: `Biggest flip: ${flip.resource} x${amount} ${sellPrice.toFixed(2)} to ${buy.price.toFixed(2)}`
                            });
                        }

                        // Determine how much energy we need for the deal.
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

    //  #                 #
    //  #                 #
    // ###    ###   ###   # #    ###
    //  #    #  #  ##     ##    ##
    //  #    # ##    ##   # #     ##
    //   ##   # #  ###    #  #  ###
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
            spawns = Cache.spawnsInRoom(room),
            {creeps: {[roomName]: creeps}} = Cache,
            scientists = creeps && creeps.scientist || [];
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
            structuresWithEnergy: [..._.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] >= 500).sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]), ...storage && storage.my ? [storage] : []],
            structuresWithMinerals: _.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] < _.sum(c.store)).sort((a, b) => _.sum(b.store) - _.sum(a.store)),
            storageCollectEnergy: storage && store[RESOURCE_ENERGY] ? [storage] : [],
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

        // storageResourcesNeeded
        if (storage && storage.my) {
            // If the room only has storage and no terminal, minerals go to storage.
            // Otherwise, if the room has storage and is not at capacity, minerals should be put into storage, but only up to a certain amount.
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

        // nukerResourcesNeeded
        if (nuker) {
            tasks.nukerResourcesNeeded[RESOURCE_GHODIUM] = nuker.ghodiumCapacity - nuker.ghodium;
        }

        // powerSpawnResourcesNeeded
        if (powerSpawn) {
            if (powerSpawn.power / powerSpawn.powerCapacity < 0.5) {
                tasks.powerSpawnResourcesNeeded[RESOURCE_POWER] = powerSpawn.powerCapacity - powerSpawn.power;
            } else if (scientists.length > 0 && scientists[0].memory.currentTask && scientists[0].memory.currentTask.type === "fillMinerals" && scientists[0].memory.currentTask.id === powerSpawn.id) {
                delete scientists[0].memory.currentTask;
            }
        }

        // labsCollectMinerals
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

        // labsFillMinerals
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

        // terminalCollectMinerals
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

        // storageCollectMinerals
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

            // We only need to transfer from storage to lab when we have both storage and at least 3 labs.
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

            // We only need to transfer from storage to terminal when we have both storage and terminal.
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
                // If we have a nuker, transfer ghodium.  If we have a power spawn, transfer power.
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

        // links
        if (links.length > 1 && spawns.length > 0) {
            tasks.links = [Utilities.objectsClosestToObj(links, spawns[0])[0]];
        }
    }

    //  ###   ###    ###  #  #  ###
    // ##     #  #  #  #  #  #  #  #
    //   ##   #  #  # ##  ####  #  #
    // ###    ###    # #  ####  #  #
    //        #
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

    //                      #                ###                #
    //                                        #                 #
    //  ###   ###    ###   ##     ###  ###    #     ###   ###   # #    ###
    // #  #  ##     ##      #    #  #  #  #   #    #  #  ##     ##    ##
    // # ##    ##     ##    #     ##   #  #   #    # ##    ##   # #     ##
    //  # #  ###    ###    ###   #     #  #   #     # #  ###    #  #  ###
    //                            ###
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

    // ##          #      ##
    //  #          #     #  #
    //  #     ###  ###   #  #  #  #   ##   #  #   ##
    //  #    #  #  #  #  #  #  #  #  # ##  #  #  # ##
    //  #    # ##  #  #  ## #  #  #  ##    #  #  ##
    // ###    # #  ###    ##    ###   ##    ###   ##
    //                      #
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
                            Memory.mineralUsage.push({
                                tick: Game.time,
                                room: room.name,
                                type: "reaction",
                                minerals: [sourceLab0.mineralType, sourceLab1.mineralType],
                                amount: 5
                            });
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
                    Memory.mineralUsage.push({
                        tick: Game.time,
                        room: room.name,
                        type: "reaction",
                        minerals: [sourceLab0.mineralType, sourceLab1.mineralType],
                        amount: 5
                    });
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

    // ##          #            ###         #  #
    //  #          #             #          #  #
    //  #     ###  ###    ###    #    ###   #  #   ###    ##
    //  #    #  #  #  #  ##      #    #  #  #  #  ##     # ##
    //  #    # ##  #  #    ##    #    #  #  #  #    ##   ##
    // ###    # #  ###   ###    ###   #  #   ##   ###     ##
    /**
     * Checks for labs in use and updates the queue with what needs to be done with them.
     * @return {void}
     */
    labsInUse() {
        const {room, room: {memory: {labsInUse}}} = this,
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
                        Memory.mineralUsage.push({
                            tick: Game.time,
                            room: room.name,
                            type: "reaction",
                            minerals: [queue.resource],
                            amount: queue.amount
                        });

                        _.remove(creep.memory.labs, (l) => l === queue.id);
                        creep.memory.boosted = true;

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

    //                                             ###
    //                                             #  #
    // ###   ###    ##    ##    ##    ###    ###   #  #   ##   #  #   ##   ###
    // #  #  #  #  #  #  #     # ##  ##     ##     ###   #  #  #  #  # ##  #  #
    // #  #  #     #  #  #     ##      ##     ##   #     #  #  ####  ##    #
    // ###   #      ##    ##    ##   ###    ###    #      ##   ####   ##   #
    // #
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

    //  #           ##   #       #
    //  #          #  #  #
    // ###    ##   #  #  ###     #
    //  #    #  #  #  #  #  #    #
    //  #    #  #  #  #  #  #    #
    //   ##   ##    ##   ###   # #
    //                          #
    /**
     * Serialize the room to an object.
     * @return {void}
     */
    toObj() {
        Memory.rooms[this.room.name].roomType = {type: this.type};
    }

    //   #                      ##   #       #
    //  # #                    #  #  #
    //  #    ###    ##   # #   #  #  ###     #
    // ###   #  #  #  #  ####  #  #  #  #    #
    //  #    #     #  #  #  #  #  #  #  #    #
    //  #    #      ##   #  #   ##   ###   # #
    //                                      #
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
    require("screeps-profiler").registerObject(RoomBase, "RoomBase");
}
module.exports = RoomBase;
