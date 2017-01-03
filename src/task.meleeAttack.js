var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Melee = function(id) {
        "use strict";
        
        this.init(id);
    };
    
Melee.prototype = Object.create(Task.prototype);
Melee.prototype.constructor = Melee;

Melee.prototype.init = function(id) {
    "use strict";
    
    Task.call(this);

    this.type = "meleeAttack";
    this.id = id;
    this.enemy = Game.getObjectById(id);
};

Melee.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || creep.getActiveBodyparts(ATTACK) === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
};

Melee.prototype.run = function(creep) {
    "use strict";

    // If enemy is gone, we're done.
    if (!this.enemy) {
        creep.say("Get Rekt!", true);
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    // Move and attack.
    Pathing.moveTo(creep, this.enemy);
    if (creep.attack(this.enemy) === ERR_NOT_IN_RANGE) {
        // Heal self if possible available.
        if (creep.getActiveBodyparts(HEAL) > 0 && creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }
    }

    // Try ranged attack if possible.
    if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
        creep.rangedAttack(this.enemy);
    }
};

Melee.prototype.canComplete = function(creep) {
    "use strict";

    if (creep.getActiveBodyparts(ATTACK) === 0) {
        creep.say("Help!");
        Task.prototype.complete.call(this, creep);
        return true;
    }

    if (!this.enemy) {
        creep.say("Get Rekt!", true);
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Melee.prototype.toObj = function(creep) {
    "use strict";

    if (this.enemy) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.id
        }
    } else {
        delete creep.memory.currentTask;
    }
};

Melee.fromObj = function(creep) {
    "use strict";

    return new Melee(creep.memory.currentTask.id);
};

Melee.getTasks = function(room) {
    "use strict";

    return _.map(_.sortBy(Cache.hostilesInRoom(room), (h) => h.hits), (h) => new Melee(h.id));
};

Melee.getDefenderTask = function(creep) {
    "use strict";

    return _.map(_.sortBy(Cache.hostilesInRoom(creep.room), (h) => h.hits), (h) => new Melee(h.id))[0];
}

require("screeps-profiler").registerObject(Melee, "TaskMeleeAttack");
module.exports = Melee;
