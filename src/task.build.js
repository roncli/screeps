const Cache = require("cache"),
    Pathing = require("pathing");

//  #####                #      ####            #     ##        #
//    #                  #       #  #                  #        #
//    #     ###    ###   #   #   #  #  #   #   ##      #     ## #
//    #        #  #      #  #    ###   #   #    #      #    #  ##
//    #     ####   ###   ###     #  #  #   #    #      #    #   #
//    #    #   #      #  #  #    #  #  #  ##    #      #    #  ##
//    #     ####  ####   #   #  ####    ## #   ###    ###    ## #
/**
 * A class that performs building.
 */
class TaskBuild {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string} id The ID of the construction site.
     */
    constructor(id) {
        this.type = "build";
        this.id = id;
        this.constructionSite = Game.getObjectById(id);
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
        if (creep.spawning || !creep.carry[RESOURCE_ENERGY] || creep.getActiveBodyparts(WORK) === 0) {
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
        const {constructionSite: site} = this;

        // Complete task if we're out of energy, the site is gone, or we can't do the work.
        if (!creep.carry[RESOURCE_ENERGY] || !site || creep.getActiveBodyparts(WORK) === 0) {
            delete creep.memory.currentTask;

            return;
        }

        // Move to the construction site and build it.
        Pathing.moveTo(creep, site, Math.max(Math.min(creep.pos.getRangeTo(site) - 1, 3), 1));
        if (creep.build(site, RESOURCE_ENERGY) === OK) {
            // If we have the means to complete the construction site or we run out of energy, complete the task.
            if (Math.min(creep.getActiveBodyparts(WORK) * 5, creep.carry[RESOURCE_ENERGY]) >= site.progressTotal - site.progress || creep.carry[RESOURCE_ENERGY] <= Math.min(creep.getActiveBodyparts(WORK) * 5)) {
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
        if (this.constructionSite) {
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
     * @return {TaskBuild|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (Game.getObjectById(id)) {
            return new TaskBuild(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskBuild, "TaskBuild");
}
module.exports = TaskBuild;
