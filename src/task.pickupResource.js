var Cache = require("cache"),
    TaskCollectEnergy = require("task.collectEnergy"),
    Pathing = require("pathing"),
    Pickup = function(id) {
        "use strict";
        
        this.init(id);
    };
    
Pickup.prototype.init = function(id) {
    "use strict";
    
    this.type = "pickupResource";
    this.id = id;
    this.resource = Game.getObjectById(id);
    this.force = true;
};

Pickup.prototype.canAssign = function(creep) {
    "use strict";

    if (creep.spawning || !this.resource || _.sum(creep.carry) === creep.carryCapacity || this.resource.amount < creep.pos.getRangeTo(this.resource) || this.resource.resourceType === RESOURCE_ENERGY && this.resource.amount < 50) {
        return false;
    }
    
    Cache.creepTasks[creep.name] = this;
    this.toObj(creep);
    return true;
};

Pickup.prototype.run = function(creep) {
    "use strict";

    // Resource is gone or we are full or it's not close enough.
    if (!this.resource || _.sum(creep.carry) === creep.carryCapacity || this.resource.amount < creep.pos.getRangeTo(this.resource)) {
        delete creep.memory.currentTask;
        return;
    }

    // Move and pickup if possible.    
    Pathing.moveTo(creep, this.resource, 1);
    if (creep.pickup(this.resource) === OK) {
        // Task always is completed one way or another upon successful transfer.
        delete creep.memory.currentTask;

        // If there is a container here, change the task.
        let structures = _.filter(creep.room.lookForAt(LOOK_STRUCTURES, this.resource), (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY]);
        if (structures.length > 0) {
            let task = new TaskCollectEnergy(structures[0].id);
            task.canAssign(creep);
        }
    }
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
