const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #      ####                          #
//    #                  #      #   #
//    #     ###    ###   #   #  #   #   ###   # ##    ###    ##    # ##
//    #        #  #      #  #   ####   #   #  ##  #      #    #    ##  #
//    #     ####   ###   ###    # #    #####  ##  #   ####    #    #
//    #    #   #      #  #  #   #  #   #      # ##   #   #    #    #
//    #     ####  ####   #   #  #   #   ###   #       ####   ###   #
//                                            #
//                                            #
/**
 * A class that performs repairing a structure.
 */
class TaskRepair {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the structure to repair.
     */
    constructor(id) {
        this.type = "repair";
        this.id = id;
        this.structure = Game.getObjectById(id);
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
        if (!this.structure || creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }

        // Do not repair structures over 1000000 if you are a worker in the home room when the RCL isn't 8 and you don't have the appropriate boost.
        const {memory, room} = creep;

        if (this.structure.hits >= 1000000 && memory.role === "worker" && room.name === memory.home && room.controller.level < 8 && !_.find(creep.body, (b) => b.type === WORK && [RESOURCE_CATALYZED_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_ACID, RESOURCE_LEMERGIUM_HYDRIDE].indexOf(b.boost) !== -1)) {
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
        const {carry: {[RESOURCE_ENERGY]: energy}} = creep,
            {structure, structure: {hits, hitsMax}} = this;

        // Check for destroyed structure, out of energy, or no WORK parts.
        if (!energy || !structure || hits === hitsMax || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;

            return;
        }

        // Move to the structure and repair it.
        Pathing.moveTo(creep, structure, Math.max(Math.min(creep.pos.getRangeTo(structure) - 1, 3), 1));
        if (creep.repair(structure) === OK) {
            // If we can repair the structure completely, then complete the task.
            if (Math.min(creep.getActiveBodyparts(WORK), energy) * 100 >= hitsMax - hits) {
                delete creep.memory.currentTask;
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
        const {structure} = this;

        if (structure) {
            creep.memory.currentTask = {
                type: this.type,
                id: structure.id
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
     * @return {TaskRepair|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskRepair(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskRepair, "TaskRepair");
}
module.exports = TaskRepair;
