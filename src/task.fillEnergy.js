const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #      #####    #     ##     ##    #####
//    #                  #      #               #      #    #
//    #     ###    ###   #   #  #       ##      #      #    #      # ##    ###   # ##    ## #  #   #
//    #        #  #      #  #   ####     #      #      #    ####   ##  #  #   #  ##  #  #  #   #   #
//    #     ####   ###   ###    #        #      #      #    #      #   #  #####  #       ##    #  ##
//    #    #   #      #  #  #   #        #      #      #    #      #   #  #      #      #       ## #
//    #     ####  ####   #   #  #       ###    ###    ###   #####  #   #   ###   #       ###       #
//                                                                                      #   #  #   #
//                                                                                       ###    ###
/**
 * A class that performs filling a structure with energy.
 */
class TaskFillEnergy {
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
        this.type = "fillEnergy";
        this.id = id;
        this.object = Game.getObjectById(id);
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
        const {object: obj} = this;
        let minEnergy;

        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || obj.energyCapacity && obj.energy === obj.energyCapacity) {
            return false;
        }

        if (obj.structureType === STRUCTURE_EXTENSION) {
            switch (obj.room.controller.level) {
                case 7:
                    minEnergy = 100;
                    break;
                case 8:
                    minEnergy = 200;
                    break;
                default:
                    minEnergy = 50;
                    break;
            }
            if (creep.carry[RESOURCE_ENERGY] < minEnergy) {
                return false;
            }
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
        const {object: obj} = this;

        // If the object is at capacity, we're done.
        if (!obj || (obj.energy || _.sum(obj.store)) === (obj.energyCapacity || obj.storeCapacity)) {
            delete creep.memory.currentTask;

            return;
        }

        // Object not found or we have no energy, complete task.
        if (!obj || !creep.carry[RESOURCE_ENERGY]) {
            delete creep.memory.currentTask;

            return;
        }

        // Move to the object and fill it.
        Pathing.moveTo(creep, obj, 1);
        if (creep.transfer(obj, RESOURCE_ENERGY) === OK) {
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
        if (this.object) {
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
     * @return {TaskFillEnergy|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskFillEnergy(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskFillEnergy, "TaskFillEnergy");
}
module.exports = TaskFillEnergy;
