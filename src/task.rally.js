const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #      ####           ##     ##
//    #                  #      #   #           #      #
//    #     ###    ###   #   #  #   #   ###     #      #    #   #
//    #        #  #      #  #   ####       #    #      #    #   #
//    #     ####   ###   ###    # #     ####    #      #    #  ##
//    #    #   #      #  #  #   #  #   #   #    #      #     ## #
//    #     ####  ####   #   #  #   #   ####   ###    ###       #
//                                                          #   #
//                                                           ###
/**
 * A class that performs rallying to a location.
 */
class TaskRally {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string|RoomPosition} [id] Either the name of the room, or the room position to rally to.
     */
    constructor(id) {
        this.type = "rally";
        this.id = id;
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

    //                    ##                  #
    //                   #  #
    //  ##    ###  ###   #  #   ###    ###   ##     ###  ###
    // #     #  #  #  #  ####  ##     ##      #    #  #  #  #
    // #     # ##  #  #  #  #    ##     ##    #     ##   #  #
    //  ##    # #  #  #  #  #  ###    ###    ###   #     #  #
    //                                              ###
    /**
     * Checks to see if the task can be assigned to a creep.
     * @param {Creep} creep The creep to try to assign the task to.
     * @return {bool} Whether the task was assigned to the creep.
     */
    canAssign(creep) {
        if (creep.spawning) {
            return false;
        }

        Cache.creepTasks[creep.name] = this;
        this.toObj(creep);

        return true;
    }

    // ###   #  #  ###
    // #  #  #  #  #  #
    // #     #  #  #  #
    // #      ###  #  #
    /**
     * Run the task for the creep.
     * @param {Creep} creep The creep to run the task for.
     * @return {void}
     */
    run(creep) {
        const {rallyPoint} = this;

        // If the rally point doesn't exist, complete the task.
        if (!rallyPoint) {
            delete creep.memory.currentTask;

            return;
        }

        // Rally to the rally point.
        const {room: {name: creepRoomName}, pos: creepPos, pos: {x: creepX, y: creepY}} = creep,
            {pos: rallyPointPos} = rallyPoint,
            range = creepRoomName === rallyPoint.roomName || !(rallyPoint instanceof RoomPosition) || rallyPointPos && creepRoomName === rallyPointPos.roomName ? this.range || 0 : 20;

        if (creepPos.getRangeTo(rallyPoint) <= range) {
            if (creepX === 0) {
                creep.move(RIGHT);
            } else if (creepX === 49) {
                creep.move(LEFT);
            } else if (creepY === 0) {
                creep.move(BOTTOM);
            } else if (creepY === 49) {
                creep.move(TOP);
            } else if (_.filter(creepPos.lookFor(LOOK_STRUCTURES), (s) => [STRUCTURE_ROAD, STRUCTURE_CONTAINER].indexOf(s.structureType) !== -1).length > 0) {
                creep.move(Math.floor(Math.random() * 8));
            }
        } else {
            Pathing.moveTo(creep, rallyPoint, range);
        }

        // Try to heal something.
        if (creep.getActiveBodyparts(HEAL) > 0) {
            const {heal, rangedHeal} = this;

            if (heal) {
                // Heal a creep.
                creep.heal(Game.getObjectById(heal));
            } else if (rangedHeal) {
                // Heal a creep at range.
                creep.rangedHeal(Game.getObjectById(rangedHeal));
            } else if (creep.hits < creep.hitsMax) {
                // Heal itself.
                creep.heal(creep);
            }
        }

        // Try to attack something.
        if (creep.getActiveBodyparts(ATTACK) > 0) {
            const {attack} = this;

            if (attack) {
                // Attack a creep.
                creep.attack(Game.getObjectById(attack));
            }
        }

        // Try to attack something at range.
        if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
            const {rangedAttack} = this;

            if (rangedAttack) {
                // Attack a creep at range.
                creep.rangedAttack(Game.getObjectById(rangedAttack));
            } else {
                // Mass attack.
                creep.rangedMassAttack();
            }
        }
    }

    //  #           ##   #       #
    //  #          #  #  #
    // ###    ##   #  #  ###     #
    //  #    #  #  #  #  #  #    #
    //  #    #  #  #  #  #  #    #
    //   ##   ##    ##   ###   # #
    //                          #
    /**
     * Serializes the task to the creep's memory.
     * @param {Creep} creep The creep to serialize the task for.
     * @return {void}
     */
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

    //   #                      ##   #       #
    //  # #                    #  #  #
    //  #    ###    ##   # #   #  #  ###     #
    // ###   #  #  #  #  ####  #  #  #  #    #
    //  #    #     #  #  #  #  #  #  #  #    #
    //  #    #      ##   #  #   ##   ###   # #
    //                                      #
    /**
     * Deserializes the task from the creep's memory.
     * @param {Creep} creep The creep to deserialize the task for.
     * @return {TaskRally} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id, range}}} = creep;
        let task;

        if (id.roomName) {
            task = new TaskRally(new RoomPosition(id.x, id.y, id.roomName));
        } else {
            task = new TaskRally(id);
        }

        if (task && range) {
            task.range = range;
        }

        return task;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskRally, "TaskRally");
}
module.exports = TaskRally;
