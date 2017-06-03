const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #      #   #                 ##
//    #                  #      #   #                  #
//    #     ###    ###   #   #  #   #   ###    ###     #
//    #        #  #      #  #   #####  #   #      #    #
//    #     ####   ###   ###    #   #  #####   ####    #
//    #    #   #      #  #  #   #   #  #      #   #    #
//    #     ####  ####   #   #  #   #   ###    ####   ###
/**
 * A class that performs healing on a creep.
 */
class TaskHeal {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the creep to heal.
     */
    constructor(id) {
        this.type = "heal";
        this.id = id;
        this.ally = Game.getObjectById(id);
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
        if (creep.spawning || creep.getActiveBodyparts(HEAL) === 0) {
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
        const {ally} = this;

        // Attempt to heal self if needed.  This is overridden by any future heal.
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }

        // Ally is gone, complete task.
        if (!ally) {
            delete creep.memory.currentTask;

            return;
        }

        // Move to ally.
        Pathing.moveTo(creep, ally);

        if (ally.hits !== ally.hitsMax && creep.id !== ally.id) {
            // Heal, or ranged heal if not in range.
            const range = creep.pos.getRangeTo(ally);

            if (range <= 1) {
                creep.heal(ally);
            } else if (range <= 3) {
                creep.rangedHeal(ally);
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
        if (this.ally) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.ally.id,
                unimportant: this.unimportant
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
     * @return {TaskHeal|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskHeal(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskHeal, "TaskHeal");
}
module.exports = TaskHeal;
