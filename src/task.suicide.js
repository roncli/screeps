var Cache = require("cache");

class Suicide {
    constructor() {
        this.type = "suicide";
        this.force = true;
    }
    
    canAssign(creep) {
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        creep.suicide();
    }
    
    toObj(creep) {
        creep.memory.currentTask = {
            type: this.type
        };
    }
    
    static fromObj() {
        return new Suicide();
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Suicide, "TaskSuicide");
}
module.exports = Suicide;
