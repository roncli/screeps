var Cache = require("cache"),
    Pathing = require("pathing");

class Rally {
    constructor(id, creep) {
        this.type = "rally";
        this.id = id;
        this.creep = creep;
        if (id instanceof RoomPosition) {
            this.rallyPoint = new RoomPosition(id.x, id.y, id.roomName);
        } else {
            this.rallyPoint = Game.getObjectById(id);
            if (!this.rallyPoint) {
                this.rallyPoint = new RoomPosition(25, 25, id);
                this.range = 5;
            }
        }
        this.unimportant = true;
    }
    
    canAssign(creep) {
        if (creep.spawning) {
            return false;
        }
    
        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);
        return true;
    }
    
    run(creep) {
        var rallyPoint = this.rallyPoint,
            range;
    
        // If the rally point doesn't exist, complete the task.
        if (!rallyPoint) {
            delete creep.memory.currentTask;
            return;
        }
    
        // Rally to the rally point.
        range = creep.room.name === rallyPoint.roomName || !(rallyPoint instanceof RoomPosition) || rallyPoint.pos && creep.room.name === rallyPoint.pos.roomName ? this.range || 0 : 20;
        if (creep.pos.getRangeTo(rallyPoint) <= range) {
            if (creep.pos.x === 0) {
                creep.move(RIGHT);
            } else if (creep.pos.x === 49) {
                creep.move(LEFT);
            } else if (creep.pos.y === 0) {
                creep.move(BOTTOM);
            } else if (creep.pos.y === 49) {
                creep.move(TOP);
            } else if (_.filter(creep.pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER).length > 0) {
                creep.move(Math.floor(Math.random() * 8));
            }
        } else {
            Pathing.moveTo(creep, rallyPoint, range);
        }
        
        // Try to heal something.
        if (creep.getActiveBodyparts(HEAL) > 0) {
            if (this.heal) {
                // Heal a creep.
                creep.heal(Game.getObjectById(this.heal));
            } else if (this.rangedHeal) {
                // Heal a creep at range.
                creep.rangedHeal(Game.getObjectById(this.rangedHeal));
            } else if (this.attack) {
                // Attack a creep.
                creep.attack(Game.getObjectById(this.attack));
            } else if (this.rangedAttack) {
                // Attack a creep at range.
                creep.rangedAttack(Game.getObjectById(this.rangedAttack));
            } else if (creep.hits < creep.hitsMax) {
                // Heal itself.
                creep.heal(creep);
            }
        }

        // If the creep has a ranged attack part. mass attack.
        if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
            creep.rangedMassAttack();
        }
    }
    
    toObj(creep) {
        if (this.rallyPoint) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id,
                unimportant: this.unimportant,
                range: this.range
            };
        } else {
            delete creep.memory.currentTask;
        }
    }
    
    static fromObj(creep) {
        var task;
    
        if (creep.memory.currentTask.id.roomName) {
            task = new Rally(new RoomPosition(creep.memory.currentTask.id.x, creep.memory.currentTask.id.y, creep.memory.currentTask.id.roomName));
        } else {
            task = new Rally(creep.memory.currentTask.id);
        }
    
        if (task && creep.memory.currentTask.range) {
            task.range = creep.memory.currentTask.range;
        }
    
        return task;
    }
    
    static getHarvesterTasks(creeps) {
        return _.map(_.filter(creeps, (c) => !c.spawning && c.ticksToLive >= 150 && c.memory.homeSource), (c) => new Rally(c.memory.homeSource, c));
    }
    
    static getDefenderTask(creep) {
        var source = Cache.sourceKeepersInRoom(creep.room).sort((a, b) => a.ticksToSpawn - b.ticksToSpawn)[0];
    
        if (source && creep.room.name === creep.memory.home) {
            return new Rally(source.id, creep);
        } else {
            return new Rally(creep.memory.home, creep);
        }
    }
    
    static getClaimerTask(creep) {
        return new Rally(creep.memory.claim, creep);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Rally, "TaskRally");
}
module.exports = Rally;
