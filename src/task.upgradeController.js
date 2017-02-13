var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities"),
    Upgrade = function(room) {
        "use strict";
        
        this.init(room);
    };
    
Upgrade.prototype = Object.create(Task.prototype);
Upgrade.prototype.constructor = Upgrade;

Upgrade.prototype.init = function(room) {
    "use strict";
    
    Task.call(this);

    this.type = "upgradeController";
    this.room = room;
    this.controller = Game.rooms[room].controller;
};

Upgrade.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || (creep.memory.role !== "upgrader" && _.sum(creep.carry) != creep.carryCapacity && creep.ticksToLive >= 150 && this.controller.ticksToDowngrade >= 1000) || creep.getActiveBodyparts(WORK) === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
};

Upgrade.prototype.run = function(creep) {
    "use strict";

    creep.say(["I've", "got to", "celebrate", "you baby", "I've got", "to praise", "GCL like", "I should!", ""][Game.time % 9], true);

    // Controller not found, or no energy, or no WORK parts, then complete task.
    if (!this.controller || !creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
        Task.prototype.complete.call(this, creep);
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
        Task.prototype.complete.call(this, creep);
        return;
    }
};

Upgrade.prototype.toObj = function(creep) {
    "use strict";

    creep.memory.currentTask = {
        type: this.type,
        room: this.room
    };
};

Upgrade.fromObj = function(creep) {
    "use strict";

    return new Upgrade(creep.memory.currentTask.room);
};

Upgrade.getCriticalTasks = function(room) {
    "use strict";
    
    var ttdLimit;
    
    if (room.controller && room.controller.my) {
        switch (room.controller.level) {
            case 1:
                ttdLimit = 10000;
                break;
            case 2:
                ttdLimit = 3500;
                break;
            case 3:
                ttdLimit = 5000;
                break;
            case 4:
                ttdLimit = 10000;
                break;
            case 5:
                ttdLimit = 20000;
                break;
            case 6:
                ttdLimit = 30000;
                break;
            case 7:
                ttdLimit = 50000;
                break;
            case 8:
                ttdLimit = 100000;
                break;
        }
    
        if (room.controller.ticksToDowngrade < ttdLimit) {
            return [new Upgrade(room.name)];
        }
    }

    return [];
};

Upgrade.getTasks = function(room) {
    "use strict";

    if (room.controller && room.controller.my) {
        return [new Upgrade(room.name)];
    }
};

require("screeps-profiler").registerObject(Upgrade, "TaskUpgradeController");
module.exports = Upgrade;
