var Cache = require("cache"),
    Pathing = require("pathing");

class CollectMinerals {
    constructor(id, resource, amount) {
        this.type = "collectMinerals";
        this.id = id;
        this.resource = resource;
        this.amount = amount;
        this.object = Game.getObjectById(id);
    }
    
    canAssign(creep) {
        var obj = this.object;
    
        if (this.amount < 0 || creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity) {
            return false;
        }

        if (obj.structureType === STRUCTURE_LAB && obj.mineralAmount === 0 || obj.store && _.sum(obj.store) === obj.store[RESOURCE_ENERGY]) {
            return false;
        }
        
        if (this.resource && this.amount) {
            if (obj.structureType === STRUCTURE_LAB && obj.mineralType !== this.resource && obj.mineralAmount < this.amount) {
                return false;
            }
    
            if (obj.structureType !== STRUCTURE_LAB && (obj.store[this.resource] || 0) < this.amount) {
                return false;
            }
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var obj = this.object,
            resource = this.resource,
            creepCarry = creep.carry,
            creepCarryCapacity = creep.carryCapacity,
            amount = this.amount,
            objStore, minerals;
    
        // If the amount is less than 0, or the creep is about to die, or if the object doesn't exist, complete.
        if (amount < 0 || creep.ticksToLive < 150 || !obj) {
            delete creep.memory.currentTask;
            return;
        }
    
        objStore = obj.store;
    
        // If we're full, complete task.
        if (_.sum(creep.carry) === creep.carryCapacity) {
            delete creep.memory.currentTask;
            return;
        }
    
        // Get the resource we're going to use.
        if (obj.structureType === STRUCTURE_LAB) {
            // Lab is empty, complete task.
            if (obj.mineralType === null) {
                delete creep.memory.currentTask;
                return;
            }
            minerals = [obj.mineralType];
        } else if (resource) {
            minerals = [resource];
        } else {
            minerals = _.filter(Object.keys(objStore), (m) => m !== RESOURCE_ENERGY && objStore[m] > 0);
        }
    
        // We're out of minerals, complete task.
        if (minerals.length === 0) {
            delete creep.memory.currentTask;
            return;
        }
    
        // Move to the object.
        Pathing.moveTo(creep, obj, 1);
    
        // Collect from the object.
        if (amount) {
            if (creep.withdraw(obj, minerals[0], Math.min(amount, creepCarryCapacity - _.sum(creepCarry))) === OK) {
                delete creep.memory.currentTask;
            }
            return;
        }
    
        if (creep.withdraw(obj, minerals[0]) === OK) {
            // Complete task.
            delete creep.memory.currentTask;
            return;
        }
    }
    
    toObj(creep) {
        if (this.object) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id,
                resource: this.resource,
                amount: this.amount
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new CollectMinerals(creep.memory.currentTask.id, creep.memory.currentTask.resource, creep.memory.currentTask.amount);
        } else {
            return;
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(CollectMinerals, "TaskCollectMinerals");
}
module.exports = CollectMinerals;
