var Task = require("task"),
    Cache = require("cache"),
    Pathing = require("pathing"),
    Ranged = function(id) {
        Task.call(this);

        this.type = "rangedAttack";
        this.id = id;
        this.enemy = Cache.getObjectById(id);
    };
    
Ranged.prototype = Object.create(Task.prototype);
Ranged.prototype.constructor = Ranged;

Ranged.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || creep.getActiveBodyparts(RANGED_ATTACK) === 0) {
        return false;
    }

    // Temporary code to not attack Suppen's workers passing through.
    if (creep.room.name === "E39N13" && this.enemy.owner && this.enemy.owner.username === "Suppen" && this.enemy.pos.getRangeTo(25, 25) <= 15) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Ranged.prototype.run = function(creep) {
    "use strict";

    // If enemy is gone, we're done.
    if (!this.enemy) {
        creep.say("Get Rekt!", true);
        Task.prototype.complete.call(this, creep);
        return;
    }

    // If this has attack body parts, use different logic.
    if (creep.getActiveBodyparts(ATTACK) > 0) {
        // Move and attack.
        Pathing.moveTo(creep, this.enemy, 1);
        if (creep.attack(this.enemy) === ERR_NOT_IN_RANGE) {
            // Heal self if possible available.
            if (creep.getActiveBodyparts(HEAL) > 0 && creep.hits < creep.maxHits) {
                creep.heal(creep);
            }
        }

        // Try ranged attack if possible.
        if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
            creep.rangedAttack(this.enemy);
        }
    } else {
        Pathing.moveTo(creep, this.enemy, 3);
        
        if (creep.rangedAttack(this.enemy) === ERR_NOT_IN_RANGE) {
            // Heal self if possible available.
            if (creep.getActiveBodyparts(HEAL) > 0 && creep.hits < creep.maxHits) {
                creep.heal(creep);
            }
        }
    } 
};

Ranged.prototype.canComplete = function(creep) {
    "use strict";

    if (!this.enemy) {
        creep.say("Get Rekt!", true);
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Ranged.prototype.toObj = function(creep) {
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

Ranged.fromObj = function(creep) {
    "use strict";

    return new Ranged(creep.memory.currentTask.id);
};

Ranged.getTasks = function(room) {
    "use strict";

    return _.map(_.sortBy(Cache.hostilesInRoom(room), (h) => h.hits), (h) => new Ranged(h.id));
};

Ranged.getDefenderTask = function(creep) {
    "use strict";

    return _.map(_.sortBy(Cache.hostilesInRoom(creep.room), (h) => h.hits), (h) => new Ranged(h.id))[0];
}

require("screeps-profiler").registerObject(Ranged, "TaskRangedAttack");
module.exports = Ranged;
