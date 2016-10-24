var Task = require("task"),
    Cache = require("cache"),
    Melee = function(id) {
        Task.call(this);

        this.type = "meleeAttack";
        this.id = id;
        this.enemy = Cache.getObjectById(id);
    };
    
Melee.prototype = Object.create(Task.prototype);
Melee.prototype.constructor = Melee;

Melee.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.getActiveBodyparts(ATTACK) === 0) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
}

Melee.prototype.run = function(creep) {
    "use strict";

    // If enemy is gone, we're done.
    if (!this.enemy) {
        creep.say("Get Rekt!", true);
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    if (creep.attack(this.enemy) === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.enemy, {reusePath: Math.floor(Math.random() * 2) + 4});
    }
};

Melee.prototype.canComplete = function(creep) {
    "use strict";

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
