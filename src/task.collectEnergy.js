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
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(CollectEnergy, "TaskCollectEnergy");
}
module.exports = CollectEnergy;
