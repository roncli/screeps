var RoomObj = require("roomObj"),
    Cache = require("cache"),
    Utilities = require("utilities"),
    RoleClaimer = require("role.claimer"),
    RoleCollector = require("role.collector"),
    RoleDefender = require("role.defender"),
    RoleHauler = require("role.hauler"),
    RoleHealer = require("role.healer"),
    RoleMeleeAttack = require("role.meleeAttack"),
    RoleMiner = require("role.miner"),
    RoleRangedAttack = require("role.rangedAttack"),
    RoleStorer = require("role.storer"),
    RoleTower = require("role.tower"),
    RoleUpgrader = require("role.upgrader"),
    RoleWorker = require("role.worker"),
    TaskBuild = require("task.build"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskCollectMinerals = require("task.collectMinerals"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),
    TaskRepair = require("task.repair"),
    TaskUpgradeController = require("task.upgradeController"),
    Base = function() {
        RoomObj.call(this);

        this.type = "base";
    };

Base.prototype = Object.create(RoomObj.prototype);
Base.prototype.constructor = Base;

Base.prototype.manage = function(room) {
    "use strict";

    var extensionsToBuild;

    // Bail if this base does not have a controller.
    if (room.controller.level === 0) {
        return;
    }

    // Build more extensions if they are available.
    if ((extensionsToBuild = [0, 5, 10, 20, 30, 40, 50, 60][room.controller.level - 1] - (Cache.extensionsInRoom(room).length + _.filter(Cache.constructionSitesInRoom(room), (c) => c.structureType === STRUCTURE_EXTENSION).length)) > 0) {
        // Build the needed structures.
        Utilities.buildStructures(room, STRUCTURE_EXTENSION, extensionsToBuild, Cache.spawnsInRoom(room)[0]);
    }

    // At RCL3, build first tower.
    if (room.controller.level >= 3 && Cache.towersInRoom(room).length === 0 && _.filter(Cache.constructionSitesInRoom(room), (c) => c.structureType === STRUCTURE_TOWER).length === 0) {
        Utilities.buildStructures(room, STRUCTURE_TOWER, 1, Cache.spawnsInRoom(room)[0]);
    }

    // At RC3, build containers by source.
    if (room.controller.level >= 3) {
        _.forEach(Cache.energySourcesInRoom(room), (source) => {
            var location = PathFinder.search(source.pos, {pos: Cache.spawnsInRoom(room)[0].pos, range: 1}, {swampCost: 1}).path[0];

            if (
                _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureContainer).length === 0 &&
                _.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === location.x && s.pos.y === location.y && s instanceof StructureContainer).length === 0
            ) {
                // Destroy roads and walls at this location.
                _.forEach(_.filter(location.lookFor(LOOK_STRUCTURES), (s) => [STRUCTURE_ROAD, STRUCTURE_WALL].indexOf(s.structureType) !== -1), (structure) => {
                    structure.destroy();
                });

                // Build the container.
                room.createConstructionSite(location.x, location.y, STRUCTURE_CONTAINER);
            }
        });
    }

    // At RCL4, build storage.
    if (room.controller.level >= 4 && !room.storage && _.filter(Cache.constructionSitesInRoom(room), (c) => c.structureType === STRUCTURE_STORAGE).length === 0) {
        Utilities.buildStructures(room, STRUCTURE_STORAGE, 1, Cache.spawnsInRoom(room)[0]);
    }

    // At RCL6, build terminal.
    if (room.controller.level >= 6 && room.storage && !room.terminal && _.filter(Cache.constructionSitesInRoom(room), (c) => c.structureType === STRUCTURE_TERMINAL).length === 0) {
        Utilities.buildStructures(room, STRUCTURE_TERMINAL, 1, room.storage);
    }

    // At RCL6, build extractor.
    if (room.controller.level >= 6 && Cache.mineralsInRoom(room).length !== Cache.extractorsInRoom(room).length) {
        _.forEach(Cache.mineralsInRoom(room), (mineral) => {
            if (
                _.filter(mineral.pos.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureExtractor).length === 0 &&
                _.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === mineral.pos.x && s.pos.y === mineral.pos.y && s instanceof StructureExtractor).length === 0
            ) {
                room.createConstructionSite(mineral.pos.x, mineral.pos.y, STRUCTURE_EXTRACTOR);
            }
        });
    }

    // At RCL6, build containers by minerals.
    if (room.controller.level >= 6) {
        _.forEach(Cache.mineralsInRoom(room), (mineral) => {
            var location = PathFinder.search(mineral.pos, {pos: Cache.spawnsInRoom(room)[0].pos, range: 1}, {swampCost: 1}).path[0];

            if (
                _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureContainer).length === 0 &&
                _.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === location.x && s.pos.y === location.y && s instanceof StructureContainer).length === 0
            ) {
                // Destroy roads and walls at this location.
                _.forEach(_.filter(location.lookFor(LOOK_STRUCTURES), (s) => [STRUCTURE_ROAD, STRUCTURE_WALL].indexOf(s.structureType) !== -1), (structure) => {
                    structure.destroy();
                });

                // Build the container.
                room.createConstructionSite(location.x, location.y, STRUCTURE_CONTAINER);
            }
        });
    }

    // At RCL3, build roads around our structures.
    if (room.controller.level >= 3) {
        _.forEach(_.filter(Game.structures, (s) => s.room.name === room.name && [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_STORAGE, STRUCTURE_TERMINAL].indexOf(s.structureType) !== -1), (structure) => {
            _.forEach([new RoomPosition(structure.pos.x - 1, structure.pos.y, room.name), new RoomPosition(structure.pos.x + 1, structure.pos.y, room.name), new RoomPosition(structure.pos.x, structure.pos.y - 1, room.name), new RoomPosition(structure.pos.x, structure.pos.y + 1, room.name)], (pos) => {
                if (
                    _.filter(pos.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureRoad).length === 0 &&
                    _.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === pos.x && s.pos.y === pos.y && s instanceof StructureRoad).length === 0
                ) {
                    room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                }
            });
        });
    }

    // At RCL3 with storage, build roads from containers to storage.
    if (room.controller.level >= 3 && room.storage) {
        _.forEach(Cache.containersInRoom(room), (container) => {
            _.forEach(PathFinder.search(container.pos, {pos: room.storage.pos, range: 1}, {swampCost: 1}).path, (pos) => {
                var structures = pos.lookFor(LOOK_STRUCTURES);
                if (
                    _.filter(structures, (s) => s.structureType !== STRUCTURE_RAMPART).length > 0 ||
                    _.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === pos.x && s.pos.y === pos.y && s.structureType !== STRUCTURE_RAMPART).length > 0
                ) {
                    return;
                }
                if (
                    _.filter(structures, (s) => s instanceof StructureRoad).length === 0 &&
                    _.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === pos.x && s.pos.y === pos.y && s instanceof StructureRoad).length === 0
                ) {
                    room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                }
            });
        });
    }
};

