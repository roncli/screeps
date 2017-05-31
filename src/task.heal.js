var Cache = require("cache"),
    Pathing = require("pathing");

class Heal {
    constructor(id) {
        this.type = "heal";
        this.id = id;
        this.ally = Game.getObjectById(id);
        this.unimportant = true;
    }
    
    canAssign(creep, tasks) {
        if (creep.spawning || creep.getActiveBodyparts(HEAL) === 0) {
            return false;
        }
    
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var ally = this.ally;
        
        // Attempt to heal self if needed.  This is overridden by any future heal.
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }
    
        // Ally is gone, complete task.
        if (!ally) {
            delete creep.memory.currentTask;
            return true;
        }
    
        // Move to ally.
        Pathing.moveTo(creep, ally);
    
        if (ally.hits !== ally.hitsMax && creep.id !== ally.id) {
            // Heal, or ranged heal if not in range.
            if (creep.pos.getRangeTo(ally) <= 1) {
                creep.heal(ally);
            } else if (creep.pos.getRangeTo(ally) <= 3) {
                creep.rangedHeal(ally);
            }
        }
    }
    
    toObj(creep) {
        if (this.ally) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.ally.id,
                unimportant: this.unimportant
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new Heal(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Heal, "TaskHeal");
}
module.exports = Heal;
