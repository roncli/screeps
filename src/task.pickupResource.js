var Task = require("task"),
    TaskCollectEnergy = require("task.collectEnergy"),
    Pathing = require("pathing"),
    Pickup = function(id) {
        "use strict";
        
        this.init(id);
    };
    
Pickup.prototype = Object.create(Task.prototype);
Pickup.prototype.constructor = Pickup;

Pickup.prototype.init = function(id) {
    "use strict";
    
    Task.call(this);

    this.type = "pickupResource";
    this.id = id;
    this.resource = Game.getObjectById(id);
};

Pickup.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || !this.resource || _.sum(creep.carry) === creep.carryCapacity || this.resource.amount < creep.pos.getRangeTo(this.resource) || (this.resource.resourceType === RESOURCE_ENERGY && this.resource.amount < 50)) {
        return false;
    }
    
    Task.prototype.assign.call(this, creep);
    return true;
};

Pickup.prototype.run = function(creep) {
    "use strict";

    // Resource is gone.
    if (!this.resource) {
        Task.prototype.complete.call(this, creep);
        return;
    }

    // Move and pickup if possible.    
    Pathing.moveTo(creep, this.resource, 1);
    if (creep.pickup(this.resource) === OK) {
        // Task always is completed one way or another upon successful transfer.
        Task.prototype.complete.call(this, creep);

        // If there is a container here, change the task.
        let structures = _.filter(creep.room.lookForAt(LOOK_STRUCTURES, this.resource), (s) => s instanceof StructureContainer && s.store[RESOURCE_ENERGY]);
        if (structures.length > 0) {
            let task = new TaskCollectEnergy(structures[0].id);
            task.canAssign(creep);
        }
    }
};

Pickup.prototype.canComplete = function(creep) {
    "use strict";

    if (!this.resource || this.resource.amount < creep.pos.getRangeTo(this.resource)) {
        Task.prototype.complete.call(this, creep);
        return true;
    }
    return false;
};

Pickup.fromObj = function(creep) {
    "use strict";

    return new Pickup(creep.memory.currentTask.id);
};

Pickup.prototype.toObj = function(creep) {
    "use strict";

    if (this.resource) {
        creep.memory.currentTask = {
            type: this.type,
            id: this.resource.id
        };
    } else {
        delete creep.memory.currentTask;
    }
};

Pickup.getTasks = function(room) {
    "use strict";
    
    return _.map(room.find(FIND_DROPPED_RESOURCES).sort((a, b) => b.amount - a.amount), (r) => new Pickup(r.id));
};

require("screeps-profiler").registerObject(Pickup, "TaskPickupResource");
module.exports = Pickup;
