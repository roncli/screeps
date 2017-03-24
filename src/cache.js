var spawnsInRoom = {},
    powerSpawnsInRoom = {},
    extensionsInRoom = {},
    towersInRoom = {},
    labsInRoom = {},
    nukersInRoom = {},
    containersInRoom = {},
    linksInRoom = {},
    repairableStructuresInRoom = {},
    sortedRepairableStructuresInRoom = {},
    extractorsInRoom = {},
    portalsInRoom = {},
    hostilesInRoom = {},
    sourceKeepersInRoom = {},
    powerBanksInRoom = {},
    costMatricies = {},

    Cache = {
        creepTasks: {},
        roomTypes: {},
        spawning: {},
        minerals: {},
        log: {},
    
        // Reset the cache.
        reset: () => {
            "use strict";
    
            spawnsInRoom = {};
            powerSpawnsInRoom = {};
            extensionsInRoom = {};
            towersInRoom = {};
            labsInRoom = {};
            nukersInRoom = {};
            containersInRoom = {};
            linksInRoom = {};
            repairableStructuresInRoom = {};
            sortedRepairableStructuresInRoom = {};
            extractorsInRoom = {};
            portalsInRoom = {};
            hostilesInRoom = {};
            sourceKeepersInRoom = {};
            powerBanksInRoom = {};
            costMatricies = {};
            Cache.creepTasks = {};
            Cache.roomTypes = {};
            Cache.spawning = {};
            Cache.minerals = {};
    
            Cache.log = {
                events: [],
                hostiles: [],
                creeps: [],
                spawns: [],
                structures: [],
                rooms: {},
                army: {}
            };
            
            Cache.credits = Game.market.credits;
            if (Memory.visualizations) {
                Cache.globalVisual = new RoomVisual();
            }
            if (Memory.visualizations) {
                Cache.time = new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}).replace(",", "");
            }
        },
    
        // Returns all spawns in the current room.    
        spawnsInRoom: (room) => {
            "use strict";
    
            return spawnsInRoom[room.name] ? spawnsInRoom[room.name] : spawnsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_SPAWN);
        },

        // Returns all power spawns in the current room.
        powerSpawnsInRoom: (room) => {
            "use strict";

            return powerSpawnsInRoom[room.name] ? powerSpawnsInRoom[room.name] : powerSpawnsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_POWER_SPAWN);
        },
        
        // Returns all extentions in the current room.
        extensionsInRoom: (room) => {
            "use strict";
    
            return extensionsInRoom[room.name] ? extensionsInRoom[room.name] : extensionsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_EXTENSION);
        },
    
        // Returns all towers in the current room.
        towersInRoom: (room) => {
            "use strict";
    
            return towersInRoom[room.name] ? towersInRoom[room.name] : towersInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_TOWER);
        },
    
        // Returns all labs in the current room.
        labsInRoom: (room) => {
            "use strict";
    
            return labsInRoom[room.name] ? labsInRoom[room.name] : labsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_LAB);
        },

        // Returns all nukers in the current room.
        nukersInRoom: (room) => {
            "use strict";

            return nukersInRoom[room.name] ? nukersInRoom[room.name] : nukersInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_NUKER);
        },
    
        // Returns all containers in the current room.
        containersInRoom: (room) => {
            "use strict";
    
            return containersInRoom[room.name] ? containersInRoom[room.name] : containersInRoom[room.name] = _.filter(room.find(FIND_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER);
        },
    
        // Returns all links in the current room.
        linksInRoom: (room) => {
            "use strict";
    
            return linksInRoom[room.name] ? linksInRoom[room.name] : linksInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_LINK});
        },
    
        // Returns all repairable structures in the current room.
        repairableStructuresInRoom: (room) => {
            "use strict";
    
            return repairableStructuresInRoom[room.name] ? repairableStructuresInRoom[room.name] : repairableStructuresInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => (s.my || s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) && s.hits});
        },
        
        sortedRepairableStructuresInRoom: (room) => {
            "use strict";
            
            return sortedRepairableStructuresInRoom[room.name] ? sortedRepairableStructuresInRoom[room.name] : sortedRepairableStructuresInRoom[room.name] = Cache.repairableStructuresInRoom(room).sort((a, b) => a.hits - b.hits);
        },
    
        // Returns all extractors in the current room.
        extractorsInRoom: (room) => {
            "use strict";
    
            return extractorsInRoom[room.name] ? extractorsInRoom[room.name] : extractorsInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_EXTRACTOR});
        },
        
        // Returns all portals in the current room.
        portalsInRoom: (room) => {
            "use strict";
            
            return portalsInRoom[room.name] ? portalsInRoom[room.name] : portalsInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_PORTAL});
        },
    
        // Return all hostile creeps in the current room.
        hostilesInRoom: (room) => {
            "use strict";

            var roomName = room.name,
                hostiles;

            if (!room || room.unobservable) {
                return [];
            }
    
            hostiles = hostilesInRoom[room.name] ? hostilesInRoom[room.name] : hostilesInRoom[room.name] = _.filter(room.find(FIND_HOSTILE_CREEPS), (c) => !c.owner || Memory.allies.indexOf(c.owner.username) === -1);
    
            if (!Memory.rooms[roomName].hostiles) {
                Memory.rooms[roomName].hostiles = [];
            }
    
            _.forEach(hostiles, (hostile) => {
                if (Memory.rooms[roomName].hostiles.indexOf(hostile.id) !== -1) {
                    Memory.rooms[roomName].harvested = 0;
                }
            });
    
            room.memory.hostiles = _.map(hostiles, (h) => h.id);
    
            return hostiles;
        },

        // Return all source keepers in the current room.
        sourceKeepersInRoom: (room) => {
            "use strict";

            return sourceKeepersInRoom[room.name] ? sourceKeepersInRoom[room.name] : sourceKeepersInRoom[room.name] = room.find(FIND_HOSTILE_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_KEEPER_LAIR});
        },
    
        // Return all power banks in the current room.
        powerBanksInRoom: (room) => {
            "use strict";

            return powerBanksInRoom[room.name] ? powerBanksInRoom[room.name] : powerBanksInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_POWER_BANK});
        },
    
        // Get the cost matrix for a room.
        getCostMatrix: (room) => {
            "use strict";

            var roomName = room.name;
    
            if (!room || room.unobservable) {
                return new PathFinder.CostMatrix();
            }
    
            if (!costMatricies[roomName]) {
                let matrix = new PathFinder.CostMatrix();
    
                _.forEach(room.find(FIND_STRUCTURES), (structure) => {
                    var pos = structure.pos;
                    if (structure.structureType === STRUCTURE_ROAD) {
                        matrix.set(pos.x, pos.y, Math.max(1, matrix.get(pos.x, pos.y)));
                    } else if (structure.structureType === STRUCTURE_WALL) {
                        matrix.set(pos.x, pos.y, Math.max(255, matrix.get(pos.x, pos.y)));
                    } else if (structure.structureType === STRUCTURE_CONTAINER) {
                        matrix.set(pos.x, pos.y, Math.max(10, matrix.get(pos.x, pos.y)));
                    } else if (!(structure.structureType === STRUCTURE_RAMPART) || !structure.my) {
                        matrix.set(pos.x, pos.y, 255);
                    }
                });
    
                _.forEach(room.find(FIND_MY_CONSTRUCTION_SITES), (structure) => {
                    var pos = structure.pos;
                    matrix.set(pos.x, pos.y, Math.max(5, matrix.get(pos.x, pos.y)));
                });
                
                _.forEach(Cache.portalsInRoom(room), (structure) => {
                    var pos = structure.pos;
                    matrix.set(pos.x, pos.y, 5);
                });

                if (Memory.avoidSquares[roomName]) {
                    _.forEach(Memory.avoidSquares[roomName], (square) => {
                        matrix.set(square.x, square.y, 255);
                    });
                }
                
                if (!Memory.rooms[roomName] || !Memory.rooms[roomName].roomType || Memory.rooms[roomName].roomType.type !== "source") {
                    _.forEach(_.filter(room.find(FIND_HOSTILE_CREEPS), (c) => c.owner.username === "Source Keeper"), (creep) => {
                        var pos = creep.pos;
                        for (let x = pos.x - 3; x < pos.x + 3; x++) {
                            for (let y = pos.y - 3; y < pos.y + 3; y++) {
//                                matrix.set(x, y, 255);
                            }
                        }
                    });
                }

                costMatricies[roomName] = matrix;
            }
            
            return costMatricies[roomName];
        }
    };

require("screeps-profiler").registerObject(Cache, "Cache");
module.exports = Cache;
