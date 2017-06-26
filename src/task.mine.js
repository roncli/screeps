const Cache = require("cache"),
    Pathing = require("pathing"),
    Utilities = require("utilities");

//  #####                #      #   #    #
//    #                  #      #   #
//    #     ###    ###   #   #  ## ##   ##    # ##    ###
//    #        #  #      #  #   # # #    #    ##  #  #   #
//    #     ####   ###   ###    #   #    #    #   #  #####
//    #    #   #      #  #  #   #   #    #    #   #  #
//    #     ####  ####   #   #  #   #   ###   #   #   ###
/**
 * A class that performs mining on a source.
 */
class TaskMine {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new task.
     * @param {string} [id] The ID of the source to mine.
     */
    constructor(id) {
        this.type = "mine";
        this.id = id;
        this.source = Game.getObjectById(id);
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
        const container = Game.getObjectById(creep.memory.container);

        if (creep.spawning || !container || creep.getActiveBodyparts(WORK) === 0) {
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
        const {memory: {container: containerId}} = creep,
            container = Game.getObjectById(containerId);

        // Container is not found, complete the task.
        if (!container) {
            delete creep.memory.currentTask;

            return;
        }

        // Move to the container if we are not there.
        const {pos: {x: containerPosX, y: containerPosY, roomName: containerPosRoomName}} = container,
            {pos: {x: creepPosX, y: creepPosY, roomName: creepPosRoomName}} = creep;

        if (containerPosX !== creepPosX || containerPosY !== creepPosY || containerPosRoomName !== creepPosRoomName) {
            Pathing.moveTo(creep, container, 0);
        } else {
            // Get the source closest to the creep and attempt to harvest it.
            const {containerSource: {[containerId]: containerSourceId}} = Memory;
            let source;

            if (this.source) {
                ({source} = this);
            } else if (containerSourceId) {
                source = Game.getObjectById(containerSourceId);
                ({id: this.id} = source);
            } else {
                const {room: containerRoom} = container;

                ({0: source} = Utilities.objectsClosestToObj(Array.prototype.concat.apply([], [containerRoom.find(FIND_SOURCES), containerRoom.find(FIND_MINERALS)]), creep));
                ({id: this.id} = source);
            }

            if (source instanceof Mineral && source.mineralAmount === 0) {
                creep.say(":(");
                creep.suicide();
            }

            // If we're harvesting a mineral, don't go over 1500.
            if (source instanceof Mineral && _.sum(container.store) >= 1500) {
                return;
            }

            creep.harvest(source);

            // Suicide creep if there's another one right here with a higher TTL.
            const {creeps: {[creepPosRoomName]: creeps}} = Cache;

            if (_.filter(Array.prototype.concat.apply([], [creeps && creeps.miner || [], creeps && creeps.remoteMiner || []]), (c) => c.room.name === creepPosRoomName && c.memory.container === containerId && c.pos.getRangeTo(creep) === 1 && c.ticksToLive > creep.ticksToLive && c.fatigue === 0).length > 0) {
                creep.say(":(");
                creep.suicide();
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
            id: this.id
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
     * @return {TaskMine|undefined} The deserialized object.
     */
    static fromObj(creep) {
        const {memory: {currentTask: {id}}} = creep;

        if (!creep.memory.currentTask.id || id) {
            return new TaskMine(id);
        }

        return void 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(TaskMine, "TaskMine");
}
module.exports = TaskMine;
