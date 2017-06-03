const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #       ###           ##     ##                   #     #####
//    #                  #      #   #           #      #                   #     #
//    #     ###    ###   #   #  #       ###     #      #     ###    ###   ####   #      # ##    ###   # ##    ## #  #   #
//    #        #  #      #  #   #      #   #    #      #    #   #  #   #   #     ####   ##  #  #   #  ##  #  #  #   #   #
//    #     ####   ###   ###    #      #   #    #      #    #####  #       #     #      #   #  #####  #       ##    #  ##
//    #    #   #      #  #  #   #   #  #   #    #      #    #      #   #   #  #  #      #   #  #      #      #       ## #
//    #     ####  ####   #   #   ###    ###    ###    ###    ###    ###     ##   #####  #   #   ###   #       ###       #
//                                                                                                           #   #  #   #
//                                                                                                            ###    ###
/**
 * A class that performs collecting energy from a structure.
 */
class TaskCollectEnergy {
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
        this.type = "collectEnergy";
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

        if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity) {
            return false;
        }

        if (!obj) {
            return false;
        }

        const energy = obj.energy || obj.store && obj.store[RESOURCE_ENERGY] || 0;

        if (energy === 0) {
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
        const {object: obj} = this;

        // If the creep is about to die or if the object doesn't exist, complete.
        if (creep.ticksToLive < 150 || !obj) {
            delete creep.memory.currentTask;

            return;
        }

        const energy = obj.energy || obj.store && obj.store[RESOURCE_ENERGY] || 0;

        // If the creep is full on capacity or the energy is empty, complete.
        if (_.sum(creep.carry) === creep.carryCapacity || energy === 0) {
            delete creep.memory.currentTask;

            return;
        }

        // Move to the object and collect from it.
        Pathing.moveTo(creep, obj, 1);

        // If we are 1 square from the goal, check to see if there's a resource on it and pick it up.
        if (creep.pos.getRangeTo(obj) === 1) {
            const resources = _.filter(obj.pos.lookFor(LOOK_RESOURCES), (r) => r.amount > 50);

            if (resources.length > 0) {
                creep.pickup(resources[0]);

                return;
            }
        }

        if (creep.withdraw(obj, RESOURCE_ENERGY) === OK) {
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
     * @return {TaskCollectEnergy|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskCollectEnergy(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskCollectEnergy, "TaskCollectEnergy");
}
module.exports = TaskCollectEnergy;
