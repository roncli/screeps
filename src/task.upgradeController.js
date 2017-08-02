const Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities");

//  #####                #      #   #                                  #
//    #                  #      #   #                                  #
//    #     ###    ###   #   #  #   #  # ##    ## #  # ##    ###    ## #   ###
//    #        #  #      #  #   #   #  ##  #  #  #   ##  #      #  #  ##  #   #
//    #     ####   ###   ###    #   #  ##  #   ##    #       ####  #   #  #####
//    #    #   #      #  #  #   #   #  # ##   #      #      #   #  #  ##  #
//    #     ####  ####   #   #   ###   #       ###   #       ####   ## #   ###
//                                     #      #   #
//                                     #       ###
/**
 * A class that performs upgrading of a controller.
 */
class TaskUpgrade {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string} roomName The name of the room with the controller to upgrade.
     */
    constructor(roomName) {
        const {rooms: {[roomName]: room}} = Game;

        this.type = "upgradeController";
        this.room = roomName;
        ({controller: this.controller} = room);
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
        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.memory.role !== "upgrader" && _.sum(creep.carry) !== creep.carryCapacity && creep.ticksToLive >= 150 && this.controller.ticksToDowngrade >= 1000 || creep.getActiveBodyparts(WORK) === 0) {
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
        const {controller} = this;

        creep.say(["I've", "got to", "celebrate", "you baby", "I've got", "to praise", "GCL like", "I should!", ""][Game.time % 9], true);

        // Controller not found, or no energy, or no WORK parts, then complete task.
        if (!controller || !creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;

            return;
        }

        // If we are an upgrader, try to get energy from the closest link.
        const {pos, room, room: {name: roomName}} = creep,
            {signs, signs: {[roomName]: signInRoom}} = Memory,
            {sign} = controller;

        if (creep.memory.role === "upgrader") {
            const {0: link} = Utilities.objectsClosestToObj(Cache.linksInRoom(room), creep);

            if (link && link.energy > 0 && pos.getRangeTo(link) <= 1) {
                creep.withdraw(link, RESOURCE_ENERGY);
            }
        }

        // Move to the controller and upgrade it.
        Pathing.moveTo(creep, controller, Math.max(Math.min(pos.getRangeTo(controller) - 1, 3), 1));
        creep.upgradeController(controller);

        if (signs && signInRoom && (!sign || sign.username !== "roncli")) {
            creep.signController(controller, signInRoom);
        }

        // If we run out of energy, complete task.
        if (creep.carry[RESOURCE_ENERGY] <= creep.getActiveBodyparts(WORK)) {
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
        creep.memory.currentTask = {
            type: this.type,
            room: this.room
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
     * @return {TaskUpgrade} The deserialized object.
     */
    static fromObj(creep) {
        return new TaskUpgrade(creep.memory.currentTask.room);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskUpgrade, "TaskUpgradeController");
}
module.exports = TaskUpgrade;
