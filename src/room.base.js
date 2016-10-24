var RoomObj = require("roomObj"),
    Cache = require("cache"),
    Utilities = require("utilities"),
    RoleClaimer = require("role.claimer"),
    RoleCollector = require("role.collector"),
    RoleDefender = require("role.defender"),
    RoleDelivery = require("role.delivery"),
    RoleHealer = require("role.healer"),
    RoleMeleeAttack = require("role.meleeAttack"),
    RoleMiner = require("role.miner"),
    RoleRangedAttack = require("role.rangedAttack"),
    RoleReserver = require("role.reserver"),
    RoleStorer = require("role.storer"),
    RoleTower = require("role.tower"),
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
                _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                _.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === location.x && s.pos.y === location.y && s.structureType === STRUCTURE_CONTAINER).length === 0
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
                _.filter(mineral.pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_EXTRACTOR).length === 0 &&
                _.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === mineral.pos.x && s.pos.y === mineral.pos.y && s.structureType === STRUCTURE_EXTRACTOR).length === 0
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
                _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                _.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === location.x && s.pos.y === location.y && s.structureType === STRUCTURE_CONTAINER).length === 0
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
                    _.filter(pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_ROAD).length === 0 &&
                    _.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === pos.x && s.pos.y === pos.y && s.structureType === STRUCTURE_ROAD).length === 0
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
                    _.filter(structures, (s) => s.structureType === STRUCTURE_ROAD).length === 0 &&
                    _.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === pos.x && s.pos.y === pos.y && s.structureType === STRUCTURE_ROAD).length === 0
                ) {
                    room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                }
            });
        });
    }
};

