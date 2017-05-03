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
    constructor(name, settings) {
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
        
        if (attackRoom) {
            hostileConstructionSites = attackRoom.find(FIND_HOSTILE_CONSTRUCTION_SITES);
        }
        
        if (this.boostRoom) {
            boostRoomStorageStore = Game.rooms[this.boostRoom].storage.store;
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
                if (!this.boostRoom) {
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
                if (attackRoom) {
                    this.dismantle = _.filter(this.dismantle, (d) => Game.getObjectById(d));

                    if (this.dismantle.length === 0) {
                        this.directive = "attack";
                    }
                }
                break;
            case "attack":
                if (attackRoom) {
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
                    tasks.rally.tasks = _.map(hostileConstructionSites, (c) => new TaskRally(c.id));
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
                boostRoom: this.success,
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
