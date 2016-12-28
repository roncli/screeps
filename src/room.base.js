var RoomObj = require("roomObj"),
    Cache = require("cache"),
    Market = require("market"),
    Utilities = require("utilities"),
    RoleClaimer = require("role.claimer"),
    RoleCollector = require("role.collector"),
    RoleDefender = require("role.defender"),
    RoleDismantler = require("role.dismantler"),
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
                _.filter(structures, (s) => s instanceof StructureContainer).length === 0 &&
                _.filter(sites, (s) => s.pos.x === x && s.pos.y === y && s instanceof StructureContainer).length === 0
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
                _.filter(mineralPos.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureExtractor).length === 0 &&
                _.filter(sites, (s) => s.pos.x === mineralX && s.pos.y === mineralY && s instanceof StructureExtractor).length === 0
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
                _.filter(structures, (s) => s instanceof StructureContainer).length === 0 &&
                _.filter(sites, (s) => s.pos.x === x && s.pos.y === y && s instanceof StructureContainer).length === 0
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
        _.forEach(_.filter(room.find(FIND_MY_STRUCTURES), (s) => s.room.name === roomName && (s.structureType instanceof StructureSpawn || s.structureType instanceof StructureExtension || s.structureType instanceof StructureTower || s.structureType instanceof StructureStorage || s.structureType instanceof StructureTerminal)), (structure) => {
            var structureX = structure.pos.x,
                structureY = structure.pos.y;
                
            _.forEach([new RoomPosition(structureX - 1, structureY, roomName), new RoomPosition(structureX + 1, structureY, roomName), new RoomPosition(structureX, structureY - 1, roomName), new RoomPosition(structureX, structureY + 1, roomName)], (pos) => {
                var x = pos.x,
                    y = pos.y;
                
                if (
                    _.filter(pos.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureRoad).length === 0 &&
                    _.filter(sites, (s) => s.pos.x === x && s.pos.y === y && s instanceof StructureRoad).length === 0
                ) {
                    room.createConstructionSite(x, y, STRUCTURE_ROAD);
                }
            });
        });
    }
};

