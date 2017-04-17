var Cache = require("cache"),
    Pathing = require("pathing");

class Reserve {
    constructor(id) {
        this.type = "reserve";
        this.force = true;
    }
    
    canAssign(creep) {
        if (creep.spawning || creep.getActiveBodyparts(CLAIM) === 0) {
            return false;
        }
    
        if (!Game.rooms[creep.memory.home] || !Game.rooms[creep.memory.home].controller || Game.rooms[creep.memory.home].controller.my) {
            return false;
        }
    
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        // R.I.P. Pete Burns
        creep.say(["You", "spin", "me", "right", "round", "baby", "right", "round", "like a", "record", "baby", "right", "round", "round", "round", ""][Game.time % 16], true);
    
        // If no controller, or controller is mine, or no CLAIM parts, bail.
        if (!Game.rooms[creep.memory.home] || !Game.rooms[creep.memory.home].controller || Game.rooms[creep.memory.home].controller.my || creep.getActiveBodyparts(CLAIM) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        
        Pathing.moveTo(creep, Game.rooms[creep.memory.home].controller, 1);
        creep.reserveController(Game.rooms[creep.memory.home].controller);
    
        if (Memory.signs && Memory.signs[creep.room.name] && (!creep.room.controller.sign || creep.room.controller.sign.username !== "roncli")) {
            creep.signController(creep.room.controller, Memory.signs[creep.room.name]);
        }
    }
    
    toObj(creep) {
        creep.memory.currentTask = {
            type: this.type
        };
    }
    
    static fromObj(creep) {
        return new Reserve();
    }
    
    static getTask(creep) {
        if (creep.room.controller) {
            return new Reserve();
        }
    }
    
    static getRemoteTask(creep) {
        if (Game.rooms[creep.memory.home] && Game.rooms[creep.memory.home].controller) {
            return new Reserve();
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Reserve, "TaskReserve");
}
module.exports = Reserve;
