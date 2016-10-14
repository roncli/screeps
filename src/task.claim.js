var Task = require("task"),
    Cache = require("cache"),
    Claim = function(id) {
        Task.call(this);

        this.type = "claim";
    };
    
Claim.prototype = Object.create(Task.prototype);
Claim.prototype.constructor = Claim;

Claim.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.memory.role !== "claimer" || !creep.room.controller || creep.room.controller.my) {
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
    
    if (creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, {reusePath: Math.floor(Math.random() * 2) + 1});
    }
};

Claim.prototype.canComplete = function(creep) {
    "use strict";

    if (!creep.room.controller || creep.room.controller.my) {
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
