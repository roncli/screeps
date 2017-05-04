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

/**
 * Represents an army.
 */
class Army {
    /**
     * Create a new Army object.
     * @param {string} name The name of the army.
     * @param {object} settings The settings for the army.
     */
    constructor(name, settings) {
        // Default settings.
        settings = _.extend(settings, {directive: "preparing"});

        // Assign settings to memory if the memory doesn't exist.
        if (!Memory.army[name]) {
            Memory.army[name] = settings;
        }

        // Set the settings on the Army object.
        _.extend(this, settings);

        // Set the name of the army and the memory location.
        this.name = name;
    }

    /**
     * Runs the army.
     */
    run() {
        var name = this.name,
            allCreepsInArmy = Cache.creeps[name] && Cache.creeps[name].all || [],
            attackRoom = Game.rooms[this.attackRoom],
            dismantler = this.dismantler,
            healer = this.healer,
            melee = this.melee,
            ranged = this.ranged,
            hostileConstructionSites, tasks;

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
            this.stageRoom = this.safeMode.stageRoom;
            this.attackRoom = this.safeMode.attackRoom;
            this.dismantle = this.safeMode.dismantle;
            this.safeMode = this.safeMode.safeMode;
        }

        // Directive is "preparing" if we have a boost room and we're missing some compounds.
        if (this.directive === "preparing") {
            let boostRoomName = this.boostRoom;
            
            if (boostRoomName) {
                let boostRoomStorageStore = Game.rooms[boostRoomName].storage.store;

                if (!boostRoomStorageStore || (
                    (boostRoomStorageStore[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] || 0) >= 30 * 5 * (dismantler.maxCreeps + melee.maxCreeps + ranged.maxCreeps + healer.maxCreeps) &&
                    (boostRoomStorageStore[RESOURCE_CATALYZED_ZYNTHIUM_ACID] || 0) >= 30 * dismantler.units * dismantler.maxCreeps &&
                    (boostRoomStorageStore[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE] || 0) >= 30 * healer.units * healer.maxCreeps
                )) {
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

        // Directive is "attack" until the army expires.
        if (this.directive === "attack") {
            if (attackRoom) {
                hostileConstructionSites = attackRoom.find(FIND_HOSTILE_CONSTRUCTION_SITES);

                if (!this.reinforce && _.filter(attackRoom.find(FIND_HOSTILE_STRUCTURES), (s) => !(s.structureType === STRUCTURE_CONTROLLER) && !(s.structureType === STRUCTURE_RAMPART) && !(s.structureType === STRUCTURE_KEEPER_LAIR)).length === 0 && hostileConstructionSites.length === 0) {
                    this.success = true;
                }
            }
        }

        // Check spawns if we're building or reinforcing.
        if (this.directive === "building" || this.reinforce) {
            this.checkSpawn("armyDismantler", dismantler.maxCreeps, RoleArmyDismantler.spawn.bind(RoleArmyDismantler, this));
            this.checkSpawn("armyHealer", healer.maxCreeps, RoleArmyHealer.spawn.bind(RoleArmyHealer, this));
            this.checkSpawn("armyMelee", melee.maxCreeps, RoleArmyMelee.spawn.bind(RoleArmyMelee, this));
            this.checkSpawn("armyRanged", ranged.maxCreeps, RoleArmyRanged.spawn.bind(RoleArmyRanged, this));
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

        // Go after hostiles in the attack room during "dismantle" and "attack" directives, but only within 3 squares if we're dismantling.
        if (attackRoom) {
            let hostiles;

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

    /**
     * Checks whether we should spawn for the role.
     * @param {string} role The role of the creep.
     * @param {number} max The maximum number of creeps that should be spawned.
     * @param {function} successCallback The callback to run on success.
     * @return {Promise} A promise that resolves if a creep should be spawned.
     */
    checkSpawn(role, max, successCallback) {
        var armyName = this.name,
            count = _.filter(Cache.creeps[armyName] && Cache.creeps[armyName][role] || [], (c) => c.spawning || c.ticksToLive > 300).length,
            armyLog = Cache.log.army[armyName];

        if (count < max) {
            successCallback();
        }

        // Output creep count in the report.
        if (armyLog && (max > 0 || count > 0)) {
            armyLog.creeps.push({
                role: role,
                count: count,
                max: max
            });
        }
    }

    /**
     * Serializes the army to memory.
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
