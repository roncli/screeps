var Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities");

class FillMinerals {
    constructor(id, resources) {
        this.type = "fillMinerals";
        this.id = id;
        this.resources = resources;
        this.object = Game.getObjectById(id);
    }
    
    canAssign(creep) {
        // Can't assign if the creep is spawning.
        if (creep.spawning) {
            return false;
        }
    
        // Can't assign if the creep isn't carrying minerals at all.
        if (_.sum(creep.carry) === creep.carry[RESOURCE_ENERGY]) {
            return false;
        }
    
        // Can't assign if the creep isn't carrying any of the requested resources.
        if (this.resources && _.intersection(_.keys(this.resources), _.filter(_.keys(creep.carry), (c) => c !== RESOURCE_ENERGY && creep.carry[c])).length === 0) {
            return false;
        }
    
        // Can't assign if the target structure is a nuker and it is full of ghodium.
        if (this.object.structureType === STRUCTURE_NUKER && this.object.ghodium === this.object.ghodiumCapacity) {
            return false;
        }
    
        // Can't assign if the target structure is a power spawn and it is full of power.
        if (this.object.structureType === STRUCTURE_POWER_SPAWN && this.object.power === this.object.powerCapacity) {
            return false;
        }
        
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var obj = this.object,
            minerals;
    
        // Object not found, complete task.
        if (!obj) {
            delete creep.memory.currentTask;
            return;
        }
    
        // The container is full, complete.
        if (obj.storeCapacity && _.filter(_.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0).length === 0 || (_.sum(obj.store) || 0) === obj.storeCapacity) {
            delete creep.memory.currentTask;
            return true;
        }
    
        if (!this.resources) {
            // Get the resource we're going to use.
            minerals = _.filter(_.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0);
    
            // We're out of minerals, complete task.
            if (minerals.length === 0) {
                delete creep.memory.currentTask;
                return;
            }
    
            // Move to the object and fill it.
            Pathing.moveTo(creep, obj, 1);
            if (creep.transfer(obj, minerals[0]) === OK) {
                // If we are out of minerals, complete task.
                if (_.filter(_.keys(creep.carry), (m) => m !== RESOURCE_ENERGY && creep.carry[m] > 0).length === 0) {
                    delete creep.memory.currentTask;
                }
            }
        } else {
            // Get the resource we're going to use.
            minerals = _.intersection(_.keys(this.resources), _.filter(_.keys(creep.carry), (c) => creep.carry[c])).sort((a, b) => {
                var ra = this.resources[a],
                    rb = this.resources[b];
                if (ra === rb) {
                    return 0;
                }
                if (ra === null) {
                    return 1;
                }
                if (rb === null) {
                    return -1;
                }
                return ra - rb;
            });
    
            // We're out of minerals, complete task.
            if (minerals.length === 0) {
                delete creep.memory.currentTask;
                return;
            }
    
            // Move to the object and fill it.
            Pathing.moveTo(creep, obj, 1);
            if (creep.transfer(obj, minerals[0], this.resources[minerals[0]] !== null ? Math.min(this.resources[minerals[0]], creep.carry[minerals[0]]) : undefined) === OK) {
                // If we have no minerals left for this container, we're done.
                if (minerals.length === 1) {
                    delete creep.memory.currentTask;
                }
            }
        }
    }
    
    toObj(creep) {
        if (this.object) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id,
                resources: this.resources
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        if (Game.getObjectById(creep.memory.currentTask.id)) {
            return new FillMinerals(creep.memory.currentTask.id, creep.memory.currentTask.resources);
        } else {
            return;
        }
    }
    
    static getLabTasks(room) {
        var resources,
            tasks = [];
    
        _.forEach(_.filter(room.memory.labsInUse, (l) => (!l.status || ["filling", "refilling"].indexOf(l.status) !== -1) && (!Game.getObjectById(l.id).mineralType || Game.getObjectById(l.id).mineralType === (l.status === "refilling" ? l.oldResource : l.resource)) && (Game.getObjectById(l.id).mineralAmount < (l.status === "refilling" ? l.oldAmount : l.amount))), (lab) => {
            resources = {};
            resources[lab.status === "refilling" ? lab.oldResource : lab.resource] = (lab.status === "refilling" ? lab.oldAmount : lab.amount) - Game.getObjectById(lab.id).mineralAmount;
            tasks.push(new FillMinerals(lab.id, resources));
        });
    
        if (room.storage && Cache.labsInRoom(room).length >= 3 && room.memory.labQueue && room.memory.labQueue.status === "moving" && !Utilities.roomLabsArePaused(room)) {
            if (Game.getObjectById(room.memory.labQueue.sourceLabs[0]).mineralAmount < room.memory.labQueue.amount) {
                resources = {};
                resources[room.memory.labQueue.children[0]] = room.memory.labQueue.amount - Game.getObjectById(room.memory.labQueue.sourceLabs[0]).mineralAmount;
                tasks.push(new FillMinerals(room.memory.labQueue.sourceLabs[0], resources));
            }
            if (Game.getObjectById(room.memory.labQueue.sourceLabs[1]).mineralAmount < room.memory.labQueue.amount) {
                resources = {};
                resources[room.memory.labQueue.children[1]] = room.memory.labQueue.amount - Game.getObjectById(room.memory.labQueue.sourceLabs[1]).mineralAmount;
                tasks.push(new FillMinerals(room.memory.labQueue.sourceLabs[1], resources));
            }
        }
    
        return tasks;
    }
    
    static getStorageTasks(room) {
        var storage = room.storage,
            store,
            resources;
    
        // If the room only has storage and no terminal, minerals go to storage.
        if (storage && storage.my && (!room.terminal || !room.terminal.my)) {
            return [new FillMinerals(storage.id)];
        }
    
        // If the room has storage and is not at capacity, minerals should be put into storage, but only up to a certain amount.
        if (storage && storage.my && _.sum(store = storage.store) < storage.storeCapacity && Memory.reserveMinerals) {
            resources = {};
            _.forEach(_.keys(Memory.reserveMinerals), (resource) => {
                var amount = (resource.startsWith("X") && resource.length === 5 ? Memory.reserveMinerals[resource] - 5000 : Memory.reserveMinerals[resource]) - (store[resource] || 0);
                if (amount > 0) {
                    resources[resource] = amount;
                }
            });
            return [new FillMinerals(storage.id, resources)];
        }
    }
    
    static getTerminalTasks(room) {
        if (room.terminal && room.terminal.my && _.sum(room.terminal.store) < room.terminal.storeCapacity) {
            return [new FillMinerals(room.terminal.id)];
        }
        return [];
    }
    
    static getNukerTasks(room) {
        var nukers = Cache.nukersInRoom(room),
            resources;
    
        if (nukers.length === 0) {
            return [];
        }
        
        resources = {};
        resources[RESOURCE_GHODIUM] = nukers[0].ghodiumCapacity - nukers[0].ghodium;
        
        if (resources[RESOURCE_GHODIUM] <= 0) {
            return [];
        }
    
        return [new FillMinerals(nukers[0].id, resources)];
    }
    
    static getPowerSpawnTasks(room) {
        var spawns = Cache.powerSpawnsInRoom(room),
            resources;
    
        if (spawns.length === 0) {
            return [];
        }
        
        resources = {};
        resources[RESOURCE_POWER] = spawns[0].powerCapacity - spawns[0].power;
        
        if (resources[RESOURCE_POWER] <= 0) {
            return [];
        }
    
        return [new FillMinerals(spawns[0].id, resources)];
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(FillMinerals, "TaskFillMinerals");
}
module.exports = FillMinerals;
