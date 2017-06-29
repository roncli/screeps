const Cache = require("cache"),
    Utilities = require("utilities"),
    RoleArmyDismantler = require("role.armyDismantler"),
    RoleArmyHealer = require("role.armyHealer"),
    RoleArmyMelee = require("role.armyMelee"),
    RoleArmyRanged = require("role.armyRanged");

//    #
//   # #
//  #   #  # ##   ## #   #   #
//  #   #  ##  #  # # #  #   #
//  #####  #      # # #  #  ##
//  #   #  #      # # #   ## #
//  #   #  #      #   #      #
//                       #   #
//                        ###
/**
 * Represents an army.
 */
class Army {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Create a new Army object.
     * @param {string} name The name of the army.
     * @param {object} settings The settings for the army.
     */
    constructor(name, settings) {
        // Default settings.
        if (!settings.directive) {
            settings.directive = "preparing";
        }

        // Assign settings to memory if the memory doesn't exist.
        if (!Memory.army[name]) {
            Memory.army[name] = settings;
        }

        // Set the settings on the Army object.
        _.extend(this, settings);

        // Set the name of the army and the memory location.
        this.name = name;
    }

    // ###   #  #  ###
    // #  #  #  #  #  #
    // #     #  #  #  #
    // #      ###  #  #
    /**
     * Runs the army.
     * @return {void}
     */
    run() {
        const {name, dismantler, healer, melee, ranged} = this,
            allCreepsInArmy = Cache.creeps[name] && Cache.creeps[name].all || [],
            {rooms: {[this.attackRoom]: attackRoom}} = Game;

        // Bail if scheduled for the future.
        if (this.scheduled && this.scheduled > Game.time) {
            return;
        }

        // Set the army to be deleted if we're successful.
        if (allCreepsInArmy.length === 0 && this.success) {
            this.delete = true;

            return;
        }

        // Reset army if we have no creeps.
        if (this.directive !== "preparing" && this.directive !== "building" && allCreepsInArmy.length === 0 && !this.success) {
            Game.notify(`Army ${name} operation failed, restarting.`);
            this.directive = "preparing";
        }

        // If the attack room is in safe mode, activate backup plan, if any.
        if (this.safeMode && attackRoom && attackRoom.controller && attackRoom.controller.safeMode) {
            this.directive = "staging";
            ({safeMode: {stageRoom: this.stageRoom, attackRoom: this.attackRoom, dismantle: this.dismantle, safeMode: this.safeMode}} = this);
        }

        // Directive is "preparing" if we have a boost room and we're missing some resources.
        if (this.directive === "preparing") {
            const {boostRoom: boostRoomName} = this;

            if (boostRoomName) {
                const {rooms: {[boostRoomName]: boostedRoom}} = Game,
                    {storage: {store: boostRoomStorageStore}} = boostedRoom;

                if (!boostRoomStorageStore ||
                    (boostRoomStorageStore[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] || 0) >= 30 * 5 * (dismantler.maxCreeps + melee.maxCreeps + ranged.maxCreeps + healer.maxCreeps) &&
                    (boostRoomStorageStore[RESOURCE_CATALYZED_ZYNTHIUM_ACID] || 0) >= 30 * dismantler.units * dismantler.maxCreeps &&
                    (boostRoomStorageStore[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE] || 0) >= 30 * healer.units * healer.maxCreeps
                ) {
                    this.directive = "building";
                }
            } else {
                this.directive = "building";
            }
        }

        // Directive is "building" until the creeps are spawned in and in the build room.
        if (this.directive === "building") {
            if (_.filter(allCreepsInArmy, (c) => c.room.name !== this.buildRoom).length === 0 && _.filter(allCreepsInArmy, (c) => c.room.name === this.buildRoom).length >= dismantler.maxCreeps + healer.maxCreeps + melee.maxCreeps + ranged.maxCreeps) {
                this.directive = "staging";
            }
        }

        // Directive is "staging" until the creeps are in the attack room.
        if (this.directive === "staging") {
            if (_.filter(allCreepsInArmy, (c) => c.room.name !== this.stageRoom).length === 0) {
                this.directive = "dismantle";
            }
        }

        // Directive is "dismantle" until the objects in the dismantle setting are destroyed.
        if (this.directive === "dismantle") {
            if (!this.dismantle) {
                this.directive = "attack";
            } else if (attackRoom) {
                this.dismantle = _.filter(this.dismantle, (d) => Game.getObjectById(d));

                if (this.dismantle.length === 0) {
                    this.directive = "attack";
                }
            }
        }

        // Call success if there is nothing else to do.
        if (attackRoom) {
            this.hostileConstructionSites = Cache.hostileConstructionSitesInRoom(attackRoom);
            if (attackRoom.find(FIND_HOSTILE_CREEPS).length === 0 && !this.reinforce && _.filter(attackRoom.find(FIND_HOSTILE_STRUCTURES), (s) => !(s.structureType === STRUCTURE_CONTROLLER) && !(s.structureType === STRUCTURE_RAMPART) && !(s.structureType === STRUCTURE_KEEPER_LAIR)).length === 0 && this.hostileConstructionSites.length === 0) {
                this.directive = "attack";
                this.success = true;
            }
        }

        // Check spawns if we're building or reinforcing.
        if (this.directive === "building" || this.reinforce) {
            this.checkSpawn("armyDismantler", dismantler.maxCreeps, this.spawnFromRegion.bind(this, RoleArmyDismantler));
            this.checkSpawn("armyHealer", healer.maxCreeps, this.spawnFromRegion.bind(this, RoleArmyHealer));
            this.checkSpawn("armyMelee", melee.maxCreeps, this.spawnFromRegion.bind(this, RoleArmyMelee));
            this.checkSpawn("armyRanged", ranged.maxCreeps, this.spawnFromRegion.bind(this, RoleArmyRanged));
        }

        // Assign escorts.
        if (dismantler.escort || melee.escort || ranged.escort) {
            _.forEach(_.filter(Cache.creeps[name] && Cache.creeps[name].armyHealer || [], (c) => !c.memory.escorting && !c.spawning), (creep) => {
                const {0: escort} = Array.prototype.concat.apply([], [
                    dismantler.escort && Cache.creeps[name].armyDismantler ? _.filter(Cache.creeps[name].armyDismantler, (c) => (!c.memory.escortedBy || !Game.getObjectById(c.memory.escortedBy)) && !c.spawning) : [],
                    melee.escort && Cache.creeps[name].armyMelee ? _.filter(Cache.creeps[name].armyMelee, (c) => (!c.memory.escortedBy || !Game.getObjectById(c.memory.escortedBy)) && !c.spawning) : [],
                    ranged.escort && Cache.creeps[name].armyRanged ? _.filter(Cache.creeps[name].armyRanged, (c) => (!c.memory.escortedBy || !Game.getObjectById(c.memory.escortedBy)) && !c.spawning) : []
                ]);

                if (escort) {
                    ({id: creep.memory.escorting} = escort);
                    ({id: escort.memory.escortedBy} = creep);
                } else {
                    return false;
                }

                return true;
            });
        }

        // Go after hostiles in the attack room during "dismantle" and "attack" directives, but only within 3 squares if we're dismantling.
        if (attackRoom) {
            switch (this.directive) {
                case "attack":
                    this.hostiles = Cache.hostilesInRoom(attackRoom);
                    break;
                default:
                    if (allCreepsInArmy.length > 0) {
                        this.hostiles = _.filter(Cache.hostilesInRoom(attackRoom), (c) => Utilities.objectsClosestToObj(allCreepsInArmy, c)[0].pos.getRangeTo(c) <= 3);
                    } else {
                        this.hostiles = [];
                    }
                    break;
            }
        }

        // Assign tasks.
        RoleArmyDismantler.assignTasks(this);
        RoleArmyHealer.assignTasks(this);
        RoleArmyMelee.assignTasks(this);
        RoleArmyRanged.assignTasks(this);
    }

