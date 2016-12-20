var RoomObj = require("roomObj"),
    Cache = require("cache"),
    Market = require("market"),
    Utilities = require("utilities"),
    RoleClaimer = require("role.claimer"),
    RoleCollector = require("role.collector"),
    RoleDefender = require("role.defender"),
    RoleDismantler = require("role.dismantler"),
    RoleHauler = require("role.hauler"),
    RoleHealer = require("role.healer"),
    RoleMeleeAttack = require("role.meleeAttack"),
    RoleMiner = require("role.miner"),
    RoleRangedAttack = require("role.rangedAttack"),
    RoleScientist = require("role.scientist"),
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
    if ((extensionsToBuild = [0, 5, 10, 20, 30, 40, 50, 60][room.controller.level - 1] - (Cache.extensionsInRoom(room).length + _.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (c) => c.structureType === STRUCTURE_EXTENSION).length)) > 0) {
        // Build the needed structures.
        Utilities.buildStructures(room, STRUCTURE_EXTENSION, extensionsToBuild, Cache.spawnsInRoom(room)[0]);
    }

    // At RCL3, build first tower.
    if (room.controller.level >= 3 && Cache.towersInRoom(room).length === 0 && _.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (c) => c.structureType === STRUCTURE_TOWER).length === 0) {
        Utilities.buildStructures(room, STRUCTURE_TOWER, 1, Cache.spawnsInRoom(room)[0]);
    }

    // At RC3, build containers by source.
    if (room.controller.level >= 3) {
        _.forEach(room.find(FIND_SOURCES), (source) => {
            var location = PathFinder.search(source.pos, {pos: Cache.spawnsInRoom(room)[0].pos, range: 1}, {swampCost: 1}).path[0];

            if (
                _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureContainer).length === 0 &&
                _.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (s) => s.pos.x === location.x && s.pos.y === location.y && s instanceof StructureContainer).length === 0
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
    if (room.controller.level >= 4 && !room.storage && _.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (c) => c.structureType === STRUCTURE_STORAGE).length === 0) {
        Utilities.buildStructures(room, STRUCTURE_STORAGE, 1, Cache.spawnsInRoom(room)[0]);
    }

    // At RCL6, build terminal.
    if (room.controller.level >= 6 && room.storage && !room.terminal && _.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (c) => c.structureType === STRUCTURE_TERMINAL).length === 0) {
        Utilities.buildStructures(room, STRUCTURE_TERMINAL, 1, room.storage);
    }

    // At RCL6, build extractor.
    if (room.controller.level >= 6 && room.find(FIND_MINERALS).length !== Cache.extractorsInRoom(room).length) {
        _.forEach(room.find(FIND_MINERALS), (mineral) => {
            if (
                _.filter(mineral.pos.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureExtractor).length === 0 &&
                _.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (s) => s.pos.x === mineral.pos.x && s.pos.y === mineral.pos.y && s instanceof StructureExtractor).length === 0
            ) {
                room.createConstructionSite(mineral.pos.x, mineral.pos.y, STRUCTURE_EXTRACTOR);
            }
        });
    }

    // At RCL6, build containers by minerals.
    if (room.controller.level >= 6) {
        _.forEach(room.find(FIND_MINERALS), (mineral) => {
            var location = PathFinder.search(mineral.pos, {pos: Cache.spawnsInRoom(room)[0].pos, range: 1}, {swampCost: 1}).path[0];

            if (
                _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureContainer).length === 0 &&
                _.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (s) => s.pos.x === location.x && s.pos.y === location.y && s instanceof StructureContainer).length === 0
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
        _.forEach(_.filter(room.find(FIND_MY_STRUCTURES), (s) => s.room.name === room.name && [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_STORAGE, STRUCTURE_TERMINAL].indexOf(s.structureType) !== -1), (structure) => {
            _.forEach([new RoomPosition(structure.pos.x - 1, structure.pos.y, room.name), new RoomPosition(structure.pos.x + 1, structure.pos.y, room.name), new RoomPosition(structure.pos.x, structure.pos.y - 1, room.name), new RoomPosition(structure.pos.x, structure.pos.y + 1, room.name)], (pos) => {
                if (
                    _.filter(pos.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureRoad).length === 0 &&
                    _.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (s) => s.pos.x === pos.x && s.pos.y === pos.y && s instanceof StructureRoad).length === 0
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
        flips = [], completed = [],
        tasks, links, terminalMinerals, topResource, bestOrder, transCost, terminalEnergy, terminalTask, amount, moved, boosted;

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
        // Transfer energy from near link to far link.
        links = Utilities.objectsClosestToObj(Cache.linksInRoom(room), Cache.spawnsInRoom(room)[0]);
        _.forEach(links, (link, index) => {
            if (index === 0) {
                return;
            }

            if (!links[0].cooldown && links[0].energy > 0 && link.energy <= 300) {
                links[0].transferEnergy(link);
            }
        });
    }

    // Check to see if we can do a deal in the terminal.
    if (room.terminal) {
        terminalEnergy = room.terminal.store[RESOURCE_ENERGY] || 0;
    } else {
        terminalEnergy = 0;
    }

    if (room.terminal && terminalEnergy < 1000) {
        terminalTask = new TaskFillEnergy(room.terminal.id);
    }

    if (room.terminal && terminalEnergy >= 1000) {
        if (!Memory.minimumSell) {
            Memory.minimumSell = {};
        }

        if (room.memory.buyQueue) {
            // Buy what we need to for the lab queue.
            bestOrder = _.filter(Market.getAllOrders(), (o) => o.resourceType === room.memory.buyQueue.resource && o.type === "sell" && o.amount > 0).sort((a, b) => (a.price - b.price !== 0 ? a.price - b.price : Game.map.getRoomLinearDistance(room.name, a.roomName, true) - Game.map.getRoomLinearDistance(room.name, b.roomName, true)))[0];
            if (bestOrder) {
                if (bestOrder.price > room.memory.buyQueue.price) {
                    delete room.memory.buyQueue;
                } else {
                    transCost = Game.market.calcTransactionCost(Math.min(room.memory.buyQueue.amount, bestOrder.amount), room.name, bestOrder.roomName);
                    if (terminalEnergy > transCost) {
                        Market.deal(bestOrder.id, Math.min(room.memory.buyQueue.amount, bestOrder.amount), room.name);
                        dealMade = true;
                        room.memory.buyQueue.amount -= Math.min(room.memory.buyQueue.amount, bestOrder.amount);
                    } else {
                        if (terminalEnergy > 0) {
                            amount = Math.floor(Math.min(room.memory.buyQueue.amount, bestOrder.amount) * terminalEnergy / transCost);
                            if (amount > 0) {
                                Market.deal(bestOrder.id, amount, room.name);
                                dealMade = true;
                                room.memory.buyQueue.amount -= amount;
                            }
                        }
                    }
                }
            }

            if (room.memory.buyQueue && room.memory.buyQueue.amount <= 0) {
                delete room.memory.buyQueue;
            }
        } else {
            // Sell what we have in excess.
            terminalMinerals = _.filter(_.map(room.terminal.store, (s, k) => {
                return {resource: k, amount: Math.min(s, s - (room.memory.reserveMinerals ? (room.memory.reserveMinerals[k] || 0) : 0) + (room.storage.store[k] || 0))};
            }), (s) => s.resource !== RESOURCE_ENERGY && s.amount > 0);

            if (terminalMinerals.length > 0) {
                _.forEach(_.sortBy(terminalMinerals, (s) => -s.amount), (topResource) => {
                    bestOrder = _.filter(Market.getAllOrders(), (o) => o.resourceType === topResource.resource && o.type === "buy" && o.amount > 0 && (!Memory.minimumSell[o.resourceType] || o.price >= Memory.minimumSell[o.resourceType])).sort((a, b) => (b.price - a.price !== 0 ? b.price - a.price : Game.map.getRoomLinearDistance(room.name, a.roomName, true) - Game.map.getRoomLinearDistance(room.name, b.roomName, true)))[0];
                    if (bestOrder) {
                        transCost = Game.market.calcTransactionCost(Math.min(topResource.amount, bestOrder.amount), room.name, bestOrder.roomName);
                        if (terminalEnergy > transCost) {
                            Market.deal(bestOrder.id, Math.min(topResource.amount, bestOrder.amount), room.name);
                            dealMade = true;
                            delete Memory.minimumSell[bestOrder.resourceType];
                            return false;
                        } else {
                            if (terminalEnergy > 0) {
                                amount = Math.floor(Math.min(topResource.amount, bestOrder.amount) * terminalEnergy / transCost);
                                if (amount > 0) {
                                    Market.deal(bestOrder.id, amount, room.name);
                                    dealMade = true;
                                    return false;
                                }
                            }
                        }
                    }
                });
            }
            
            // Find an order to flip if we haven't made a deal and we have enough energy.
            if (!dealMade && room.storage && room.storage.store[RESOURCE_ENERGY] > 100000) {
                _.forEach(_.uniq(_.map(Market.getAllOrders(), (o) => o.resourceType)), (resource) => {
                    var sellOrder, buyOrder;

                    // Energy is a special case handled later, and tokens are not to be traded.
                    if ([RESOURCE_ENERGY, SUBSCRIPTION_TOKEN].indexOf(resource) !== -1) {
                        return;
                    }

                    // Get all the orders that can be flipped.
                    sellOrder = _.sortBy(_.filter(Market.getAllOrders(), (o) => o.resourceType === resource && o.type === "sell" && o.amount > 0), (o) => o.price)[0];
                    buyOrder = _.sortBy(_.filter(Market.getAllOrders(), (o) => o.resourceType === resource && o.type === "buy" && o.amount > 0), (o) => -o.price)[0];

                    if (sellOrder && buyOrder && sellOrder.price < buyOrder.price && sellOrder.price < Game.market.credits) {
                        flips.push({resource: resource, buy: buyOrder, sell: sellOrder});
                    }
                });

                _.forEach(_.sortBy(flips, (f) => f.sell.price - f.buy.price), (flip, index) => {
                    if (index === 0) {
                        Cache.log.events.push("Biggest flip: " + flip.resource + " x" + Math.min(flip.buy.amount, flip.sell.amount) + " " + flip.sell.price.toFixed(2) + " to " + flip.buy.price.toFixed(2));
                    }

                    // Determine how much energy we need for the deal.
                    transCost = Game.market.calcTransactionCost(flip.sell.amount, room.name, flip.sell.roomName);
                    if (terminalEnergy > transCost) {
                        Market.deal(flip.sell.id, flip.sell.amount, room.name);
                        Memory.minimumSell[flip.resource] = flip.sell.price;
                        dealMade = true;
                        return false;
                    }

                    if (terminalEnergy > 0) {
                        amount = Math.floor(flip.sell.amount * terminalEnergy / transCost);
                        if (amount > 0) {
                            Market.deal(flip.sell.id, amount, room.name);
                            Memory.minimumSell[flip.resource] = flip.sell.price;
                            dealMade = true;
                            return false;
                        }
                    }
                });
            }
        }
    }

    // Update lab queue if necessary.
    if (room.storage && Cache.labsInRoom(room).length >= 3 && room.memory.labQueue && !Utilities.roomLabsArePaused(room)) {
        switch (room.memory.labQueue.status) {
            case "clearing":
                if (Cache.labsInRoom(room).length - room.memory.labsInUse.length > 2 && _.filter(Cache.labsInRoom(room), (l) => room.memory.labsInUse.indexOf(l.id) === -1 && l.mineralAmount > 0).length === 0) {
                    room.memory.labQueue.status = "moving";
                }
            case "moving":
                if (!room.memory.labQueue.start || room.memory.labQueue.start + 500 < Game.time) {
                    delete room.memory.labQueue;
                } else {
                    moved = true;
                    _.forEach(room.memory.labQueue.children, (resource) => {
                        if (_.sum(_.filter(Cache.labsInRoom(room), (l) => l.mineralType === resource), (l) => l.mineralAmount) < room.memory.labQueue.amount) {
                            moved = false;
                            return false;
                        }
                    });

                    if (Cache.getObjectById(room.memory.labQueue.sourceLabs[0]).mineralType === room.memory.labQueue.children[0] && Cache.getObjectById(room.memory.labQueue.sourceLabs[1]).mineralType === room.memory.labQueue.children[1]) {
                        _.forEach(_.filter(Cache.labsInRoom(room), (l) => room.memory.labQueue.sourceLabs.indexOf(l.id) === -1 && (!room.memory.labsInUse || _.map(_.filter(room.memory.labsInUse, (l) => l.resource !== room.memory.labQueue.resource), (l) => l.id).indexOf(l.id) === -1)), (lab) => {
                            if (lab.runReaction(Cache.getObjectById(room.memory.labQueue.sourceLabs[0]), Cache.getObjectById(room.memory.labQueue.sourceLabs[1])) === OK) {
                                room.memory.labQueue.amount -= 5;
                            }
                        });
                    }

                    if (moved) {
                        room.memory.labQueue.status = "creating";
                    }
                }
                break;
            case "creating":
                _.forEach(_.filter(Cache.labsInRoom(room), (l) => room.memory.labQueue.sourceLabs.indexOf(l.id) === -1 && (!room.memory.labsInUse || _.map(_.filter(room.memory.labsInUse, (l) => l.resource !== room.memory.labQueue.resource), (l) => l.id).indexOf(l.id) === -1)), (lab) => {
                    if (lab.runReaction(Cache.getObjectById(room.memory.labQueue.sourceLabs[0]), Cache.getObjectById(room.memory.labQueue.sourceLabs[1])) === OK) {
                        room.memory.labQueue.amount -= 5;
                    }
                });

                if (_.sum(_.filter(Cache.labsInRoom(room), (l) => room.memory.labQueue.sourceLabs.indexOf(l.id) !== -1), (l) => l.mineralAmount) === 0) {
                    room.memory.labQueue.status = "returning";
                }
                break;
            case "returning":
                if (_.sum(_.filter(Cache.labsInRoom(room), (l) => l.mineralType === room.memory.labQueue.resource), (l) => l.mineralAmount) === 0) {
                    delete room.memory.labQueue;
                }
                break;
            default:
                room.memory.labQueue.status = "clearing";
                room.memory.labQueue.sourceLabs = Utilities.getSourceLabs(room);
                break;
        }
    }

    if (room.memory.labsInUse) {
        boosted = [];

        _.forEach(room.memory.labsInUse, (queue) => {
            switch (queue.status) {
                case "emptying":
                    if (Cache.getObjectById(queue.id).mineralAmount === 0) {
                        queue.status = "filling";
                    }
                    break;
                case "filling":
                    if (Cache.getObjectById(queue.id).mineralAmount === queue.amount && Cache.getObjectById(queue.id).mineralType === queue.resource) {
                        queue.status = "waiting";
                    }
                    break;
                case "waiting":
                default:
                    if (Cache.getObjectById(queue.id).pos.getRangeTo(Game.creeps[queue.creepToBoost]) <= 1 && Cache.getObjectById(queue.id).mineralType === queue.resource && Cache.getObjectById(queue.id).mineralAmount >= queue.amount) {
                        if (Cache.getObjectById(queue.id).boostCreep(Game.creeps[queue.creepToBoost]) === OK) {
                            _.remove(Game.creeps[queue.creepToBoost].memory.labs, (l) => l === queue.id);
                            if (!queue.status || queue.oldAmount === 0) {
                                boosted.push(queue);
                            } else {
                                queue.status = "refilling";
                            }
                        }
                    }
                    break;
                case "refilling":
                    if (Cache.getObjectById(queue.id).mineralAmount === queue.oldAmount && Cache.getObjectById(queue.id).mineralType === queue.oldResource) {
                        boosted.push(queue);
                    }
                    break;
            }
        });

        _.forEach(boosted, (queue) => {
            _.remove(room.memory.labsInUse, (l) => l.id === queue.id);
        })
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
            storerTasks: TaskCollectMinerals.getStorerTasks(room),
            labTasks: TaskCollectMinerals.getLabTasks(room),
            storageTasks: TaskCollectMinerals.getStorageTasks(room),
            terminalTasks: TaskCollectMinerals.getTerminalTasks(room)
        },
        fillEnergy: {
            extensionTasks: TaskFillEnergy.getExtensionTasks(room),
            spawnTasks: TaskFillEnergy.getSpawnTasks(room),
            towerTasks: TaskFillEnergy.getTowerTasks(room),
            storageTasks: TaskFillEnergy.getStorageTasks(room),
            containerTasks: TaskFillEnergy.getContainerTasks(room),
            labTasks: TaskFillEnergy.getLabTasks(room),
            linkTasks: TaskFillEnergy.getLinkTasks(room),
            terminalTask: terminalTask
        },
        fillMinerals: {
            labTasks: TaskFillMinerals.getLabTasks(room),
            storageTasks: TaskFillMinerals.getStorageTasks(room),
            terminalTasks: TaskFillMinerals.getTerminalTasks(room)
        },
        heal: {
            tasks: TaskHeal.getTasks(room)
        },
        rangedAttack: {
            tasks: TaskRangedAttack.getTasks(room)
        },
        repair: {
            tasks: TaskRepair.getTasks(room),
            criticalTasks: TaskRepair.getCriticalTasks(room),
            towerTasks: TaskRepair.getTowerTasks(room)
        },
        upgradeController: {
            tasks: TaskUpgradeController.getTasks(room),
            criticalTasks: TaskUpgradeController.getCriticalTasks(room)
        },
        dismantle: {
            tasks: []
        }
    };

    if (room.terminal && room.terminal.store[RESOURCE_ENERGY] >= 3000 && !room.memory.buyQueue) {
        tasks.collectEnergy.terminalTask = new TaskCollectEnergy(room.terminal.id);
    }

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
            _.remove(Memory.dismantle[room.name], (d) => d.x === complete.x && d.y === complete.y);
        });
    } else {
        _.forEach(Cache.creepsInRoom("dismantler", room), (creep) => {
            creep.memory.role = "remoteWorker";
            creep.memory.container = Cache.containersInRoom(room)[0].id;
        });
    }
    
    // Spawn new creeps.
    RoleWorker.checkSpawn(room, !room.storage || room.storage.store[RESOURCE_ENERGY] >= 250000 || tasks.upgradeController.criticalTasks.length > 0 || tasks.build.tasks.length > 0 || tasks.repair.criticalTasks > 0);
    RoleMiner.checkSpawn(room);
    RoleStorer.checkSpawn(room);
    RoleScientist.checkSpawn(room);
    RoleMeleeAttack.checkSpawn(room);
    RoleRangedAttack.checkSpawn(room);
    RoleHealer.checkSpawn(room);
    RoleDefender.checkSpawn(room);
    if (Memory.dismantle && Memory.dismantle[room.name] && Memory.dismantle[room.name].length > 0) {
        RoleDismantler.checkSpawn(room, supportRoom);
    }
    RoleCollector.checkSpawn(room);
    RoleClaimer.checkSpawn(room);
    if (room.controller && room.controller.level < 8) {
        RoleUpgrader.checkSpawn(room);
    }
    if (Cache.haulers[room.name]) {
        RoleHauler.checkSpawn(room);
    }

    // Assign tasks to creeps.                    
    RoleWorker.assignTasks(room, tasks);
    RoleMiner.assignTasks(room, tasks);
    RoleStorer.assignTasks(room, tasks);
    RoleScientist.assignTasks(room, tasks);
    RoleMeleeAttack.assignTasks(room, tasks);
    RoleRangedAttack.assignTasks(room, tasks);
    RoleHealer.assignTasks(room, tasks);
    RoleDefender.assignTasks(room, tasks);
    RoleDismantler.assignTasks(room, tasks);
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