Base.prototype.run = function(room) {
    "use strict";

    var tasks, links, terminalMinerals, topResource, bestOrder, transCost, terminalEnergy, terminalTask, amountToSend;

    // Something is supremely wrong.  Notify and bail.
    if (room.unobservable) {
        Game.notify("Base Room " + room.name + " is unobservable, something is wrong!");
        return;
    }

    // Manage room.
    if (Game.time % 100 === 0) {
        this.manage(room);
    }

    // Transfer energy from far link to near link.
    if (Cache.spawnsInRoom(room).length > 0) {
        links = Utilities.objectsClosestToObj(Cache.linksInRoom(room), Cache.spawnsInRoom(room)[0]);
        if (links.length > 1 && !links[1].cooldown && links[1].energy > 0) {
            links[1].transferEnergy(links[0]);
        }
    }

    // Check to see if we can do a deal in the terminal.
    if (room.terminal) {
        terminalMinerals = _.filter(_.map(room.terminal.store, (s, k) => {return {resource: k, amount: s};}), (s) => s.resource !== RESOURCE_ENERGY);
        if (terminalMinerals.length > 0) {
            topResource = _.sortBy(terminalMinerals, (s) => -s.amount)[0];
            bestOrder = _.filter(Cache.marketOrders(), (o) => o.resourceType === topResource.resource && o.type === "buy" && o.amount > 0).sort((a, b) => (b.price - a.price !== 0 ? b.price - a.price : Game.map.getRoomLinearDistance(room.name, a.roomName, true) - Game.map.getRoomLinearDistance(room.name, b.roomName, true)))[0];
            if (bestOrder) {
                transCost = Game.market.calcTransactionCost(Math.min(topResource.amount, bestOrder.amount), room.name, bestOrder.roomName);
                terminalEnergy = room.terminal.store[RESOURCE_ENERGY] || 0;
                if (terminalEnergy > transCost) {
                    Game.market.deal(bestOrder.id, Math.min(topResource.amount, bestOrder.amount), room.name);
                } else {
                    terminalTask = new TaskFillEnergy(room.terminal.id);
                    if (terminalEnergy > 0) {
                        amountToSend = Math.floor(Math.min(topResource.amount, bestOrder.amount) * terminalEnergy / transCost);
                        if (amountToSend > 0) {
                            Game.market.deal(bestOrder.id, amountToSend, room.name);
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
    RoleDelivery.checkSpawn(room);
    RoleReserver.checkSpawn(room);
    RoleClaimer.checkSpawn(room);

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
            fillLinkTask: TaskFillEnergy.getFillLinkTask(room),
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

    // Output room report.
    if (tasks.fillEnergy.fillExtensionTasks.length > 0) {
        console.log("    Extensions to fill: " + tasks.fillEnergy.fillExtensionTasks.length);
    }
    if (tasks.fillEnergy.fillSpawnTasks.length > 0) {
        console.log("    Spawns to fill: " + tasks.fillEnergy.fillSpawnTasks.length);
    }
    if (tasks.fillEnergy.fillTowerTasks.length > 0) {
        console.log("    Towers to fill: " + tasks.fillEnergy.fillTowerTasks.length);
    }
    if (tasks.build.tasks.length > 0) {
        console.log("    Structures to build: " + tasks.build.tasks.length);
    }
    if (tasks.repair.criticalTasks.length > 0) {
        console.log("    Critical repairs needed: " + tasks.repair.criticalTasks.length);
        _.forEach(_.take(tasks.repair.criticalTasks, 5), (task) => {
            console.log("      " + task.structure.structureType + " " + task.structure.pos.x + "," + task.structure.pos.y + " " + task.structure.hits + "/" + task.structure.hitsMax + " " + (100 * task.structure.hits / task.structure.hitsMax).toFixed(3) + "%");
        });
    }
    if (tasks.repair.tasks.length > 0) {
        console.log("    Repairs needed: " + tasks.repair.tasks.length);
        _.forEach(_.take(tasks.repair.tasks, 5), (task) => {
            console.log("      " + task.structure.structureType + " " + task.structure.pos.x + "," + task.structure.pos.y + " " + task.structure.hits + "/" + task.structure.hitsMax + " " + (100 * task.structure.hits / task.structure.hitsMax).toFixed(3) + "%");
        });
    }
    if (tasks.rangedAttack.tasks.length > 0) {
        console.log("    Hostiles: " + tasks.rangedAttack.tasks.length);
        _.forEach(_.take(tasks.rangedAttack.tasks, 5), (task) => {
            console.log("      " + task.enemy.pos.x + "," + task.enemy.pos.y + " " + task.enemy.hits + "/" + task.enemy.hitsMax + " " + (100 * task.enemy.hits / task.enemy.hitsMax).toFixed(3) + "%");
        });
    }
    if (tasks.heal.tasks.length > 0) {
        console.log("    Creeps to heal: " + tasks.heal.tasks.length);
        _.forEach(_.take(tasks.heal.tasks, 5), (task) => {
            console.log("      " + task.ally.pos.x + "," + task.ally.pos.y + " " + task.ally.hits + "/" + task.ally.hitsMax + " " + (100 * task.ally.hits / task.ally.hitsMax).toFixed(3) + "%");
        });
    }

    // Assign tasks to creeps.                    
    RoleWorker.assignTasks(room, tasks);
    RoleMiner.assignTasks(room, tasks);
    RoleStorer.assignTasks(room, tasks);
    RoleMeleeAttack.assignTasks(room, tasks);
    RoleRangedAttack.assignTasks(room, tasks);
    RoleHealer.assignTasks(room, tasks);
    RoleDefender.assignTasks(room, tasks);
    RoleCollector.assignTasks(room, tasks);
    RoleDelivery.assignTasks(room, tasks);
    RoleReserver.assignTasks(room, tasks);
    RoleClaimer.assignTasks(room, tasks);

    // Assign tasks to towers.
    RoleTower.assignTasks(room, tasks);
};

Base.prototype.toObj = function(room) {
    "use strict";

    Memory.room[room.name].roomType = {
        type: this.type
    }
};

Base.fromObj = function(room) {
    "use strict";

    return new Base();
};

require("screeps-profiler").registerObject(Base, "RoomBase");
module.exports = Base;
