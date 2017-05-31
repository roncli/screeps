var Cache = require("cache"),
    Pathing = require("pathing");

class FillEnergy {
    constructor(id) {
        this.type = "fillEnergy";
        this.id = id;
        this.object = Game.getObjectById(id);
    }
    
    canAssign(creep) {
        var minEnergy;
    
        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || (this.object.energyCapacity && this.object.energy === this.object.energyCapacity)) {
            return false;
        }
    
        if (this.object.structureType === STRUCTURE_EXTENSION) {
            switch (this.object.room.controller.level) {
                case 7:
                    minEnergy = 100;
                    break;
                case 8:
                    minEnergy = 200;
                    break;
                default:
                    minEnergy = 50;
                    break;
            }
            if (creep.carry[RESOURCE_ENERGY] < minEnergy) {
                return false;
            }
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var obj = this.object;
    
        // If the object is at capacity, we're done.
        if (!obj || (obj.energy || _.sum(obj.store)) === (obj.energyCapacity || obj.storeCapacity)) {
            delete creep.memory.currentTask;
            return;
        }
    
        // Object not found or we have no energy, complete task.
        if (!obj || !creep.carry[RESOURCE_ENERGY]) {
            delete creep.memory.currentTask;
            return;
        }
    
        // Move to the object and fill it.
        Pathing.moveTo(creep, obj, 1);
        if (creep.transfer(obj, RESOURCE_ENERGY) === OK) {
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
            return new FillEnergy(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(FillEnergy, "TaskFillEnergy");
}
module.exports = FillEnergy;
