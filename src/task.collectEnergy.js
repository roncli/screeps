var Cache = require("cache"),
    Pathing = require("pathing");

class CollectEnergy {
    constructor(id) {
        this.type = "collectEnergy";
        this.id = id;
        this.object = Game.getObjectById(id);
    }
    
    canAssign(creep) {
        var obj = this.object,
            energy;
        
        if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity) {
            return false;
        }
    
        if (!obj) {
            return false;
        }
        
        energy = obj.energy || (obj.store && obj.store[RESOURCE_ENERGY]) || 0;
    
        if (energy === 0) {
            return false;
        }
    
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var obj = this.object,
            energy, resources;
    
        // If the creep is about to die or if the object doesn't exist, complete.
        if (creep.ticksToLive < 150 || !obj) {
            delete creep.memory.currentTask;
            return;
        }
    
        energy = obj.energy || (obj.store && obj.store[RESOURCE_ENERGY]) || 0;
    
        // If the creep is full on capacity or the energy is empty, complete.
        if (_.sum(creep.carry) === creep.carryCapacity || energy === 0) {
            delete creep.memory.currentTask;
            return;
        }
    
        // Move to the object and collect from it.
        Pathing.moveTo(creep, obj, 1);
    
        // If we are 1 square from the goal, check to see if there's a resource on it and pick it up.
        if (creep.pos.getRangeTo(obj) === 1) {
            if ((resources = _.filter(obj.pos.lookFor(LOOK_RESOURCES), (r) => r.amount > 50)).length > 0) {
                creep.pickup(resources[0]);
                return;
            }
        }
    
        if (creep.withdraw(obj, RESOURCE_ENERGY) === OK) {
            delete creep.memory.currentTask;
        }
    }
    
    toObj(creep) {
        if (this.object) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new CollectEnergy(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
    
    static getTasks(room) {
        var structures = _.filter(room.find(FIND_HOSTILE_STRUCTURES), (s) => (s.energy > 0 || (s.store && s.store[RESOURCE_ENERGY] > 0)) && s.structureType !== STRUCTURE_NUKER);
        
        if (structures.length > 0) {
            return _.map(structures, (s) => new CollectEnergy(s.id));
        }
    
        if (room.storage && room.storage.store[RESOURCE_ENERGY] > 0) {
            return [new CollectEnergy(room.storage.id)];
        }
    
        return _.map(_.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] >= 500).sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]), (c) => new CollectEnergy(c.id));
    }
    
    static getStorerTasks(room) {
        return _.map(_.filter(Cache.containersInRoom(room), (c) => c.store[RESOURCE_ENERGY] && c.store[RESOURCE_ENERGY] >= 500), (c) => new CollectEnergy(c.id));
    }
    
    static getCleanupTasks(structures) {
        return _.map(_.filter(structures, (s) => s.energy || (s.store && s.store[RESOURCE_ENERGY])).sort((a, b) => (a.energy || a.store[RESOURCE_ENERGY]) - (b.energy || b.store[RESOURCE_ENERGY])), (s) => new CollectEnergy(s.id));
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(CollectEnergy, "TaskCollectEnergy");
}
module.exports = CollectEnergy;
