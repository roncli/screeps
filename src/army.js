var Cache = require("cache"),
    Utilities = require("utilities"),
    RoleArmyDismantler = require("role.armyDismantler"),
    RoleArmyHealer = require("role.armyHealer"),
    RoleArmyMelee = require("role.armyMelee"),
    RoleArmyRanged = require("role.armyRanged"),
    TaskHeal = require("task.heal"),
    TaskMeleeAttack = require("task.meleeAttack"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),

    Army = {
        run: (name) => {
            var army = Memory.army[name],
                allCreepsInArmy = Cache.creeps[name] && Cache.creeps[name].all || [],
                armyAttackRoom = Game.rooms[army.attackRoom],
                armyDismantlers = army.dismantler,
                armyHealers = army.healer,
                armyMelees = army.melee,
                armyRangeds = army.ranged,
                boostRoomStorageStore, hostileConstructionSites, hostiles, tasks;

            // Bail if scheduled for the future.
            if (army.scheduled && army.scheduled > Game.time) {
                return;
            }
            
            if (armyAttackRoom) {
                hostileConstructionSites = armyAttackRoom.find(FIND_HOSTILE_CONSTRUCTION_SITES);
            }
            
            if (army.boostRoom) {
                boostRoomStorageStore = Game.rooms[army.boostRoom].storage.store
            }

            // Delete the army if we're successful.
            if (allCreepsInArmy.length === 0 && army.success) {
                Game.notify("Army " + name + " operation successful!");
                delete Memory.army[name];
                return;
            }

            // Reset army if we have no creeps.
            if (army.directive !== "preparing" && army.directive !== "building" && allCreepsInArmy.length === 0 && !army.success) {
                Game.notify("Army " + name + " operation failed, restarting.");
                army.directive = "preparing";
            }

            // Determine conditions for next stage or success.
            switch (army.directive) {
                case "preparing":
                    if (!army.boostRoom) {
                        army.directive = "building";
                    } else if (
                        (boostRoomStorageStore[RESOURCE_CATALYZED_GHODIUM_ALKALIDE] || 0) >= 30 * 5 * (armyDismantlers.maxCreeps + armyMelees.maxCreeps + armyRangeds.maxCreeps + armyHealers.maxCreeps) &&
                        (boostRoomStorageStore[RESOURCE_CATALYZED_ZYNTHIUM_ACID] || 0) >= 30 * armyDismantlers.units * armyDismantlers.maxCreeps &&
                        (boostRoomStorageStore[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE] || 0) >= 30 * armyHealers.units * armyHealers.maxCreeps
                    ) {
                        army.directive = "building";
                    }
                    break;
                case "building":
                    if (_.filter(allCreepsInArmy, (c) => c.room.name !== army.buildRoom).length === 0 && _.filter(allCreepsInArmy, (c) => c.room.name === army.buildRoom).length >= armyDismantlers.maxCreeps + armyHealers.maxCreeps + armyMelees.maxCreeps + armyRangeds.maxCreeps) {
                        army.directive = "staging";
                    }
                    break;
                case "staging":
                    if (_.filter(allCreepsInArmy, (c) => c.room.name !== army.stageRoom).length === 0) {
                        army.directive = "dismantle";
                    }
                    break;
                case "dismantle":
                    if (armyAttackRoom) {
                        army.dismantle = _.filter(army.dismantle, (d) => Game.getObjectById(d));

                        if (army.dismantle.length === 0) {
                            army.directive = "attack";
                        }
                    }
                    break;
                case "attack":
                    if (armyAttackRoom) {
                        if (!army.reinforce && _.filter(armyAttackRoom.find(FIND_HOSTILE_STRUCTURES), (s) => !(s.structureType === STRUCTURE_CONTROLLER) && !(s.structureType === STRUCTURE_RAMPART) && !(s.structureType === STRUCTURE_KEEPER_LAIR)).length === 0 && hostileConstructionSites.length === 0) {
                            army.success = true;
                        }
                    }
                    break;
            }

            // Check spawns if we're building.
            if (army.directive === "building" || army.reinforce) {
                RoleArmyDismantler.checkSpawn(name, army.portals);
                RoleArmyHealer.checkSpawn(name, army.portals);
                RoleArmyMelee.checkSpawn(name, army.portals);
                RoleArmyRanged.checkSpawn(name, army.portals);
            }

            // Assign escorts.
            if (armyDismantlers.escort || armyMelees.escort || armyRangeds.escort) {
                _.forEach(_.filter(Cache.creeps[name] && Cache.creeps[name].armyHealer || [], (c) => !c.memory.escorting && !c.spawning), (healer) => {
                    var escort = [].concat.apply([], [
                        armyDismantlers.escort && Cache.creeps[name].armyDismantler ? _.filter(Cache.creeps[name].armyDismantler, (c) => !c.memory.escortedBy && !c.spawning) : [],
                        armyMelees.escort && Cache.creeps[name].armyMelee ? _.filter(Cache.creeps[name].armyMelee, (c) => !c.memory.escortedBy && !c.spawning) : [],
                        armyRangeds.escort && Cache.creeps[name].armyRanged ? _.filter(Cache.creeps[name].armyRanged, (c) => !c.memory.escortedBy && !c.spawning) : []
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
                    tasks: _.map(_.filter(allCreepsInArmy, (c) => c.hits < c.hitsMax).sort((a, b) => (b.hitsMax - b.hits) - (a.hitsMax - a.hits)), (c) => new TaskHeal(c.id))
                },
                rally: { tasks: [] }
            };

            if (armyAttackRoom) {
                switch (army.directive) {
                    case "dismantle":
                        hostiles = _.filter(Cache.hostilesInRoom(armyAttackRoom), (c) => Utilities.objectsClosestToObj(allCreepsInArmy, c)[0].pos.getRangeTo(c) <= 3);
                        tasks.ranged.tasks = _.map(hostiles, (c) => new TaskRangedAttack(c.id));
                        tasks.melee.tasks = _.map(hostiles, (c) => new TaskMeleeAttack(c.id));
                        break;
                    case "attack":
                        hostiles = Cache.hostilesInRoom(armyAttackRoom);
                        tasks.melee.tasks = _.map(hostiles, (c) => new TaskMeleeAttack(c.id));
                        tasks.ranged.tasks = _.map(hostiles, (c) => new TaskRangedAttack(c.id));
                        tasks.rally.tasks = _.map(hostileConstructionSites, (c) => new TaskRally(c.id));
                        break;
                }
            }

            // Assign tasks.
            RoleArmyDismantler.assignTasks(name, army.directive, tasks);
            RoleArmyHealer.assignTasks(name, army.directive, tasks);
            RoleArmyMelee.assignTasks(name, army.directive, tasks);
            RoleArmyRanged.assignTasks(name, army.directive, tasks);
        }
    };

require("screeps-profiler").registerObject(Army, "Army");
module.exports = Army;
