const Cache = require("cache");

//  #   #   #       #     ##      #     #       #
//  #   #   #              #            #
//  #   #  ####    ##      #     ##    ####    ##     ###    ###
//  #   #   #       #      #      #     #       #    #   #  #
//  #   #   #       #      #      #     #       #    #####   ###
//  #   #   #  #    #      #      #     #  #    #    #          #
//   ###     ##    ###    ###    ###     ##    ###    ###   ####
/**
 * A class of miscellaneous utilities.
 */
class Utilities {
    // #            #    ##       #   ##    #                       #
    // #                  #       #  #  #   #                       #
    // ###   #  #  ##     #     ###   #    ###   ###   #  #   ##   ###   #  #  ###    ##    ###
    // #  #  #  #   #     #    #  #    #    #    #  #  #  #  #      #    #  #  #  #  # ##  ##
    // #  #  #  #   #     #    #  #  #  #   #    #     #  #  #      #    #  #  #     ##      ##
    // ###    ###  ###   ###    ###   ##     ##  #      ###   ##     ##   ###  #      ##   ###
    /**
     * Builds structures in a pattern around a central structure.
     * @param {Room} room The room to build in.
     * @param {string} structureType The structure type to build.
     * @param {number} structuresToBuild The number of structures to build.
     * @param {object} buildAroundObj The object to build around.
     * @return {void}
     */
    static buildStructures(room, structureType, structuresToBuild, buildAroundObj) {
        const {pos: {x: buildAroundX, y: buildAroundY}} = buildAroundObj;
        let distanceFromSpawn = 1;

        while (structuresToBuild > 0 && distanceFromSpawn < 50) {
            for (let x = buildAroundX - distanceFromSpawn; x <= buildAroundX + distanceFromSpawn; x += 2) {
                for (let y = buildAroundY - distanceFromSpawn; y <= buildAroundY + distanceFromSpawn; y += Math.abs(buildAroundX - x) === distanceFromSpawn ? 2 : 2 * distanceFromSpawn) {
                    // Don't check outside of the room.
                    if (x < 1 || x > 48 || y < 1 || y > 48) {
                        continue;
                    }

                    // If there is already a construction site here, skip.
                    if (room.find(FIND_MY_CONSTRUCTION_SITES, {filter: (s) => s.pos.x === x && s.pos.y === y}).length > 0) {
                        continue;
                    }

                    // Check if the site is clear.
                    const siteIsClear = Utilities.checkSiteIsClear(new RoomPosition(x, y, room.name));

                    if (siteIsClear === false) {
                        continue;
                    }

                    // Check if there's anything to destroy.
                    if (siteIsClear !== true) {
                        _.forEach(siteIsClear, (structure) => {
                            structure.destroy();
                        });
                    }

                    // Build the structure.
                    room.createConstructionSite(x, y, structureType);
                    structuresToBuild--;
                    if (structuresToBuild === 0) {
                        break;
                    }
                }
                if (structuresToBuild === 0) {
                    break;
                }
            }

            distanceFromSpawn++;
        }
    }

    //       #                 #      ##                  #                     #
    //       #                 #     #  #                 #                     #
    //  ##   ###    ##    ##   # #   #  #  #  #   ###   ###  ###    ###  ###   ###
    // #     #  #  # ##  #     ##    #  #  #  #  #  #  #  #  #  #  #  #  #  #   #
    // #     #  #  ##    #     # #   ## #  #  #  # ##  #  #  #     # ##  #  #   #
    //  ##   #  #   ##    ##   #  #   ##    ###   # #   ###  #      # #  #  #    ##
    //                                  #
    /**
     * Checks to see if a position is in a quadrant.
     * @param {RoomPosition} pos The room position to check.
     * @param {number} quadrant The quadrant to check.
     * @return {bool} Whether the position is in the quadrant.
     */
    static checkQuadrant(pos, quadrant) {
        switch (quadrant) {
            case 0:
            default:
                return pos.x < 25 && pos.y < 25;
            case 1:
                return pos.x < 25 && pos.y >= 25;
            case 2:
                return pos.x >= 25 && pos.y >= 25;
            case 3:
                return pos.x >= 25 && pos.y < 25;
        }
    }

