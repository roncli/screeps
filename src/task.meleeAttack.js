var Cache = require("cache"),
    Pathing = require("pathing");

class Melee {
    constructor(id) {
        this.type = "meleeAttack";
        this.id = id;
        this.enemy = Game.getObjectById(id);
    }
    
    canAssign(creep) {
        if (creep.spawning || creep.getActiveBodyparts(ATTACK) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        // If enemy is gone, we're done.
        if (!this.enemy) {
            creep.say("Get Rekt!", true);
            delete creep.memory.currentTask;
            return;
        }
    
        // If we're out of attack parts, we're done.    
        if (creep.getActiveBodyparts(ATTACK) === 0) {
            creep.say("Help!");
            delete creep.memory.currentTask;
            return;
        }

        // Move and attack.
        Pathing.moveTo(creep, this.enemy);
        if (creep.attack(this.enemy) === ERR_NOT_IN_RANGE) {
            // Heal self if possible available.
            if (creep.hits < creep.hitsMax && creep.getActiveBodyparts(HEAL) > 0) {
                creep.heal(creep);
            }
        }
    
        // Try ranged attack if possible.
        if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
            creep.rangedAttack(this.enemy);
        }
    }
    
    toObj(creep) {
        if (this.enemy) {
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
            return new Melee(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
    
    static getTasks(room) {
        return _.map(Cache.hostilesInRoom(room).sort((a, b) => a.hits - b.hits), (h) => new Melee(h.id));
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Melee, "TaskMeleeAttack");
}
module.exports = Melee;
