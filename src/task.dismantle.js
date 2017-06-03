const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #      ####     #                                 #      ##
//    #                  #       #  #                                      #       #
//    #     ###    ###   #   #   #  #   ##     ###   ## #    ###   # ##   ####     #     ###
//    #        #  #      #  #    #  #    #    #      # # #      #  ##  #   #       #    #   #
//    #     ####   ###   ###     #  #    #     ###   # # #   ####  #   #   #       #    #####
//    #    #   #      #  #  #    #  #    #        #  # # #  #   #  #   #   #  #    #    #
//    #     ####  ####   #   #  ####    ###   ####   #   #   ####  #   #    ##    ###    ###
/**
 * A class that performs dismantling on a structure.
 */
class TaskDismantle {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string} id The ID of the structure.
     */
    constructor(id) {
        this.type = "dismantle";
        this.id = id;
        this.structure = Game.getObjectById(id);
        this.unimportant = true;
        this.force = true;
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
        if (creep.spawning || creep.carryCapacity > 0 && _.sum(creep.carry) === creep.carryCapacity || creep.spawning || creep.getActiveBodyparts(WORK) === 0) {
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
        const {structure} = this,
            {carry, carryCapacity} = creep;

        // If we're at capacity, the structure is destroyed, or we have no WORK parts, we're done.
        if (carryCapacity > 0 && _.sum(carry) === carryCapacity || !structure || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;

            return;
        }

        // Move to the structure and dismantle it.
        Pathing.moveTo(creep, structure, 1);
        creep.dismantle(structure);

        // If the unit can destroy the structure, complete the task.
        if (Math.min(creep.getActiveBodyparts(WORK), carry[RESOURCE_ENERGY]) * 50 >= structure.hits) {
            delete creep.memory.currentTask;
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
        if (this.structure) {
            creep.memory.currentTask = {
                type: this.type,
                id: this.structure.id
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
     * @return {TaskDismantle|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskDismantle(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskDismantle, "TaskDismantle");
}
module.exports = TaskDismantle;