    //       #                 #      ##
    //       #                 #     #  #
    //  ##   ###    ##    ##   # #    #    ###    ###  #  #  ###
    // #     #  #  # ##  #     ##      #   #  #  #  #  #  #  #  #
    // #     #  #  ##    #     # #   #  #  #  #  # ##  ####  #  #
    //  ##   #  #   ##    ##   #  #   ##   ###    # #  ####  #  #
    //                                     #
    /**
     * Checks whether we should spawn for the role.
     * @param {string} role The role of the creep.
     * @param {number} max The maximum number of creeps that should be spawned.
     * @param {function} successCallback The callback to run on success.
     * @return {void}
     */
    checkSpawn(role, max, successCallback) {
        const {name: armyName} = this,
            {length: count} = _.filter(Cache.creeps[armyName] && Cache.creeps[armyName][role] || [], (c) => c.spawning || c.ticksToLive > 300);

        if (count < max) {
            successCallback();
        }

        // Output creep count in the report.
        if (max > 0 || count > 0) {
            if (!Memory.creepCount[armyName]) {
                Memory.creepCount[armyName] = [];
            }
            Memory.creepCount[armyName].push({role, count, max});
        }
    }

    //                                ####                    ###                #
    //                                #                       #  #
    //  ###   ###    ###  #  #  ###   ###   ###    ##   # #   #  #   ##    ###  ##     ##   ###
    // ##     #  #  #  #  #  #  #  #  #     #  #  #  #  ####  ###   # ##  #  #   #    #  #  #  #
    //   ##   #  #  # ##  ####  #  #  #     #     #  #  #  #  # #   ##     ##    #    #  #  #  #
    // ###    ###    # #  ####  #  #  #     #      ##   #  #  #  #   ##   #     ###    ##   #  #
    //        #                                                            ###
    /**
     * Spawn a creep for this army from within the region.
     * @param {class} Role The class of the role to create the creep for.
     * @return {bool} Whether the creep was spawned.
     */
    spawnFromRegion(Role) {
        const settings = Role.spawnSettings(this),
            spawns = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(settings.body) && s.room.memory.region === this.region);
        let boostRoom, labsInUse, labsToBoostWith;

