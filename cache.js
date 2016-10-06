var creeps = {},
    creepsInRoom = {},
    spawnsInRoom = {},
    energySourcesInRoom = {};

var cache = {
    creeps: (type) => {
        return creeps[type] ? creeps[type] : (creeps[type] = _.filter(Game.creeps, (c) => c.memory.role === "worker"));
    },
    
    creepsInRoom: (type, room) => {
        if (!creepsInRoom[room.name]) {
            creepsInRoom[room.name] = {};
        }
        return creepsInRoom[room.name][type] ? creepsInRoom[room.name][type] : (creepsInRoom[room.name][type] = _.filter(cache.creeps(type), (c) => c.room.name === room.name));
    },
    
    spawnsInRoom: (room) => {
        return spawnsInRoom[room.name] ? spawnsInRoom[room.name] : (spawnsInRoom[room.name] = _.filter(Game.spawns, (s) => s.room.name === room.name));
    },
    
    energySourcesInRoom: (room) => {
        return energySourcesInRoom[room.name] ? energySourcesInRoom[room.name] : energySourcesInRoom[room.name] = room.find(FIND_SOURCES);
    }
};

module.exports = cache;
