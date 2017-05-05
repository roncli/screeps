var Cache = require("cache"),
    TaskCollectEnergy = require("task.collectEnergy"),
    Utilities = require("utilities"),
    Pathing = require("pathing");

class Pickup {
    constructor(id) {
        this.type = "pickupResource";
        this.id = id;
        this.resource = Game.getObjectById(id);
        this.force = true;
    }
    
    canAssign(creep) {
        if (creep.spawning || creep.ticksToLive < 150 || !this.resource || _.sum(creep.carry) === creep.carryCapacity || this.resource.amount < creep.pos.getRangeTo(this.resource) || this.resource.resourceType === RESOURCE_ENERGY && this.resource.amount < 50 || this.resource.room.controller && Memory.allies.indexOf(Utilities.getControllerOwner(this.resource.room.controller)) !== -1) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        // Resource is gone or we are full.
        if (!this.resource || _.sum(creep.carry) === creep.carryCapacity) {
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
    }
    
    toObj(creep) {
        if (this.resource) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.resource.id
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new Pickup(creep.memory.currentTask.id);
        } else {
            return;
        }
    }
    
    static getTasks(room) {
        return _.map(Cache.resourcesInRoom(room), (r) => new Pickup(r.id));
    }

    static getCollectorTasks(room) {
        return _.map(_.filter(Cache.resourcesInRoom(room), (r) => r.resourceType === RESOURCE_ENERGY), (r) => new Pickup(r.id));
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Pickup, "TaskPickupResource");
}
module.exports = Pickup;