Base.prototype.run = function(room) {
    "use strict";

    var dealMade = false,
        flips = [],
        tasks, links, terminalMinerals, topResource, bestOrder, transCost, terminalEnergy, terminalTask, amount;

    // Something is supremely wrong.  Notify and bail.
    if (room.unobservable) {
        Game.notify("Base Room " + room.name + " is unobservable, something is wrong!");
        return;
    }

    // Manage room.
    if (Game.time % 100 === 0 && Cache.spawnsInRoom(room).length > 0) {
        this.manage(room);
    }

    if (Cache.spawnsInRoom(room).length > 0) {
        // Transfer energy from far links to near link.
        links = Utilities.objectsClosestToObj(Cache.linksInRoom(room), Cache.spawnsInRoom(room)[0]);
        _.forEach(links, (link, index) => {
            if (index === 0) {
                return;
            }

            if (!link.cooldown && link.energy > 0 && links[0].energy <= 300) {
                link.transferEnergy(links[0]);
            }
        });
    }

    // Check to see if we can do a deal in the terminal.
    if (room.terminal && Game.cpu.bucket >= 9000) {
        if (!Memory.minimumSell) {
            Memory.minimumSell = {};
        }

        terminalMinerals = _.filter(_.map(room.terminal.store, (s, k) => {return {resource: k, amount: s};}), (s) => s.resource !== RESOURCE_ENERGY);
        if (terminalMinerals.length > 0) {
            _.forEach(_.sortBy(terminalMinerals, (s) => -s.amount), (topResource) => {
                bestOrder = _.filter(Cache.marketOrders(), (o) => o.resourceType === topResource.resource && o.type === "buy" && o.amount > 0 && (!Memory.minimumSell[o.resourceType] || o.price >= Memory.minimumSell[o.resourceType])).sort((a, b) => (b.price - a.price !== 0 ? b.price - a.price : Game.map.getRoomLinearDistance(room.name, a.roomName, true) - Game.map.getRoomLinearDistance(room.name, b.roomName, true)))[0];
                if (bestOrder) {
                    transCost = Game.market.calcTransactionCost(Math.min(topResource.amount, bestOrder.amount), room.name, bestOrder.roomName);
                    terminalEnergy = room.terminal.store[RESOURCE_ENERGY] || 0;
                    if (terminalEnergy > transCost) {
                        Game.market.deal(bestOrder.id, Math.min(topResource.amount, bestOrder.amount), room.name);
                        dealMade = true;
                        delete Memory.minimumSell[bestOrder.resourceType];
                        return false;
                    } else {
                        terminalTask = new TaskFillEnergy(room.terminal.id);
                        if (terminalEnergy > 0) {
                            amount = Math.floor(Math.min(topResource.amount, bestOrder.amount) * terminalEnergy / transCost);
                            if (amount > 0) {
                                Game.market.deal(bestOrder.id, amount, room.name);
                                dealMade = true;
                                return false;
                            }
                        }
                    }
                }
            });
        }
        
        if (!dealMade && room.storage && room.storage.store[RESOURCE_ENERGY] > 500000) {
            _.forEach(_.uniq(_.map(Cache.marketOrders(), (o) => o.resourceType)), (resource) => {
                var sellOrder, buyOrder;

                // Energy is a special case handled later, and tokens are not to be traded.
                if ([RESOURCE_ENERGY, SUBSCRIPTION_TOKEN].indexOf(resource) !== -1) {
                    return;
                }

                // Get all the orders that can be flipped.
                sellOrder = _.sortBy(_.filter(Cache.marketOrders(), (o) => o.resourceType === resource && o.type === "sell" && o.amount > 0), (o) => o.price)[0];
                buyOrder = _.sortBy(_.filter(Cache.marketOrders(), (o) => o.resourceType === resource && o.type === "buy" && o.amount > 0), (o) => -o.price)[0];

                if (sellOrder && buyOrder && sellOrder.price < buyOrder.price && sellOrder.price < Game.market.credits) {
                    flips.push({resource: resource, buy: buyOrder, sell: sellOrder});
                }
            });

            terminalEnergy = room.terminal.store[RESOURCE_ENERGY] || 0;

            _.forEach(_.sortBy(flips, (f) => f.sell.price - f.buy.price), (flip, index) => {
                if (index === 0) {
                    Cache.log.events.push("Biggest flip: " + flip.resource + " x" + Math.min(flip.buy.amount, flip.sell.amount) + " " + flip.sell.price.toFixed(2) + " to " + flip.buy.price.toFixed(2));
                }

                // Determine how much energy we need for the deal.
                transCost = Game.market.calcTransactionCost(flip.sell.amount, room.name, flip.sell.roomName);
                if (terminalEnergy > transCost) {
                    Game.market.deal(flip.sell.id, flip.sell.amount, room.name);
                    Memory.minimumSell[flip.resource] = flip.sell.price;
                    dealMade = true;
                    return false;
                }

                terminalTask = new TaskFillEnergy(room.terminal.id);
                if (terminalEnergy > 0) {
                    amount = Math.floor(flip.sell.amount * terminalEnergy / transCost);
                    if (amount > 0) {
                        Game.market.deal(flip.sell.id, amount, room.name);
                        Memory.minimumSell[flip.resource] = flip.sell.price;
                        dealMade = true;
                        return false;
                    }
                }
            });

            if (!dealMade && terminalEnergy > 100) {
                // Attempt to sell excess energy.
                bestOrder = _.sortBy(_.filter(Cache.marketOrders(), (o) => o.resourceType === RESOURCE_ENERGY && o.type === "buy" && o.amount > 0), (o) => -((o.price * o.amount + Game.market.calcTransactionCost(o.amount, room.name, o.roomName)) / o.amount))[0];
                if (bestOrder) {
                    transCost = Game.market.calcTransactionCost(bestOrder.amount, room.name, bestOrder.roomName);
                    if (terminalEnergy > transCost + room.terminal.store[RESOURCE_ENERGY]) {
                        // Game.market.deal(bestOrder.id, bestOrder.amount, room.name);
                        Cache.log.events.push("Would be selling", bestOrder.amount, "energy to", bestOrder.roomName, "for", bestOrder.price, "at a cost of", transCost)
                    } else {
                        // terminalTask = new TaskFillEnergy(room.terminal.id);
                        Cache.log.events.push("Would be filling terminal with energy.")
                        if (terminalEnergy > 0) {
                            amount = Math.floor(bestOrder.amount * (terminalEnergy / (bestOrder.amount + transCost)));
                            if (amount > 0) {
                                // Game.market.deal(bestOrder.id, amount, room.name);
                                Cache.log.events.push("Would be selling", amount, "energy to", bestOrder.roomName, "for", bestOrder.price, "at a cost of", Game.market.calcTransactionCost(amount, room.name, bestOrder.roomName))
                            }
                        }
                    }
                }
            }
        }
    }

    // Spawn new creeps.
    RoleWorker.checkSpawn(room);
    RoleMiner.checkSpawn(room);
    RoleStorer.checkSpawn(room);
    RoleMeleeAttack.checkSpawn(room);
    RoleRangedAttack.checkSpawn(room);
    RoleHealer.checkSpawn(room);
    RoleDefender.checkSpawn(room);
    RoleCollector.checkSpawn(room);
    RoleClaimer.checkSpawn(room);
    if (room.controller && room.controller.level < 8) {
        RoleUpgrader.checkSpawn(room);
    }
    if (Cache.haulers[room.name]) {
        RoleHauler.checkSpawn(room);
    }

    // Get the tasks needed for this room.
    tasks = {
        build: {
            tasks: TaskBuild.getTasks(room)
        },
        collectEnergy: {
            tasks: TaskCollectEnergy.getTasks(room),
            storerTasks: TaskCollectEnergy.getStorerTasks(room)
        },
        collectMinerals: {
            storerTasks: TaskCollectMinerals.getStorerTasks(room)
        },
        fillEnergy: {
            fillExtensionTasks: TaskFillEnergy.getFillExtensionTasks(room),
            fillSpawnTasks: TaskFillEnergy.getFillSpawnTasks(room),
            fillTowerTasks: TaskFillEnergy.getFillTowerTasks(room),
            fillStorageTasks: TaskFillEnergy.getFillStorageTasks(room),
            fillContainerTasks: TaskFillEnergy.getFillContainerTasks(room),
            fillLabTasks: TaskFillEnergy.getFillLabTasks(room),
            fillLinkTask: null,
            fillTerminalTask: terminalTask
        },
        fillMinerals: {
            fillStorageTasks: TaskFillMinerals.getFillStorageTasks(room)
        },
        heal: {
            tasks: TaskHeal.getTasks(room)
        },
        rangedAttack: {
            tasks: TaskRangedAttack.getTasks(room)
        },
        repair: {
            tasks: TaskRepair.getTasks(room),
            criticalTasks: TaskRepair.getCriticalTasks(room)
        },
        upgradeController: {
            tasks: TaskUpgradeController.getTasks(room),
            criticalTasks: TaskUpgradeController.getCriticalTasks(room)
        }
    };

    // Assign tasks to creeps.                    
    RoleWorker.assignTasks(room, tasks);
    RoleMiner.assignTasks(room, tasks);
    RoleStorer.assignTasks(room, tasks);
    RoleMeleeAttack.assignTasks(room, tasks);
    RoleRangedAttack.assignTasks(room, tasks);
    RoleHealer.assignTasks(room, tasks);
    RoleDefender.assignTasks(room, tasks);
    RoleCollector.assignTasks(room, tasks);
    RoleClaimer.assignTasks(room, tasks);
    RoleUpgrader.assignTasks(room, tasks);
    RoleHauler.assignTasks(room, tasks);

    // Assign tasks to towers.
    RoleTower.assignTasks(room, tasks);
};

Base.prototype.toObj = function(room) {
    "use strict";

    Memory.rooms[room.name].roomType = {
        type: this.type
    }
};

Base.fromObj = function(room) {
    "use strict";

    return new Base();
};

require("screeps-profiler").registerObject(Base, "RoomBase");
module.exports = Base;