    //       #                 #      ##    #     #          ###           ##   ##
    //       #                 #     #  #         #           #           #  #   #
    //  ##   ###    ##    ##   # #    #    ##    ###    ##    #     ###   #      #     ##    ###  ###
    // #     #  #  # ##  #     ##      #    #     #    # ##   #    ##     #      #    # ##  #  #  #  #
    // #     #  #  ##    #     # #   #  #   #     #    ##     #      ##   #  #   #    ##    # ##  #
    //  ##   #  #   ##    ##   #  #   ##   ###     ##   ##   ###   ###     ##   ###    ##    # #  #
    /**
     * Checks to see if a site is clear.
     * @param {RoomPosition} pos The site to check.
     * @return {bool|structures} Whether the site is clear or not, or a list of structures if it would be clear if those structures were destroyed.
     */
    static checkSiteIsClear(pos) {
        const {x, y, roomName} = pos,
            {rooms: {[roomName]: room}} = Game;
        let siteClear = true;

        // Cannot be a wall or have walls on opposite sides.
        if (new RoomPosition(x, y, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" || new RoomPosition(x - 1, y, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" && new RoomPosition(x + 1, y, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" || new RoomPosition(x, y - 1, roomName).lookFor(LOOK_TERRAIN)[0] === "wall" && new RoomPosition(x, y + 1, roomName).lookFor(LOOK_TERRAIN)[0] === "wall") {
            return false;
        }

        // Cannot be within 1 square of a source.
        _.forEach(room.find(FIND_SOURCES), (source) => siteClear = pos.getRangeTo(source) > 1);

        if (!siteClear) {
            return false;
        }

        // Cannot be within 1 square of a mineral.
        _.forEach(room.find(FIND_MINERALS), (source) => siteClear = pos.getRangeTo(source) > 1);

        if (!siteClear) {
            return false;
        }

        // Cannot be within 4 squares of the room controller.
        if (pos.getRangeTo(room.controller) <= 4) {
            return false;
        }

        // If the site is clear, we're done.  Don't count ramparts.
        const structures = _.filter(pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType !== "rampart");

        if (structures.length === 0) {
            return true;
        }

        // We're not clear if there are structures other than roads or walls.
        if (_.filter(structures, (s) => [STRUCTURE_ROAD, STRUCTURE_WALL].indexOf(s.structureType) !== -1).length !== structures.length) {
            return false;
        }

        // Return the structure list for potential destruction.
        return structures;
    }

    //                                      #  #   #     #    #     #  #        ###                #
    //                                      #  #         #    #     ## #         #                 #
    //  ##   ###    ##    ##   ###    ###   #  #  ##    ###   ###   ## #   ##    #     ###   ###   # #
    // #     #  #  # ##  # ##  #  #  ##     ####   #     #    #  #  # ##  #  #   #    #  #  ##     ##
    // #     #     ##    ##    #  #    ##   ####   #     #    #  #  # ##  #  #   #    # ##    ##   # #
    //  ##   #      ##    ##   ###   ###    #  #  ###     ##  #  #  #  #   ##    #     # #  ###    #  #
    //                         #
    /**
     * Filters the creeps that have either an unimportant task or no task.
     * @param {Creep[]} creeps The creeps to filter.
     * @return {Creep[]} The filtered creeps.
     */
    static creepsWithNoTask(creeps) {
        return _.filter(creeps, (c) => !c.memory.currentTask || c.memory.currentTask.unimportant);
    }

    //              #    ###            #                           #     ##                 #
    //              #    #  #           #                           #    #  #                #
    //  ###   ##   ###   ###    ##    ###  #  #  ###    ###  ###   ###   #      ##    ###   ###
    // #  #  # ##   #    #  #  #  #  #  #  #  #  #  #  #  #  #  #   #    #     #  #  ##      #
    //  ##   ##     #    #  #  #  #  #  #   # #  #  #  # ##  #      #    #  #  #  #    ##    #
    // #      ##     ##  ###    ##    ###    #   ###    # #  #       ##   ##    ##   ###      ##
    //  ###                                 #    #
    /**
     * Gets the energy cost of a creep's body parts.
     * @param {string[]} body The creep's body.
     * @return {number} The energy cost of the body.
     */
    static getBodypartCost(body) {
        return _.sum(_.map(body, (b) => BODYPART_COST[b]));
    }

    //              #     ##                #                ##    ##                 ##
    //              #    #  #               #                 #     #                #  #
    //  ###   ##   ###   #      ##   ###   ###   ###    ##    #     #     ##   ###   #  #  #  #  ###    ##   ###
    // #  #  # ##   #    #     #  #  #  #   #    #  #  #  #   #     #    # ##  #  #  #  #  #  #  #  #  # ##  #  #
    //  ##   ##     #    #  #  #  #  #  #   #    #     #  #   #     #    ##    #     #  #  ####  #  #  ##    #
    // #      ##     ##   ##    ##   #  #    ##  #      ##   ###   ###    ##   #      ##   ####  #  #   ##   #
    //  ###
    /**
     * Gets the owner or reserver of a controller.
     * @param {StructureController} controller The controller to check for an owner.
     * @return {string} The username of the owner.
     */
    static getControllerOwner(controller) {
        if (controller.owner) {
            return controller.owner.username;
        }
        if (controller.reservation) {
            return controller.reservation.owner;
        }

        return "";
    }

    //              #    #           #     ###         ###                       #    #  #   #     #    #
    //              #    #           #      #          #  #                      #    #  #         #    #
    //  ###   ##   ###   #      ###  ###    #     ##   ###    ##    ##    ###   ###   #  #  ##    ###   ###
    // #  #  # ##   #    #     #  #  #  #   #    #  #  #  #  #  #  #  #  ##      #    ####   #     #    #  #
    //  ##   ##     #    #     # ##  #  #   #    #  #  #  #  #  #  #  #    ##    #    ####   #     #    #  #
    // #      ##     ##  ####   # #  ###    #     ##   ###    ##    ##   ###      ##  #  #  ###     ##  #  #
    //  ###
    /**
     * Gets available labs to boost creeps with.
     * @param {Room} room The room to check for labs.
     * @param {number} count The number of labs needed.
     * @return {object[]} The list of labs to use to boost creeps.
     */
    static getLabToBoostWith(room, count) {
        const {memory, memory: {labQueue}} = room,
            labs = [];
        let sourceLabs = labQueue && labQueue.sourceLabs || [];

        if (!count) {
            count = 1;
        }

        if (sourceLabs.length === 0) {
            sourceLabs = Utilities.getSourceLabs(room);
        }

        if (!memory.labsInUse) {
            memory.labsInUse = [];
        }

        for (let index = 0; index < count; index++) {
            // Try to use labs other than source labs.
            const lab = _.filter(Cache.labsInRoom(room), (l) => sourceLabs.indexOf(l.id) === -1 && _.map(memory.labsInUse, (liu) => liu.id).indexOf(l.id) === -1 && _.map(labs, (liu) => liu.id).indexOf(l.id) === -1);
            let labToUse = {};

            if (lab.length > 0) {
                labToUse = {
                    id: lab[0].id,
                    pause: false
                };
            }

            // If only source labs are left, we will need to pause the reaction and use one of them.
            if (!labToUse || !labToUse.id) {
                labToUse = {
                    id: _.filter(sourceLabs, (l) => _.map(memory.labsInUse, (liu) => liu.id).indexOf(l) === -1 && _.map(labs, (liu) => liu.id).indexOf(l) === -1)[0],
                    pause: true
                };

                if (!labToUse.id) {
                    return false;
                }

                const labUsed = Game.getObjectById(labToUse.id);

                if (labUsed.mineralAmount > 0) {
                    labToUse.status = "emptying";
                    ({mineralType: labToUse.oldResource, mineralAmount: labToUse.oldAmount} = labUsed);
                }
            }

            // If no labs can be used, then we can't boost.
            if (!labToUse.id) {
                return false;
            }

            labs.push(labToUse);
        }

        return labs;
    }

    //              #     ##                                 #           #
    //              #    #  #                                #           #
    //  ###   ##   ###    #     ##   #  #  ###    ##    ##   #      ###  ###    ###
    // #  #  # ##   #      #   #  #  #  #  #  #  #     # ##  #     #  #  #  #  ##
    //  ##   ##     #    #  #  #  #  #  #  #     #     ##    #     # ##  #  #    ##
    // #      ##     ##   ##    ##    ###  #      ##    ##   ####   # #  ###   ###
    //  ###
    /**
     * Gets the 2 source labs to use for reactions.
     * @param {Room} room The room to check for labs.
     * @return {string[]} The IDs of the labs to use as source labs.
     */
    static getSourceLabs(room) {
        const labs = Cache.labsInRoom(room),
            sourceLabs = [];

        _.forEach(labs, (lab) => {
            if (Utilities.objectsClosestToObj(labs, lab)[labs.length - 1].pos.getRangeTo(lab) <= 2) {
                sourceLabs.push(lab.id);
                if (sourceLabs.length >= 2) {
                    return false;
                }
            }

            return true;
        });

        return sourceLabs;
    }

    //                     #
    //                     #
    // ###    ##    ###   ###
    // #  #  # ##  ##      #
    // #  #  ##      ##    #
    // #  #   ##   ###      ##
    /**
     * A function that nests an object by a key.
     * @param {object[]} seq An array of objects to nest.
     * @param {function[]} keys Functions that define the keys.
     * @return {object} The nested object.
     */
    static nest(seq, keys) {
        if (!keys.length) {
            return seq;
        }

        return _.mapValues(_.groupBy(seq, keys[0]), (value) => Utilities.nest(value, keys.slice(1)));
    }

    //       #       #                #            ##   ##                               #    ###          ##   #       #
    //       #                        #           #  #   #                               #     #          #  #  #
    //  ##   ###     #    ##    ##   ###    ###   #      #     ##    ###    ##    ###   ###    #     ##   #  #  ###     #
    // #  #  #  #    #   # ##  #      #    ##     #      #    #  #  ##     # ##  ##      #     #    #  #  #  #  #  #    #
    // #  #  #  #    #   ##    #      #      ##   #  #   #    #  #    ##   ##      ##    #     #    #  #  #  #  #  #    #
    //  ##   ###   # #    ##    ##     ##  ###     ##   ###    ##   ###     ##   ###      ##   #     ##    ##   ###   # #
    //              #                                                                                                  #
    /**
     * Sorts the objects by which ones are closest to another object.
     * @param {object[]} objects The objects to sort.
     * @param {object} obj The object to determine the range to.
     * @return {object[]} The sorted objects.
     */
    static objectsClosestToObj(objects, obj) {
        const {id} = obj;

        if (objects.length === 0) {
            return [];
        }

        if (!obj) {
            return objects;
        }

        const {ranges, ranges: {[id]: thisRange}} = Memory,
            objList = _.map(objects, (o) => {
                const {id: oId} = o;
                let range;

                if (ranges && ranges[id] && ranges[id][oId]) {
                    ({[oId]: range} = thisRange);
                } else {
                    range = obj.pos.getRangeTo(o);
                    if (!(o instanceof Creep) && !(obj instanceof Creep)) {
                        if (!ranges[id]) {
                            ranges[id] = {};
                        }
                        ranges[id][oId] = range;
                    }
                }

                return {
                    object: o,
                    distance: range
                };
            });

        objList.sort((a, b) => a.distance - b.distance);

        return _.map(objList, (o) => o.object);
    }

    //                         #           #             ##               ###                               #
    //                         #           #            #  #              #  #                              #
    // ###    ##    ##   # #   #      ###  ###    ###   #  #  ###    ##   #  #   ###  #  #   ###    ##    ###
    // #  #  #  #  #  #  ####  #     #  #  #  #  ##     ####  #  #  # ##  ###   #  #  #  #  ##     # ##  #  #
    // #     #  #  #  #  #  #  #     # ##  #  #    ##   #  #  #     ##    #     # ##  #  #    ##   ##    #  #
    // #      ##    ##   #  #  ####   # #  ###   ###    #  #  #      ##   #      # #   ###  ###     ##    ###
    /**
     * Returns whether any labs in the room are paused.
     * @param {Room} room The room to check for paused labs.
     * @return {bool} Whether there are paused labs.
     */
    static roomLabsArePaused(room) {
        const {memory: {labsInUse}} = room;

        return labsInUse && _.filter(labsInUse, (l) => l.pause).length > 0;
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Utilities, "Utilities");
}
module.exports = Utilities;
