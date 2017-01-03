var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),

    Storer = {
        checkSpawn: (room) => {
            "use strict";

            var containers = Cache.containersInRoom(room),
                length = 0,
                max = 0,
                controller = room.controller,
                army = Memory.army,
                storers = Cache.creepsInRoom("storer", room);
            
            // If there are no spawns, containers, or storages in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0 || containers.length === 0 || !room.storage) {
                return;
            }

            // Init road length cache.
            if (!Memory.lengthToStorage) {
                Memory.lengthToStorage = {};
            }

            // Determine the number storers needed.
            _.forEach(containers, (container) => {
                var closest = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0];

                if (closest instanceof Mineral) {
                    if (closest.mineralAmount > 0) {
                        max += 1;
                    }
                } else {
                    if (!Memory.lengthToStorage[container.id]) {
                        Memory.lengthToStorage[container.id] = PathFinder.search(container.pos, {pos: room.storage.pos, range: 1}, {swampCost: 1}).path.length;
                    }

                    length += Memory.lengthToStorage[container.id];
                }
            });

            // If we don't have a storer for each container, spawn one.
            max += Math.ceil((2 * length) / ((controller && controller.level >= 6) ? 35 : 30)) + ((controller.level >= 7 && army && _.filter(army, (a) => a.region === room.memory.region).length > 0) ? 1 : 0);
            if (_.filter(storers, (c) => c.spawning || c.ticksToLive >= 300).length < max) {
                Storer.spawn(room);
            }

            // Output storer count in the report.
            if (storers.length > 0 || max > 0) {
                Cache.log.rooms[room.name].creeps.push({
                    role: "storer",
                    count: storers.length,
                    max: max
                });
            }        
        },
        
        spawn: (room) => {
            "use strict";

            var spawns = Cache.spawnsInRoom(room),
                roomName = room.name,
                body, spawnToUse, name;

            switch (room.controller.level) {
                case 7:
                    body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                    break;
                case 8:
                    body = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                    break;
                default:
                    body = [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
                    break;
            }

            // Fail if all the spawns are busy.
            if (_.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Create the creep from the first listed spawn that is available.
            spawnToUse = _.sortBy(_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === room.memory.region), (s) => s.room.name === roomName ? 0 : 1)[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "storer-" + roomName + "-" + Game.time.toFixed(0).substring(4), {role: "storer", home: roomName});
            Cache.spawning[spawnToUse.id] = typeof name !== "number";

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInRoom("storer", room)), (c) => _.sum(c.carry) > 0 || (!c.spawning && c.ticksToLive > 150)),
                allCreeps = Cache.creepsInRoom("all", room),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled links.
            _.forEach(tasks.fillEnergy.linkTasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Link");
                            assigned.push(creep.name);
                            energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];
                }
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled extensions.
            _.forEach(_.sortBy(creepsWithNoTask, (c) => c.pos.getRangeTo(Cache.spawnsInRoom(room)[0])), (creep) => {
                _.forEach(_.sortBy(tasks.fillEnergy.extensionTasks, (t) => t.object.pos.getRangeTo(creep)), (task) => {
                    var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                    if (energyMissing > 0) {
                        if (task.canAssign(creep)) {
                            creep.say("Extension");
                            assigned.push(creep.name);
                            return false;
                        }
                    }
                });
            });
            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled spawns.
            _.forEach(tasks.fillEnergy.spawnTasks, (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0)
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Spawn");
                            assigned.push(creep.name);
                            energyMissing -= creep.carry[RESOURCE_ENERGY] || 0;
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];
                }
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for terminals.
            if (tasks.fillEnergy.terminalTask) {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (tasks.fillEnergy.terminalTask.canAssign(creep)) {
                        creep.say("Terminal");
                        assigned.push(creep.name);
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled storage.
            _.forEach(tasks.fillEnergy.storageTasks, (task) => {
                var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
                if (energyMissing > 0) {
                    _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                        if (!creep.memory.lastCollectEnergyWasStorage && task.canAssign(creep)) {
                            creep.say("Storage");
                            assigned.push(creep.name);
                            energyMissing -= _.sum(creep.carry);
                            if (energyMissing <= 0) {
                                return false;
                            }
                        }
                    });
                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];
                }
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled storage for minerals.
            _.forEach(tasks.fillMinerals.storageTasks, (task) => {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Storage");
                        assigned.push(creep.name);
                    }
                });

                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for unfilled terminals for minerals.
            _.forEach(tasks.fillMinerals.terminalTasks, (task) => {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Terminal");
                        assigned.push(creep.name);
                    }
                });

                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to get energy from terminals.
            if (tasks.collectEnergy.terminalTask) {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (tasks.collectEnergy.terminalTask.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                        creep.memory.lastCollectEnergyWasStorage = false;
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            }

            // Attempt to get energy from containers.
            _.forEach(_.sortBy([].concat.apply([], [tasks.collectEnergy.storerTasks, tasks.collectMinerals.storerTasks]), (t) => -(t.object.energy || _.sum(t.object.store) || 0)), (task) => {
                if (!task.object.energy && !_.sum(task.object.store)) {
                    return;
                }
                var energy = (task.object.energy || _.sum(task.object.store) || 0) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === task.type && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carryCapacity - _.sum(c.carry));}, 0);
                if (energy >= 500) {
                    _.forEach(creepsWithNoTask, (creep) => {
                        if (task.canAssign(creep)) {
                            creep.say("Collecting");
                            creep.memory.lastCollectEnergyWasStorage = false;
                            assigned.push(creep.name);
                            energy -= (creep.carryCapacity - _.sum(creep.carry));
                            if (energy < 500) {
                                return false;
                            }
                        }
                    });
                    _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                    assigned = [];
                }
            });

            // As a last resort, get energy from containers.
            _.forEach(tasks.collectEnergy.tasks, (task) => {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                        if (task.object instanceof StructureStorage) {
                            creep.memory.lastCollectEnergyWasStorage = true;
                        }
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Rally to center.
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskRally(creep.room.terminal ? creep.room.terminal.id : creep.room.name);
                task.range = 0;
                task.canAssign(creep);
            });
        }
    };

require("screeps-profiler").registerObject(Storer, "RoleStorer");
module.exports = Storer;
