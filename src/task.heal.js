var Task = require("task"),
    Pathing = require("pathing"),
    Heal = function(id) {
        "use strict";
        
        this.init(id);
    };
    
Heal.prototype = Object.create(Task.prototype);
Heal.prototype.constructor = Heal;

Heal.prototype.init = function(id) {
    "use strict";
    
    Task.call(this);
    
    this.type = "heal";
    this.id = id;
    this.ally = Game.getObjectById(id);
};

Heal.prototype.canAssign = function(creep, tasks) {
    "use strict";

    if (creep.spawning || creep.getActiveBodyparts(HEAL) === 0) {
        return false;
    }

    Task.prototype.assign.call(this, creep, tasks);
    return true;
};

Heal.prototype.run = function(creep) {
    "use strict";

    // Attempt to heal self if needed.  This is overridden by any future heal.
    if (creep.hits < creep.hitsMax) {
        creep.heal(creep);
    }

    // Ally is gone, complete task.
    if (!this.ally) {
        Task.prototype.complete.call(this, creep);
        return true;
    }

    // Move to ally.
    Pathing.moveTo(creep, this.ally);

    if (this.ally.hits !== this.ally.hitsMax && creep.id !== this.ally.id) {
        // Heal, or ranged heal if not in range.
        if (creep.pos.getRangeTo(this.ally) <= 1) {
            creep.heal(this.ally);
        } else if (creep.pos.getRangeTo(this.ally) <= 3) {
            creep.rangedHeal(this.ally);
        }
    }

    // Always complete so we can switch targets.
    Task.prototype.complete.call(this, creep);
    return true;
};

Heal.prototype.toObj = function(creep) {
    "use strict";

    if (this.ally) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.ally.id
        };
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

    return _.map(_.filter(room.find(FIND_MY_CREEPS), (c) => c.hits < c.hitsMax).sort((a, b) => a.hits - b.hits), (c) => new Heal(c.id));
};

Heal.getDefenderTask = function(creep) {
    "use strict";

    return _.map(_.filter(creep.room.find(FIND_MY_CREEPS), (c) => c.hits < c.hitsMax && c.id !== creep.id).sort((a, b) => a.hits - b.hits), (c) => new Heal(c.id))[0];
};

require("screeps-profiler").registerObject(Heal, "TaskHeal");
module.exports = Heal;
