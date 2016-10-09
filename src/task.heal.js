var Task = require("task"),
    Cache = require("cache"),
    Heal = function(id) {
        Task.call(this);
        
        this.type = "heal";
        this.id = id;
        this.ally = Cache.getObjectById(id);
    };
    
Heal.prototype = Object.create(Task.prototype);
Heal.prototype.constructor = Heal;

Heal.prototype.canAssign = function(creep, tasks) {
    "use strict";

    if (creep.memory.role !== "healer") {
        return false;
    }
    Task.prototype.assign.call(this, creep, tasks);
    return true;
}

Heal.prototype.run = function(creep) {
    "use strict";

    // If ally is gone or at full health, we're done.
    if (!this.ally || this.ally.hits === this.ally.hitsMax) {
        Task.prototype.complete.call(this, creep);
        return;
    }
    
    if (creep.heal(this.ally) === ERR_NOT_IN_RANGE) {
        creep.moveTo(this.ally, {reusePath: Math.floor(Math.random() * 2) + 1});
    }
};

Heal.prototype.canComplete = function(creep) {
    "use strict";

    if (!this.ally || this.ally.hits === this.ally.hitsMax) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Heal.prototype.toObj = function(creep) {
    "use strict";

    if (this.ally) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.ally
        }
    } else {
        delete creep.memory.currentTask;
    }
};

Heal.fromObj = function(creep) {
    "use strict";

    return new Heal(creep.memory.currentTask.id);
};

Heal.getTasks = function(room) {
    "use strict";

    return _.map(_.sortBy(_.filter(Cache.creepsInRoom("all", room), (c) => c.hits < c.hitsMax), (c) => c.hits), (c) => new Heal(c.id));
};

require("screeps-profiler").registerObject(Heal, "TaskHeal");
module.exports = Heal;
