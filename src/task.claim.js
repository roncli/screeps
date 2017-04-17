var Cache = require("cache"),
    Pathing = require("pathing");

class Claim {
    constructor() {
        this.type = "claim";
    }

    canAssign(creep) {
        var controller = creep.room.controller;

        if (creep.spawning || creep.memory.role !== "claimer" || !controller || controller.my || creep.getActiveBodyparts(CLAIM) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }

    run(creep) {
        if (!creep.room.controller || creep.room.controller.my || !creep.getActiveBodyparts(CLAIM) === 0) {
            delete creep.memory.currentTask;
            return;
        }

        // Move towards the controller and claim it.    
        Pathing.moveTo(creep, creep.room.controller, 1);
        creep.claimController(creep.room.controller);
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
    
    static fromObj(creep) {
        return new Claim();
    }

    static getTask(creep) {
        if (creep.room.controller) {
            return new Claim();
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Claim, "TaskClaim");
}
module.exports = Claim;
