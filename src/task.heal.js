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
        // Attempt to heal self if needed.  This is overridden by any future heal.
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }
    
        // Ally is gone, complete task.
        if (!this.ally) {
            delete creep.memory.currentTask;
            return true;
        }
    
        // Move to ally.
        Pathing.moveTo(creep, this.ally);
    
        if (this.ally.hits !== this.ally.hitsMax && creep.id !== this.ally.id) {
            // Heal, or ranged heal if not in range.
            if (creep.pos.getRangeTo(this.ally) <= 1) {
                creep.heal(this.ally);
            } else if (creep.pos.getRangeTo(this.ally) <= 3) {
                creep.rangedHeal(this.ally);
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
    
    static getTasks(room) {
        return _.map(_.filter(room.find(FIND_MY_CREEPS), (c) => c.hits < c.hitsMax).sort((a, b) => a.hits - b.hits), (c) => new Heal(c.id));
    }
    
    static getDefenderTask(creep) {
        return _.map(_.filter(creep.room.find(FIND_MY_CREEPS), (c) => c.hits < c.hitsMax && c.id !== creep.id).sort((a, b) => a.hits - b.hits), (c) => new Heal(c.id))[0];
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Heal, "TaskHeal");
}
module.exports = Heal;
