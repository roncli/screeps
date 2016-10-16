var creeps = {},
    creepsInRoom = {},
    spawnsInRoom = {},
    extensionsInRoom = {},
    towersInRoom = {},
    containersInRoom = {},
    linksInRoom = {},
    repairableStructuresInRoom = {},
    constructionSitesInRoom = {},
    energySourcesInRoom = {},
    mineralsInRoom = {},
    resourcesInRoom = {},
    extractorsInRoom = {},
    flagsInRoom = {},
    hostilesInRoom = {},
    objects = {};

var Cache = {
    creepTasks: {},
    roomTypes: {},
    spawning: {},

    // Reset the cache.
    reset: () => {
        "use strict";

        creeps = {};
        creepsInRoom = {};
        spawnsInRoom = {};
        extensionsInRoom = {};
        towersInRoom = {};
        containersInRoom = {};
        linksInRoom = {};
        repairableStructuresInRoom = {};
        constructionSitesInRoom = {};
        energySourcesInRoom = {};
        mineralsInRoom = {};
        resourcesInRoom = {};
        extractorsInRoom = {};
        flagsInRoom = {};
        hostilesInRoom = {};
        objects = {};
        Cache.creepTasks = {};
        Cache.roomTypes = {};
        Cache.spawning = {};
    },

    // Returns all creeps of a certain type.
    creeps: (type) => {
        "use strict";

        return creeps[type] ? creeps[type] : (creeps[type] = _.filter(Game.creeps, (c) => type === "all" || c.memory.role === type));
    },
    
    // Returns all creeps of a certain in the current room.
    creepsInRoom: (type, room) => {
        "use strict";

        if (!creepsInRoom[room.name]) {
            creepsInRoom[room.name] = {};
        }
        return creepsInRoom[room.name][type] ? creepsInRoom[room.name][type] : (creepsInRoom[room.name][type] = _.filter(Cache.creeps(type), (c) => c.room.name === room.name));
    },

    // Returns all spawns in the current room.    
    spawnsInRoom: (room) => {
        "use strict";

        return spawnsInRoom[room.name] ? spawnsInRoom[room.name] : (spawnsInRoom[room.name] = _.filter(Game.spawns, (s) => s.room.name === room.name));
    },
    
    // Returns all extentions in the current room.
    extensionsInRoom: (room) => {
        "use strict";

        return extensionsInRoom[room.name] ? extensionsInRoom[room.name] : (extensionsInRoom[room.name] = _.filter(Game.structures, (s) => s.room.name === room.name && s.structureType === STRUCTURE_EXTENSION));
    },

    // Returns all towers in the current room.
    towersInRoom: (room) => {
        "use strict";

        return towersInRoom[room.name] ? towersInRoom[room.name] : (towersInRoom[room.name] = _.filter(Game.structures, (s) => s.room.name === room.name && s.structureType === STRUCTURE_TOWER));
    },

    // Returns all containers in the current room.
    containersInRoom: (room) => {
        "use strict";

        return containersInRoom[room.name] ? containersInRoom[room.name] : (containersInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_CONTAINER}));
    },

    // Returns all links in the current room.
    linksInRoom: (room) => {
        "use strict";

        return linksInRoom[room.name] ? linksInRoom[room.name] : (linksInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_LINK}));
    },

    // Returns all repairable structures in the current room.
    repairableStructuresInRoom: (room) => {
        "use strict";

        return repairableStructuresInRoom[room.name] ? repairableStructuresInRoom[room.name] : (repairableStructuresInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => (s.my || [STRUCTURE_WALL, STRUCTURE_ROAD, STRUCTURE_CONTAINER].indexOf(s.structureType) !== -1)}));
    },

    // Return all construction sites in the current room.
    constructionSitesInRoom: (room) => {
        "use strict";

        return constructionSitesInRoom[room.name] ? constructionSitesInRoom[room.name] : (constructionSitesInRoom[room.name] = room.find(FIND_MY_CONSTRUCTION_SITES));
    },

    // Returns all energy sources in the current room.
    energySourcesInRoom: (room) => {
        "use strict";

        return energySourcesInRoom[room.name] ? energySourcesInRoom[room.name] : (energySourcesInRoom[room.name] = room.find(FIND_SOURCES));
    },

    // Returns all minerals in the current room.
    mineralsInRoom: (room) => {
        "use strict";

        return mineralsInRoom[room.name] ? mineralsInRoom[room.name] : (mineralsInRoom[room.name] = room.find(FIND_MINERALS));
    },

    // Returns all resources in the current room.
    resourcesInRoom: (room) => {
        "use strict";

        return resourcesInRoom[room.name] ? resourcesInRoom[room.name] : (resourcesInRoom[room.name] = room.find(FIND_DROPPED_RESOURCES));
    },

    // Returns all extractors in the current room.
    extractorsInRoom: (room) => {
        "use strict";

        return extractorsInRoom[room.name] ? extractorsInRoom[room.name] : (extractorsInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => (s.structureType === STRUCTURE_EXTRACTOR)}));
    },

    // Returns all flags in the current room.
    flagsInRoom: (room) => {
        "use strict";

        return flagsInRoom[room.name] ? flagsInRoom[room.name] : (flagsInRoom[room.name] = _.filter(Game.flags, (f) => f.room.name === room.name));
    },

    // Return all hostile creeps in the current room.
    hostilesInRoom: (room) => {
        "use strict";

        return hostilesInRoom[room.name] ? hostilesInRoom[room.name] : (hostilesInRoom[room.name] = room.find(FIND_HOSTILE_CREEPS));
    },

    // Get object by ID.
    getObjectById: (id) => {
        "use strict";

        return objects[id] ? objects[id] : (objects[id] = Game.getObjectById(id));
    }
};

require("screeps-profiler").registerObject(Cache, "Cache");
module.exports = Cache;
