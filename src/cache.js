var creepsInRoom = {},
    creepsInArmy = {},
    spawnsInRoom = {},
    extensionsInRoom = {},
    towersInRoom = {},
    labsInRoom = {},
    containersInRoom = {},
    linksInRoom = {},
    repairableStructuresInRoom = {},
    extractorsInRoom = {},
    portalsInRoom = {},
    hostilesInRoom = {},
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
            portalsInRoom = {};
            hostilesInRoom = {};
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
    
            return creepsInArmy[army][type] ? creepsInArmy[army][type] : (creepsInArmy[army][type] = (type === "all" ? creepsInArmy[army].all : _.filter(creepsInArmy[army].all, (c) => c.memory.role === type)));
        },
    
        // Returns all spawns in the current room.    
        spawnsInRoom: (room) => {
            "use strict";
    
            return spawnsInRoom[room.name] ? spawnsInRoom[room.name] : (spawnsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s instanceof StructureSpawn));
        },
        
        // Returns all extentions in the current room.
        extensionsInRoom: (room) => {
            "use strict";
    
            return extensionsInRoom[room.name] ? extensionsInRoom[room.name] : (extensionsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s instanceof StructureExtension));
        },
    
        // Returns all towers in the current room.
        towersInRoom: (room) => {
            "use strict";
    
            return towersInRoom[room.name] ? towersInRoom[room.name] : (towersInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s instanceof StructureTower));
        },
    
        // Returns all labs in the current room.
        labsInRoom: (room) => {
            "use strict";
    
            return labsInRoom[room.name] ? labsInRoom[room.name] : (labsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s instanceof StructureLab));
        },
    
        // Returns all containers in the current room.
        containersInRoom: (room) => {
            "use strict";
    
            return containersInRoom[room.name] ? containersInRoom[room.name] : (containersInRoom[room.name] = _.filter(room.find(FIND_STRUCTURES), (s) => s instanceof StructureContainer));
        },
    
        // Returns all links in the current room.
        linksInRoom: (room) => {
            "use strict";
    
            return linksInRoom[room.name] ? linksInRoom[room.name] : (linksInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s instanceof StructureLink}));
        },
    
        // Returns all repairable structures in the current room.
        repairableStructuresInRoom: (room) => {
            "use strict";
    
            return repairableStructuresInRoom[room.name] ? repairableStructuresInRoom[room.name] : (repairableStructuresInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => ((s.my || s instanceof StructureWall || s instanceof StructureRoad || s instanceof StructureContainer) && s.hits)}));
        },
    
        // Returns all extractors in the current room.
        extractorsInRoom: (room) => {
            "use strict";
    
            return extractorsInRoom[room.name] ? extractorsInRoom[room.name] : (extractorsInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => (s instanceof StructureExtractor)}));
        },
        
        // Returns all portals in the current room.
        portalsInRoom: (room) => {
            "use strict";
            
            return portalsInRoom[room.name] ? portalsInRoom[room.name] : (portalsInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s instanceof StructurePortal}));
        },
    
        // Return all hostile creeps in the current room.
        hostilesInRoom: (room) => {
            "use strict";

            if (!room) {
                return [];
            }
    
            var hostiles = hostilesInRoom[room.name] ? hostilesInRoom[room.name] : (hostilesInRoom[room.name] = _.filter(room.find(FIND_HOSTILE_CREEPS), (c) => !c.owner || Memory.allies.indexOf(c.owner.username) === -1));
    
            if (!room.memory.hostiles) {
                room.memory.hostiles = [];
            }
    
            _.forEach(hostiles, (hostile) => {
                if (room.memory.hostiles.indexOf(hostile.id) !== -1) {
                    room.memory.harvested = 0;
                }
            });
    
            room.memory.hostiles = _.map(hostiles, (h) => h.id);
    
            return hostiles;
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
                    if (structure instanceof StructureRoad) {
                        matrix.set(structure.pos.x, structure.pos.y, 1);
                    } else if (structure.structureType !== STRUCTURE_CONTAINER && (structure.structureType !== STRUCTURE_RAMPART || !structure.my)) {
                        matrix.set(structure.pos.x, structure.pos.y, 255);
                    }
                });
    
                _.forEach(room.find(FIND_MY_CONSTRUCTION_SITES), (structure) => {
                    matrix.set(structure.pos.x, structure.pos.y, 5);
                });
                
                _.forEach(Cache.portalsInRoom(room), (structure) => {
                    matrix.set(structure.pos.x, structure.pos.y, 5);
                });
                
                _.forEach(_.filter(room.find(FIND_HOSTILE_CREEPS), (c) => c.owner.username === "Source Keeper"), (creep) => {
                    for (let x = creep.pos.x - 3; x < creep.pos.x + 3; x++) {
                        for (let y = creep.pos.y - 3; y < creep.pos.y + 3; y++) {
                            matrix.set(x, y, 255);
                        }
                    }
                });

                costMatricies[roomName] = matrix;
            }
            
            return costMatricies[roomName];
        }
    };

require("screeps-profiler").registerObject(Cache, "Cache");
module.exports = Cache;
