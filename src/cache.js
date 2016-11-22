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
    flagsInRoom = {},
    hostilesInRoom = {},
    costMatricies = {},
    objects = {};

var Cache = {
    creepTasks: {},
    roomTypes: {},
    spawning: {},
    haulers: {},
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
        flagsInRoom = {};
        hostilesInRoom = {};
        costMatricies = {};
        objects = {};
        Cache.creepTasks = {};
        Cache.roomTypes = {};
        Cache.spawning = {};
        Cache.haulers = {};

        Cache.log = {
            events: [],
            hostiles: [],
            creeps: [],
            spawns: [],
            structures: [],
            rooms: {},
            army: {},
            clearConsole: "<script>angular.element(document.getElementsByClassName('fa fa-trash ng-scope')[0].parentNode).scope().Console.clear()</script>"
        }
    },

    // Returns all creeps of a certain in the current room.
    creepsInRoom: (type, room) => {
        "use strict";

        if (!creepsInRoom[room.name]) {
            creepsInRoom[room.name] = {};
        }

        if (!creepsInRoom[room.name].all) {
            creepsInRoom[room.name].all = _.filter(Game.creeps, (c) => c.memory.home === room.name);
        }

        return creepsInRoom[room.name][type] ? creepsInRoom[room.name][type] : (creepsInRoom[room.name][type] = _.filter(creepsInRoom[room.name].all, (c) => type === "all" || c.memory.role === type));
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

        return creepsInArmy[army][type] ? creepsInArmy[army][type] : (creepsInArmy[army][type] = _.filter(creepsInArmy[army].all, (c) => type === "all" || c.memory.role === type));
    },

    // Returns all spawns in the current room.    
    spawnsInRoom: (room) => {
        "use strict";

        return spawnsInRoom[room.name] ? spawnsInRoom[room.name] : (spawnsInRoom[room.name] = _.filter(Game.spawns, (s) => s.room.name === room.name));
    },
    
    // Returns all extentions in the current room.
    extensionsInRoom: (room) => {
        "use strict";

        return extensionsInRoom[room.name] ? extensionsInRoom[room.name] : (extensionsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.room.name === room.name && s instanceof StructureExtension));
    },

    // Returns all towers in the current room.
    towersInRoom: (room) => {
        "use strict";

        return towersInRoom[room.name] ? towersInRoom[room.name] : (towersInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.room.name === room.name && s instanceof StructureTower));
    },

    // Returns all labs in the current room.
    labsInRoom: (room) => {
        "use strict";

        return labsInRoom[room.name] ? labsInRoom[room.name] : (labsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.room.name === room.name && s instanceof StructureLab));
    },

    // Returns all containers in the current room.
    containersInRoom: (room) => {
        "use strict";

        return containersInRoom[room.name] ? containersInRoom[room.name] : (containersInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s instanceof StructureContainer}));
    },

    // Returns all links in the current room.
    linksInRoom: (room) => {
        "use strict";

        return linksInRoom[room.name] ? linksInRoom[room.name] : (linksInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s instanceof StructureLink}));
    },

    // Returns all repairable structures in the current room.
    repairableStructuresInRoom: (room) => {
        "use strict";

        return repairableStructuresInRoom[room.name] ? repairableStructuresInRoom[room.name] : (repairableStructuresInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => (s.my || s instanceof StructureWall || s instanceof StructureRoad || s instanceof StructureContainer)}));
    },

    // Returns all extractors in the current room.
    extractorsInRoom: (room) => {
        "use strict";

        return extractorsInRoom[room.name] ? extractorsInRoom[room.name] : (extractorsInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => (s instanceof StructureExtractor)}));
    },

    // Returns all flags in the current room.
    flagsInRoom: (room) => {
        "use strict";

        return flagsInRoom[room.name] ? flagsInRoom[room.name] : (flagsInRoom[room.name] = _.filter(Game.flags, (f) => f.room.name === room.name));
    },

    // Return all hostile creeps in the current room.
    hostilesInRoom: (room) => {
        "use strict";

        return hostilesInRoom[room.name] ? hostilesInRoom[room.name] : (hostilesInRoom[room.name] = _.filter(room.find(FIND_HOSTILE_CREEPS), (c) => !c.owner || Memory.allies.indexOf(c.owner.username) === -1));
    },

    // Get the cost matrix for a room.
    getCostMatrix: (room) => {
        "use strict";

        if (!costMatricies[room.name]) {
            costMatricies[room.name] = new PathFinder.CostMatrix();

            _.forEach(room.find(FIND_STRUCTURES), (structure) => {
                if (structure instanceof StructureRoad) {
                    costMatricies[room.name].set(structure.pos.x, structure.pos.y, 1);
                } else if (structure.structureType !== STRUCTURE_CONTAINER && (structure.structureType !== STRUCTURE_RAMPART || !structure.my)) {
                    costMatricies[room.name].set(structure.pos.x, structure.pos.y, 255);
                }
            });

            _.forEach(room.find(FIND_CONSTRUCTION_SITES), (structure) => {
                costMatricies[room.name].set(structure.pos.x, structure.pos.y, 5);
            });
        }
        
        return costMatricies[room.name];
    },

    // Get object by ID.
    getObjectById: (id) => {
        "use strict";

        return objects[id] ? objects[id] : (objects[id] = Game.getObjectById(id));
    }
};

require("screeps-profiler").registerObject(Cache, "Cache");
module.exports = Cache;
