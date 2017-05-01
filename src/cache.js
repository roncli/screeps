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
    resourcesInRoom = {},
    costMatricies = {};

class Cache {
    static reset() {
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
        resourcesInRoom = {};
        costMatricies = {};
        this.creepTasks = {};
        this.rooms = {};
        this.armies = {};
        this.spawning = {};
        this.minerals = {};

        this.log = {
            events: [],
            hostiles: [],
            creeps: [],
            spawns: [],
            structures: [],
            rooms: {},
            army: {}
        };
        
        this.credits = Game.market.credits;
        if (Memory.visualizations) {
            this.globalVisual = new RoomVisual();
            this.time = new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}).replace(",", "");
        }
    }

    static spawnsInRoom(room) {
        return spawnsInRoom[room.name] ? spawnsInRoom[room.name] : spawnsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_SPAWN);
    }

    static powerSpawnsInRoom(room) {
        return powerSpawnsInRoom[room.name] ? powerSpawnsInRoom[room.name] : powerSpawnsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_POWER_SPAWN);
    }

    static extensionsInRoom(room) {
        return extensionsInRoom[room.name] ? extensionsInRoom[room.name] : extensionsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_EXTENSION);
    }

    static towersInRoom(room) {
        return towersInRoom[room.name] ? towersInRoom[room.name] : towersInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_TOWER);
    }

    static labsInRoom(room) {
        return labsInRoom[room.name] ? labsInRoom[room.name] : labsInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_LAB);
    }

    static nukersInRoom(room) {
        return nukersInRoom[room.name] ? nukersInRoom[room.name] : nukersInRoom[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_NUKER);
    }

    static containersInRoom(room) {
        return containersInRoom[room.name] ? containersInRoom[room.name] : containersInRoom[room.name] = _.filter(room.find(FIND_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER);
    }

    static linksInRoom(room) {
        return linksInRoom[room.name] ? linksInRoom[room.name] : linksInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_LINK});
    }

    static repairableStructuresInRoom(room) {
        return repairableStructuresInRoom[room.name] ? repairableStructuresInRoom[room.name] : repairableStructuresInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => (s.my || s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) && s.hits});
    }

    static sortedRepairableStructuresInRoom(room) {
        return sortedRepairableStructuresInRoom[room.name] ? sortedRepairableStructuresInRoom[room.name] : sortedRepairableStructuresInRoom[room.name] = this.repairableStructuresInRoom(room).sort((a, b) => a.hits - b.hits);
    }

    static extractorsInRoom(room) {
        return extractorsInRoom[room.name] ? extractorsInRoom[room.name] : extractorsInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_EXTRACTOR});
    }

    static portalsInRoom(room) {
        return portalsInRoom[room.name] ? portalsInRoom[room.name] : portalsInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_PORTAL});
    }

    static hostilesInRoom(room) {
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
    }

    static sourceKeepersInRoom(room) {
        return sourceKeepersInRoom[room.name] ? sourceKeepersInRoom[room.name] : sourceKeepersInRoom[room.name] = room.find(FIND_HOSTILE_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_KEEPER_LAIR});
    }

    static powerBanksInRoom(room) {
        return powerBanksInRoom[room.name] ? powerBanksInRoom[room.name] : powerBanksInRoom[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_POWER_BANK});
    }
    
    static resourcesInRoom(room) {
        return resourcesInRoom[room.name] ? resourcesInRoom[room.name] : resourcesInRoom[room.name] = room.find(FIND_DROPPED_RESOURCES).sort((a, b) => b.amount - a.amount);
    }

    static getCostMatrix(room) {
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
            
            _.forEach(this.portalsInRoom(room), (structure) => {
                var pos = structure.pos;
                matrix.set(pos.x, pos.y, 5);
            });

            if (Memory.avoidSquares[roomName]) {
                _.forEach(Memory.avoidSquares[roomName], (square) => {
                    matrix.set(square.x, square.y, 255);
                });
            }
            
            costMatricies[roomName] = matrix;
        }
        
        return costMatricies[roomName];
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Cache, "Cache");
}
module.exports = Cache;
