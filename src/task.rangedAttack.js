var Task = require("task"),
    Cache = require("cache"),
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

    if (creep.memory.role !== "rangedAttack") {
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
    
    if (creep.rangedAttack(this.enemy) === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.enemy, {reusePath: Math.floor(Math.random() * 2) + 1});
    }
};

Ranged.prototype.canComplete = function(creep) {
    "use strict";

    if (!this.enemy) {
        console.log(this.enemy);
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

require("screeps-profiler").registerObject(Ranged, "TaskRangedAttack");
module.exports = Ranged;
