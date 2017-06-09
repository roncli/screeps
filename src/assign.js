const Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    TaskBuild = require("task.build"),
    TaskClaim = require("task.claim"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskCollectMinerals = require("task.collectMinerals"),
    TaskDismantle = require("task.dismantle"),
    TaskDowngrade = require("task.downgrade"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals"),
    TaskFlee = require("task.flee"),
    TaskHarvest = require("task.harvest"),
    TaskHeal = require("task.heal"),
    TaskMine = require("task.mine"),
    TaskMeleeAttack = require("task.meleeAttack"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),
    TaskRepair = require("task.repair"),
    TaskReserve = require("task.reserve"),
    TaskSuicide = require("task.suicide"),
    TaskUpgradeController = require("task.upgradeController");

//    #                    #
//   # #
//  #   #   ###    ###    ##     ## #  # ##
//  #   #  #      #        #    #  #   ##  #
//  #####   ###    ###     #     ##    #   #
//  #   #      #      #    #    #      #   #
//  #   #  ####   ####    ###    ###   #   #
//                              #   #
//                               ###
/**
 * A set of static functions that assigns creeps in an array to tasks.
 */
class Assign {
    //        #     #                #
    //        #     #                #
    //  ###  ###   ###    ###   ##   # #
    // #  #   #     #    #  #  #     ##
    // # ##   #     #    # ##  #     # #
    //  # #    ##    ##   # #   ##   #  #
    /**
     * Assigns creeps to attack other creeps.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToAttack The list of creeps to attack.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static attack(creeps, creepsToAttack, say) {
        let firstCreep;

        // Bail if there are no creeps to heal.
        if (!creepsToAttack || creepsToAttack.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            let task;

            ({0: firstCreep} = creepsToAttack);

            if (!firstCreep) {
                return;
            } else if (creep.pos.getRangeTo(firstCreep) <= 1) {
                // Attack the first creep when in range.
                task = new TaskMeleeAttack(firstCreep.id);
            } else {
                const closeCreeps = _.filter(creepsToAttack, (c) => creep.pos.getRangeTo(c) <= 1);

                // Rally towards the first creep.
                task = new TaskRally(firstCreep.pos, "position");

                // If there are any creeps within 1 range, attack them.
                if (closeCreeps.length > 0) {
                    ({0: {id: task.attack}} = closeCreeps);
                }
            }

            if (task.canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    //        #     #                #     ###          ##                  #                     #
    //        #     #                #      #          #  #                 #                     #
    //  ###  ###   ###    ###   ##   # #    #    ###   #  #  #  #   ###   ###  ###    ###  ###   ###
    // #  #   #     #    #  #  #     ##     #    #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #   #
    // # ##   #     #    # ##  #     # #    #    #  #  ## #  #  #  # ##  #  #  #     # ##  #  #   #
    //  # #    ##    ##   # #   ##   #  #  ###   #  #   ##    ###   # #   ###  #      # #  #  #    ##
    //                                                    #
    /**
     * Assigns creeps to attack other creeps in a quadrant of a room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToAttack The list of creeps to attack.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static attackInQuadrant(creeps, creepsToAttack, say) {
        let firstCreep;

        // Bail if there are no creeps to heal.
        if (!creepsToAttack || creepsToAttack.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            let task;

            ({0: firstCreep} = _.filter(creepsToAttack, (c) => Utilities.checkQuadrant(c.pos, creep.memory.quadrant)));

            if (firstCreep) {
                return;
            }

            // Set target.
            ({id: creep.memory.target} = firstCreep);

            if (creep.pos.getRangeTo(firstCreep) <= 1) {
                // Attack the first creep when in range.
                task = new TaskMeleeAttack(firstCreep.id);
            } else {
                const closeCreeps = _.filter(creepsToAttack, (c) => creep.pos.getRangeTo(c) <= 1);

                // Rally towards the first creep.
                task = new TaskRally(firstCreep.pos, "position");

                // If there are any creeps within 1 range, attack them.
                if (closeCreeps.length > 0) {
                    ({0: {id: task.attack}} = closeCreeps);
                }
            }

            if (task.canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    //        #     #                #     ###                            #
    //        #     #                #      #                             #
    //  ###  ###   ###    ###   ##   # #    #     ###  ###    ###   ##   ###
    // #  #   #     #    #  #  #     ##     #    #  #  #  #  #  #  # ##   #
    // # ##   #     #    # ##  #     # #    #    # ##  #      ##   ##     #
    //  # #    ##    ##   # #   ##   #  #   #     # #  #     #      ##     ##
    //                                                        ###
    /**
     * Assigns creeps to attack a set target.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToAttack The list of creeps to attack.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static attackTarget(creeps, creepsToAttack, say) {
        _.forEach(creeps, (creep) => {
            let task;

            if (!creep.memory.target) {
                return;
            }

            const target = Game.getObjectById(creep.memory.target);

            if (!target) {
                delete creep.memory.target;

                return;
            }

            if (creep.pos.getRangeTo(target) <= 1) {
                // Attack the first creep when in range.
                task = new TaskMeleeAttack(target.id);
            } else {
                const closeCreeps = _.filter(creepsToAttack, (c) => creep.pos.getRangeTo(c) <= 1);

                // Rally towards the first creep.
                task = new TaskRally(target.pos, "position");

                // If there are any creeps within 1 range, attack them.
                if (closeCreeps.length > 0) {
                    ({0: {id: task.attack}} = closeCreeps);
                }
            }

            if (task.canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    // #            #    ##       #
    // #                  #       #
    // ###   #  #  ##     #     ###
    // #  #  #  #   #     #    #  #
    // #  #  #  #   #     #    #  #
    // ###    ###  ###   ###    ###
    /**
     * Assigns creeps to build structures.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {ConstructionSite[]} sites The construction sites to build.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static build(creeps, allCreeps, sites, say) {
        if (!sites || sites.length === 0) {
            return;
        }

        _.forEach(sites, (site) => {
            let progressMissing = site.progressTotal - site.progress - _.sum(_.map(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "build" && c.memory.currentTask.id === site.id), (c) => c.carry[RESOURCE_ENERGY]));

            if (progressMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creeps, site), (creep) => {
                    if (new TaskBuild(site.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }
                        progressMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                        if (progressMissing <= 0) {
                            return false;
                        }
                    }

                    return true;
                });
            }
        });
    }

    // #            #    ##       #  ###          ##                                  #    ###
    // #                  #       #   #          #  #                                 #    #  #
    // ###   #  #  ##     #     ###   #    ###   #     #  #  ###   ###    ##   ###   ###   #  #   ##    ##   # #
    // #  #  #  #   #     #    #  #   #    #  #  #     #  #  #  #  #  #  # ##  #  #   #    ###   #  #  #  #  ####
    // #  #  #  #   #     #    #  #   #    #  #  #  #  #  #  #     #     ##    #  #   #    # #   #  #  #  #  #  #
    // ###    ###  ###   ###    ###  ###   #  #   ##    ###  #     #      ##   #  #    ##  #  #   ##    ##   #  #
    /**
     * Assigns creeps to build structures in their current room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {bool} quickOnly Only build quick construction sites.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static buildInCurrentRoom(creeps, allCreeps, quickOnly, say) {
        const creepsByRoom = _.groupBy(creeps, (c) => c.room.name);

        _.forEach(Object.keys(creepsByRoom), (roomName) => {
            const sites = _.filter(Game.rooms[roomName].find(FIND_MY_CONSTRUCTION_SITES), (s) => !quickOnly || s.progressTotal === 1),
                {[roomName]: creepsInRoom} = creepsByRoom;

            _.forEach(sites, (site) => {
                let progressMissing = site.progressTotal - site.progress - _.sum(_.map(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "build" && c.memory.currentTask.id === site.id), (c) => c.carry[RESOURCE_ENERGY]));

                if (progressMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsInRoom, site), (creep) => {
                        if (new TaskBuild(site.id).canAssign(creep)) {
                            if (say) {
                                creep.say(say);
                            }
                            progressMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            _.remove(creepsInRoom, (c) => c.id === creep.id);
                            if (progressMissing <= 0) {
                                return false;
                            }
                        }

                        return true;
                    });
                }
            });
        });
    }

    //       ##           #           ##                #                ##    ##
    //        #                      #  #               #                 #     #
    //  ##    #     ###  ##    # #   #      ##   ###   ###   ###    ##    #     #     ##   ###
    // #      #    #  #   #    ####  #     #  #  #  #   #    #  #  #  #   #     #    # ##  #  #
    // #      #    # ##   #    #  #  #  #  #  #  #  #   #    #     #  #   #     #    ##    #
    //  ##   ###    # #  ###   #  #   ##    ##   #  #    ##  #      ##   ###   ###    ##   #
    /**
     * Assigns creeps to claim a controller from their memory.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static claimController(creeps, say) {
        _.forEach(creeps, (creep) => {
            const {memory: {claim: roomName}} = creep,
                {rooms: {[roomName]: room}} = Game;

            if (room) {
                const {controller} = room;

                // If there is no controller in the room or we have already claimed it, remove the key from memory and suicide the creep.
                if (!controller || controller.my) {
                    delete Memory.maxCreeps.claimer[roomName];
                    if (new TaskSuicide().canAssign(creep)) {
                        creep.say("RIP :(");
                    }

                    return;
                }

                // We've found the controller, let's go claim it.
                if (new TaskClaim(controller.id).canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            } else {
                // We can't see the room, so move the creep towards it.
                this.moveToRoom([creep], roomName, say);
            }
        });
    }

    //             ##    ##                 #    ####
    //              #     #                 #    #
    //  ##    ##    #     #     ##    ##   ###   ###   ###    ##   ###    ###  #  #
    // #     #  #   #     #    # ##  #      #    #     #  #  # ##  #  #  #  #  #  #
    // #     #  #   #     #    ##    #      #    #     #  #  ##    #      ##    # #
    //  ##    ##   ###   ###    ##    ##     ##  ####  #  #   ##   #     #       #
    //                                                                    ###   #
    /**
     * Assigns creeps to collect energy from a structure.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Structure[]} structures The structures to collect energy from.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static collectEnergy(creeps, allCreeps, structures, say) {
        if (!structures || structures.length === 0) {
            return;
        }

        _.forEach(structures, (structure) => {
            let energy = (structure.store ? structure.store[RESOURCE_ENERGY] : structure.energy) - _.sum(_.map(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "collectEnergy" && c.memory.currentTask.id === structure.id), (c) => c.carryCapacity - _.sum(c.carry)));

            if (energy > 0) {
                _.forEach(creeps, (creep) => {
                    if (new TaskCollectEnergy(structure.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        if (creep.memory.role === "storer") {
                            creep.memory.lastCollectEnergyWasStorage = structure.structureType === STRUCTURE_STORAGE;
                        }

                        energy -= creep.carryCapacity - _.sum(creep.carry) || 0;
                        if (energy <= 0) {
                            return false;
                        }
                    }

                    return true;
                });
            }
        });
    }

    //             ##    ##                 #    ####                                ####                    #  #                     ##                #           #
    //              #     #                 #    #                                   #                       #  #                    #  #               #
    //  ##    ##    #     #     ##    ##   ###   ###   ###    ##   ###    ###  #  #  ###   ###    ##   # #   ####   ##   # #    ##   #      ##   ###   ###    ###  ##    ###    ##   ###
    // #     #  #   #     #    # ##  #      #    #     #  #  # ##  #  #  #  #  #  #  #     #  #  #  #  ####  #  #  #  #  ####  # ##  #     #  #  #  #   #    #  #   #    #  #  # ##  #  #
    // #     #  #   #     #    ##    #      #    #     #  #  ##    #      ##    # #  #     #     #  #  #  #  #  #  #  #  #  #  ##    #  #  #  #  #  #   #    # ##   #    #  #  ##    #
    //  ##    ##   ###   ###    ##    ##     ##  ####  #  #   ##   #     #       #   #     #      ##   #  #  #  #   ##   #  #   ##    ##    ##   #  #    ##   # #  ###   #  #   ##   #
    //                                                                    ###   #
    /**
     * Assigns creeps to collect energy from their home container.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static collectEnergyFromHomeContainer(creeps, say) {
        _.forEach(creeps, (creep) => {
            if (new TaskCollectEnergy(creep.memory.container).canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    //             ##    ##                 #    #  #   #                            ##
    //              #     #                 #    ####                                 #
    //  ##    ##    #     #     ##    ##   ###   ####  ##    ###    ##   ###    ###   #     ###
    // #     #  #   #     #    # ##  #      #    #  #   #    #  #  # ##  #  #  #  #   #    ##
    // #     #  #   #     #    ##    #      #    #  #   #    #  #  ##    #     # ##   #      ##
    //  ##    ##   ###   ###    ##    ##     ##  #  #  ###   #  #   ##   #      # #  ###   ###
    /**
     * Assigns creeps to collect minerals from a structure.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Structure[]} structures The structures to collect minerals from.
     * @param {string} resource The resource to collect.  Leave undefined to just pick up anything.
     * @param {number} amount The amount of resources to collect.  Leave undefined to get all.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static collectMinerals(creeps, allCreeps, structures, resource, amount, say) {
        if (!structures || structures.length === 0) {
            return;
        }

        _.forEach(structures, (structure) => {
            let minerals = structure.store ? _.sum(structure.store) - structure.store[RESOURCE_ENERGY] - _.sum(_.map(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "collectMinerals" && c.memory.currentTask.id === structure.id), (c) => c.carryCapacity - _.sum(c.carry))) : structure.mineralAmount;

            if (minerals > 0) {
                _.forEach(creeps, (creep) => {
                    if (new TaskCollectMinerals(structure.id, resource, amount).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }
                        minerals -= creep.carryCapacity - _.sum(creep.carry) || 0;
                        if (minerals <= 0) {
                            return false;
                        }
                    }

                    return true;
                });
            }
        });
    }

    //             ##    ##                 #    #  #   #                            ##           ####                    #  #                     ##                #           #
    //              #     #                 #    ####                                 #           #                       #  #                    #  #               #
    //  ##    ##    #     #     ##    ##   ###   ####  ##    ###    ##   ###    ###   #     ###   ###   ###    ##   # #   ####   ##   # #    ##   #      ##   ###   ###    ###  ##    ###    ##   ###
    // #     #  #   #     #    # ##  #      #    #  #   #    #  #  # ##  #  #  #  #   #    ##     #     #  #  #  #  ####  #  #  #  #  ####  # ##  #     #  #  #  #   #    #  #   #    #  #  # ##  #  #
    // #     #  #   #     #    ##    #      #    #  #   #    #  #  ##    #     # ##   #      ##   #     #     #  #  #  #  #  #  #  #  #  #  ##    #  #  #  #  #  #   #    # ##   #    #  #  ##    #
    //  ##    ##   ###   ###    ##    ##     ##  #  #  ###   #  #   ##   #      # #  ###   ###    #     #      ##   #  #  #  #   ##   #  #   ##    ##    ##   #  #    ##   # #  ###   #  #   ##   #
    /**
     * Assigns creeps to collect energy from their home container.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static collectMineralsFromHomeContainer(creeps, say) {
        _.forEach(creeps, (creep) => {
            if (new TaskCollectMinerals(creep.memory.container).canAssign(creep)) {
                creep.say(say);
            }
        });
    }

    //    #   #                              #    ##           ##                     ###                            #
    //    #                                  #     #          #  #                     #                             #
    //  ###  ##     ###   # #    ###  ###   ###    #     ##   #  #  ###   # #   #  #   #     ###  ###    ###   ##   ###
    // #  #   #    ##     ####  #  #  #  #   #     #    # ##  ####  #  #  ####  #  #   #    #  #  #  #  #  #  # ##   #
    // #  #   #      ##   #  #  # ##  #  #   #     #    ##    #  #  #     #  #   # #   #    # ##  #      ##   ##     #
    //  ###  ###   ###    #  #   # #  #  #    ##  ###    ##   #  #  #     #  #    #    #     # #  #     #      ##     ##
    //                                                                           #                       ###
    /**
     * Assigns creeps to dismantle a target from the army dismantle list if available.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} roomName The name of the room.
     * @param {string[]} dismantle An array of object IDs to dismantle.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static dismantleArmyTarget(creeps, roomName, dismantle, say) {
        if (!Game.rooms[roomName] || !dismantle || dismantle.length === 0) {
            return;
        }

        const task = new TaskDismantle(dismantle[0]);

        _.forEach(creeps, (creep) => {
            if (task.canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    //    #   #                              #    ##          #  #                #     #    ##           ##    #                       #
    //    #                                  #     #          #  #                #           #          #  #   #                       #
    //  ###  ##     ###   # #    ###  ###   ###    #     ##   ####   ##    ###   ###   ##     #     ##    #    ###   ###   #  #   ##   ###   #  #  ###    ##    ###
    // #  #   #    ##     ####  #  #  #  #   #     #    # ##  #  #  #  #  ##      #     #     #    # ##    #    #    #  #  #  #  #      #    #  #  #  #  # ##  ##
    // #  #   #      ##   #  #  # ##  #  #   #     #    ##    #  #  #  #    ##    #     #     #    ##    #  #   #    #     #  #  #      #    #  #  #     ##      ##
    //  ###  ###   ###    #  #   # #  #  #    ##  ###    ##   #  #   ##   ###      ##  ###   ###    ##    ##     ##  #      ###   ##     ##   ###  #      ##   ###
    /**
     * Assigns creeps to dismantle a hostile structure.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} roomName The name of the room.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static dismantleHostileStructures(creeps, roomName, say) {
        const {rooms: {[roomName]: room}} = Game;

        if (!room) {
            return;
        }

        const structures = room.find(FIND_HOSTILE_STRUCTURES, {filter: (s) => [STRUCTURE_CONTROLLER, STRUCTURE_RAMPART, STRUCTURE_KEEPER_LAIR].indexOf(s.structureType) === -1});

        if (structures.length > 0) {
            const task = new TaskDismantle(structures[0].id);

            _.forEach(creeps, (creep) => {
                if (task.canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            });
        }
    }

    //    #   #                              #    ##           ##    #                       #
    //    #                                  #     #          #  #   #                       #
    //  ###  ##     ###   # #    ###  ###   ###    #     ##    #    ###   ###   #  #   ##   ###   #  #  ###    ##    ###
    // #  #   #    ##     ####  #  #  #  #   #     #    # ##    #    #    #  #  #  #  #      #    #  #  #  #  # ##  ##
    // #  #   #      ##   #  #  # ##  #  #   #     #    ##    #  #   #    #     #  #  #      #    #  #  #     ##      ##
    //  ###  ###   ###    #  #   # #  #  #    ##  ###    ##    ##     ##  #      ###   ##     ##   ###  #      ##   ###
    /**
     * Assigns creeps to dismantle a structure from a list of structures.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Structure[]} structures An array of structures to dismantle.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static dismantleStructures(creeps, allCreeps, structures, say) {
        if (!structures || structures.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            _.forEach(structures, (structure) => {
                if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "dismantle" && c.memory.currentTask.id === structure.id).length === 0) {
                    if (new TaskDismantle(structure.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        return false;
                    }
                }

                return true;
            });

            if (!creep.memory.currentTask) {
                if (new TaskDismantle(structures[0].id).canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            }
        });
    }

    //    #   #                              #    ##          ###                            #
    //    #                                  #     #           #                             #
    //  ###  ##     ###   # #    ###  ###   ###    #     ##    #     ###  ###    ###   ##   ###    ###
    // #  #   #    ##     ####  #  #  #  #   #     #    # ##   #    #  #  #  #  #  #  # ##   #    ##
    // #  #   #      ##   #  #  # ##  #  #   #     #    ##     #    # ##  #      ##   ##     #      ##
    //  ###  ###   ###    #  #   # #  #  #    ##  ###    ##    #     # #  #     #      ##     ##  ###
    //                                                                           ###
    /**
     * Assigns creeps to dismantle targets in a room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Room} room The room to dismantle targets in.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static dismantleTargets(creeps, room, say) {
        const {dismantle} = Memory,
            {name: roomName} = room,
            convert = () => {
                _.forEach(creeps, (creep) => {
                    const {memory} = creep;

                    memory.role = "worker";
                    ({0: {id: memory.container}} = Cache.containersInRoom(Game.rooms[memory.supportRoom]));
                    delete Cache.creepTasks[creep.name];
                });
            };

        if (!dismantle || !dismantle[roomName] || !dismantle[roomName].length === 0) {
            convert();

            return;
        }

        while (dismantle[roomName].length > 0) {
            const {[roomName]: {0: pos}} = dismantle,
                structures = _.filter(room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y), (s) => s.hits);

            if (structures.length === 0) {
                dismantle[roomName].shift();
                continue;
            }

            _.forEach(creeps, (creep) => {
                if (new TaskDismantle(structures[0].id).canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            });

            return;
        }

        convert();
    }

    //    #                                         #         ##                #                ##    ##
    //    #                                         #        #  #               #                 #     #
    //  ###   ##   #  #  ###    ###  ###    ###   ###   ##   #      ##   ###   ###   ###    ##    #     #     ##   ###
    // #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  # ##  #     #  #  #  #   #    #  #  #  #   #     #    # ##  #  #
    // #  #  #  #  ####  #  #   ##   #     # ##  #  #  ##    #  #  #  #  #  #   #    #     #  #   #     #    ##    #
    //  ###   ##   ####  #  #  #     #      # #   ###   ##    ##    ##   #  #    ##  #      ##   ###   ###    ##   #
    //                          ###
    /**
     * Assigns creeps to downgrade a controller.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static downgradeController(creeps, say) {
        _.forEach(creeps, (creep) => {
            const {memory: {downgrade: roomName}} = creep,
                {rooms: {[roomName]: room}} = Game;

            if (room) {
                const {controller} = room;

                // If there is no controller in the room or it is unowned, remove the key from memory and suicide the creep.
                if (!controller || !controller.level) {
                    delete Memory.maxCreeps.downgrader[roomName];
                    if (new TaskSuicide().canAssign(creep)) {
                        creep.say("RIP :(");
                    }

                    return;
                }

                // We've found the controller, let's go downgrade it.
                if (new TaskDowngrade(controller.id).canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            } else {
                // We can't see the room, so move the creep towards it.
                this.moveToRoom([creep], roomName, say);
            }
        });
    }

    //                                 #
    //                                 #
    //  ##    ###    ##    ##   ###   ###
    // # ##  ##     #     #  #  #  #   #
    // ##      ##   #     #  #  #      #
    //  ##   ###     ##    ##   #       ##
    /**
     * Assigns creeps to escort another, and heal it if it's hurt.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment for healing only.
     * @return {void}
     */
    static escort(creeps, say) {
        _.forEach(_.filter(creeps, (c) => !c.spawning && c.memory.escorting), (creep) => {
            const escorting = Game.getObjectById(creep.memory.escorting);

            // If the escortee is dead, this creep is no longer escorting anyone.
            if (!escorting) {
                delete creep.memory.escorting;

                return;
            }

            // Determine who to heal.  If self, rally.  If escortee, heal.
            if (escorting.hitsMax - escorting.hits === 0 || escorting.hits / escorting.hitsMax > creep.hits / creep.hitsMax || !new TaskHeal(escorting.id).canAssign(creep)) {
                new TaskRally(escorting.pos, "position").canAssign(creep);
            } else if (say) {
                creep.say(say);
            }
        });
    }

    //   #    #    ##    ##    ####         #                        #
    //  # #         #     #    #            #
    //  #    ##     #     #    ###   #  #  ###    ##   ###    ###   ##     ##   ###    ###
    // ###    #     #     #    #      ##    #    # ##  #  #  ##      #    #  #  #  #  ##
    //  #     #     #     #    #      ##    #    ##    #  #    ##    #    #  #  #  #    ##
    //  #    ###   ###   ###   ####  #  #    ##   ##   #  #  ###    ###    ##   #  #  ###
    /**
     * Assigns creeps to fill extensions.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {number} rcl The room controller level.
     * @param {StructureExtension[]} extensions The extensions to fill.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillExtensions(creeps, allCreeps, rcl, extensions, say) {
        if (!extensions || extensions.length === 0) {
            return;
        }

        _.forEach(_.filter(creeps, (c) => c.carry[RESOURCE_ENERGY] >= EXTENSION_ENERGY_CAPACITY[rcl]), (creep) => {
            _.forEach(extensions.sort((a, b) => a.pos.getRangeTo(creep) - b.pos.getRangeTo(creep)), (extension) => {
                if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === extension.id).length === 0) {
                    if (new TaskFillEnergy(extension.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        return false;
                    }
                }

                return true;
            });
        });
    }

    //   #    #    ##    ##     ##
    //  # #         #     #    #  #
    //  #    ##     #     #     #    ###    ###  #  #  ###    ###
    // ###    #     #     #      #   #  #  #  #  #  #  #  #  ##
    //  #     #     #     #    #  #  #  #  # ##  ####  #  #    ##
    //  #    ###   ###   ###    ##   ###    # #  ####  #  #  ###
    //                               #
    /**
     * Assigns creeps to fill spawns.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {StructureSpawn[]} spawns The spawns to fill.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillSpawns(creeps, allCreeps, spawns, say) {
        if (!spawns || spawns.length === 0) {
            return;
        }

        _.forEach(_.filter(creeps, (c) => c.carry[RESOURCE_ENERGY] > 0), (creep) => {
            _.forEach(spawns.sort((a, b) => a.pos.getRangeTo(creep) - b.pos.getRangeTo(creep)), (spawn) => {
                if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === spawn.id).length === 0) {
                    if (new TaskFillEnergy(spawn.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        return false;
                    }
                }

                return true;
            });
        });
    }

    //   #    #    ##    ##     ##    #                                  #  #   #     #    #     ####
    //  # #         #     #    #  #   #                                  #  #         #    #     #
    //  #    ##     #     #     #    ###    ##   ###    ###   ###   ##   #  #  ##    ###   ###   ###   ###    ##   ###    ###  #  #
    // ###    #     #     #      #    #    #  #  #  #  #  #  #  #  # ##  ####   #     #    #  #  #     #  #  # ##  #  #  #  #  #  #
    //  #     #     #     #    #  #   #    #  #  #     # ##   ##   ##    ####   #     #    #  #  #     #  #  ##    #      ##    # #
    //  #    ###   ###   ###    ##     ##   ##   #      # #  #      ##   #  #  ###     ##  #  #  ####  #  #   ##   #     #       #
    //                                                        ###                                                         ###   #
    /**
     * Assigns creeps to fill storage with energy.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Room} room The room to check for storage.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillStorageWithEnergy(creeps, allCreeps, room, say) {
        if (!room || !room.storage) {
            return;
        }

        _.forEach(_.filter(creeps, (c) => c.carry[RESOURCE_ENERGY] > 0), (creep) => {
            if ((!room.terminal || !creep.memory.lastCollectEnergyWasStorage) && new TaskFillEnergy(room.storage.id).canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    //   #    #    ##    ##    ###                      #                ##
    //  # #         #     #     #                                         #
    //  #    ##     #     #     #     ##   ###   # #   ##    ###    ###   #
    // ###    #     #     #     #    # ##  #  #  ####   #    #  #  #  #   #
    //  #     #     #     #     #    ##    #     #  #   #    #  #  # ##   #
    //  #    ###   ###   ###    #     ##   #     #  #  ###   #  #   # #  ###
    /**
     * Assigns creeps to fill a terminal.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Room} room The room to check for a terminal.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillTerminal(creeps, allCreeps, room, say) {
        if (!room || !room.terminal) {
            return;
        }

        _.forEach(_.filter(creeps, (c) => c.carry[RESOURCE_ENERGY] > 0), (creep) => {
            if (new TaskFillEnergy(room.terminal.id).canAssign(creep)) {
                creep.say(say);
            }
        });
    }

    //   #    #    ##    ##    ###                                  #  #   #     #    #     ####
    //  # #         #     #     #                                   #  #         #    #     #
    //  #    ##     #     #     #     ##   #  #   ##   ###    ###   #  #  ##    ###   ###   ###   ###    ##   ###    ###  #  #
    // ###    #     #     #     #    #  #  #  #  # ##  #  #  ##     ####   #     #    #  #  #     #  #  # ##  #  #  #  #  #  #
    //  #     #     #     #     #    #  #  ####  ##    #       ##   ####   #     #    #  #  #     #  #  ##    #      ##    # #
    //  #    ###   ###   ###    #     ##   ####   ##   #     ###    #  #  ###     ##  #  #  ####  #  #   ##   #     #       #
    //                                                                                                               ###   #
    /**
     * Assings creeps to fill towers with energy.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {StructureTower[]} towers The towers to fill.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillTowersWithEnergy(creeps, allCreeps, towers, say) {
        if (!towers || towers.length === 0) {
            return;
        }

        _.forEach(_.filter(creeps, (c) => c.carry[RESOURCE_ENERGY] > 0), (creep) => {
            _.forEach(towers.sort((a, b) => a.energy - b.energy), (tower) => {
                if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === tower.id).length === 0) {
                    if (new TaskFillEnergy(tower.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        return false;
                    }
                }

                return true;
            });
        });
    }

    //   #    #    ##    ##    #  #   #     #    #     ####
    //  # #         #     #    #  #         #    #     #
    //  #    ##     #     #    #  #  ##    ###   ###   ###   ###    ##   ###    ###  #  #
    // ###    #     #     #    ####   #     #    #  #  #     #  #  # ##  #  #  #  #  #  #
    //  #     #     #     #    ####   #     #    #  #  #     #  #  ##    #      ##    # #
    //  #    ###   ###   ###   #  #  ###     ##  #  #  ####  #  #   ##   #     #       #
    //                                                                          ###   #
    /**
     * Assigns creeps to fill structures with energy.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Structure[]} structures The structures to fill.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillWithEnergy(creeps, structures, say) {
        if (!structures || structures.length === 0) {
            return;
        }

        _.forEach(_.filter(creeps, (c) => c.carry[RESOURCE_ENERGY] > 0), (creep) => {
            _.forEach(structures, (structure) => {
                if (new TaskFillEnergy(structure.id).canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }

                    return false;
                }

                return true;
            });
        });
    }

    //   #    #    ##    ##    #  #   #     #    #     #  #   #                            ##
    //  # #         #     #    #  #         #    #     ####                                 #
    //  #    ##     #     #    #  #  ##    ###   ###   ####  ##    ###    ##   ###    ###   #     ###
    // ###    #     #     #    ####   #     #    #  #  #  #   #    #  #  # ##  #  #  #  #   #    ##
    //  #     #     #     #    ####   #     #    #  #  #  #   #    #  #  ##    #     # ##   #      ##
    //  #    ###   ###   ###   #  #  ###     ##  #  #  #  #  ###   #  #   ##   #      # #  ###   ###
    /**
     * Assign creeps to fill a structure with minerals.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Structure} structure The structure to fill with minerals.
     * @param {object} resourcesNeeded An object with the resources needed by the structure.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static fillWithMinerals(creeps, structure, resourcesNeeded, say) {
        if (!structure) {
            return;
        }

        _.forEach(creeps, (creep) => {
            if (new TaskFillMinerals(structure.id, resourcesNeeded).canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    //   #   ##
    //  # #   #
    //  #     #     ##    ##
    // ###    #    # ##  # ##
    //  #     #    ##    ##
    //  #    ###    ##    ##
    /**
     * Assigns creeps to flee from nearby hostiles.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} hostiles The hostiles to run from.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static flee(creeps, hostiles, say) {
        if (!hostiles || hostiles.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            const {0: closest} = Utilities.objectsClosestToObj(hostiles, creep);

            if (closest.pos.getRangeTo(creep) < 7) {
                const task = new TaskFlee(closest.pos);

                if (task.canAssign(creep)) {
                    ({time: creep.memory.currentTask.priority} = Game);
                    creep.say(say);
                }
            }
        });
    }

    //              #    ###                       #
    //              #    #  #                      #
    //  ###   ##   ###   ###    ##    ##    ###   ###
    // #  #  # ##   #    #  #  #  #  #  #  ##      #
    //  ##   ##     #    #  #  #  #  #  #    ##    #
    // #      ##     ##  ###    ##    ##   ###      ##
    //  ###
    /**
     * Assigns creeps to rally to a lab if they require a boost.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static getBoost(creeps, say) {
        _.forEach(_.filter(creeps, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
            const task = new TaskRally(creep.memory.labs[0], "id");

            if (task.canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                creep.say(say);
            }
        });
    }

    // #                                     #
    // #                                     #
    // ###    ###  ###   # #    ##    ###   ###
    // #  #  #  #  #  #  # #   # ##  ##      #
    // #  #  # ##  #     # #   ##      ##    #
    // #  #   # #  #      #     ##   ###      ##
    /**
     * Assigns creeps to harvest.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static harvest(creeps, say) {
        _.forEach(creeps, (creep) => {
            const task = new TaskHarvest();

            if (creep.room.name !== creep.memory.home) {
                return;
            }

            if (task.canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    // #                 ##
    // #                  #
    // ###    ##    ###   #
    // #  #  # ##  #  #   #
    // #  #  ##    # ##   #
    // #  #   ##    # #  ###
    /**
     * Assigns creeps to heal other creeps.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToHeal The list of creeps to heal.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static heal(creeps, creepsToHeal, say) {
        let mostHurtCreep;

        // Bail if there are no creeps to heal.
        if (!creepsToHeal || creepsToHeal.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            let task;

            ({0: mostHurtCreep} = creepsToHeal);

            if (creep.id === mostHurtCreep.id && creepsToHeal.length >= 2) {
                // If we are the most hurt creep, Rally towards the second most hurt creep.  Healers with rally tasks heal themselves by default.
                task = new TaskRally(creepsToHeal[1].pos, "position");
            } else if (creep.pos.getRangeTo(mostHurtCreep) <= 3) {
                // Heal the most hurt creep when in range.
                task = new TaskHeal(mostHurtCreep.id);
            } else {
                let closeCreeps;

                // Rally towards the most hurt creep.
                task = new TaskRally(mostHurtCreep.pos, "position");

                // If we are not hurt, see if we can heal someone else.
                if (creep.hits === creep.hitsMax) {
                    // If there are any hurt creeps within 1 range, heal them.
                    closeCreeps = _.filter(creepsToHeal, (c) => creep.pos.getRangeTo(c) <= 1);
                    if (closeCreeps.length > 0) {
                        ({0: {id: task.heal}} = closeCreeps);
                    } else {
                        // If there are any hurt creeps within 3 range, heal them at range.
                        closeCreeps = _.filter(creepsToHeal, (c) => creep.pos.getRangeTo(c) <= 3);
                        if (closeCreeps.length > 0) {
                            ({0: {id: task.rangedHeal}} = closeCreeps);
                        }
                    }
                }
            }

            if (task.canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    //        #
    //
    // # #   ##    ###    ##
    // ####   #    #  #  # ##
    // #  #   #    #  #  ##
    // #  #  ###   #  #   ##
    /**
     * Assigns all creeps to mine.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static mine(creeps, say) {
        _.forEach(creeps, (creep) => {
            if (new TaskMine().canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    //                         ###         #  #                     ##          ##                                  #
    //                          #          #  #                    #  #        #  #                                 #
    // # #    ##   # #    ##    #     ##   ####   ##   # #    ##   #  #  ###    #    #  #  ###   ###    ##   ###   ###
    // ####  #  #  # #   # ##   #    #  #  #  #  #  #  ####  # ##  #  #  #  #    #   #  #  #  #  #  #  #  #  #  #   #
    // #  #  #  #  # #   ##     #    #  #  #  #  #  #  #  #  ##    #  #  #     #  #  #  #  #  #  #  #  #  #  #      #
    // #  #   ##    #     ##    #     ##   #  #   ##   #  #   ##    ##   #      ##    ###  ###   ###    ##   #       ##
    //                                                                                     #     #
    /**
     * Assigns all creeps to rally to their home or support room depending on whether they are carrying resources or not.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @return {void}
     */
    static moveToHomeOrSupport(creeps) {
        _.forEach(creeps, (creep) => {
            let task;

            if (_.sum(creep.carry) > 0) {
                task = new TaskRally(creep.memory.supportRoom, "room");
            } else {
                task = new TaskRally(creep.memory.home, "room");
            }
            task.canAssign(creep);
        });
    }

    //                         ###         #  #                    ###
    //                          #          #  #                    #  #
    // # #    ##   # #    ##    #     ##   ####   ##   # #    ##   #  #   ##    ##   # #
    // ####  #  #  # #   # ##   #    #  #  #  #  #  #  ####  # ##  ###   #  #  #  #  ####
    // #  #  #  #  # #   ##     #    #  #  #  #  #  #  #  #  ##    # #   #  #  #  #  #  #
    // #  #   ##    #     ##    #     ##   #  #   ##   #  #   ##   #  #   ##    ##   #  #
    /**
     * Assigns all creeps to rally to their home room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @return {void}
     */
    static moveToHomeRoom(creeps) {
        _.forEach(_.filter(creeps, (c) => !c.spawning && c.ticksToLive >= 150 && c.memory.home), (creep) => {
            new TaskRally(creep.memory.home, "room").canAssign(creep);
        });
    }

    //                         ###         #  #                     ##
    //                          #          #  #                    #  #
    // # #    ##   # #    ##    #     ##   ####   ##   # #    ##    #     ##   #  #  ###    ##    ##
    // ####  #  #  # #   # ##   #    #  #  #  #  #  #  ####  # ##    #   #  #  #  #  #  #  #     # ##
    // #  #  #  #  # #   ##     #    #  #  #  #  #  #  #  #  ##    #  #  #  #  #  #  #     #     ##
    // #  #   ##    #     ##    #     ##   #  #   ##   #  #   ##    ##    ##    ###  #      ##    ##
    /**
     * Assigns all creeps to rally to their home source.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @return {void}
     */
    static moveToHomeSource(creeps) {
        _.forEach(_.filter(creeps, (c) => !c.spawning && c.ticksToLive >= 150 && c.memory.homeSource), (creep) => {
            new TaskRally(creep.memory.homeSource, "id").canAssign(creep);
        });
    }

    //                         ###         ###
    //                          #          #  #
    // # #    ##   # #    ##    #     ##   #  #   ##    ###
    // ####  #  #  # #   # ##   #    #  #  ###   #  #  ##
    // #  #  #  #  # #   ##     #    #  #  #     #  #    ##
    // #  #   ##    #     ##    #     ##   #      ##   ###
    /**
     * Assigns all creeps to rally to a position.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {RoomPosition} pos The position to rally to.
     * @param {number|undefined} range The range to move within.
     * @return {void}
     * @param {string} say Text to say on successful assignment.
     */
    static moveToPos(creeps, pos, range, say) {
        const task = new TaskRally(pos, "position");

        if (range) {
            task.range = range;
        }
        _.forEach(creeps, (creep) => {
            if (task.canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    //                         ###         ###
    //                          #          #  #
    // # #    ##   # #    ##    #     ##   #  #   ##    ##   # #
    // ####  #  #  # #   # ##   #    #  #  ###   #  #  #  #  ####
    // #  #  #  #  # #   ##     #    #  #  # #   #  #  #  #  #  #
    // #  #   ##    #     ##    #     ##   #  #   ##    ##   #  #
    /**
     * Assigns all creeps to rally to a room.  Will go through portals if specified.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} roomName The name of the room to rally to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static moveToRoom(creeps, roomName, say) {
        _.forEach(creeps, (creep) => {
            let task;

            const {memory: {portals}} = creep;

            // If the creep was trying to go through a portal and is no longer in origin room, assume the portal was successful and remove the origin room from the portals array.
            if (creep.memory.portaling && portals[0] !== creep.room.name) {
                portals.shift();
            }

            // Rally towards a portal if there's one in memory, or the destination room otherwise.
            if (portals && portals.length > 0) {
                // If we're in the portal's origin room, rally to the portal.  Otherwise, rally to the origin room.
                if (portals[0] === creep.room.name) {
                    creep.memory.portaling = true;
                    task = new TaskRally(Cache.portalsInRoom(creep.room)[0].pos, "position");
                } else {
                    task = new TaskRally(portals[0], "room");
                    task.range = 20;
                }
            } else {
                task = new TaskRally(roomName, "room");
                task.range = 20;
            }

            // Assign the task.
            if (task.canAssign(creep)) {
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    //                         ###          ##                                 #  #
    //                          #          #  #                                # #
    // # #    ##   # #    ##    #     ##    #     ##   #  #  ###    ##    ##   ##     ##    ##   ###    ##   ###
    // ####  #  #  # #   # ##   #    #  #    #   #  #  #  #  #  #  #     # ##  ##    # ##  # ##  #  #  # ##  #  #
    // #  #  #  #  # #   ##     #    #  #  #  #  #  #  #  #  #     #     ##    # #   ##    ##    #  #  ##    #
    // #  #   ##    #     ##    #     ##    ##    ##    ###  #      ##    ##   #  #   ##    ##   ###    ##   #
    //                                                                                           #
    /**
     * Assigns creeps to move to a source keeper.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {StructureKeeperLair[]} keepers The source keepers to move to.
     * @return {void}
     */
    static moveToSourceKeeper(creeps, keepers) {
        if (!keepers || keepers.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            _.forEach(_.filter(keepers, (k) => k.ticksToSpawn < 200 && (creep.memory.role !== "defender" || Utilities.checkQuadrant(k.pos, creep.memory.quadrant))).sort((a, b) => a.ticksToSpawn - b.ticksToSpawn), (keeper) => {
                const task = new TaskRally(keeper.pos, "position");

                task.range = 1;
                if (task.canAssign(creep)) {
                    ({time: creep.memory.currentTask.priority} = Game);

                    return false;
                }

                return true;
            });
        });
    }

    //                         ###         ###                      #                ##     ##         ###
    //                          #           #                                         #    #  #        #  #
    // # #    ##   # #    ##    #     ##    #     ##   ###   # #   ##    ###    ###   #    #  #  ###   #  #   ##    ##   # #
    // ####  #  #  # #   # ##   #    #  #   #    # ##  #  #  ####   #    #  #  #  #   #    #  #  #  #  ###   #  #  #  #  ####
    // #  #  #  #  # #   ##     #    #  #   #    ##    #     #  #   #    #  #  # ##   #    #  #  #     # #   #  #  #  #  #  #
    // #  #   ##    #     ##    #     ##    #     ##   #     #  #  ###   #  #   # #  ###    ##   #     #  #   ##    ##   #  #
    /**
     * Assigns creeps to move to a terminal or the room if there is no terminal.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Room} room The room to move to.
     * @return {void}
     */
    static moveToTerminalOrRoom(creeps, room) {
        if (room.terminal) {
            _.forEach(creeps, (creep) => {
                new TaskRally(room.terminal.pos, "position").canAssign(creep);
            });
        } else {
            _.forEach(creeps, (creep) => {
                new TaskRally(room.name, "room").canAssign(creep);
            });
        }
    }

    //        #          #                 ###
    //                   #                 #  #
    // ###   ##     ##   # #   #  #  ###   #  #   ##    ###    ##   #  #  ###    ##    ##    ###
    // #  #   #    #     ##    #  #  #  #  ###   # ##  ##     #  #  #  #  #  #  #     # ##  ##
    // #  #   #    #     # #   #  #  #  #  # #   ##      ##   #  #  #  #  #     #     ##      ##
    // ###   ###    ##   #  #   ###  ###   #  #   ##   ###     ##    ###  #      ##    ##   ###
    // #                             #
    /**
     * Assigns creeps to pickup resources in the room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Resource[]} resources The resources to pickup.
     * @param {Creep[]} hostiles Hostile creeps.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static pickupResources(creeps, allCreeps, resources, hostiles, say) {
        if (hostiles && hostiles.length > 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            _.forEach(_.filter(resources, (r) => r.amount > creep.pos.getRangeTo(r)), (resource) => {
                if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === resource.id).length > 0) {
                    return true;
                }
                if (new TaskPickupResource(resource.id).canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }

                    return false;
                }

                return true;
            });
        });
    }

    //        #          #                 ###                                                     ###          ##                                  #    ###
    //                   #                 #  #                                                     #          #  #                                 #    #  #
    // ###   ##     ##   # #   #  #  ###   #  #   ##    ###    ##   #  #  ###    ##    ##    ###    #    ###   #     #  #  ###   ###    ##   ###   ###   #  #   ##    ##   # #
    // #  #   #    #     ##    #  #  #  #  ###   # ##  ##     #  #  #  #  #  #  #     # ##  ##      #    #  #  #     #  #  #  #  #  #  # ##  #  #   #    ###   #  #  #  #  ####
    // #  #   #    #     # #   #  #  #  #  # #   ##      ##   #  #  #  #  #     #     ##      ##    #    #  #  #  #  #  #  #     #     ##    #  #   #    # #   #  #  #  #  #  #
    // ###   ###    ##   #  #   ###  ###   #  #   ##   ###     ##    ###  #      ##    ##   ###    ###   #  #   ##    ###  #     #      ##   #  #    ##  #  #   ##    ##   #  #
    // #                             #
    /**
     * Assigns creeps to pickup resources in their current room.
     * @param {Creeps[]} creeps The creeps to assign this task to.
     * @param {Creeps[]} allCreeps All creeps.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static pickupResourcesInCurrentRoom(creeps, allCreeps, say) {
        const creepsByRoom = _.groupBy(creeps, (c) => c.room.name);

        _.forEach(Object.keys(creepsByRoom), (roomName) => {
            const resources = Cache.sortedResourcesInRoom(Game.rooms[roomName]);

            _.forEach(creepsByRoom[roomName], (creep) => {
                _.forEach(_.filter(resources, (r) => r.amount > creep.pos.getRangeTo(r)), (resource) => {
                    if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === resource.id).length > 0) {
                        return true;
                    }
                    if (new TaskPickupResource(resource.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        return false;
                    }

                    return true;
                });
            });
        });
    }

    //                                  #   ##    #     #                #
    //                                  #  #  #   #     #                #
    // ###    ###  ###    ###   ##    ###  #  #  ###   ###    ###   ##   # #
    // #  #  #  #  #  #  #  #  # ##  #  #  ####   #     #    #  #  #     ##
    // #     # ##  #  #   ##   ##    #  #  #  #   #     #    # ##  #     # #
    // #      # #  #  #  #      ##    ###  #  #    ##    ##   # #   ##   #  #
    //                    ###
    /**
     * Assigns creeps to attack other creeps at range.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} creepsToAttack The list of creeps to attack.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static rangedAttack(creeps, creepsToAttack, say) {
        let firstCreep;

        // Bail if there are no creeps to heal.
        if (!creepsToAttack || creepsToAttack.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            let task;

            ({0: firstCreep} = creepsToAttack);

            if (!firstCreep) {
                return;
            } else if (creep.pos.getRangeTo(firstCreep) <= 1) {
                // Attack the first creep when in range.
                task = new TaskRangedAttack(firstCreep.id);
            } else {
                const closeCreeps = _.filter(creepsToAttack, (c) => creep.pos.getRangeTo(c) <= 3);

                // Rally towards the most hurt creep.
                task = new TaskRally(firstCreep.pos, "position");

                // If there are any creeps within 3 range, attack them.
                if (closeCreeps.length > 0) {
                    ({0: {id: task.rangedAttack}} = closeCreeps);
                }
            }

            if (task.canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    //                          #           ##          #     #     #                ##     ##    #                       #                             ###          ##                                  #    ###
    //                                     #  #               #                       #    #  #   #                       #                              #          #  #                                 #    #  #
    // ###    ##   ###    ###  ##    ###   #     ###   ##    ###   ##     ##    ###   #     #    ###   ###   #  #   ##   ###   #  #  ###    ##    ###    #    ###   #     #  #  ###   ###    ##   ###   ###   #  #   ##    ##   # #
    // #  #  # ##  #  #  #  #   #    #  #  #     #  #   #     #     #    #     #  #   #      #    #    #  #  #  #  #      #    #  #  #  #  # ##  ##      #    #  #  #     #  #  #  #  #  #  # ##  #  #   #    ###   #  #  #  #  ####
    // #     ##    #  #  # ##   #    #     #  #  #      #     #     #    #     # ##   #    #  #   #    #     #  #  #      #    #  #  #     ##      ##    #    #  #  #  #  #  #  #     #     ##    #  #   #    # #   #  #  #  #  #  #
    // #      ##   ###    # #  ###   #      ##   #     ###     ##  ###    ##    # #  ###    ##     ##  #      ###   ##     ##   ###  #      ##   ###    ###   #  #   ##    ###  #     #      ##   #  #    ##  #  #   ##    ##   #  #
    //             #
    /**
     * Assigns creeps to repair a structure in the current room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static repairCriticalStructuresInCurrentRoom(creeps, say) {
        const creepsByRoom = _.groupBy(creeps, (c) => c.room.name);

        _.forEach(Object.keys(creepsByRoom), (roomName) => {
            const structures = Cache.criticalRepairableStructuresInRoom(Game.rooms[roomName]),
                {[roomName]: creepsInRoom} = creepsByRoom;

            _.forEach(structures, (structure) => {
                _.forEach(Utilities.objectsClosestToObj(creepsInRoom, structure), (creep) => {
                    if (new TaskRepair(structure.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }
                        _.remove(creepsInRoom, (c) => c.id === creep.id);

                        return false;
                    }

                    return true;
                });
            });
        });
    }

    //                          #           ##    #                       #
    //                                     #  #   #                       #
    // ###    ##   ###    ###  ##    ###    #    ###   ###   #  #   ##   ###   #  #  ###    ##    ###
    // #  #  # ##  #  #  #  #   #    #  #    #    #    #  #  #  #  #      #    #  #  #  #  # ##  ##
    // #     ##    #  #  # ##   #    #     #  #   #    #     #  #  #      #    #  #  #     ##      ##
    // #      ##   ###    # #  ###   #      ##     ##  #      ###   ##     ##   ###  #      ##   ###
    //             #
    /**
     * Assigns creeps to repair a structure.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} allCreeps All creeps.
     * @param {Structure[]} structures The structures to repair.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static repairStructures(creeps, allCreeps, structures, say) {
        if (!structures || structures.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            _.forEach(structures, (structure) => {
                if (_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === structure.id).length === 0) {
                    if (new TaskRepair(structure.id).canAssign(creep)) {
                        if (say) {
                            creep.say(say);
                        }

                        return false;
                    }
                }

                return true;
            });
        });
    }

    //                                             ##                #                ##    ##
    //                                            #  #               #                 #     #
    // ###    ##    ###    ##   ###   # #    ##   #      ##   ###   ###   ###    ##    #     #     ##   ###
    // #  #  # ##  ##     # ##  #  #  # #   # ##  #     #  #  #  #   #    #  #  #  #   #     #    # ##  #  #
    // #     ##      ##   ##    #     # #   ##    #  #  #  #  #  #   #    #     #  #   #     #    ##    #
    // #      ##   ###     ##   #      #     ##    ##    ##   #  #    ##  #      ##   ###   ###    ##   #
    /**
     * Assigns creeps to reserve a controller in a room.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Room} room The room of the controller to observe.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static reserveController(creeps, room, say) {
        if (room && !room.unobservable && room.controller) {
            _.forEach(creeps, (creep) => {
                // If the controller has been claimed, turn into a base and suicide the creep.
                if (room.controller.my) {
                    Commands.setRoomType(room.name, {type: "base"});
                    if (new TaskSuicide().canAssign(creep)) {
                        creep.say("RIP :(");
                    }

                    return;
                }
                if (new TaskReserve().canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            });
        }
    }

    //              #                       #     ##                     #  #         #     #
    //              #                       #    #  #                    #  #               #
    // ###    ##   ###   ###    ##    ###  ###   #  #  ###   # #   #  #  #  #  ###   ##    ###
    // #  #  # ##   #    #  #  # ##  #  #   #    ####  #  #  ####  #  #  #  #  #  #   #     #
    // #     ##     #    #     ##    # ##   #    #  #  #     #  #   # #  #  #  #  #   #     #
    // #      ##     ##  #      ##    # #    ##  #  #  #     #  #    #    ##   #  #  ###     ##
    //                                                              #
    /**
     * Assigns an army unit to retreat when hurt.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} healers The healers to check against.
     * @param {string} stageRoomName The name of the staging room.
     * @param {string} attackRoomName The name of the attack room.
     * @param {number} minHealthPercent The minimum amount a health a unit must have to not retreat.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static retreatArmyUnit(creeps, healers, stageRoomName, attackRoomName, minHealthPercent, say) {
        // Bail if there are no healers.
        if (!healers || healers.length === 0) {
            return;
        }

        // Only retreat if there is somewhere to retreat to.
        if (stageRoomName !== attackRoomName) {
            const task = new TaskRally(stageRoomName, "room");

            // Creeps will retreat if they are in the attack room or within 2 squares of a room edge.  They must be below the minimum health percentage to retreat.
            _.forEach(_.filter(creeps, (c) => (c.room.name === attackRoomName || c.pos.x <= 1 || c.pos.x >= 48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hits / c.hitsMax < minHealthPercent), (creep) => {
                if (task.canAssign(creep)) {
                    ({time: creep.memory.currentTask.priority} = Game);
                    if (say) {
                        creep.say(say);
                    }
                }
            });
        }
    }

    //              #                       #     ##                     #  #         #     #     ##         #  #                    ###         #  #              ##
    //              #                       #    #  #                    #  #               #    #  #        ####                     #          #  #               #
    // ###    ##   ###   ###    ##    ###  ###   #  #  ###   # #   #  #  #  #  ###   ##    ###   #  #  ###   ####   ##   # #    ##    #     ##   ####   ##    ###   #     ##   ###
    // #  #  # ##   #    #  #  # ##  #  #   #    ####  #  #  ####  #  #  #  #  #  #   #     #    #  #  #  #  #  #  #  #  # #   # ##   #    #  #  #  #  # ##  #  #   #    # ##  #  #
    // #     ##     #    #     ##    # ##   #    #  #  #     #  #   # #  #  #  #  #   #     #    #  #  #     #  #  #  #  # #   ##     #    #  #  #  #  ##    # ##   #    ##    #
    // #      ##     ##  #      ##    # #    ##  #  #  #     #  #    #    ##   #  #  ###     ##   ##   #     #  #   ##    #     ##    #     ##   #  #   ##    # #  ###    ##   #
    //                                                              #
    /**
     * Assigns an army unit to retreat when hurt or move to a healer if too far from one.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {Creep[]} healers The healers to check against.
     * @param {string} stageRoomName The name of the staging room.
     * @param {string} attackRoomName The name of the attack room.
     * @param {number} minHealthPercent The minimum amount a health a unit must have to not retreat.
     * @param {string} say Text to say on successful assignment for retreating only.
     * @return {void}
     */
    static retreatArmyUnitOrMoveToHealer(creeps, healers, stageRoomName, attackRoomName, minHealthPercent, say) {
        // Bail if there are no healers.
        if (!healers || healers.length === 0) {
            return;
        }

        // Only retreat if there is somewhere to retreat to.
        if (stageRoomName !== attackRoomName) {
            const task = new TaskRally(stageRoomName, "room");

            // Creeps will retreat if they are in the attack room or within 2 squares of a room edge.  They must be below the minimum health percentage to retreat.
            _.forEach(_.filter(creeps, (c) => (c.room.name === attackRoomName || c.pos.x <= 1 || c.pos.x >= 48 || c.pos.y <= 1 || c.pos.y >= 48) && c.hits / c.hitsMax < minHealthPercent), (creep) => {
                if (task.canAssign(creep)) {
                    ({time: creep.memory.currentTask.priority} = Game);
                    if (say) {
                        creep.say(say);
                    }
                }
            });
        }

        // Only move towards a healer if there are any not escorting other creeps.
        const healersNotEscorting = _.filter(healers, (h) => !h.memory.escorting);

        if (healersNotEscorting.length > 0) {
            _.forEach(creeps, (creep) => {
                const closest = Utilities.objectsClosestToObj(healersNotEscorting, creep);
                let task;

                // Check to see if the closest healer is further than 2 squares away, rally to it if so.
                if (closest[0].pos.getRangeTo(creep) > 2) {
                    task = new TaskRally(closest[0].pos, "position");
                    if (task.canAssign(creep)) {
                        ({time: creep.memory.currentTask.priority} = Game);
                    }
                }
            });
        }
    }

    //         #
    //         #
    //  ###   ###    ##   # #   ###
    // ##      #    #  #  ####  #  #
    //   ##    #    #  #  #  #  #  #
    // ###      ##   ##   #  #  ###
    //                          #
    /**
     * Assign creeps to stomp out hostile construction sites.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {ConstructionSite[]} sites The list of construction sites to stomp.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static stomp(creeps, sites, say) {
        if (!sites || sites.length === 0) {
            return;
        }

        _.forEach(creeps, (creep) => {
            if (new TaskRally(Utilities.objectsClosestToObj(sites, creep)[0].pos, "position").canAssign(creep)) {
                ({time: creep.memory.currentTask.priority} = Game);
                if (say) {
                    creep.say(say);
                }
            }
        });
    }

    //                                  #         ##                #                ##    ##
    //                                  #        #  #               #                 #     #
    // #  #  ###    ###  ###    ###   ###   ##   #      ##   ###   ###   ###    ##    #     #     ##   ###
    // #  #  #  #  #  #  #  #  #  #  #  #  # ##  #     #  #  #  #   #    #  #  #  #   #     #    # ##  #  #
    // #  #  #  #   ##   #     # ##  #  #  ##    #  #  #  #  #  #   #    #     #  #   #     #    ##    #
    //  ###  ###   #     #      # #   ###   ##    ##    ##   #  #    ##  #      ##   ###   ###    ##   #
    //       #      ###
    /**
     * Assigns creeps to upgrade controllers.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {StructureController} controller The controller to upgrade.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static upgradeController(creeps, controller, say) {
        if (controller.my) {
            const task = new TaskUpgradeController(controller.room.name);

            _.forEach(creeps, (creep) => {
                if (task.canAssign(creep)) {
                    if (say) {
                        creep.say(say);
                    }
                }
            });
        }
    }

    //                                  #         ##          #     #     #                ##     ##                #                ##    ##
    //                                  #        #  #               #                       #    #  #               #                 #     #
    // #  #  ###    ###  ###    ###   ###   ##   #     ###   ##    ###   ##     ##    ###   #    #      ##   ###   ###   ###    ##    #     #     ##   ###
    // #  #  #  #  #  #  #  #  #  #  #  #  # ##  #     #  #   #     #     #    #     #  #   #    #     #  #  #  #   #    #  #  #  #   #     #    # ##  #  #
    // #  #  #  #   ##   #     # ##  #  #  ##    #  #  #      #     #     #    #     # ##   #    #  #  #  #  #  #   #    #     #  #   #     #    ##    #
    //  ###  ###   #     #      # #   ###   ##    ##   #     ###     ##  ###    ##    # #  ###    ##    ##   #  #    ##  #      ##   ###   ###    ##   #
    //       #      ###
    /**
     * Assigns creeps to upgrade controllers that are critically low.
     * @param {Creep[]} creeps The creeps to assign this task to.
     * @param {StructureController} controller The controller to upgrade.
     * @param {string} say Text to say on successful assignment.
     * @return {void}
     */
    static upgradeCriticalController(creeps, controller, say) {
        if (controller.my && controller.ticksToDowngrade < [0, 10000, 3500, 5000, 10000, 20000, 30000, 50000, 100000][controller.level]) {
            if (new TaskUpgradeController(controller.room.name).canAssign(creeps[0])) {
                if (say) {
                    creeps[0].say(say);
                }
            }
        }
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Assign, "Assign");
}
module.exports = Assign;
