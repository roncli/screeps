/*
room.base
---------
Create [0, 5, 10, 20, 30, 40, 50, 60][room.controller.level - 1] extensions diagonally from spawn
Queue 5 role.worker
Create container by source on square closest to spawn, replacing structures
Queue 1 role.miner per source
If RCL >= 3:
  Create first tower diagonally from spawn
  Create roads between structures
If RCL >= 4:
  Create storage diagonally from spawn, replacing roads
  Queue 1 role.collector per source
  Create roads from each source to storage
If RCL >= 6:
  Create terminal diagonally from storage, replacing roads
  Create extractor on mineral
  Create container by mineral on square closest to storage with container, replacing structures
  Queue 1 role.miner per mineral
  Queue 1 role.collector per mineral
  Create roads from mineral to storage

* Diagonally from object restrictions:
*   Not within 1 square horizontally or vertically of a wall
*   Not within 1 square of a source or mineral.
*   Not within 4 squares of a controller.
*/

var Cache = require("cache"),
    Utilities = require("utilities"),

    Base = {
        manage: (room) => {
            "use strict";

            var extensionsToBuild;

            // Bail if this base does not have a controller.
            if (room.controller.level === 0) {
                return;
            }

            // Build more extensions if they are available.
            if ((extensionsToBuild = [0, 5, 10, 20, 30, 40, 50, 60][room.controller.level - 1] - Cache.extensionsInRoom(room).length + _.filter(Cache.constructionSitesInRoom(room), (c) => c.structureType === STRUCTURE_EXTENSION)) > 0) {
                // Build the needed structures.
                Utilities.buildStructures(room, STRUCTURE_EXTENSION, extensionsToBuild, Cache.spawnsInRoom(room)[0]);
            }

            // Build containers by source.
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

            // At RCL3, build first tower.
            if (room.controller.level >= 3 && Cache.towersInRoom(room).length === 0) {
                Utilities.buildStructures(room, STRUCTURE_TOWER, 1, Cache.spawnsInRoom(room)[0]);
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
                        room.createConstructionSite(x, y, STRUCTURE_CONTAINER);
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

            // At RCL4, build roads from containers to storage.
            // TODO
        }
    };


require("screeps-profiler").registerObject(Base, "RoomBase");
module.exports = Base;
