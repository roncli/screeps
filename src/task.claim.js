var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Claim = function(id) {
        Task.call(this);

        this.type = "claim";
    };
    
Claim.prototype = Object.create(Task.prototype);
Claim.prototype.constructor = Claim;

Claim.prototype.canAssign = function(creep) {
    "use strict";

    var controller = creep.room.controller;

    if (creep.spawning || creep.memory.role !== "claimer" || !controller || controller.my || creep.getActiveBodyparts(CLAIM) === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Claim.prototype.run = function(creep) {
    "use strict";

    if (!creep.room.controller) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Move towards the controller and claim it.    
    Pathing.moveTo(creep, creep.room.controller, 1);
    creep.claimController(creep.room.controller);
};

Claim.prototype.canComplete = function(creep) {
    "use strict";

    if (!creep.room.controller || creep.room.controller.my || !creep.getActiveBodyparts(CLAIM) === 0) {
        Task.prototype.complete.call(this, creep);
        return true;
    }

    return false;
};

Claim.prototype.toObj = function(creep) {
    "use strict";

    if (creep.room.controller) {
        creep.memory.currentTask = {
            type: this.type
        }
    } else {
        delete creep.memory.currentTask;
    }
};

Claim.fromObj = function(creep) {
    "use strict";

    return new Claim();
};

Claim.getTask = function(creep) {
    "use strict";

    if (creep.room.controller) {
        return new Claim();
    }
}

require("screeps-profiler").registerObject(Claim, "TaskClaim");
module.exports = Claim;
