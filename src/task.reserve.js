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

    if (creep.getActiveBodyparts(CLAIM) === 0) {
        return false;
    }

    switch (creep.memory.role) {
        case "reserver":
            if (!creep.room.controller || creep.room.controller.my) {
                return false;
            }
            break;
        case "remoteReserver":
            if (!Game.rooms[creep.memory.home].controller || Game.rooms[creep.memory.home].controller.my) {
                return false;
            }
            break;
        default:
            return false;
    }

    Task.prototype.assign.call(this, creep);
    return true;
}

Reserve.prototype.run = function(creep) {
    "use strict";

    switch (creep.memory.role) {
        case "reserver":
            if (!creep.room.controller) {
                Task.prototype.complete.call(this, creep);
                return;
            }
            
            if (creep.reserveController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {reusePath: Math.floor(Math.random() * 2) + 4});
            }

            break;
        case "remoteReserver":
            if (!Game.rooms[creep.memory.home].controller) {
                Task.prototype.complete.call(this, creep);
                return;
            }
            
            if (creep.reserveController(Game.rooms[creep.memory.home].controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(Game.rooms[creep.memory.home].controller, {reusePath: Math.floor(Math.random() * 2) + 4});
            }

            break;
    }
};

Reserve.prototype.canComplete = function(creep) {
    "use strict";
    switch (creep.memory.role) {
        case "reserver":
            if (!creep.room.controller || creep.room.controller.my) {
                Task.prototype.complete.call(this, creep);
                return true;
            }
            break;
        case "remoteReserver":
            if (!Game.rooms[creep.memory.home].controller || Game.rooms[creep.memory.home].controller.my) {
                Task.prototype.complete.call(this, creep);
                return true;
            }
            break;
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

Reserve.getRemoteTask = function(creep) {
    "use strict";

    if (Game.rooms[creep.memory.home].controller) {
        return new Reserve();
    }
}

require("screeps-profiler").registerObject(Reserve, "TaskReserve");
module.exports = Reserve;