Base.prototype.run = function(room) {
    "use strict";

    var roomName = room.name,
        spawns = Cache.spawnsInRoom(room),
        terminal = room.terminal,
        terminalStore = terminal.store,
        terminalId = terminal.id,
        storage = room.storage,
        storageStore = storage.store,
        memory = room.memory,
        buyQueue = memory.buyQueue,
        labQueue = memory.labQueue,
        dealMade = false,
        flips = [],
        completed = [],
        labs = Cache.labsInRoom(room),
        labsInUse = memory.labsInUse,
        dismantle = Memory.dismantle,
        controller = room.controller,
        tasks, links, firstLink, terminalMinerals, bestOrder, transCost, terminalEnergy, terminalTask, amount, moved, boosted;

    // Something is supremely wrong.  Notify and bail.
    if (room.unobservable) {
        Game.notify("Base Room " + roomName + " is unobservable, something is wrong!");
        return;
    }

    // Manage room.
    if (Game.time % 100 === 0 && spawns.length > 0) {
        this.manage(room);
    }

    if (spawns.length > 0) {
        // Transfer energy from near link to far link.
        links = Utilities.objectsClosestToObj(Cache.linksInRoom(room), spawns[0]);
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

    // Check to see if we can do a deal in the terminal.
    if (terminal) {
        terminalEnergy = terminalStore[RESOURCE_ENERGY] || 0;
    } else {
        terminalEnergy = 0;
    }

    if (terminal && terminalEnergy < 1000) {
        terminalTask = new TaskFillEnergy(terminalId);
    }

    if (terminal && terminalEnergy >= 1000) {
        if (!Memory.minimumSell) {
            Memory.minimumSell = {};
        }

        if (buyQueue && storageStore[RESOURCE_ENERGY] >= 10000) {
            // Buy what we need to for the lab queue.
            bestOrder = _.filter(Market.getAllOrders(), (o) => o.resourceType === buyQueue.resource && o.type === "sell" && o.amount > 0).sort((a, b) => (a.price - b.price !== 0 ? a.price - b.price : Game.map.getRoomLinearDistance(roomName, a.roomName, true) - Game.map.getRoomLinearDistance(roomName, b.roomName, true)))[0];
            if (bestOrder) {
                if (bestOrder.price > buyQueue.price) {
                    delete memory.buyQueue;
                    buyQueue = undefined;
                } else {
                    transCost = Game.market.calcTransactionCost(Math.min(buyQueue.amount, bestOrder.amount), roomName, bestOrder.roomName);
                    if (terminalEnergy > transCost) {
                        Market.deal(bestOrder.id, Math.min(buyQueue.amount, bestOrder.amount), roomName);
                        dealMade = true;
                        buyQueue.amount -= Math.min(buyQueue.amount, bestOrder.amount);
                    } else {
                        if (terminalEnergy > 0) {
                            amount = Math.floor(Math.min(buyQueue.amount, bestOrder.amount) * terminalEnergy / transCost);
                            if (amount > 0) {
                                Market.deal(bestOrder.id, amount, roomName);
                                dealMade = true;
                                buyQueue.amount -= amount;
                            }
                        }
                    }
                }
            }

            if (buyQueue && buyQueue.amount <= 0) {
                delete memory.buyQueue;
                buyQueue = undefined;
            }
        } else {
            // Sell what we have in excess.
            terminalMinerals = _.filter(_.map(terminalStore, (s, k) => {
                return {resource: k, amount: Math.min(s, s - (Memory.reserveMinerals ? (Memory.reserveMinerals[k] || 0) : 0) + (storageStore[k] || 0))};
            }), (s) => s.resource !== RESOURCE_ENERGY && s.amount > 0);

            if (terminalMinerals.length > 0) {
                _.forEach(_.sortBy(terminalMinerals, (s) => -s.amount), (topResource) => {
                    bestOrder = _.filter(Market.getAllOrders(), (o) => o.resourceType === topResource.resource && o.type === "buy" && o.amount > 0 && (!Memory.minimumSell[o.resourceType] || o.price >= Memory.minimumSell[o.resourceType])).sort((a, b) => (b.price - a.price !== 0 ? b.price - a.price : Game.map.getRoomLinearDistance(roomName, a.roomName, true) - Game.map.getRoomLinearDistance(roomName, b.roomName, true)))[0];
                    if (bestOrder) {
                        transCost = Game.market.calcTransactionCost(Math.min(topResource.amount, bestOrder.amount), roomName, bestOrder.roomName);
                        if (terminalEnergy > transCost) {
                            Market.deal(bestOrder.id, Math.min(topResource.amount, bestOrder.amount), roomName);
                            dealMade = true;
                            delete Memory.minimumSell[bestOrder.resourceType];
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
            
            // Find an order to flip if we haven't made a deal and we have enough energy.
            if (!dealMade && storage && storageStore[RESOURCE_ENERGY] > Memory.marketEnergy) {
                _.forEach(_.uniq(_.map(Market.getAllOrders(), (o) => o.resourceType)), (resource) => {
                    var sellOrder, buyOrder;

                    // Energy and tokens are not to be traded.
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
                    var buy = flip.buy,
                        sell = flip.sell;
                    
                    if (index === 0) {
                        Cache.log.events.push("Biggest flip: " + flip.resource + " x" + Math.min(buy.amount, sell.amount) + " " + sell.price.toFixed(2) + " to " + buy.price.toFixed(2));
                    }

                    // Determine how much energy we need for the deal.
                    transCost = Game.market.calcTransactionCost(sell.amount, roomName, sell.roomName);
                    if (terminalEnergy > transCost) {
                        Market.deal(sell.id, sell.amount, roomName);
                        Memory.minimumSell[flip.resource] = sell.price;
                        dealMade = true;
                        return false;
                    }

                    if (terminalEnergy > 0) {
                        amount = Math.floor(sell.amount * terminalEnergy / transCost);
                        if (amount > 0) {
                            Market.deal(sell.id, amount, roomName);
                            Memory.minimumSell[flip.resource] = sell.price;
                            dealMade = true;
                            return false;
                        }
                    }
                });
            }
        }
    }

    // Update lab queue if necessary.
    if (storage && labs.length >= 3 && labQueue && !Utilities.roomLabsArePaused(room)) {
        let sourceLabs = labQueue.sourceLabs || [],
            children = labQueue.children || [],
            sourceLab0 = Game.getObjectById(sourceLabs[0]),
            sourceLab1 = Game.getObjectById(sourceLabs[1]),
            resource = labQueue.resource;
        
        switch (labQueue.status) {
            case "clearing":
                if (labs.length - labsInUse.length > 2 && _.filter(labs, (l) => labsInUse.indexOf(l.id) === -1 && l.mineralAmount > 0).length === 0) {
                    labQueue.status = "moving";
                }
            case "moving":
                if (!labQueue.start || labQueue.start + 500 < Game.time) {
                    delete memory.labQueue;
                    labQueue = undefined;
                } else {
                    moved = true;
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

    if (labsInUse) {
        boosted = [];

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

    if (terminal && terminalStore[RESOURCE_ENERGY] >= 5000 && (!buyQueue || storageStore[RESOURCE_ENERGY] < 10000)) {
        tasks.collectEnergy.terminalTask = new TaskCollectEnergy(terminalId);
    }

    if (dismantle && dismantle[roomName] && dismantle[roomName].length > 0) {
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
        _.forEach(Cache.creepsInRoom("dismantler", room), (creep) => {
            creep.memory.role = "remoteWorker";
            creep.memory.container = Cache.containersInRoom(room)[0].id;
        });
    }
    
    // Spawn new creeps.
    RoleWorker.checkSpawn(room, !storage || storageStore[RESOURCE_ENERGY] >= Memory.workerEnergy || tasks.upgradeController.criticalTasks.length > 0 || tasks.build.tasks.length > 0 || tasks.repair.criticalTasks.length > 0 || _.filter(tasks.repair.tasks, (t) => (t.structure instanceof StructureWall || t.structure instanceof StructureRampart) && t.structure.hits < 1000000).length > 0);
    RoleMiner.checkSpawn(room);
    RoleStorer.checkSpawn(room);
    RoleScientist.checkSpawn(room);
    RoleMeleeAttack.checkSpawn(room);
    RoleRangedAttack.checkSpawn(room);
    RoleHealer.checkSpawn(room);
    RoleDefender.checkSpawn(room);
    if (dismantle && dismantle[roomName] && dismantle[roomName].length > 0) {
        RoleDismantler.checkSpawn(room, supportRoom);
    }
    RoleCollector.checkSpawn(room);
    RoleClaimer.checkSpawn(room);
    if (controller && controller.level < 8) {
        RoleUpgrader.checkSpawn(room);
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
