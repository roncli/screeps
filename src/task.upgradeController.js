var Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities");

class Upgrade {
    constructor(room) {
        this.type = "upgradeController";
        this.room = room;
        this.controller = Game.rooms[room].controller;
        this.force = true;
    }
    
    canAssign(creep) {
        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.memory.role !== "upgrader" && _.sum(creep.carry) !== creep.carryCapacity && creep.ticksToLive >= 150 && this.controller.ticksToDowngrade >= 1000 || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        creep.say(["I've", "got to", "celebrate", "you baby", "I've got", "to praise", "GCL like", "I should!", ""][Game.time % 9], true);
    
        // Controller not found, or no energy, or no WORK parts, then complete task.
        if (!this.controller || !creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;
            return;
        }
        
        // If we are an upgrader, try to get energy from the closest link.
        if (creep.memory.role === "upgrader") {
            let links = Utilities.objectsClosestToObj(Cache.linksInRoom(creep.room), creep);
    
            if (links.length > 0 && links[0].energy > 0 && creep.pos.getRangeTo(links[0]) <= 1) {
                creep.withdraw(links[0], RESOURCE_ENERGY);
            }
        }
    
        // Move to the controller and upgrade it.
        Pathing.moveTo(creep, this.controller, Math.max(Math.min(creep.pos.getRangeTo(this.controller) - 1, 3), 1));
        creep.transfer(this.controller, RESOURCE_ENERGY);
    
        if (Memory.signs && Memory.signs[creep.room.name] && (!this.controller.sign || this.controller.sign.username !== "roncli")) {
            creep.signController(this.controller, Memory.signs[creep.room.name]);
        }
        
        // If we run out of energy, complete task.
        if (creep.carry[RESOURCE_ENERGY] <= creep.getActiveBodyparts(WORK)) {
            delete creep.memory.currentTask;
            return;
        }
    }
    
    toObj(creep) {
        creep.memory.currentTask = {
            type: this.type,
            room: this.room
        };
    }
    
    static fromObj(creep) {
        return new Upgrade(creep.memory.currentTask.room);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Upgrade, "TaskUpgradeController");
}
module.exports = Upgrade;
