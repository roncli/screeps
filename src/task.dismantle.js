var Cache = require("cache"),
    Pathing = require("pathing");

class Dismantle {
    constructor(id) {
        this.type = "dismantle";
        this.id = id;
        this.structure = Game.getObjectById(id);
        this.unimportant = true;
        this.force = true;
    }
    
    canAssign(creep) {
        if (creep.spawning || creep.carryCapacity > 0 && _.sum(creep.carry) === creep.carryCapacity || creep.spawning || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var structure = this.structure;
    
        // If we're at capacity, the structure is destroyed, or we have no WORK parts, we're done.
        if (creep.carryCapacity > 0 && _.sum(creep.carry) === creep.carryCapacity || !this.structure || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        
        // Move to the structure and dismantle it.
        Pathing.moveTo(creep, structure, 1);
        creep.dismantle(structure);
        
        // If the unit can destroy the structure, complete the task.
        if (Math.min(creep.getActiveBodyparts(WORK), creep.carry[RESOURCE_ENERGY]) * 50 >= structure.hits) {
            delete creep.memory.currentTask;
            return;
        }
    }
    
    toObj(creep) {
        if (this.structure) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.structure.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new Dismantle(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Dismantle, "TaskDismantle");
}
module.exports = Dismantle;
