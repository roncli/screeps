var Cache = require("cache"),
    Pathing = require("pathing"),
    Claim = function(id) {
        "use strict";
        
        this.init(id);
    };
    
Claim.prototype.init = function() {
    "use strict";
    
    this.type = "claim";
};

Claim.prototype.canAssign = function(creep) {
    "use strict";

    var controller = creep.room.controller;

    if (creep.spawning || creep.memory.role !== "claimer" || !controller || controller.my || creep.getActiveBodyparts(CLAIM) === 0) {
        return false;
    }
    
    Cache.creepTasks[creep.name] = this;
    this.toObj(creep);
    return true;
};

Claim.prototype.run = function(creep) {
    "use strict";

    if (!creep.room.controller || creep.room.controller.my || !creep.getActiveBodyparts(CLAIM) === 0) {
        delete creep.memory.currentTask;
        return;
    }

    // Move towards the controller and claim it.    
    Pathing.moveTo(creep, creep.room.controller, 1);
    creep.claimController(creep.room.controller);
};

Claim.prototype.toObj = function(creep) {
    "use strict";

    if (creep.room.controller) {
        creep.memory.currentTask = {
            type: this.type
        };
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
};

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Claim, "TaskClaim");
}
module.exports = Claim;
