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
    }

    // ###   #  #  ###   
    // #  #  #  #  #  #  
    // #     #  #  #  #  
    // #      ###  #  #  
    /**
     * Run the room.
     */
    run() {
        var room = this.room,
            roomName, spawns, terminal, storage, memory, labQueue, labsInUse;

        if (room.unobservable) {
            // Something is supremely wrong.  Notify and bail.
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
            this.terminal();
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
     */
    manage() {
        var room = this.room,
            controller = room.controller,
            rcl = controller.level,
            sites = room.find(FIND_MY_CONSTRUCTION_SITES),
            spawn = Cache.spawnsInRoom(room)[0],
            spawnPos = spawn.pos,
            storage = room.storage,
            minerals = room.find(FIND_MINERALS),
            roomName = room.name,
            extensionsToBuild;

        // Build extensions.
        if ((extensionsToBuild = [0, 5, 10, 20, 30, 40, 50, 60][rcl - 1] - (Cache.extensionsInRoom(room).length + _.filter(sites, (c) => c.structureType === STRUCTURE_EXTENSION).length)) > 0) {
            Utilities.buildStructures(room, STRUCTURE_EXTENSION, extensionsToBuild, spawn);
        }

        // At RCL3, build first tower.
        if (rcl >= 3 && Cache.towersInRoom(room).length === 0 && _.filter(sites, (c) => c.structureType === STRUCTURE_TOWER).length === 0) {
            Utilities.buildStructures(room, STRUCTURE_TOWER, 1, spawn);
        }

        // At RC3, build containers by source.
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

        // At RCL6, build containers by minerals.
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
     */
    defend() {
        var room = this.room,
            hostiles = _.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username !== "Invader"),
            roomName = room.name,
            armyName = `${roomName}-defense`,
            roomMemory = room.memory;

        if (hostiles.length > 0) {
            let threats, edgeTicks, armySize;

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

            threats = roomMemory.threats;
            edgeTicks = roomMemory.edgeTicks;
            
            _.forEach(_.filter(_.map(hostiles, (h) => ({id: h.id, threat: _.filter(h.body, (b) => [ATTACK, RANGED_ATTACK, HEAL].indexOf(b) !== -1).length}))), (hostile) => {
                threats[hostile.id] = hostile.threat;
            });
            armySize = Math.min(Math.ceil(_.sum(threats) / 20), 3);

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
                if (!Memory.army[armyName]) {
                    Game.notify(`Warning! ${roomName} is under attack!`);
                    Commands.createArmy(armyName, {reinforce: false, region: roomMemory.region, boostRoom: roomName, buildRoom: roomName, stageRoom: roomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: armySize, units: 20}, ranged: {maxCreeps: 0, units: 20}, creepCount: 0});
                } else {
                    let attackTicks = Game.time - roomMemory.currentAttack,
                        exits = Game.map.describeExits(roomName);

                    if (attackTicks >= 500) {
                        Memory.army[armyName].boostRoom = roomName;

                        if (attackTicks >= 2000) {
                            let rooms = _.filter(Game.rooms, (r) => r.memory && r.memory.region === roomMemory.region);

                            _.forEach(rooms, (remoteRoom) => {
                                var remoteRoomName = remoteRoom.name,
                                    remoteArmyName = `${remoteRoomName}-defense-for-${roomName}`;

                                if (!Memory.army[`${remoteRoomName}-defense`] && !Memory.army[remoteArmyName]) {
                                    Commands.createArmy(remoteArmyName, {reinforce: false, region: roomMemory.region, boostRoom: roomName, buildRoom: roomName, stageRoom: roomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: armySize, units: 20}, ranged: {maxCreeps: 0, units: 20}});
                                }
                            });

                            if (attackTicks >= 2500) {
                                _.forEach(rooms, (remoteRoom) => {
                                    var remoteRoomName = remoteRoom.name,
                                        remoteArmyName = `${remoteRoomName}-defense-for-${roomName}`;

                                    if (Memory.army[remoteArmyName]) {
                                        Memory.army[remoteArmyName].boostRoom = remoteRoomName;
                                    }
                                });
                            }
                        }
                    }

                    // Check edgeTicks, if any are over 50, spawn an army for that room, or update it if one already exists.
                    _.forEach(Object.keys(exits), (dir) => {
                        var dirArmyName = `${roomName}-${dir.toString()}-border-defense`;
                        if (!Memory.army[dirArmyName] && edgeTicks[dir] >= 50) {
                            Commands.createArmy(dirArmyName, {reinforce: false, region: roomMemory.region, boostRoom: roomName, buildRoom: roomName, stageRoom: roomName, attackRoom: exits[dir], dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: armySize, units: 20}, ranged: {maxCreeps: 0, units: 20}});
                        }
                    });

                    // Test army casualties taken.  If 4 or more units are lost, reduce army size and queue & respect base matrix.
                    // TODO
                }
            }
        } else if (Memory.army[armyName]) {
            // This is a true success only if 50 ticks have passed since the last hostile was seen.
            if (roomMemory.lastHostile + 50 < Game.time) {
                let army = Memory.army[armyName];

                if (army) {
                    army.directive = "attack";
                    army.success = true;
                }
                delete roomMemory.lastHostile;
                delete roomMemory.currentAttack;
                delete roomMemory.threats;
                delete roomMemory.edgeTicks;
            }
        } else {
            delete roomMemory.lastHostile;
            delete roomMemory.currentAttack;
            delete roomMemory.threats;
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
     */
    transferEnergy() {
        var room = this.room,
            links = Utilities.objectsClosestToObj(Cache.linksInRoom(room), Cache.spawnsInRoom(room)[0]),
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

    //  #                       #                ##    
    //  #                                         #    
    // ###    ##   ###   # #   ##    ###    ###   #    
    //  #    # ##  #  #  ####   #    #  #  #  #   #    
    //  #    ##    #     #  #   #    #  #  # ##   #    
    //   ##   ##   #     #  #  ###   #  #   # #  ###   
    /**
     * Make resource deals in the terminal.
     */
    terminal() {
        var room = this.room,
            terminal = room.terminal,
            terminalStore = terminal.store,
            terminalEnergy = terminalStore[RESOURCE_ENERGY] || 0,
            storage = room.storage,
            roomName = room.name,
            memory = room.memory,
            buyQueue = memory.buyQueue,
            dealMade = false,
            flips = [],
            storageStore = {},
            market = Game.market,
            maxEnergy = Math.max(..._.map(_.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.storage && r.storage.my && r.terminal && r.terminal.my), (r) => (r.storage && r.storage.my) ? r.storage.store[RESOURCE_ENERGY] : 0));
            
        if (storage) {
            storageStore = storage.store;
        }
        
        if (terminalEnergy >= 1000 && maxEnergy >= Memory.dealEnergy) {
            let reserveMinerals = Memory.reserveMinerals,
                buyResource;

            if (memory.buyQueue) {
                buyResource = buyQueue.resource;
                
                if (Cache.credits < Memory.minimumCredits || (storageStore[buyResource] || 0) + (terminalStore[buyResource] || 0) > (reserveMinerals[buyResource] || 0)) {
                    delete memory.buyQueue;
                    buyQueue = undefined;
                }
            }

            if (buyQueue && maxEnergy > Memory.marketEnergy && Memory.buy) {
                // Buy what we need to for the lab queue.
                let bestOrder = (Market.getFilteredOrders().sell[buyResource] || [])[0];

                if (bestOrder) {
                    let bestPrice = bestOrder.price;

                    if (bestPrice > buyQueue.price) {
                        delete memory.buyQueue;
                        buyQueue = undefined;
                    } else {
                        let bestAmount = bestOrder.amount,
                            transCost = market.calcTransactionCost(Math.min(buyQueue.amount, bestAmount), roomName, bestOrder.roomName);
                        
                        if (terminalEnergy > transCost && Cache.credits >= buyQueue.amount * bestPrice) {
                            Market.deal(bestOrder.id, Math.min(buyQueue.amount, bestAmount), roomName);
                            dealMade = true;
                            buyQueue.amount -= Math.min(buyQueue.amount, bestAmount);
                        } else {
                            if (terminalEnergy > 0) {
                                let amount = Math.min(Math.floor(Math.min(buyQueue.amount, bestAmount) * terminalEnergy / transCost), Math.floor(Cache.credits / bestPrice));

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
                // Transfer what we have in excess to rooms in need if we have the minimum credits.
                // TODO: Transfer the first excess mineral to the room that needs it the most.
                if (Cache.credits >= Memory.minimumCredits) {
                    _.forEach(_.filter(Game.rooms, (r) => {
                        var memory = r.memory,
                            roomType = memory.roomType,
                            terminal = r.terminal;
                        
                        return memory && roomType && roomType.type === "base" && terminal && terminal.my;
                    }), (otherRoom) => {
                        var otherRoomName = otherRoom.name,
                            otherRoomStorage = otherRoom.storage;

                        dealMade = false;
                        if (roomName === otherRoomName) {
                            return;
                        }

                        _.forEach(_.filter(_.map(terminalStore, (s, k) => ({
                            resource: k,
                            amount: Math.min(reserveMinerals ? s + storageStore[k] - (k.startsWith("X") && k.length === 5 ? reserveMinerals[k] - 5000 : reserveMinerals[k]) : 0, s),
                            otherRoomAmount: (otherRoom.terminal.store[k] || 0) + (otherRoomStorage && otherRoomStorage.store[k] || 0),
                            needed: reserveMinerals ? (k.startsWith("X") && k.length === 5 ? reserveMinerals[k] - 5000 : reserveMinerals[k]) || 0 : 0
                        })), (r) => {
                            var otherRoomAmount = r.otherRoomAmount,
                                needed = r.needed,
                                amount = r.amount;

                            return reserveMinerals[r.resource] && otherRoomAmount < needed && amount > 0 && needed - otherRoomAmount > 0 && Math.min(amount, needed - otherRoomAmount) >= 100;
                        }), (resource) => {
                            var amount = Math.min(resource.amount, resource.needed - resource.otherRoomAmount),
                                resourceResource = resource.resource;

                            let transCost = market.calcTransactionCost(amount, roomName, otherRoomName);

                            if (terminalEnergy > transCost) {
                                if (terminal.send(resourceResource, amount, otherRoomName) === OK) {
                                    Cache.log.events.push(`Sending ${amount} ${resourceResource} from ${roomName} to ${otherRoomName}`);
                                    dealMade = true;
                                    return false;
                                }
                            } else {
                                if (terminalEnergy > 0) {
                                    amount = Math.floor(amount * terminalEnergy / transCost);
                                    if (amount > 0) {
                                        if (terminal.send(resourceResource, amount, otherRoomName) === OK) {
                                            Cache.log.events.push(`Sending ${amount} ${resourceResource} from ${roomName} to ${otherRoomName}`);
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

                // Sell what we have in excess.
                if (!dealMade) {
                    let terminalMinerals = _.filter(_.map(terminalStore, (s, k) => {
                        return {resource: k, amount: Math.min(s, s - (reserveMinerals ? (k.startsWith("X") && k.length === 5 ? reserveMinerals[k] - 5000 : reserveMinerals[k]) || 0 : 0) + (storageStore[k] || 0))};
                    }), (s) => s.resource !== RESOURCE_ENERGY && s.amount > 0);

                    if (terminalMinerals.length > 0) {
                        _.forEach(terminalMinerals.sort((a, b) => b.amount - a.amount), (topResource) => {
                            var resource = topResource.resource,
                                bestOrder = _.filter(Market.getFilteredOrders().buy[resource] || [], (o) => (topResource.amount >= 5005 && Cache.credits < Memory.minimumCredits) || (!Memory.minimumSell[resource] && !Memory.flipPrice[resource]) || (Memory.minimumSell[resource] && o.price >= Memory.minimumSell[resource]) || (Memory.flipPrice[resource] && o.price >= Memory.flipPrice[resource].price) || (Memory.flipPrice[resource] && Game.time > Memory.flipPrice[resource].expiration))[0];
                            
                            if (bestOrder) {
                                let bestAmount = bestOrder.amount,
                                    transCost = market.calcTransactionCost(Math.min(topResource.amount, bestAmount), roomName, bestOrder.roomName);
                                
                                if (terminalEnergy > transCost) {
                                    Market.deal(bestOrder.id, Math.min(topResource.amount, bestAmount), roomName);
                                    dealMade = true;
                                    if (topResource.amount < 5005) {
                                        delete Memory.minimumSell[bestOrder.resourceType];
                                    }
                                    return false;
                                } else {
                                    if (terminalEnergy > 0) {
                                        let amount = Math.floor(Math.min(topResource.amount, bestAmount) * terminalEnergy / transCost);

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
                
                // Find an order to flip if we haven't made a deal and we have enough energy.
                if (!dealMade && storage && maxEnergy > Memory.marketEnergy) {
                    let filteredOrders = Market.getFilteredOrders();

                    _.forEach(Minerals, (children, resource) => {
                        var sellOrder, buyOrder;

                        // Only flip what we are full on.
                        if (!storageStore || (storageStore[resource] || 0) < reserveMinerals[resource]) {
                            return;
                        }

                        // Energy and tokens are not to be traded.
                        if ([RESOURCE_ENERGY, SUBSCRIPTION_TOKEN].indexOf(resource) !== -1) {
                            return;
                        }

                        // Get all the orders that can be flipped.
                        sellOrder = (filteredOrders.sell[resource] || [])[0];
                        buyOrder = (filteredOrders.buy[resource] || [])[0];

                        if (sellOrder && buyOrder && sellOrder.price < buyOrder.price && sellOrder.price < Cache.credits) {
                            flips.push({resource: resource, buy: buyOrder, sell: sellOrder});
                        }
                    });

                    _.forEach(flips.sort((a, b) => a.sell.price - a.buy.price - (b.sell.price - b.buy.price)), (flip, index) => {
                        var sell = flip.sell,
                            sellPrice = sell.price,
                            buy = flip.buy,
                            amount = Math.min(buy.amount, sell.amount),
                            transCost;
                        
                        if (amount * sellPrice > Cache.credits) {
                            amount = Math.floor(Cache.credits / sellPrice);
                        }

                        if (index === 0) {
                            Cache.log.events.push(`Biggest flip: ${flip.resource} x${amount} ${sellPrice.toFixed(2)} to ${buy.price.toFixed(2)}`);
                        }

                        // Determine how much energy we need for the deal.
                        transCost = market.calcTransactionCost(amount, roomName, sell.roomName);
                        if (terminalEnergy > transCost) {
                            Market.deal(sell.id, amount, roomName);
                            Memory.flipPrice[flip.resource] = {price: sellPrice, expiration: Game.time + 100};
                            dealMade = true;
                            return false;
                        }

                        if (terminalEnergy > 0) {
                            amount = Math.floor(amount * terminalEnergy / transCost);
                            if (amount > 0) {
                                Market.deal(sell.id, amount, roomName);
                                Memory.flipPrice[flip.resource] = {price: sellPrice, expiration: Game.time + 100};
                                dealMade = true;
                                return false;
                            }
                        }
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
     */
    tasks() {
        var room = this.room,
            controller = room.controller,
            rcl = controller ? controller.level : undefined,
            extensionEnergyCapacity = rcl ? EXTENSION_ENERGY_CAPACITY[rcl] : 0,
            nuker = Cache.nukersInRoom(room)[0],
            powerSpawn = Cache.powerSpawnsInRoom(room)[0],
            storage = room.storage,
            terminal = room.terminal,
            terminalEnergy = terminal ? terminal.store[RESOURCE_ENERGY] : 0,
            store = storage ? storage.store : undefined,
            roomMemory = room.memory,
            labsInUse = roomMemory.labsInUse,
            labQueue = roomMemory.labQueue,
            labs = Cache.labsInRoom(room),
            labAmount = labQueue ? labQueue.amount : undefined,
            reserveMinerals = Memory.reserveMinerals,
            links = Cache.linksInRoom(room),
            spawns = Cache.spawnsInRoom(room),
            tasks, status, sourceLabs, lab0, lab1, labsCollectMinerals;

        this.tasks = {
            constructionSites: room.find(FIND_MY_CONSTRUCTION_SITES),
            criticalRepairableStructures: _.filter(Cache.criticalRepairableStructuresInRoom(room), (s) => s.hits < 125000 && s.hits / s.hitsMax < 0.5), // TODO: Cache critical structures to repair in current room.
            extensions: _.filter(Cache.extensionsInRoom(room), (e) => e.energy < extensionEnergyCapacity),
            hostiles: Cache.hostilesInRoom(room),
            hurtCreeps: _.filter(Game.creeps, (c) => c.room.name === room.name && c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax),
            labsCollectMinerals: [],
            nuker: nuker,
            powerSpawn: powerSpawn,
            repairableStructures: _.filter(Cache.sortedRepairableStructuresInRoom(room), (s) => s.hits / s.hitsMax < 0.9 || s.hitsMax - s.hits > 100000),
            spawns: _.filter(Cache.spawnsInRoom(room), (s) => s.energy < SPAWN_ENERGY_CAPACITY),
            structuresWithEnergy: [...(storage && storage.my ? [storage] : []), ..._.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] >= 500).sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY])],
            terminalsCollectEnergy: terminal && (!terminal.my || (terminalEnergy >= 5000 && (!roomMemory.buyQueue || !storage || store[RESOURCE_ENERGY] < Memory.marketEnergy || Cache.credits < Memory.minimumCredits))),
            terminalsFillWithEnergy: terminal && terminal.my && terminalEnergy < 1000 ? [terminal] : [],
            towers: _.filter(Cache.towersInRoom(room), (t) => t.energy < TOWER_CAPACITY * 0.8)
        };

        tasks = this.tasks;

        tasks.quickConstructionSites = _.filter(tasks.constructionSites, (s) => s.progressTotal === 1);

        // storageResourcesNeeded
        if (storage && storage.my) {
            // If the room only has storage and no terminal, minerals go to storage.
            // Otherwise, if the room has storage and is not at capacity, minerals should be put into storage, but only up to a certain amount.
            if (!terminal || !terminal.my) {
                tasks.storageResourcesNeeded = undefined;
            } else if (_.sum(store) < storage.storeCapacity && reserveMinerals) {
                tasks.storageResourcesNeeded = {};
                _.forEach(Object.keys(reserveMinerals), (resource) => {
                    var reserveMineralsResource = reserveMinerals[resource],
                        amount = (resource.startsWith("X") && resource.length === 5 ? reserveMineralsResource - 5000 : reserveMineralsResource) - (store[resource] || 0);
                    if (amount > 0) {
                        tasks.storageResourcesNeeded[resource] = amount;
                    }
                });
            }
        }

        //nukerResourcesNeeded
        if (nuker) {
            tasks.nukerResourcesNeeded = {};
            tasks.nukerResourcesNeeded[RESOURCE_GHODIUM] = nuker.ghodiumCapacity - nuker.ghodium;
        }

        //powerSpawnResourcesNeeded
        if (powerSpawn / powerSpawn.power < 0.5) {
            tasks.powerSpawnResourcesNeeded[RESOURCE_POWER] = powerSpawn.powerCapacity - powerSpawn.power;
        }

        // labsCollectMinerals
        if (labQueue) {
            status = labQueue.status;
            sourceLabs = labQueue.sourceLabs;
            lab0 = Game.getObjectById(sourceLabs[0]);
            lab1 = Game.getObjectById(sourceLabs[1]);
        }

        labsCollectMinerals = tasks.labsCollectMinerals;
    
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
                var lab = Game.getObjectById(l.id);

                return (!l.status || l.status === "emptying") && lab && lab.mineralType && lab.mineralType !== l.resource;
            }), (lab) => {
                labsCollectMinerals.push(Game.getObjectById(lab.id));
            });
        }
    
        if (storage && labQueue && status === "creating" && !Utilities.roomLabsArePaused(room)) {
            let lab0Amount = lab0.mineralAmount,
                lab1Amount = lab1.mineralAmount;

            if (lab0Amount === 0 && lab1Amount !== 0) {
                labsCollectMinerals.push(lab1);
            }
            if (lab0Amount !== 0 && lab1Amount === 0) {
                labsCollectMinerals.push(lab0);
            }
        }
    
        if (storage && labQueue && status === "returning") {
            _.forEach(_.filter(labs, (l) => l.mineralType === labQueue.resource), (lab) => {
                labsCollectMinerals.push(lab);
            });
        }

        // labsFillMinerals
        if (labsInUse) {
            _.forEach(_.filter(labsInUse, (l) => {
                var lab = Game.getObjectById(l.id),
                    status = l.status;

                return (!status || ["filling", "refilling"].indexOf(status) !== -1) && (!lab.mineralType || lab.mineralType === (status === "refilling" ? l.oldResource : l.resource)) && (lab.mineralAmount < (status === "refilling" ? l.oldAmount : l.amount));
            }), (labInUse) => {
                var status = labInUse.status,
                    lab = Game.getObjectById(lab.id);

                tasks.labsFillMinerals = lab;
                tasks.labsFillMineralsResourcesNeeded = {};
                tasks.labsFillMineralsResourcesNeeded[status === "refilling" ? labInUse.oldResource : labInUse.resource] = (status === "refilling" ? labInUse.oldAmount : labInUse.amount) - lab.mineralAmount;

                return false;
            });
        }

        if (!tasks.labsFillMinerals && storage && labs.length >= 3 && labQueue && labQueue.status === "moving" && !Utilities.roomLabsArePaused(room)) {
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
                var reserveMineralsResource;

                if (resource === RESOURCE_ENERGY) {
                    return;
                }

                reserveMineralsResource = reserveMinerals[resource];

                if (!reserveMineralsResource) {
                    return;
                }
                if (!store[resource]) {
                    tasks.terminalCollectMinerals = [terminal];
                    tasks.terminalCollectMineralsResource = resource;
                    tasks.terminalCollectMineralsAmount = Math.min(amount, (resource.startsWith("X") && resource.length === 5 ? reserveMineralsResource - 5000 : reserveMineralsResource));
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
                    var status = l.status,
                        lab = Game.getObjectById(l.id);

                    return (!status || ["filling", "refilling"].indexOf(status) !== -1) && (!lab.mineralType || lab.mineralType === (status === "refilling" ? l.oldResource : l.resource));
                }), (l) => {
                    var status = l.status,
                        lab = Game.getObjectById(l.id);

                    if ((status === "refilling" ? (l.oldAmount - lab.mineralAmount) : (l.amount - lab.mineralAmount)) > 0) {
                        links.storageCollectMinerals = [storage];
                        links.storageCollectMineralsResource = status === "refilling" ? l.oldResource : l.resource;
                        links.storageCollectMineralsAmount = status === "refilling" ? (l.oldAmount - lab.mineralAmount) : (l.amount - lab.mineralAmount);

                        return false;
                    }
                });
            }
    
            // We only need to transfer from storage to lab when we have both storage and at least 3 labs.
            if (!links.storageCollectMinerals && storage && labQueue && labQueue.status === "moving" && labs.length >= 3 && !Utilities.roomLabsArePaused(room)) {
                _.forEach(labQueue.children, (resource) => {
                    var amount;

                    if ((amount = _.sum(_.filter(labs, (l) => l.mineralType === resource), (l) => l.mineralAmount)) < labAmount) {
                        links.storageCollectMinerals = [storage];
                        links.storageCollectMineralsResource = resource;
                        links.storageCollectMineralsAmount = labAmount - amount;

                        return false;
                    }
                });
            }
    
            // We only need to transfer from storage to terminal when we have both storage and terminal.
            if (!links.storageCollectMinerals && storage && terminal && reserveMinerals) {
                _.forEach(store, (amount, resource) => {
                    var reserveMineralsResource;

                    if (resource === RESOURCE_ENERGY) {
                        return;
                    }

                    reserveMineralsResource = reserveMinerals[resource];

                    if (!reserveMineralsResource) {
                        links.storageCollectMinerals = [storage];
                        links.storageCollectMineralsResource = resource;
                        links.storageCollectMineralsAmount = amount;

                        return false;
                    } else if ((resource.startsWith("X") && resource.length === 5 ? reserveMineralsResource - 5000 : reserveMineralsResource) < amount) {
                        links.storageCollectMinerals = [storage];
                        links.storageCollectMineralsResource = resource;
                        links.storageCollectMineralsAmount = amount - (resource.startsWith("X") && resource.length === 5 ? reserveMineralsResource - 5000 : reserveMineralsResource);

                        return false;
                    }
                });
            }
    
            if (!links.storageCollectMinerals) {
                // If we have a nuker, transfer ghodium.  If we have a power spawn, transfer power.
                if (nuker && rcl > 8 && nuker.ghodium < nuker.ghodiumCapacity && store[RESOURCE_GHODIUM]) {
                    links.storageCollectMinerals = [storage];
                    links.storageCollectMineralsResource = RESOURCE_GHODIUM;
                    links.storageCollectMineralsAmount = Math.min(nuker.ghodiumCapacity - nuker.ghodium, store[RESOURCE_GHODIUM]);
                } else if (powerSpawn && rcl > 8 && powerSpawn.power / powerSpawn.powerCapacity < 0.5 && store[RESOURCE_POWER]) {
                    links.storageCollectMinerals = [storage];
                    links.storageCollectMineralsResource = RESOURCE_POWER;
                    links.storageCollectMineralsAmount = Math.min(powerSpawn.powerCapacity - powerSpawn.power, store[RESOURCE_POWER]);
                }
            }
        }

        // links
        if (links.length > 1 && spawns.length > 0) {
            tasks.links = Utilities.objectsClosestToObj(links, spawns[0]);
        }
    }

    //  ###   ###    ###  #  #  ###   
    // ##     #  #  #  #  #  #  #  #  
    //   ##   #  #  # ##  ####  #  #  
    // ###    ###    # #  ####  #  #  
    //        #                       
    /**
     * Spawns needed creeps.
     * @param {canSpawn} bool Whether to spawn creeps this turn.
     */
    spawn(canSpawn) {
        var room = this.room,
            storage = room.storage,
            controller = room.controller,
            tasks = this.tasks,
            rcl = controller.level,
            dismantle = Memory.dismantle,
            roomName = room.name;

        this.checkSpawn(RoleWorker, canSpawn && (!storage || storage.store[RESOURCE_ENERGY] >= Memory.workerEnergy || controller.ticksToDowngrade < 3500 || room.find(FIND_MY_CONSTRUCTION_SITES).length > 0 || tasks.criticalRepairableStructures && tasks.criticalRepairableStructures.length > 0 || tasks.repairableStructures && _.filter(tasks.repairableStructures, (s) => [STRUCTURE_WALL, STRUCTURE_RAMPART].indexOf(s.structureType) !== 1 && s.hits < 1000000).length > 0));
        this.checkSpawn(RoleMiner, canSpawn);
        this.checkSpawn(RoleStorer, canSpawn);
        this.checkSpawn(RoleScientist, canSpawn && rcl >= 6);
        this.checkSpawn(RoleDismantler, canSpawn && (!!(dismantle && dismantle[roomName] && dismantle[roomName].length > 0)));
        this.checkSpawn(RoleCollector, canSpawn);
        this.checkSpawn(RoleClaimer, canSpawn);
        this.checkSpawn(RoleDowngrader, canSpawn);
        this.checkSpawn(RoleUpgrader, canSpawn && (rcl < 8 || _.filter(Game.rooms, (r) => {
            var controller = r.controller;

            return controller && controller.my && controller.level < 8;
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
     */
    labQueue() {
        var room = this.room,
            memory = room.memory,
            labQueue = memory.labQueue,
            status = labQueue.status;
        
        if (status === "clearing") {
            let labsInUse = memory.labsInUse,
                labs = Cache.labsInRoom(room);
            
            if (!labsInUse || labs.length - labsInUse.length > 2 && _.filter(labs, (l) => _.filter(labsInUse, (u) => u.id === l.id).length === 0 && l.mineralAmount > 0).length === 0) {
                labQueue.status = "moving";
            }
        } else if (status === "moving") {
            if (!labQueue.start || labQueue.start + 500 < Game.time) {
                delete memory.labQueue;
                labQueue = undefined;
            } else {
                let moved = true,
                    children = labQueue.children || [],
                    labs = Cache.labsInRoom(room),
                    sourceLabs = labQueue.sourceLabs || [],
                    sourceLab0 = Game.getObjectById(sourceLabs[0]),
                    sourceLab1 = Game.getObjectById(sourceLabs[1]),
                    labsInUse = memory.labsInUse;
                
                _.forEach(children, (resource) => {
                    if (_.sum(_.filter(labs, (l) => l.mineralType === resource), (l) => l.mineralAmount) < labQueue.amount) {
                        moved = false;
                        return false;
                    }
                });

                if (sourceLab0.mineralType === children[0] && sourceLab1.mineralType === children[1]) {
                    _.forEach(_.filter(labs, (l) => sourceLabs.indexOf(l.id) === -1 && (!labsInUse || _.map(_.filter(labsInUse, (l) => l.resource !== labQueue.resource), (l) => l.id).indexOf(l.id) === -1)), (lab) => {
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
            let labs = Cache.labsInRoom(room),
                sourceLabs = labQueue.sourceLabs || [],
                labsInUse = memory.labsInUse,
                sourceLab0 = Game.getObjectById(sourceLabs[0]),
                sourceLab1 = Game.getObjectById(sourceLabs[1]);
            
            _.forEach(_.filter(labs, (l) => sourceLabs.indexOf(l.id) === -1 && (!labsInUse || _.map(_.filter(labsInUse, (l) => l.resource !== labQueue.resource), (l) => l.id).indexOf(l.id) === -1)), (lab) => {
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

            if (labQueue.amount <= 0 && (sourceLab0.mineralAmount < 5 || sourceLab1.mineralAmount < 5)) {
                delete memory.labQueue;
                labQueue = undefined;
            }
        } else if (status === "returning") {
            if (_.sum(_.filter(Cache.labsInRoom(room), (l) => l.mineralType === labQueue.resource), (l) => l.mineralAmount) === 0) {
                delete memory.labQueue;
                labQueue = undefined;
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
     */
    labsInUse() {
        var labsInUse = this.room.memory.labsInUse,
            boosted = [];

        _.forEach(labsInUse, (queue) => {
            var status = queue.status,
                lab = Game.getObjectById(queue.id);
            
            if (status === "emptying") {
                if (lab.mineralAmount === 0) {
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
                let creep = Game.creeps[queue.creepToBoost];
                
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

    //                                             ###                           
    //                                             #  #                          
    // ###   ###    ##    ##    ##    ###    ###   #  #   ##   #  #   ##   ###   
    // #  #  #  #  #  #  #     # ##  ##     ##     ###   #  #  #  #  # ##  #  #  
    // #  #  #     #  #  #     ##      ##     ##   #     #  #  ####  ##    #     
    // ###   #      ##    ##    ##   ###    ###    #      ##   ####   ##   #     
    // #                                                                         
    /**
     * Processes power in the room.
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
     */
    toObj() {
        Memory.rooms[this.room.name].roomType = {
            type: this.type
        };
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
