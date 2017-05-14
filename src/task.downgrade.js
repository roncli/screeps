var Cache = require("cache"),
    Pathing = require("pathing");

class Downgrade {
    constructor() {
        this.type = "downgrade";
    }

    canAssign(creep) {
        var controller = creep.room.controller;

        if (creep.spawning || creep.memory.role !== "downgrader" || !controller || controller.level === 0 || creep.getActiveBodyparts(CLAIM) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }

    run(creep) {
        if (!creep.room.controller || creep.room.controller.level === 0 || !creep.getActiveBodyparts(CLAIM) === 0) {
            delete creep.memory.currentTask;
            return;
        }

        // Move towards the controller and downgrade it.    
        Pathing.moveTo(creep, creep.room.controller, 1);
        creep.attackController(creep.room.controller);
    }

    toObj(creep) {
        if (creep.room.controller) {
            creep.memory.currentTask = {
                type: this.type
            };
        } else {
            delete creep.memory.currentTask;
        }
    }

    static fromObj() {
        return new Downgrade();
    }

    static getTask(creep) {
        if (creep.room.controller) {
            return new Downgrade();
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Downgrade, "TaskDowngrade");
}
module.exports = Downgrade;
