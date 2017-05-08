var Cache = require("cache"),
    Pathing = require("pathing");

class Harvest {
    constructor(failIn, source) {
        this.type = "harvest";
        this.failIn = failIn || 10;
        this.source = source;
    }
    
    canAssign(creep) {
        var source = Game.getObjectById(creep.memory.homeSource);
    
        if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || !source || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }
    
        if (source.energy === 0) {
            source = creep.room.find(FIND_SOURCES_ACTIVE)[0];
            if (!source) {
                return false;
            }
        }
    
        this.source = source.id;
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var source = Game.getObjectById(this.source || creep.memory.homeSource);
        
        // No sources found or the source is drained, or creep is about to die or out of WORK parts, complete task.
        if (creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || !source || source.energy === 0 || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        
        // Move to the source and harvest it.
        Pathing.moveTo(creep, source, 1);
        if (creep.harvest(source) !== OK) {
            this.failIn--;
            if (this.failIn === 0) {
                delete creep.memory.currentTask;
            }
        }
    }
    
    toObj(creep) {
        creep.memory.currentTask = {
            type: this.type,
            failIn: this.failIn,
            source: this.source
        };
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.source)) {
            return new Harvest(creep.memory.currentTask.failIn, creep.memory.currentTask.source);
        } else {
            return;
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Harvest, "TaskHarvest");
}
module.exports = Harvest;
