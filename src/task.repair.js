var Cache = require("cache"),
    Pathing = require("pathing");

class Repair {
    constructor(id) {
        this.type = "repair";
        this.id = id;
        this.structure = Game.getObjectById(id);
        this.force = true;
    }
    
    canAssign(creep) {
        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.carry[RESOURCE_ENERGY] === 0 || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }
    
        // Do not repair structures over 1000000 if you are a worker in the home room when the RCL isn't 8 and you don't have the appropriate boost.
        if (this.structure.hits >= 1000000 && creep.memory.role === "worker" && creep.room.name === creep.memory.home && creep.room.controller.level < 8 && !_.find(creep.body, (b) => b.type === WORK && [RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_HYDRIDE].indexOf(b.boost) !== -1)) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var structure = this.structure;
    
        // Check for destroyed structure, out of energy, or no WORK parts.
        if (!creep.carry[RESOURCE_ENERGY] || !structure || structure.hits === structure.hitsMax || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        
        // Move to the structure and repair it.
        Pathing.moveTo(creep, structure, Math.max(Math.min(creep.pos.getRangeTo(structure) - 1, 3), 1));
        if (creep.repair(structure) === OK) {
            // If we can repair the structure completely, then complete the task.
            if (Math.min(creep.getActiveBodyparts(WORK), creep.carry[RESOURCE_ENERGY]) * 100 >= structure.hitsMax - structure.hits) {
                delete creep.memory.currentTask;
                return;
            }
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
            return new Repair(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Repair, "TaskRepair");
}
module.exports = Repair;