        // Fail if we cannot fulfill the spawn request.
        if (spawns.length === 0) {
            return false;
        }

        // Fail if we're supposed to boost, but can't.
        if (this.boostRoom) {
            ({rooms: {[this.boostRoom]: boostRoom}} = Game);
            ({memory: {labsInUse}} = boostRoom);
            if (boostRoom && !(labsToBoostWith = Utilities.getLabToBoostWith(boostRoom, Object.keys(settings.boosts).length))) {
                return false;
            }
        }

        // Create the creep from the first listed spawn that is available.
        const name = spawns[0].createCreep(settings.body, `${settings.name}-${this.name}-${Game.time.toFixed(0).substring(4)}`, {role: settings.name, army: this.name, labs: boostRoom ? _.map(labsToBoostWith, (l) => l.id) : [], portals: this.portals});

        Cache.spawning[spawns[0].id] = typeof name !== "number";

        if (typeof name !== "number" && boostRoom) {
            // Set the labs to be in use.
            let labIndex = 0;

            _.forEach(settings.boosts, (amount, resource) => {
                labsToBoostWith[labIndex].creepToBoost = name;
                labsToBoostWith[labIndex].resource = resource;
                labsToBoostWith[labIndex].amount = 30 * amount;
                labsInUse.push(labsToBoostWith[labIndex]);

                labIndex++;
            });

            // If anything is coming to fill the labs, stop them.
            if (Cache.creeps[boostRoom.name]) {
                _.forEach(_.filter(Cache.creeps[boostRoom.name].all, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && _.map(labsToBoostWith, (l) => l.id).indexOf(c.memory.currentTask.id) !== -1), (creep) => {
                    delete creep.memory.currentTask;
                });
            }
        }

        return typeof name !== "number";
    }

    //  #           ##   #       #
    //  #          #  #  #
    // ###    ##   #  #  ###     #
    //  #    #  #  #  #  #  #    #
    //  #    #  #  #  #  #  #    #
    //   ##   ##    ##   ###   # #
    //                          #
    /**
     * Serializes the army to memory.
     * @return {void}
     */
    toObj() {
        if (this.delete) {
            delete Memory.army[this.name];
        } else {
            Memory.army[this.name] = {
                attackRoom: this.attackRoom,
                boostRoom: this.boostRoom,
                buildRoom: this.buildRoom,
                directive: this.directive,
                dismantle: this.dismantle,
                dismantler: this.dismantler,
                healer: this.healer,
                melee: this.melee,
                portals: this.portals,
                ranged: this.ranged,
                region: this.region,
                reinforce: this.reinforce,
                restPosition: this.restPosition,
                safeMode: this.safeMode,
                scheduled: this.scheduled,
                stageRoom: this.stageRoom,
                success: this.success,
                super: this.super
            };
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
     * Deserializes the object from memory.
     * @param {string} armyName The name of the army.
     * @param {object} army The army object from memory.
     * @return {Army} The Army object.
     */
    static fromObj(armyName, army) {
        return new Army(armyName, army);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Army, "Army");
}
module.exports = Army;
