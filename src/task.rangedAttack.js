const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #      ####                                   #    #     #      #                   #
//    #                  #      #   #                                  #   # #    #      #                   #
//    #     ###    ###   #   #  #   #   ###   # ##    ## #   ###    ## #  #   #  ####   ####    ###    ###   #   #
//    #        #  #      #  #   ####       #  ##  #  #  #   #   #  #  ##  #   #   #      #         #  #   #  #  #
//    #     ####   ###   ###    # #     ####  #   #   ##    #####  #   #  #####   #      #      ####  #      ###
//    #    #   #      #  #  #   #  #   #   #  #   #  #      #      #  ##  #   #   #  #   #  #  #   #  #   #  #  #
//    #     ####  ####   #   #  #   #   ####  #   #   ###    ###    ## #  #   #    ##     ##    ####   ###   #   #
//                                                   #   #
//                                                    ###
/**
 * A class that performs attacking creeps at range.
 */
class TaskRangedAttack {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the creep to attack.
     */
    constructor(id) {
        this.type = "rangedAttack";
        this.id = id;
        this.enemy = Game.getObjectById(id);
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
        if (creep.spawning || creep.getActiveBodyparts(RANGED_ATTACK) === 0) {
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
        // If enemy is gone, we're done.
        if (!this.enemy) {
            creep.say("Get Rekt!", true);
            delete creep.memory.currentTask;

            return;
        }

        // If we're out of ranged parts, we're done.
        if (creep.getActiveBodyparts(RANGED_ATTACK) === 0) {
            creep.say("Help!");
            delete creep.memory.currentTask;

            return;
        }

        // If this has attack body parts, use different logic.
        const {enemy} = this;

        if (creep.getActiveBodyparts(ATTACK) > 0) {
            // Move and attack.
            Pathing.moveTo(creep, enemy);
            if (creep.attack(enemy) === ERR_NOT_IN_RANGE) {
                // Heal self if possible available.
                if (creep.hits < creep.hitsMax && creep.getActiveBodyparts(HEAL) > 0) {
                    creep.heal(creep);
                }
            }

            // Try ranged attack if possible.
            if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) {
                creep.rangedAttack(enemy);
            }
        } else {
            if (creep.pos.getRangeTo(enemy) > 3) {
                Pathing.moveTo(creep, enemy, 3);
            } else {
                Pathing.moveTo(creep, enemy, 3, true, [enemy]);
            }

            creep.rangedAttack(enemy);

            // Heal self if possible available.
            if (creep.hits < creep.hitsMax && creep.getActiveBodyparts(HEAL) > 0) {
                creep.heal(creep);
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
        if (this.enemy) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.id
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
     * @return {TaskRangedAttack|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskRangedAttack(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskRangedAttack, "TaskRangedAttack");
}
module.exports = TaskRangedAttack;
