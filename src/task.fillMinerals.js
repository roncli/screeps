const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #      #####    #     ##     ##    #   #    #                                 ##
//    #                  #      #               #      #    #   #                                       #
//    #     ###    ###   #   #  #       ##      #      #    ## ##   ##    # ##    ###   # ##    ###     #     ###
//    #        #  #      #  #   ####     #      #      #    # # #    #    ##  #  #   #  ##  #      #    #    #
//    #     ####   ###   ###    #        #      #      #    #   #    #    #   #  #####  #       ####    #     ###
//    #    #   #      #  #  #   #        #      #      #    #   #    #    #   #  #      #      #   #    #        #
//    #     ####  ####   #   #  #       ###    ###    ###   #   #   ###   #   #   ###   #       ####   ###   ####
/**
 * A class that performs filling a structure with minerals.
 */
class TaskFillMinerals {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string} id The ID of the structure.
     * @param {object} resources The resources to fill.
     */
    constructor(id, resources) {
        this.type = "fillMinerals";
        this.id = id;
        this.resources = resources;
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
        // Can't assign if the creep is spawning.
        if (creep.spawning) {
            return false;
        }

        const {carry} = creep;

        // Can't assign if the creep isn't carrying minerals at all.
        if (_.sum(carry) === carry[RESOURCE_ENERGY]) {
            return false;
        }

        const {resources} = this;

        // Can't assign if the creep isn't carrying any of the requested resources.
        if (resources && _.intersection(Object.keys(resources), _.filter(Object.keys(carry), (c) => c !== RESOURCE_ENERGY && carry[c])).length === 0) {
            return false;
        }

        const {object: obj, object: {structureType}} = this;

        // Can't assign if the target structure is a nuker and it is full of ghodium.
        if (structureType === STRUCTURE_NUKER && obj.ghodium === obj.ghodiumCapacity) {
            return false;
        }

        // Can't assign if the target structure is a power spawn and it is full of power.
        if (structureType === STRUCTURE_POWER_SPAWN && obj.power === obj.powerCapacity) {
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

        // Object not found, complete task.
        if (!obj) {
            delete creep.memory.currentTask;

            return;
        }

        // The container is full, complete.
        const {storeCapacity} = obj,
            {carry} = creep;

        if (storeCapacity && _.filter(Object.keys(carry), (m) => m !== RESOURCE_ENERGY && carry[m] > 0).length === 0 || (_.sum(obj.store) || 0) === storeCapacity) {
            delete creep.memory.currentTask;

            return;
        }

        const {resources} = this;

        if (resources) {
            // Get the resource we're going to use.
            const minerals = _.intersection(Object.keys(resources), _.filter(Object.keys(carry), (c) => carry[c])).sort((a, b) => {
                const {[a]: ra, [b]: rb} = resources;

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

            const {0: firstMineral} = minerals,
                {[firstMineral]: firstResources} = resources;

            if (creep.transfer(obj, firstMineral, firstResources === null ? void 0 : Math.min(firstResources, carry[firstMineral])) === OK) {
                // If we have no minerals left for this container, we're done.
                if (minerals.length === 1) {
                    delete creep.memory.currentTask;
                }
            }
        } else {
            // Get the resource we're going to use.
            const minerals = _.filter(Object.keys(carry), (m) => m !== RESOURCE_ENERGY && carry[m] > 0);

            // We're out of minerals, complete task.
            if (minerals.length === 0) {
                delete creep.memory.currentTask;

                return;
            }

            // Move to the object and fill it.
            Pathing.moveTo(creep, obj, 1);
            if (creep.transfer(obj, minerals[0]) === OK) {
                // If we are out of minerals, complete task.
                if (_.filter(Object.keys(carry), (m) => m !== RESOURCE_ENERGY && carry[m] > 0).length === 0) {
                    delete creep.memory.currentTask;
                }
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
     * @return {TaskFillMinerals|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask, currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskFillMinerals(id, currentTask.resources);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskFillMinerals, "TaskFillMinerals");
}
module.exports = TaskFillMinerals;
