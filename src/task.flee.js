const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #      #####   ##
//    #                  #      #        #
//    #     ###    ###   #   #  #        #     ###    ###
//    #        #  #      #  #   ####     #    #   #  #   #
//    #     ####   ###   ###    #        #    #####  #####
//    #    #   #      #  #  #   #        #    #      #
//    #     ####  ####   #   #  #       ###    ###    ###
/**
 * A class that performs fleeing from a location.
 */
class TaskFlee {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {RoomPosition} pos The position to flee from.
     */
    constructor(pos) {
        this.type = "flee";
        this.pos = pos;
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
        if (creep.spawning) {
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
        // Run away from the position.
        Pathing.moveTo(creep, this.pos, 10, true, Cache.hostilesInRoom(creep.room));
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
            type: this.type,
            x: this.pos.x,
            y: this.pos.y,
            roomName: this.pos.roomName,
            unimportant: this.unimportant
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
     * @return {TaskFlee} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {x, y, roomName}}} = creep;

        return new TaskFlee(new RoomPosition(x, y, roomName));
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskFlee, "TaskFlee");
}
module.exports = TaskFlee;
