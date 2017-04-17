var Cache = require("cache"),
    Pathing = require("pathing");

class Attack {
    constructor() {
        this.type = "attack";
    }

    canAssign(creep) {
        var controller = creep.room.controller;

        if (creep.spawning || creep.memory.role !== "converter" || !controller || controller.level === 0 || creep.getActiveBodyparts(CLAIM) === 0) {
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

        // Move towards the controller and attack it.    
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

    static fromObj(creep) {
        return new Attack();
    }

    static getTask(creep) {
        if (creep.room.controller) {
            return new Attack();
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Attack, "TaskAttack");
}
module.exports = Attack;
