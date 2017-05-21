var Cache = require("cache"),
    Pathing = require("pathing");

class Claim {
    constructor(controllerId, x, y, roomName) {
        this.controller = Game.getObjectById(controllerId);
        if (this.controller) {
            let pos = this.controller.pos;

            this.x = pos.x;
            this.y = pos.y;
            this.roomName = pos.roomName;
        } else {
            this.x = x;
            this.y = y;
            this.roomName = roomName;
        }
        this.type = "claim";
    }

    canAssign(creep) {
        var controller = this.controller;

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
        Pathing.moveTo(creep, new RoomPosition(this.x, this.y, this.roomName), 1);
        creep.claimController(creep.room.controller);
    }

    toObj(creep) {
        creep.memory.currentTask = {
            controllerId: this.controller.id,
            x: this.x,
            y: this.y,
            roomName: this.roomName,
            type: this.type
        };
    }
    
    static fromObj(creep) {
        var task = creep.memory.currentTask;

        return new Claim(task.controllerId, task.x, task.y, task.roomName);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Claim, "TaskClaim");
}
module.exports = Claim;
