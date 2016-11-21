var Cache = require("cache"),
    RoleArmyDismantler = require("role.armyDismantler"),
    RoleArmyHealer = require("role.armyHealer"),
    RoleArmyMelee = require("role.armyMelee"),
    RoleArmyRanged = require("role.armyRanged"),
    TaskHeal = require("task.heal"), 
    TaskMeleeAttack = require("task.meleeAttack"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),

    Army = {
        run: (army) => {
            // Delete the army if we're successful.
            if (Cache.creepsInArmy("all", army).length === 0 && Memory.army[army].success) {
                Game.notify("Army " + army + " operation successful!");
                delete Memory.army[army];
                return;
            }

            // Reset army if we have no creeps.
            if (Memory.army[army].directive !== "building" && Cache.creepsInArmy("all", army).length === 0 && !Memory.army[army].success) {
                Game.notify("Army " + army + " operation failed, restarting.");
                Memory.army[army].directive = "building";
            }

            // Determine conditions for next stage or success.
            switch (Memory.army[army].directive) {
                case "building":
                    if (_.filter(Cache.creepsInArmy("all", army), (c) => c.room.name !== Memory.army[army].buildRoom).length === 0 && _.filter(Cache.creepsInArmy("all", army), (c) => c.room.name === Memory.army[army].buildRoom).length === Memory.army[army].dismantler.maxCreeps + Memory.army[army].healer.maxCreeps+ Memory.army[army].melee.maxCreeps+ Memory.army[army].ranged.maxCreeps) {
                        Memory.army[army].directive = "staging";
                    }
                    break;
                case "staging":
                    if (_.filter(Cache.creepsInArmy("all", army), (c) => c.room.name !== Memory.army[army].stageRoom).length === 0) {
                        Memory.army[army].directive = "dismantle";
                    }
                    break;
                case "dismantle":
                    if (Game.rooms[Memory.army[army].attackRoom]) {
                        Memory.army[army].dismantle = _.filter(Memory.army[army].dismantle, (d) => Cache.getObjectById(d));

                        if (Memory.army[army].dismantle.length === 0) {
                            Memory.army[army].directive = "attack";
                        }
                    }
                    break;
                case "attack":
                    if (Game.rooms[Memory.army[army].attackRoom]) {
                        if (Game.rooms[Memory.army[army].attackRoom].find(FIND_HOSTILE_STRUCTURES).length === 0 && Game.rooms[Memory.army[army].attackRoom].find(FIND_CONSTRUCTION_SITES).length === 0) {
                            Memory.army[army].success = true;
                        }
                    }
                    break;
            }

            // Check spawns if we're building.
            if (Memory.army[army].directive === "building") {
                RoleArmyDismantler.checkSpawn(army);
                RoleArmyHealer.checkSpawn(army);
                RoleArmyMelee.checkSpawn(army);
                RoleArmyRanged.checkSpawn(army);
            }

            // Create tasks.
            tasks = {
                melee: { tasks: [] },
                ranged: { tasks: [] },
                heal: {
                    tasks: _.map(_.filter(Cache.creepsInArmy("all", army), (c) => c.hits < c.hitsMax), (c) => new TaskHeal(c.id))
                },
                rally: { tasks: [] },
            };

            if (Game.rooms[Memory.army[army].attackRoom]) {
                switch (Memory.army[army].directive) {
                    case "dismantle":
                        if (Memory.army[army].dismantle.length > 0) {
                            tasks.ranged.tasks = _.map(_.filter(Cache.hostilesInRoom(Game.rooms[Memory.army[army].attackRoom]), (c) => c.pos.getRangeTo(Cache.getObjectById(Memory.army[army].dismantle[0])) <= 2), (c) => new TaskRangedAttack(c.id));
                        }
                        
                        break;
                    case "attack":
                        tasks.melee.tasks = _.map(Cache.hostilesInRoom(Game.rooms[Memory.army[army].attackRoom]), (c) => new TaskMeleeAttack(c.id));
                        tasks.ranged.tasks = _.map(Cache.hostilesInRoom(Game.rooms[Memory.army[army].attackRoom]), (c) => new TaskRangedAttack(c.id));
                        tasks.rally.tasks = _.map(Cache.enemyConstructionSitesInRoom(Game.rooms[Memory.army[army].attackRoom]), (c) => new TaskRally(c.id));
                        break;
                }
            }

            // Assign tasks.
            RoleArmyDismantler.assignTasks(army, Memory.army[army].directive, tasks);
            RoleArmyHealer.assignTasks(army, Memory.army[army].directive, tasks);
            RoleArmyMelee.assignTasks(army, Memory.army[army].directive, tasks);
            RoleArmyRanged.assignTasks(army, Memory.army[army].directive, tasks);
        }
    };

require("screeps-profiler").registerObject(Army, "Army");
module.exports = Army;
