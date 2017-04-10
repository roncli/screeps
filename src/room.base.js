var RoomObj = require("roomObj"),
    Cache = require("cache"),
    Commands = require("commands"),
    Market = require("market"),
    Minerals = require("minerals"),
    Utilities = require("utilities"),
    RoleClaimer = require("role.claimer"),
    RoleCollector = require("role.collector"),
    RoleConverter = require("role.converter"),
    RoleDismantler = require("role.dismantler"),
    RoleMiner = require("role.miner"),
    RoleScientist = require("role.scientist"),
    RoleStorer = require("role.storer"),
    RoleTower = require("role.tower"),
    RoleUpgrader = require("role.upgrader"),
    RoleWorker = require("role.worker"),
    TaskBuild = require("task.build"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskCollectMinerals = require("task.collectMinerals"),
    TaskDismantle = require("task.dismantle"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals"),
    TaskHeal = require("task.heal"),
    TaskRangedAttack = require("task.rangedAttack"),
    TaskRepair = require("task.repair"),
    TaskUpgradeController = require("task.upgradeController"),
    Base = function() {
        "use strict";
    
        this.init();
    };

Base.prototype = Object.create(RoomObj.prototype);
Base.prototype.constructor = Base;

Base.prototype.init = function() {
    "use strict";
    
    RoomObj.call(this);

    this.type = "base";
};

Base.prototype.manage = function(room) {
    "use strict";

    var controller = room.controller,
        rcl = controller.level,
        sites = room.find(FIND_MY_CONSTRUCTION_SITES),
        spawn = Cache.spawnsInRoom(room)[0],
        spawnPos = spawn.pos,
        storage = room.storage,
        minerals = room.find(FIND_MINERALS),
        roomName = room.name,
        extensionsToBuild;

    // Bail if this base does not have a controller.
    if (!controller || rcl === 0) {
        return;
    }

    // Build more extensions if they are available.
    if ((extensionsToBuild = [0, 5, 10, 20, 30, 40, 50, 60][rcl - 1] - (Cache.extensionsInRoom(room).length + _.filter(sites, (c) => c.structureType === STRUCTURE_EXTENSION).length)) > 0) {
        // Build the needed structures.
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

                // Build the container.
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

                // Build the container.
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
};

// Basic philosophy: We want to respond appropriately to incoming threats, but we also don't want to overdo it.
// 0-50 ticks - Enemy is being annoying, let towers deal with them.
// 50-500 ticks - Enemy is proving to be at least a basic threat, deal with them using a standard army.
// 500-2000 ticks - Light threat.  Use boosts with the standard army.
// 2000-2500 ticks - Moderate threat.  All bases in the region should send an army to any rooms identified as a threat.
// 2500+ ticks - Massive sustained threat.  Use boosts with all armies.
// Casualties taken? - Create an army of similar size that respects the base matrixes.  If a base matrix has not yet been created, queue one for creation.
// Enemy spending a lot of time on 0/49 tiles? - Create an army of similar size that goes after creeps in the border room they are trying to drain from.
Base.prototype.defend = function(room) {
    var roomName = room.name,
        roomMemory = room.memory,
        hostiles = _.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username !== "Invader"),
        armyName = roomName + "-defense",
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
                Game.notify("Warning! " + roomName + " is under attack!");
                Commands.createArmy(armyName, {reinforce: false, region: roomMemory.region, boostRoom: roomName, buildRoom: roomName, stageRoom: roomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: armySize, units: 20}, ranged: {maxCreeps: 0, units: 20}});
                Memory.army[armyName].creepCount = 0;
            } else {
                attackTicks = Game.time - roomMemory.currentAttack;

                if (attackTicks >= 500 && attackTicks < 2000) {
                    Memory.army[armyName].boostRoom = roomName;
                } else if (attackTicks >= 2000 && attackTicks < 2500) {
                    _.forEach(_.filter(Game.rooms, (r) => r.memory && r.memory.region === roomMemory.region), (remoteRoom) => {
                        var remoteArmyName = remoteRoom.name + "-defense-for-" + roomName;
                        if (!Memory.army[remoteRoom.name + "-defense"] && !Memory.army[remoteArmyName]) {
                            Commands.createArmy(remoteArmyName, {reinforce: false, region: roomMemory.region, boostRoom: roomName, buildRoom: roomName, stageRoom: roomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: armySize, units: 20}, ranged: {maxCreeps: 0, units: 20}});
                        }
                    });
                } else if (attackTicks >= 2500) {
                    _.forEach(_.filter(Game.rooms, (r) => r.memory && r.memory.region === roomMemory.region), (remoteRoom) => {
                        var remoteArmyName = remoteRoom.name + "-defense-for-" + roomName;
                        if (Memory.army[remoteArmyName]) {
                            Memory.army[remoteArmyName].boostRoom = remoteRoom.name;
                        }
                    });
                }

                // Check edgeTicks, if any are over 50, spawn an army for that room, or update it if one already exists.
                exits = Game.map.describeExits(roomName);
                _.forEach(_.keys(exits), (dir) => {
                    var dirArmyName = roomName + "-" + dir.toString() + "-border-defense";
                    if (!Memory.army[dirArmyName] && roomMemory.edgeTicks[dir] >= 50) {
                        Commands.createArmy(dirArmyName, {reinforce: false, region: roomMemory.region, boostRoom: roomName, buildRoom: roomName, stageRoom: roomName, attackRoom: exits[dir], dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: armySize, units: 17}, melee: {maxCreeps: armySize, units: 20}, ranged: {maxCreeps: 0, units: 20}});
                    }
                });

                // Test army casualties taken.  If 4 or more units are lost, reduce army size and queue & respect base matrix.
                // TODO
            }
        }
    } else if (Memory.army[roomName + "-defense"]) {
        // This is a true success only if 50 ticks have passed since the last hostile was seen.
        if (roomMemory.lastHostile + 50 < Game.time) {
            if (Memory.army[roomName + "-defense"]) {
                Memory.army[roomName + "-defense"].directive = "attack";
                Memory.army[roomName + "-defense"].success = true;
            }
            delete roomMemory.lastHostile;
            delete roomMemory.currentAttack;
            delete roomMemory.threats;
            delete roomMemory.edgeTicks;
        }
    }
};

