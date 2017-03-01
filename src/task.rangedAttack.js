var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Ranged = function(id) {
        "use strict";
        
        this.init(id);
    };
    
Ranged.prototype = Object.create(Task.prototype);
Ranged.prototype.constructor = Ranged;

Ranged.prototype.init = function(id) {
    "use strict";
    
    Task.call(this);

    this.type = "rangedAttack";
    this.id = id;
    this.enemy = Game.getObjectById(id);
};

Ranged.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || creep.getActiveBodyparts(RANGED_ATTACK) === 0) {
        return false;
    }

    Task.prototype.assign.call(this, creep);
    return true;
};

Ranged.prototype.run = function(creep) {
    "use strict";

    // If enemy is gone, we're done.
    if (!this.enemy) {
        creep.say("Get Rekt!", true);
        delete creep.memory.currentTask;
        return;
    }

    // If we're out of ranged parts, we're done.
    if (creep.getActiveBodyparts(RANGED_ATTACK) === 0) {
        creep.say("Help!");
        delete creep.memory.currentTask;
        return;
    }

    // If this has attack body parts, use different logic.
    if (creep.getActiveBodyparts(ATTACK) > 0) {
        // Move and attack.
        Pathing.moveTo(creep, this.enemy);
        if (creep.attack(this.enemy) === ERR_NOT_IN_RANGE) {
            // Heal self if possible available.
            if (creep.hits < creep.hitsMax && creep.getActiveBodyparts(HEAL) > 0) {
                creep.heal(creep);
            }
        }

        // Try ranged attack if possible.
        if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
            creep.rangedAttack(this.enemy);
        }
    } else {
        Pathing.moveTo(creep, this.enemy, 3);
        
        creep.rangedAttack(this.enemy);

        // Heal self if possible available.
        if (creep.hits < creep.hitsMax && creep.getActiveBodyparts(HEAL) > 0) {
            creep.heal(creep);
        }
    } 
};

Ranged.prototype.toObj = function(creep) {
    "use strict";

    if (this.enemy) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.id
        };
    } else {
        delete creep.memory.currentTask;
    }
};

Ranged.fromObj = function(creep) {
    "use strict";

    return new Ranged(creep.memory.currentTask.id);
};

Ranged.getTasks = function(room) {
    "use strict";

    return _.map(Cache.hostilesInRoom(room).sort((a, b) => a.hits - b.hits), (h) => new Ranged(h.id));
};

Ranged.getDefenderTask = function(creep) {
    "use strict";

    return _.map(Cache.hostilesInRoom(creep.room).sort((a, b) => a.hits - b.hits), (h) => new Ranged(h.id))[0];
};

require("screeps-profiler").registerObject(Ranged, "TaskRangedAttack");
module.exports = Ranged;
