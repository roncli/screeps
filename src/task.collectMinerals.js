const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #       ###           ##     ##                   #     #   #    #                                 ##
//    #                  #      #   #           #      #                   #     #   #                                       #
//    #     ###    ###   #   #  #       ###     #      #     ###    ###   ####   ## ##   ##    # ##    ###   # ##    ###     #     ###
//    #        #  #      #  #   #      #   #    #      #    #   #  #   #   #     # # #    #    ##  #  #   #  ##  #      #    #    #
//    #     ####   ###   ###    #      #   #    #      #    #####  #       #     #   #    #    #   #  #####  #       ####    #     ###
//    #    #   #      #  #  #   #   #  #   #    #      #    #      #   #   #  #  #   #    #    #   #  #      #      #   #    #        #
//    #     ####  ####   #   #   ###    ###    ###    ###    ###    ###     ##   #   #   ###   #   #   ###   #       ####   ###   ####
/**
 * A class that performs collecting minerals from a structure.
 */
class TaskCollectMinerals {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string} id The ID of the structure.
     * @param {string} [resource] The resource to collect.
     * @param {number} [amount] The amount of resource to collect.
     */
    constructor(id, resource, amount) {
        this.type = "collectMinerals";
        this.id = id;
        this.resource = resource;
        this.amount = amount;
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

        if (!obj || this.amount < 0 || creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || creep.carry[RESOURCE_ENERGY] > 0) {
            return false;
        }

        const isLab = obj.structureType === STRUCTURE_LAB,
            {mineralAmount, store} = obj;

        if (isLab && mineralAmount === 0 || obj.store && _.sum(store) === store[RESOURCE_ENERGY]) {
            return false;
        }

        const {resource, amount} = this;

        if (resource && this.amount) {
            if (isLab && obj.mineralType !== resource && mineralAmount < amount) {
                return false;
            }

            if (!isLab && (store[resource] || 0) < amount) {
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
        const {object: obj, resource, amount} = this,
            {carryCapacity} = creep,
            carry = _.sum(creep.carry);
        let minerals;

        // If the amount is less than 0, or the creep is about to die, or if the object doesn't exist, complete.
        if (amount < 0 || creep.ticksToLive < 150 || !obj) {
            delete creep.memory.currentTask;

            return;
        }

        const {store: objStore} = obj;

        // If we're full, complete task.
        if (carry === carryCapacity) {
            delete creep.memory.currentTask;

            return;
        }

        // Get the resource we're going to use.
        if (obj.structureType === STRUCTURE_LAB) {
            // Lab is empty, complete task.
            if (obj.mineralType === null) {
                delete creep.memory.currentTask;

                return;
            }
            minerals = [obj.mineralType];
        } else if (resource) {
            minerals = [resource];
        } else {
            minerals = _.filter(Object.keys(objStore), (m) => m !== RESOURCE_ENERGY && objStore[m] > 0);
        }

        // We're out of minerals, complete task.
        if (minerals.length === 0) {
            delete creep.memory.currentTask;

            return;
        }

        // Move to the object.
        Pathing.moveTo(creep, obj, 1);

        // Collect from the object.
        if (amount) {
            if (creep.withdraw(obj, minerals[0], Math.min(amount, carryCapacity - carry)) === OK) {
                delete creep.memory.currentTask;
            }

            return;
        }

        if (creep.withdraw(obj, minerals[0]) === OK) {
            // Complete task.
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
                id: this.id,
                resource: this.resource,
                amount: this.amount
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
     * @return {TaskCollectMinerals|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask, currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskCollectMinerals(id, currentTask.resource, currentTask.amount);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskCollectMinerals, "TaskCollectMinerals");
}
module.exports = TaskCollectMinerals;
