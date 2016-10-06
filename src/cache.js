var creeps = {},
    creepsInRoom = {},
    spawnsInRoom = {},
    extensionsInRoom = {},
    towersInRoom = {},
    repairableStructuresInRoom = {},
    constructionSitesInRoom = {},
    energySourcesInRoom = {},
    flagsInRoom = {},
    hostilesInRoom = {};

var cache = {
    // Reset the cache.
    reset: () => {
        creeps = {};
        creepsInRoom = {};
        spawnsInRoom = {};
        extensionsInRoom = {};
        towersInRoom = {};
        repairableStructuresInRoom = {};
        constructionSitesInRoom = {};
        energySourcesInRoom = {};
        flagsInRoom = {};
        hostilesInRoom = {};
    },

    // Returns all creeps of a certain type.
    creeps: (type) => {
        return creeps[type] ? creeps[type] : (creeps[type] = _.filter(Game.creeps, (c) => type === "all" || c.memory.role === type));
    },
    
    // Returns all creeps of a certain in the current room.
    creepsInRoom: (type, room) => {
        if (!creepsInRoom[room.name]) {
            creepsInRoom[room.name] = {};
        }
        return creepsInRoom[room.name][type] ? creepsInRoom[room.name][type] : (creepsInRoom[room.name][type] = _.filter(cache.creeps(type), (c) => c.room.name === room.name));
    },

    // Returns all spawns in the current room.    
    spawnsInRoom: (room) => {
        return spawnsInRoom[room.name] ? spawnsInRoom[room.name] : (spawnsInRoom[room.name] = _.filter(Game.spawns, (s) => s.room.name === room.name));
    },
    
    // Returns all extentions in the current room.
    extensionsInRoom: (room) => {
        return extensionsInRoom[room.name] ? extensionsInRoom[room.name] : (extensionsInRoom[room.name] = _.filter(Game.structures, (s) => s.room.name === room.name && s.structureType === STRUCTURE_EXTENSION));
    },

    // Returns all towers in the current room.
    towersInRoom: (room) => {
        return towersInRoom[room.name] ? towersInRoom[room.name] : (towersInRoom[room.name] = _.filter(Game.structures, (s) => s.room.name === room.name && s.structureType === STRUCTURE_TOWER));
    },

    // Returns all repairable structures in the current room.
    repairableStructuresInRoom: (room) => {
        return repairableStructuresInRoom[room.name] ? repairableStructuresInRoom[room.name] : (repairableStructuresInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => (s.my || [STRUCTURE_WALL, STRUCTURE_ROAD].indexOf(s.structureType) !== -1)}));
    },

    // Return all construction sites in the current room.
    constructionSitesInRoom: (room) => {
        return constructionSitesInRoom[room.name] ? constructionSitesInRoom[room.name] : (constructionSitesInRoom[room.name] = room.find(FIND_MY_CONSTRUCTION_SITES));
    },

    // Returns all energy sources in the current room.
    energySourcesInRoom: (room) => {
        return energySourcesInRoom[room.name] ? energySourcesInRoom[room.name] : (energySourcesInRoom[room.name] = room.find(FIND_SOURCES));
    },

    // Returns all flags in the current room.
    flagsInRoom: (room) => {
        return flagsInRoom[room.name] ? flagsInRoom[room.name] : (flagsInRoom[room.name] = _.filter(Game.flags, (f) => f.room.name === room.name));
    },

    // Return all hostile creeps in the current room.
    hostilesInRoom: (room) => {
        return hostilesInRoom[room.name] ? hostilesInRoom[room.name] : (hostilesInRoom[room.name] = room.find(FIND_HOSTILE_CREEPS));
    }
};

module.exports = cache;
