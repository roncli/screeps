const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #      #   #                                      #
//    #                  #      #   #                                      #
//    #     ###    ###   #   #  #   #   ###   # ##   #   #   ###    ###   ####
//    #        #  #      #  #   #####      #  ##  #  #   #  #   #  #       #
//    #     ####   ###   ###    #   #   ####  #       # #   #####   ###    #
//    #    #   #      #  #  #   #   #  #   #  #       # #   #          #   #  #
//    #     ####  ####   #   #  #   #   ####  #        #     ###   ####     ##
/**
 * A class that performs harvesting on a source.
 */
class TaskHarvest {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the source to harvest.
     * @param {number} [failIn=10] The number of ticks to fail in.
     */
    constructor(id, failIn) {
        this.type = "harvest";
        this.id = id;
        this.failIn = failIn || 10;
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
        let source = Game.getObjectById(creep.memory.homeSource);

        if (creep.spawning || creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || !source || creep.getActiveBodyparts(WORK) === 0) {
            return false;
        }

        if (["miner", "remoteMiner"].indexOf(creep.role) === -1 && source.energy === 0) {
            ({0: source} = creep.room.find(FIND_SOURCES_ACTIVE));
            if (!source) {
                return false;
            }
        }

        ({id: this.id} = source);

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
        const source = Game.getObjectById(this.source || creep.memory.homeSource);

        // No sources found or the source is drained, or creep is about to die or out of WORK parts, complete task.
        if (creep.ticksToLive < 150 || _.sum(creep.carry) === creep.carryCapacity || !source || source.energy === 0 || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;

            return;
        }

        // Move to the source and harvest it.
        Pathing.moveTo(creep, source, 1);
        if (creep.harvest(source) !== OK) {
            this.failIn--;
            if (this.failIn === 0) {
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
        creep.memory.currentTask = {
            type: this.type,
            failIn: this.failIn,
            source: this.source
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
     * @return {TaskHarvest|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask}} = creep;

        if (Game.getObjectById(currentTask.source)) {
            return new TaskHarvest(currentTask.source, currentTask.failIn);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskHarvest, "TaskHarvest");
}
module.exports = TaskHarvest;
