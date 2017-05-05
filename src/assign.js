var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskDismantle = require("task.dismantle"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally");

/**
 * A set of static functions that assigns creeps in an array to tasks.
 */
class Assign {
    /**
     * Assigns creeps to dismantle a target from the army dismantle list if available.
     * @param {object[]} creeps The creeps to assign this task to.
     * @param {string} attackRoom The name of the attack room.
     * @param {string[]} dismantle An array of object IDs to dismantle.
     * @param {string} say Text to say on successful assignment.
     */
    static dismantleArmyTarget(creeps, attackRoom, dismantle, say) {
        if (attackRoom && dismantle && dismantle.length > 0) {
            let task = new TaskDismantle(dismantle[0]);

            _.forEach(creeps, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say(say);
                }
            });
        }
    }

    /**
     * Assigns creeps to dismantle a hostile structure.
     * @param {object[]} creeps The creeps to assign this task to.
     * @param {string} attackRoom The name of the attack room.
     * @param {string} say Text to say on successful assignment.
     */
    static dismantleHostileStructures(creeps, attackRoom, say) {
        if (attackRoom) {
            let structures = _.filter(attackRoom.find(FIND_HOSTILE_STRUCTURES), (s) => [STRUCTURE_CONTROLLER, STRUCTURE_RAMPART, STRUCTURE_KEEPER_LAIR].indexOf(s.structureType) === -1);

            if (structures.length > 0) {
                let task = new TaskDismantle(structures[0].id);

                _.forEach(creeps, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say(say);
                    }
                });
            }
        }
    }
    
    /**
     * Assigns a creep to escort another, and heal it if it's hurt.
     * @param {object[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment for healing only.
     */
    static escort(creeps, say) {
        _.forEach(_.filter(creeps, (c) => !c.spawning && c.memory.escorting), (creep) => {
            var escorting = Game.getObjectById(creep.memory.escorting);
            
            // If the escortee is dead, this creep is no longer escorting anyone.
            if (!escorting) {
                delete creep.memory.escorting;
                return;
            }
            
            // Determine who to heal.  If self, rally.  If escortee, heal.
            if (escorting.hitsMax - escorting.hits === 0 || escorting.hits / escorting.hitsMax > creep.hits / creep.hitsMax || !new TaskHeal(escorting.id).canAssign(creep)) {
                new TaskRally(escorting.id).canAssign(creep);
            } else {
                creep.say(say);
            }
        });
    }

    /**
     * Assigns creeps to rally to a lab if they require a boost.
     * @param {object[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     */
    static getBoost(creeps, say) {
        _.forEach(_.filter(creeps, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
            var task = new TaskRally(creep.memory.labs[0]);
            if (task.canAssign(creep)) {
                creep.say(say);
            }
        });
    }
    
    /**
     * Assigns creeps to rally to a lab if they require a boost.
     * @param {object[]} creeps The creeps to assign this task to.
     * @param {object[]} creepsToHeal The list of creeps to heal.
     * @param {string} say Text to say on successful assignment.
     */
    static healCreeps(creeps, creepsToHeal, say) {
        var mostHurtCreep;
        
        // Bail if there are no creeps to heal.
        if (!creepsToHeal || creepsToHeal.length === 0) {
            return;
        }
        
        _.forEach(creeps, (creep) => {
            var task;

            mostHurtCreep = creepsToHeal[0];
            
            if (creep.id === mostHurtCreep.id && creepsToHeal.length >= 2) {
                // If we are the most hurt creep, Rally towards the second most hurt creep.  Healers with rally tasks heal themselves by default.
                task = new TaskRally(creepsToHeal[1].id);
            } else if (creep.pos.getRangeTo(mostHurtCreep) <= 3) {
                // Heal the most hurt creep when in range.
                task = new TaskHeal(mostHurtCreep.id);
            } else {
                let closeCreeps;
                
                // Rally towards the most hurt creep.
                task = new TaskRally(mostHurtCreep.id);

                // If we are not hurt, see if we can heal someone else.
                if (creep.hits === creep.hitsMax) {
                    // If there are any hurt creeps within 1 range, heal them.
                    closeCreeps = _.filter(creepsToHeal, (c) => creep.pos.getRangeTo(c) <= 1);
                    if (closeCreeps.length > 0) {
                        task.heal = closeCreeps[0].id;
                    } else {
                        // If there are any hurt creeps within 3 range, heal them at range.
                        closeCreeps = _.filter(creepsToHeal, (c) => creep.pos.getRangeTo(c) <= 3);
                        task.rangedHeal = closeCreeps[0].id;
                    }
                }
            }
            
            if (task.canAssign(creep)) {
                creep.say(say);
            }
        });
    }
    
    /**
     * Assigns all creeps to rally to a position.
     * @param {object[]} creeps The creeps to assign this task to.
     * @param {RoomPosition} pos The position to rally to.
     * @param {number|undefined} range The range to move within.
     * @param {string} say Text to say on successful assignment.
     */
    static moveToPos(creeps, pos, range, say) {
        var task = new TaskRally(pos);
        if (range) {
            task.range = range;
        }
        _.forEach(creeps, (creep) => {
            task.canAssign(creep);
        });
    }

    /**
     * Assigns all creeps to rally to a room.  Will go through portals if specified.
     * @param {object[]} creeps The creeps to assign this task to.
     * @param {string} roomName The name of the room to rally to.
     * @param {string} say Text to say on successful assignment.
     */
    static moveToRoom(creeps, roomName, say) {
        _.forEach(creeps, (creep) => {
            var portals = creep.memory.portals,
                task;
            
            // If the creep was trying to go through a portal and is no longer in origin room, assume the portal was successful and remove the origin room from the portals array.
            if (creep.memory.portaling && portals[0] !== creep.room.name) {
                portals.shift();
            }
            
            // Rally towards a portal if there's one in memory, or the destination room otherwise.
            if (portals && portals.length > 0) {
                // If we're in the portal's origin room, rally to the portal.  Otherwise, rally to the origin room.
                if (portals[0] === creep.room.name) {
                    creep.memory.portaling = true;
                    task = new TaskRally(Cache.portalsInRoom(creep.room)[0].id);
                } else {
                    task = new TaskRally(portals[0]);
                }
            } else {
                task = new TaskRally(roomName);
            }
            
            // Assign the task.
            if (task.canAssign(creep)) {
                creep.say(say);
            }
        });
    }
    
    /**
     * Assigns an army unit to retreat when hurt.
     * @param {object[]} creeps The creeps to assign this task to.
     * @param {object[]} healers The healers to check against.
     * @param {string} stageRoomName The name of the staging room.
     * @param {string} attackRoomName The name of the attack room.
     * @param {number} minHealthPercent The minimum amount a health a unit must have to not retreat.
     * @param {string} say Text to say on successful assignment.
     */
    static retreatArmyUnit(creeps, healers, stageRoomName, attackRoomName, minHealthPercent, say) {
        // Bail if there are no healers.
        if (!healers || healers.length === 0) {
            return;
        }

        // Only retreat if there is somewhere to retreat to.
        if (stageRoomName !== attackRoomName) {
            let task = new TaskRally(stageRoomName);
            
            task.unimportant = false;
            
            // Creeps will retreat if they are in the attack room or within 2 squares of a room edge.  They must be below the minimum health percentage to retreat.
            _.forEach(_.filter(creeps, (c) => (c.room.name === attackRoomName || c.pos.x <= 1 || c.pos.x >= 48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hits / c.hitsMax < minHealthPercent), (creep) => {
                if (task.canAssign(creep)) {
                    creep.say(say);
                }
            });
        }
    }

    /**
     * Assigns an army unit to retreat when hurt or move to a healer if too far from one.
     * @param {object[]} creeps The creeps to assign this task to.
     * @param {object[]} healers The healers to check against.
     * @param {string} stageRoomName The name of the staging room.
     * @param {string} attackRoomName The name of the attack room.
     * @param {number} minHealthPercent The minimum amount a health a unit must have to not retreat.
     * @param {string} say Text to say on successful assignment for retreating only.
     */
    static retreatArmyUnitOrMoveToHealer(creeps, healers, stageRoomName, attackRoomName, minHealthPercent, say) {
        var healersNotEscorting;

        // Bail if there are no healers.
        if (!healers || healers.length === 0) {
            return;
        }

        // Only retreat if there is somewhere to retreat to.
        if (stageRoomName !== attackRoomName) {
            let task = new TaskRally(stageRoomName);
            
            task.unimportant = false;

            // Creeps will retreat if they are in the attack room or within 2 squares of a room edge.  They must be below the minimum health percentage to retreat.
            _.forEach(_.filter(creeps, (c) => (c.room.name === attackRoomName || c.pos.x <= 1 || c.pos.x >= 48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hits / c.hitsMax < minHealthPercent), (creep) => {
                if (task.canAssign(creep)) {
                    creep.say(say);
                }
            });
        }

        // Only move towards a healer if there are any not escorting other creeps.
        healersNotEscorting = _.filter(healers, (h) => !h.memory.escorting);
        if (healersNotEscorting.length > 0) {
            _.forEach(creeps, (creep) => {
                var closest = Utilities.objectsClosestToObj(healersNotEscorting, creep),
                    task;

                // Check to see if the closest healer is further than 2 squares away, rally to it if so.
                if (closest[0].pos.getRangeTo(creep) > 2) {
                    task = new TaskRally(closest[0].id);
                    task.unimportant = false;
                    task.canAssign(creep);
                }
            });
        }
    }
    
    /**
     * Assigns a task from a list to each creep.
     * @param {object[]} creeps The creeps to assign this task to.
     * @param {object[]} tasks The tasks to assign.
     * @param {bool} multiAssign Assign the task to more than one creep.
     * @param {string} say Text to say on successful assignment.
     */
    static tasks(creeps, tasks, multiAssign, say) {
        _.forEach(tasks, (task) => {
            _.forEach(creeps, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say(say);
                }
                return multiAssign;
            });
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Assign, "Assign");
}
module.exports = Assign;
