var Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities");

class FillMinerals {
    constructor(id, resources) {
        this.type = "fillMinerals";
        this.id = id;
        this.resources = resources;
        this.object = Game.getObjectById(id);
    }
    
    canAssign(creep) {
        // Can't assign if the creep is spawning.
        if (creep.spawning) {
            return false;
        }
    
        // Can't assign if the creep isn't carrying minerals at all.
        if (_.sum(creep.carry) === creep.carry[RESOURCE_ENERGY]) {
            return false;
        }
    
        // Can't assign if the creep isn't carrying any of the requested resources.
        if (this.resources && _.intersection(Object.keys(this.resources), _.filter(Object.keys(creep.carry), (c) => c !== RESOURCE_ENERGY && creep.carry[c])).length === 0) {
            return false;
        }
    
        // Can't assign if the target structure is a nuker and it is full of ghodium.
        if (this.object.structureType === STRUCTURE_NUKER && this.object.ghodium === this.object.ghodiumCapacity) {
            return false;
        }
    
        // Can't assign if the target structure is a power spawn and it is full of power.
        if (this.object.structureType === STRUCTURE_POWER_SPAWN && this.object.power === this.object.powerCapacity) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var obj = this.object,
            minerals;
    
        // Object not found, complete task.
        if (!obj) {
            delete creep.memory.currentTask;
            return;
        }
    
        // The container is full, complete.
        if (obj.storeCapacity && _.filter(Object.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0).length === 0 || (_.sum(obj.store) || 0) === obj.storeCapacity) {
            delete creep.memory.currentTask;
            return true;
        }
    
        if (!this.resources) {
            // Get the resource we're going to use.
            minerals = _.filter(Object.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0);
    
            // We're out of minerals, complete task.
            if (minerals.length === 0) {
                delete creep.memory.currentTask;
                return;
            }
    
            // Move to the object and fill it.
            Pathing.moveTo(creep, obj, 1);
            if (creep.transfer(obj, minerals[0]) === OK) {
                // If we are out of minerals, complete task.
                if (_.filter(Object.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0).length === 0) {
                    delete creep.memory.currentTask;
                }
            }
        } else {
            // Get the resource we're going to use.
            minerals = _.intersection(Object.keys(this.resources), _.filter(Object.keys(creep.carry), (c) => creep.carry[c])).sort((a, b) => {
                var ra = this.resources[a],
                    rb = this.resources[b];
                if (ra === rb) {
                    return 0;
                }
                if (ra === null) {
                    return 1;
                }
                if (rb === null) {
                    return -1;
                }
                return ra - rb;
            });
    
            // We're out of minerals, complete task.
            if (minerals.length === 0) {
                delete creep.memory.currentTask;
                return;
            }
    
            // Move to the object and fill it.
            Pathing.moveTo(creep, obj, 1);
            if (creep.transfer(obj, minerals[0], this.resources[minerals[0]] !== null ? Math.min(this.resources[minerals[0]], creep.carry[minerals[0]]) : undefined) === OK) {
                // If we have no minerals left for this container, we're done.
                if (minerals.length === 1) {
                    delete creep.memory.currentTask;
                }
            }
        }
    }
    
    toObj(creep) {
        if (this.object) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id,
                resources: this.resources
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new FillMinerals(creep.memory.currentTask.id, creep.memory.currentTask.resources);
        } else {
            return;
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(FillMinerals, "TaskFillMinerals");
}
module.exports = FillMinerals;
