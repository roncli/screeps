const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #       ###    ##             #
//    #                  #      #   #    #
//    #     ###    ###   #   #  #        #     ###    ##    ## #
//    #        #  #      #  #   #        #        #    #    # # #
//    #     ####   ###   ###    #        #     ####    #    # # #
//    #    #   #      #  #  #   #   #    #    #   #    #    # # #
//    #     ####  ####   #   #   ###    ###    ####   ###   #   #
/**
 * A class that performs claiming a controller.
 */
class TaskClaim {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string} id The ID of the controller.
     * @param {RoomPosition} [pos] The position of the controller.
     */
    constructor(id, pos) {
        const controller = Game.getObjectById(id);

        this.id = id;
        this.controller = controller;

        if (controller) {
            ({pos: this.pos} = controller);
        } else {
            this.pos = pos;
        }
        this.type = "claim";
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
        const {controller} = this;

        if (creep.spawning || creep.memory.role !== "claimer" || !controller || controller.my || creep.getActiveBodyparts(CLAIM) === 0) {
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
        if (!creep.getActiveBodyparts(CLAIM) === 0) {
            delete creep.memory.currentTask;

            return;
        }

        // Move towards the controller and claim it.
        const {controller} = this;

        Pathing.moveTo(creep, this.pos, 1);
        if (controller) {
            creep.claimController(controller);
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
        creep.memory.currentTask = {
            id: this.id,
            x: this.x,
            y: this.y,
            roomName: this.roomName,
            type: this.type
        };
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
     * @return {TaskClaim} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: task}} = creep;

        return new TaskClaim(task.id, new RoomPosition(task.x, task.y, task.roomName));
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskClaim, "TaskClaim");
}
module.exports = TaskClaim;