Base.prototype.transferEnergy = function(room) {
    "use strict";
    
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
};

Base.prototype.terminal = function(room, terminal) {
    "use strict";
    
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
    
    if (terminal && terminalEnergy >= 1000 && maxEnergy >= Memory.dealEnergy) {
        if (memory.buyQueue && (Cache.credits < Memory.minimumCredits || (storageStore[buyQueue.resource] || 0) + (terminalStore[buyQueue.resource] || 0) > (Memory.reserveMinerals[buyQueue.resource] || 0))) {
            delete memory.buyQueue;
            buyQueue = undefined;
        }

        if (buyQueue && maxEnergy > Memory.marketEnergy && Memory.buy) {
            // Buy what we need to for the lab queue.
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
            // Transfer what we have in excess to rooms in need if we have the minimum credits.
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
                                Cache.log.events.push("Sending " + amount + " " + resource.resource + " from " + roomName + " to " + otherRoomName);
                                dealMade = true;
                                return false;
                            }
                        } else {
                            if (terminalEnergy > 0) {
                                amount = Math.floor(amount * terminalEnergy / transCost);
                                if (amount > 0) {
                                    if (room.terminal.send(resource.resource, amount, otherRoomName) === OK) {
                                        Cache.log.events.push("Sending " + amount + " " + resource.resource + " from " + roomName + " to " + otherRoomName);
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
            
            // Find an order to flip if we haven't made a deal and we have enough energy.
            if (!dealMade && storage && maxEnergy > Memory.marketEnergy) {
                _.forEach(Minerals, (children, resource) => {
                    var sellOrder, buyOrder;

                    // Only flip what we are full on.
                    if (!storageStore || storageStore[resource] < Memory.reserveMinerals[resource]) {
                        return;
                    }

                    // Energy and tokens are not to be traded.
                    if ([RESOURCE_ENERGY, SUBSCRIPTION_TOKEN].indexOf(resource) !== -1) {
                        return;
                    }

                    // Get all the orders that can be flipped.
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
                        Cache.log.events.push("Biggest flip: " + flip.resource + " x" + amount + " " + sell.price.toFixed(2) + " to " + buy.price.toFixed(2));
                    }

                    // Determine how much energy we need for the deal.
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
};

Base.prototype.tasks = function(room) {
    "use strict";
    
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
};

Base.prototype.spawn = function(room, canSpawnWorkers) {
    "use strict";
    
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
};

Base.prototype.assignTasks = function(room, tasks) {
    "use strict";
    
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
};

Base.prototype.labQueue = function(room, labQueue) {
    "use strict";
    
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
};

Base.prototype.labsInUse = function(room, labsInUse) {
    "use strict";
    
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
};

Base.prototype.run = function(room) {
    "use strict";

    var roomName, spawns, terminal, storage, memory, labQueue, labsInUse, tasks;

    // Something is supremely wrong.  Notify and bail.
    if (room.unobservable) {
        Game.notify("Base Room " + roomName + " is unobservable, something is wrong!");
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
        this.manage(room);
    }

    // Defend base.
    this.defend(room);

    // Transfer energy from near link to far link.
    if (spawns.length > 0) {
        this.transferEnergy(room);
    }
    
    // Check to see if we can do a deal in the terminal.
    if (terminal) {
        this.terminal(room, terminal);
    }

    // Get the tasks needed for this room.
    tasks = this.tasks(room);

    // Spawn new creeps.
    this.spawn(room, !storage || storage.store[RESOURCE_ENERGY] >= Memory.workerEnergy || room.controller.ticksToDowngrade < 3500 || room.find(FIND_MY_CONSTRUCTION_SITES).length > 0 || tasks.repair.criticalTasks && tasks.repair.criticalTasks.length > 0 || tasks.repair.tasks && _.filter(tasks.repair.tasks, (t) => (t.structure.structureType === STRUCTURE_WALL || t.structure.structureType === STRUCTURE_RAMPART) && t.structure.hits < 1000000).length > 0);

    // Assign tasks to creeps and towers.
    this.assignTasks(room, tasks);

    // Update lab queue if necessary.
    if (storage && Cache.labsInRoom(room).length >= 3 && labQueue && !Utilities.roomLabsArePaused(room)) {
        this.labQueue(room, labQueue);
    }

    // Update labs in use.
    if (labsInUse) {
        this.labsInUse(room, labsInUse);
    }
};

Base.prototype.toObj = function(room) {
    "use strict";

    Memory.rooms[room.name].roomType = {
        type: this.type
    };
};

Base.fromObj = function(room) {
    "use strict";

    return new Base();
};

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Base, "RoomBase");
}
module.exports = Base;
