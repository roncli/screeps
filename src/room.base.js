var Room = require("room"),
    Cache = require("cache"),
    Utilities = require("utilities"),
    RoleCollector = require("role.collector"),
    RoleDelivery = require("role.delivery"),
    RoleHealer = require("role.healer"),
    RoleMiner = require("role.miner"),
    RoleRangedAttack = require("role.rangedAttack"),
    RoleStorer = require("role.storer"),
    RoleTower = require("role.tower"),
    RoleWorker = require("role.worker"),
    Base = function() {
        Room.call(this);

        this.type = "base";
    };

Base.prototype = Object.create(Room.prototype);
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
    // Manage room.
    if (Game.time % 100 === 0) {
        this.manage(room);
    }

    // Spawn new creeps.
    RoleWorker.checkSpawn(room);
    RoleRangedAttack.checkSpawn(room);
    RoleHealer.checkSpawn(room);
    RoleMiner.checkSpawn(room);
    RoleStorer.checkSpawn(room);
    RoleCollector.checkSpawn(room);
    RoleDelivery.checkSpawn(room);

    // Get the tasks needed for this room.

    // Output room report.

    // Assign tasks to creeps.                    
    RoleWorker.assignTasks(room);
    RoleRangedAttack.assignTasks(room);
    RoleHealer.assignTasks(room);
    RoleMiner.assignTasks(room);
    RoleStorer.assignTasks(room);
    RoleCollector.assignTasks(room);
    RoleDelivery.assignTasks(room);

    // Assign tasks to towers.
    RoleTower.assignTasks(room);
};

Base.prototype.toObj = function(room) {
    "use strict";

    room.memory.roomType = {
        type: this.type
    }
};

Base.fromObj = function(room) {
    "use strict";

    return new Base();
};

require("screeps-profiler").registerObject(Base, "RoomBase");
module.exports = Base;
