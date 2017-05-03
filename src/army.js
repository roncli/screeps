var Cache = require("cache"),
    Utilities = require("utilities"),
    RoleArmyDismantler = require("role.armyDismantler"),
    RoleArmyHealer = require("role.armyHealer"),
    RoleArmyMelee = require("role.armyMelee"),
    RoleArmyRanged = require("role.armyRanged"),
    TaskHeal = require("task.heal"),
    TaskMeleeAttack = require("task.meleeAttack"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack");

class Army {
    /**
     * Create an army.
     * 
     * @param {string} name The name of the army.
     * @param {Object} settings The settings for the army.
     * @param {string} settings.attackRoom The room to attack.
     * @param {string} [settings.boostRoom] The room to obtain boosts from.
     * @param {string} [settings.directive] The army's standing orders.  Defaults to "preparing".
     * @param {string[]} [settings.dismantle] An array of object IDs that the army should dismantle during the dismantle directive.
     * @param {Object} settings.dismantler The dismantler creeps for the army.
     * @param {bool} [settings.dismantler.escort] Assigns a healer to this creep.
     * @param {number} settings.dismantler.maxCreeps The number of dismantler creeps in the army.
     * @param {number} settings.dismantler.units The number of WORK parts on each dismantler creep.  Max 20.
     * @param {Object} settings.healer The healer creeps for the army.
     * @param {number} settings.healer.maxCreeps The number of healer creeps in the army.
     * @param {number} settings.healer.units The number of HEAL parts on each healer creep.  Max 20.
     * @param {Object} settings.melee The melee creeps for the army.
     * @param {bool} [settings.melee.escort] Assigns a healer to this creep.
     * @param {number} settings.melee.maxCreeps The number of melee creeps in the army.
     * @param {number} settings.melee.units The number of ATTACK parts on each melee creep.  Max 20.
     * @param {string[]} [settings.portals] An array of room names with portals in them that the creep should take.
     * @param {Object} settings.ranged The ranged creeps for the army.
     * @param {bool} [settings.ranged.escort] Assigns a healer to this creep.
     * @param {number} settings.ranged.maxCreeps The number of ranged creeps in the army.
     * @param {number} settings.ranged.units The number of RANGED_ATTACK parts on each ranged creep.  Max 20.
     * @param {string} settings.region The region the creeps should spawn from.
     * @param {bool} settings.reinforce Reinforces the army as it loses creeps.
     * @param {Object} [settings.restPosition] The position the army should rest at when it has nothing to do.
     * @param {string} settings.restPosition.room The room to rest in.
     * @param {number} settings.restPosition.x The X coordinate to rest at.
     * @param {number} settings.restPosition.y The Y coordinate to rest at.
     * @param {Object} [settings.safeMode] The settings to use when the assigned attack room goes into safe mode.
     * @param {number} [settings.scheduled] The Game.time value at which to begin producing the army.
     * @param {string} settings.stageRoom The room to move to once building is complete.
     * @param {success} [settings.success] Whether this army has succeeded.  Armies that aren't reinforced will be removed from memory once the last creep dies.
     */
    constructor(name, settings) {
        settings = _.extend(settings, {directive: "preparing"});

        if (!Memory.army[name]) {
            Memory.army[name] = settings;
        }
        _.assign(this, settings);

        this.name = name;
        this.army = Memory.army[name];
    }

    run() {
        var name = this.name,
            allCreepsInArmy = Cache.creeps[name] && Cache.creeps[name].all || [],
            boostRoomName = this.boostRoom,
            attackRoom = Game.rooms[this.attackRoom],
            dismantler = this.dismantler,
            healer = this.healer,
            melee = this.melee,
            ranged = this.ranged,
            boostRoomStorageStore, hostileConstructionSites, hostiles, tasks;

        // Bail if scheduled for the future.
        if (this.scheduled && this.scheduled > Game.time) {
            return;
        }
        
        if (boostRoomName) {
            boostRoomStorageStore = Game.rooms[boostRoomName].storage.store;
        }

        // Delete the army if we're successful.
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
            this.stageRoom = this.safeMode.stageRoom;
            this.attackRoom = this.safeMode.attackRoom;
            this.dismantle = this.safeMode.dismantle;
            this.safeMode = this.safeMode.safeMode;
        }

        // Determine conditions for next stage or success.
        switch (this.directive) {
            case "preparing":
                if (!boostRoomName || !boostRoomStorageStore) {
                    this.directive = "building";
                } else if (
                    (boostRoomStorageStore[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] || 0) >= 30 * 5 * (dismantler.maxCreeps + melee.maxCreeps + ranged.maxCreeps + healer.maxCreeps) &&
                    (boostRoomStorageStore[RESOURCE_CATALYZED_ZYNTHIUM_ACID] || 0) >= 30 * dismantler.units * dismantler.maxCreeps &&
                    (boostRoomStorageStore[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE] || 0) >= 30 * healer.units * healer.maxCreeps
                ) {
                    this.directive = "building";
                }
                break;
            case "building":
                if (_.filter(allCreepsInArmy, (c) => c.room.name !== this.buildRoom).length === 0 && _.filter(allCreepsInArmy, (c) => c.room.name === this.buildRoom).length >= dismantler.maxCreeps + healer.maxCreeps + melee.maxCreeps + ranged.maxCreeps) {
                    this.directive = "staging";
                }
                break;
            case "staging":
                if (_.filter(allCreepsInArmy, (c) => c.room.name !== this.stageRoom).length === 0) {
                    this.directive = "dismantle";
                }
                break;
            case "dismantle":
                if (!this.dismantle) {
                    this.directive = "attack";
                } else if (attackRoom) {
                    this.dismantle = _.filter(this.dismantle, (d) => Game.getObjectById(d));

                    if (this.dismantle.length === 0) {
                        this.directive = "attack";
                    }
                }
                break;
            case "attack":
                if (attackRoom) {
                    hostileConstructionSites = attackRoom.find(FIND_HOSTILE_CONSTRUCTION_SITES);

                    if (!this.reinforce && _.filter(attackRoom.find(FIND_HOSTILE_STRUCTURES), (s) => !(s.structureType === STRUCTURE_CONTROLLER) && !(s.structureType === STRUCTURE_RAMPART) && !(s.structureType === STRUCTURE_KEEPER_LAIR)).length === 0 && hostileConstructionSites.length === 0) {
                        this.success = true;
                    }
                }
                break;
        }

        // Check spawns if we're building.
        if (this.directive === "building" || this.reinforce) {
            RoleArmyDismantler.checkSpawn(this);
            RoleArmyHealer.checkSpawn(this);
            RoleArmyMelee.checkSpawn(this);
            RoleArmyRanged.checkSpawn(this);
        }

        // Assign escorts.
        if (dismantler.escort || melee.escort || ranged.escort) {
            _.forEach(_.filter(Cache.creeps[name] && Cache.creeps[name].armyHealer || [], (c) => !c.memory.escorting && !c.spawning), (healer) => {
                var escort = [].concat.apply([], [
                    dismantler.escort && Cache.creeps[name].armyDismantler ? _.filter(Cache.creeps[name].armyDismantler, (c) => !c.memory.escortedBy && !c.spawning) : [],
                    melee.escort && Cache.creeps[name].armyMelee ? _.filter(Cache.creeps[name].armyMelee, (c) => !c.memory.escortedBy && !c.spawning) : [],
                    ranged.escort && Cache.creeps[name].armyRanged ? _.filter(Cache.creeps[name].armyRanged, (c) => !c.memory.escortedBy && !c.spawning) : []
                ])[0];

                if (escort) {
                    healer.memory.escorting = escort.id;
                    escort.memory.escortedBy = healer.id;
                } else {
                    return false;
                }
            });
        }

        // Create tasks.
        tasks = {
            melee: { tasks: [] },
            ranged: { tasks: [] },
            heal: {
                tasks: _.map(_.filter(allCreepsInArmy, (c) => c.hits < c.hitsMax).sort((a, b) => b.hitsMax - b.hits - (a.hitsMax - a.hits)), (c) => new TaskHeal(c.id))
            },
            rally: { tasks: [] }
        };

        if (attackRoom) {
            switch (this.directive) {
                case "dismantle":
                    hostiles = _.filter(Cache.hostilesInRoom(attackRoom), (c) => Utilities.objectsClosestToObj(allCreepsInArmy, c)[0].pos.getRangeTo(c) <= 3);
                    tasks.ranged.tasks = _.map(hostiles, (c) => new TaskRangedAttack(c.id));
                    tasks.melee.tasks = _.map(hostiles, (c) => new TaskMeleeAttack(c.id));
                    break;
                case "attack":
                    hostiles = Cache.hostilesInRoom(attackRoom);
                    tasks.melee.tasks = _.map(hostiles, (c) => new TaskMeleeAttack(c.id));
                    tasks.ranged.tasks = _.map(hostiles, (c) => new TaskRangedAttack(c.id));
                    if (hostileConstructionSites) {
                        tasks.rally.tasks = _.map(hostileConstructionSites, (c) => new TaskRally(c.id));
                    }
                    break;
            }
        }

        // Assign tasks.
        RoleArmyDismantler.assignTasks(this, tasks);
        RoleArmyHealer.assignTasks(this, tasks);
        RoleArmyMelee.assignTasks(this, tasks);
        RoleArmyRanged.assignTasks(this, tasks);
    }

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
                ranged: this.ranged,
                region: this.region,
                reinforce: this.reinforce,
                restPosition: this.restPosition,
                safeMode: this.safeMode,
                scheduled: this.scheduled,
                stageRoom: this.stageRoom,
                success: this.success
            };
        }
    }

    static fromObj(armyName, army) {
        return new Army(armyName, army);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Army, "Army");
}
module.exports = Army;
