var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Reserve = function(id) {
        Task.call(this);

        this.type = "reserve";
    };
    
Reserve.prototype = Object.create(Task.prototype);
Reserve.prototype.constructor = Reserve;

Reserve.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || creep.getActiveBodyparts(CLAIM) === 0) {
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

    // R.I.P. Pete Burns
    creep.say(["You", "spin", "me", "right", "round", "baby", "right", "round", "like a", "record", "baby", "right", "round", "round", "round", ""][Game.time % 16], true);

    switch (creep.memory.role) {
        case "reserver":
            if (!creep.room.controller) {
                Task.prototype.complete.call(this, creep);
                return;
            }
            
            Pathing.moveTo(creep, creep.room.controller, 1);
            creep.reserveController(creep.room.controller);

            break;
        case "remoteReserver":
            if (!Game.rooms[creep.memory.home].controller) {
                Task.prototype.complete.call(this, creep);
                return;
            }
            
            Pathing.moveTo(creep, Game.rooms[creep.memory.home].controller, 1);
            creep.reserveController(Game.rooms[creep.memory.home].controller);

            break;
    }

    if (Memory.signs && Memory.signs[creep.room.name] && (!creep.room.controller.sign || creep.room.controller.sign.username !== "roncli")) {
        creep.signController(creep.room.controller, Memory.signs[creep.room.name])
    }
};

Reserve.prototype.canComplete = function(creep) {
    "use strict";
    if (creep.getActiveBodyparts(CLAIM) === 0) {
        Task.prototype.complete.call(this, creep);
        return true;
    }

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
