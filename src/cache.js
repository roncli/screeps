var Filters = require("filters"),

    creepsInRoom = {},
    creepsInArmy = {},
    spawnsInRoom = {},
    extensionsInRoom = {},
    towersInRoom = {},
    labsInRoom = {},
    containersInRoom = {},
    linksInRoom = {},
    repairableStructuresInRoom = {},
    extractorsInRoom = {},
    hostilesInRoom = {},
    costMatricies = {},
    objects = {},

    filterResetHarvestedCount = (hostile) => {
        if (hostile.room.memory.hostiles.indexOf(hostile.id) !== -1) {
            hostile.room.memory.harvested = 0;
        }
    },

    Cache = {
        creepTasks: {},
        roomTypes: {},
        spawning: {},
        minerals: [],
        log: {},
    
        // Reset the cache.
        reset: () => {
            "use strict";
    
            creepsInRoom = {};
            creepsInArmy = {};
            spawnsInRoom = {};
            extensionsInRoom = {};
            towersInRoom = {};
            labsInRoom = {};
            containersInRoom = {};
            linksInRoom = {};
            repairableStructuresInRoom = {};
            extractorsInRoom = {};
            hostilesInRoom = {};
            costMatricies = {};
            objects = {};
            Cache.creepTasks = {};
            Cache.roomTypes = {};
            Cache.spawning = {};
            Cache.minerals = [];
    
            Cache.log = {
                events: [],
                hostiles: [],
                creeps: [],
                spawns: [],
                structures: [],
                rooms: {},
                army: {}
            };
        },
    
        // Returns all creeps of a certain in the current room.
        creepsInRoom: (type, room) => {
            "use strict";
            
            var roomName = room.name;
    
            if (!creepsInRoom[roomName]) {
                creepsInRoom[roomName] = {};
            }
    
            if (!creepsInRoom[roomName].all) {
                creepsInRoom[roomName].all = _.filter(Game.creeps, (c) => c.memory.home === roomName);
            }

            return creepsInRoom[roomName][type] ? creepsInRoom[roomName][type] : (creepsInRoom[roomName][type] = (type === "all" ? creepsInRoom[roomName].all : _.filter(creepsInRoom[roomName].all, (c) => c.memory.role === type)));
        },
    
        // Returns all creeps of a certain in an army.
        creepsInArmy: (type, army) => {
            "use strict";
    
            if (!creepsInArmy[army]) {
                creepsInArmy[army] = {};
            }
    
            if (!creepsInArmy[army].all) {
                creepsInArmy[army].all = _.filter(Game.creeps, (c) => c.memory.army === army);
            }
    
            return creepsInArmy[army][type] ? creepsInArmy[army][type] : (creepsInArmy[army][type] = (type === "all" ? creepsInArmy[army].all : _.filter(creepsInArmy[army].all, (c) => type === "all" || c.memory.role === type)));
        },
    
        // Returns all spawns in the current room.    
        spawnsInRoom: (room) => {
            "use strict";
    
            return spawnsInRoom[room.name] ? spawnsInRoom[room.name] : (spawnsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), Filters.isSpawn));
        },
        
        // Returns all extentions in the current room.
        extensionsInRoom: (room) => {
            "use strict";
    
            return extensionsInRoom[room.name] ? extensionsInRoom[room.name] : (extensionsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), Filters.isExtension));
        },
    
        // Returns all towers in the current room.
        towersInRoom: (room) => {
            "use strict";
    
            return towersInRoom[room.name] ? towersInRoom[room.name] : (towersInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), Filters.isTower));
        },
    
        // Returns all labs in the current room.
        labsInRoom: (room) => {
            "use strict";
    
            return labsInRoom[room.name] ? labsInRoom[room.name] : (labsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), Filters.isLab));
        },
    
        // Returns all containers in the current room.
        containersInRoom: (room) => {
            "use strict";
    
            return containersInRoom[room.name] ? containersInRoom[room.name] : (containersInRoom[room.name] = _.filter(room.find(FIND_STRUCTURES), Filters.isContainer));
        },
    
        // Returns all links in the current room.
        linksInRoom: (room) => {
            "use strict";
    
            return linksInRoom[room.name] ? linksInRoom[room.name] : (linksInRoom[room.name] = _.filter(room.find(FIND_STRUCTURES), Filters.isLink));
        },
    
        // Returns all repairable structures in the current room.
        repairableStructuresInRoom: (room) => {
            "use strict";
    
            return repairableStructuresInRoom[room.name] ? repairableStructuresInRoom[room.name] : (repairableStructuresInRoom[room.name] = _.filter(room.find(FIND_STRUCTURES), Filters.isRepairable));
        },
    
        // Returns all extractors in the current room.
        extractorsInRoom: (room) => {
            "use strict";
    
            return extractorsInRoom[room.name] ? extractorsInRoom[room.name] : (extractorsInRoom[room.name] = _.filter(room.find(FIND_STRUCTURES), Filters.isExtractor));
        },
    
        // Return all hostile creeps in the current room.
        hostilesInRoom: (room) => {
            "use strict";
    
            var hostiles = hostilesInRoom[room.name] ? hostilesInRoom[room.name] : (hostilesInRoom[room.name] = _.filter(room.find(FIND_HOSTILE_CREEPS), Filters.notAllied));

            // Check for new hostiles, resetting the harvested count if there are hostiles.
            if (!room.memory.hostiles) {
                room.memory.hostiles = [];
            }
    
            _.forEach(hostiles, filterResetHarvestedCount);
    
            room.memory.hostiles = _.map(hostiles, (h) => h.id);
    
            return hostiles;
        },
    
        // Get the cost matrix for a room.
        getCostMatrix: (room) => {
            "use strict";
            
            var roomName = room.name,
                matrix;
    
            if (!costMatricies[roomName]) {
                matrix = new PathFinder.CostMatrix();

                _.forEach(room.find(FIND_STRUCTURES), (structure) => {
                    if (structure instanceof StructureRoad) {
                        matrix.set(structure.pos.x, structure.pos.y, 1);
                    } else if (structure.structureType !== STRUCTURE_CONTAINER && (structure.structureType !== STRUCTURE_RAMPART || !structure.my)) {
                        matrix.set(structure.pos.x, structure.pos.y, 255);
                    }
                });
    
                _.forEach(room.find(FIND_CONSTRUCTION_SITES), (structure) => {
                    matrix.set(structure.pos.x, structure.pos.y, 5);
                });

                costMatricies[roomName] = matrix;
            }
            
            return costMatricies[roomName];
        },
    
        // Get object by ID.
        getObjectById: (id) => {
            "use strict";
    
            return objects[id] ? objects[id] : (objects[id] = Game.getObjectById(id));
        }
    };

require("screeps-profiler").registerObject(Cache, "Cache");
module.exports = Cache;
