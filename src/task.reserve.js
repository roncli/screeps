var Task = require("task"),
    Cache = require("cache"),
    Reserve = function(id) {
        Task.call(this);

        this.type = "reserve";
    };
    
Reserve.prototype = Object.create(Task.prototype);
Reserve.prototype.constructor = Reserve;

Reserve.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.memory.role !== "reserver" || !creep.room.controller || creep.room.controller.my || creep.getActiveBodyparts(CLAIM) === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Reserve.prototype.run = function(creep) {
    "use strict";

    if (!creep.room.controller) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    if (creep.reserveController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, {reusePath: Math.floor(Math.random() * 2) + 1});
    }
};

Reserve.prototype.canComplete = function(creep) {
    "use strict";

    if (!creep.room.controller || creep.room.controller.my) {
        Task.prototype.complete.call(this, creep);
        return true;
    }

    return false;
};

Reserve.prototype.toObj = function(creep) {
    "use strict";

    if (creep.room.controller) {
        creep.memory.currentTask = {
            type: this.type
        }
    } else {
        delete creep.memory.currentTask;
    }
};

Reserve.fromObj = function(creep) {
    "use strict";

    return new Reserve();
};

Reserve.getTask = function(creep) {
    "use strict";

    if (creep.room.controller) {
        return new Reserve();
    }
}

require("screeps-profiler").registerObject(Reserve, "TaskReserve");
module.exports = Reserve;
