const Cache = require("cache"),
    TaskCollectEnergy = require("task.collectEnergy"),
    Utilities = require("utilities"),
    Pathing = require("pathing");

//  #####                #      ####     #           #                    ####
//    #                  #      #   #                #                    #   #
//    #     ###    ###   #   #  #   #   ##     ###   #   #  #   #  # ##   #   #   ###    ###    ###   #   #  # ##    ###    ###
//    #        #  #      #  #   ####     #    #   #  #  #   #   #  ##  #  ####   #   #  #      #   #  #   #  ##  #  #   #  #   #
//    #     ####   ###   ###    #        #    #      ###    #   #  ##  #  # #    #####   ###   #   #  #   #  #      #      #####
//    #    #   #      #  #  #   #        #    #   #  #  #   #  ##  # ##   #  #   #          #  #   #  #  ##  #      #   #  #
//    #     ####  ####   #   #  #       ###    ###   #   #   ## #  #      #   #   ###   ####    ###    ## #  #       ###    ###
//                                                                 #
//                                                                 #
/**
 * A class that performs picking up resources.
 */
class TaskPickupResource {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the resource to pickup.
     */
    constructor(id) {
        this.type = "pickupResource";
        this.id = id;
        this.resource = Game.getObjectById(id);
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
        const {resource} = this;

        if (!resource) {
            return false;
        }

        const {amount, room: {controller}} = resource;

        if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || amount < creep.pos.getRangeTo(resource) || resource.resourceType === RESOURCE_ENERGY && amount < 50 || controller && Memory.allies.indexOf(Utilities.getControllerOwner(controller)) !== -1) {
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
        const {resource} = this;

        // Resource is gone or we are full.
        if (!resource || _.sum(creep.carry) === creep.carryCapacity) {
            delete creep.memory.currentTask;

            return;
        }

        // Move and pickup if possible.
        Pathing.moveTo(creep, resource, 1);
        if (creep.pickup(resource) === OK) {
            // Task always is completed one way or another upon successful transfer.
            delete creep.memory.currentTask;

            // If there is a container here, change the task.
            const structures = _.filter(creep.room.lookForAt(LOOK_STRUCTURES, resource), (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY]);

            if (structures.length > 0) {
                new TaskCollectEnergy(structures[0].id).canAssign(creep);
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
        const {resource} = this;

        if (resource) {
            creep.memory.currentTask = {
                type: this.type,
                id: resource.id
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
     * @return {TaskPickupResource|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskPickupResource(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskPickupResource, "TaskPickupResource");
}
module.exports = TaskPickupResource;
