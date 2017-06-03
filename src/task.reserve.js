const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #      ####
//    #                  #      #   #
//    #     ###    ###   #   #  #   #   ###    ###    ###   # ##   #   #   ###
//    #        #  #      #  #   ####   #   #  #      #   #  ##  #  #   #  #   #
//    #     ####   ###   ###    # #    #####   ###   #####  #       # #   #####
//    #    #   #      #  #  #   #  #   #          #  #      #       # #   #
//    #     ####  ####   #   #  #   #   ###   ####    ###   #        #     ###
/**
 * A class that performs reservation of a controller.
 */
class TaskReserve {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     */
    constructor() {
        this.type = "reserve";
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
        if (creep.spawning || creep.getActiveBodyparts(CLAIM) === 0) {
            return false;
        }

        const {rooms: {[creep.memory.home]: room}} = Game;

        if (!room || !room.controller || room.controller.my) {
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
        const {memory: {home: roomName}} = creep,
            {rooms: {[creep.memory.home]: room}} = Game;

        // R.I.P. Pete Burns
        creep.say(["You", "spin", "me", "right", "round", "baby", "right", "round", "like a", "record", "baby", "right", "round", "round", "round", ""][Game.time % 16], true);

        // If no controller, or controller is mine, or no CLAIM parts, bail.
        if (!room || !room.controller || room.controller.my || creep.getActiveBodyparts(CLAIM) === 0) {
            delete creep.memory.currentTask;

            return;
        }

        const {signs, signs: {[roomName]: signInRoom}} = Memory,
            {controller, controller: {sign}} = room;

        Pathing.moveTo(creep, controller, 1);
        creep.reserveController(controller);

        if (signs && signInRoom && (!sign || sign.username !== "roncli")) {
            creep.signController(controller, signInRoom);
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
        creep.memory.currentTask = {type: this.type};
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
     * @return {TaskReserve} The deserialized object.
     */
    static fromObj() {
        return new TaskReserve();
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskReserve, "TaskReserve");
}
module.exports = TaskReserve;
