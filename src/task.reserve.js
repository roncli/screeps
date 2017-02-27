var Task = require("task"),
    Pathing = require("pathing"),
    Reserve = function(id) {
        "use strict";
        
        this.init(id);
    };
    
Reserve.prototype = Object.create(Task.prototype);
Reserve.prototype.constructor = Reserve;

Reserve.prototype.init = function(id) {
    "use strict";
    
    Task.call(this);

    this.type = "reserve";
    this.force = true;
};

Reserve.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || creep.getActiveBodyparts(CLAIM) === 0) {
        return false;
    }

    if (!Game.rooms[creep.memory.home] || !Game.rooms[creep.memory.home].controller || Game.rooms[creep.memory.home].controller.my) {
        return false;
    }

    Task.prototype.assign.call(this, creep);
    return true;
};

Reserve.prototype.run = function(creep) {
    "use strict";

    // R.I.P. Pete Burns
    creep.say(["You", "spin", "me", "right", "round", "baby", "right", "round", "like a", "record", "baby", "right", "round", "round", "round", ""][Game.time % 16], true);

    // If no controller, or controller is mine, or no CLAIM parts, bail.
    if (!Game.rooms[creep.memory.home] || !Game.rooms[creep.memory.home].controller || Game.rooms[creep.memory.home].controller.my || creep.getActiveBodyparts(CLAIM) === 0) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    Pathing.moveTo(creep, Game.rooms[creep.memory.home].controller, 1);
    creep.reserveController(Game.rooms[creep.memory.home].controller);

    if (Memory.signs && Memory.signs[creep.room.name] && (!creep.room.controller.sign || creep.room.controller.sign.username !== "roncli")) {
        creep.signController(creep.room.controller, Memory.signs[creep.room.name]);
    }
};

Reserve.prototype.toObj = function(creep) {
    "use strict";

    creep.memory.currentTask = {
        type: this.type
    };
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
};

Reserve.getRemoteTask = function(creep) {
    "use strict";

    if (Game.rooms[creep.memory.home] && Game.rooms[creep.memory.home].controller) {
        return new Reserve();
    }
};

require("screeps-profiler").registerObject(Reserve, "TaskReserve");
module.exports = Reserve;
