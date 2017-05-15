var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally");

//  ####           ##            ###    #                                
//  #   #           #           #   #   #                                
//  #   #   ###     #     ###   #      ####    ###   # ##    ###   # ##  
//  ####   #   #    #    #   #   ###    #     #   #  ##  #  #   #  ##  # 
//  # #    #   #    #    #####      #   #     #   #  #      #####  #     
//  #  #   #   #    #    #      #   #   #  #  #   #  #      #      #     
//  #   #   ###    ###    ###    ###     ##    ###   #       ###   #     
/**
 * Represents the storer role.
 */
class RoleStorer {
    //       #                 #      ##                            ##          #     #     #                       
    //       #                 #     #  #                          #  #         #     #                             
    //  ##   ###    ##    ##   # #    #    ###    ###  #  #  ###    #     ##   ###   ###   ##    ###    ###   ###   
    // #     #  #  # ##  #     ##      #   #  #  #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     
    // #     #  #  ##    #     # #   #  #  #  #  # ##  ####  #  #  #  #  ##     #     #     #    #  #   ##     ##   
    //  ##   #  #   ##    ##   #  #   ##   ###    # #  ####  #  #   ##    ##     ##    ##  ###   #  #  #     ###    
    //                                     #                                                            ###         
    /**
     * Gets the settings for checking whether a creep should spawn.
     * @param {RoomEngine} engine The room engine to check for.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine) {
        var room = engine.room,
            containers = Cache.containersInRoom(room),
            length = 0,
            max = 0,
            containerSource, sources, lengthToStorage, controller, rcl, army, creeps, storers;
        
        // If there are no containers or storages in the room, ignore the room.
        if (containers.length === 0 || !room.storage || !room.storage.my) {
            return {
                name: "storer",
                spawn: false,
                max: 0,
                spawnFromRegion: true
            };
        }

        containerSource = Memory.containerSource;
        sources = [].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]);
        lengthToStorage = Memory.lengthToStorage;
        controller = room.controller;
        rcl = controller.level;
        army = Memory.army;
        creeps = Cache.creeps[room.name];
        storers = creeps && creeps.storer || [];

        // Determine the number storers needed.
        _.forEach(containers, (container) => {
            var containerId = container.id,
                closest;

            if (!containerSource[containerId]) {
                containerSource[containerId] = Utilities.objectsClosestToObj(sources, container)[0].id;
            }

            closest = Game.getObjectById(containerSource[containerId]);

            if (closest instanceof Mineral) {
                if (closest.mineralAmount > 0) {
                    max += 1;
                }
            } else {
                if (!lengthToStorage[container.id]) {
                    lengthToStorage[container.id] = PathFinder.search(container.pos, {pos: room.storage.pos, range: 1}, {swampCost: 1}).path.length;
                }

                length += lengthToStorage[container.id];
            }
        });

        max += Math.ceil(2 * length / (controller && rcl === 8 ? 35 : 30)) + (rcl >= 7 && army && _.filter(army, (a) => a.region === room.memory.region && a.directive === "building").length > 0 ? 1 : 0);

        return {
            name: "storer",
            spawn: _.filter(storers, (c) => c.spawning || c.ticksToLive >= 300).length < max,
            max: max,
            rcl: rcl
        };
    }

    //                                 ##          #     #     #                       
    //                                #  #         #     #                             
    //  ###   ###    ###  #  #  ###    #     ##   ###   ###   ##    ###    ###   ###   
    // ##     #  #  #  #  #  #  #  #    #   # ##   #     #     #    #  #  #  #  ##     
    //   ##   #  #  # ##  ####  #  #  #  #  ##     #     #     #    #  #   ##     ##   
    // ###    ###    # #  ####  #  #   ##    ##     ##    ##  ###   #  #  #     ###    
    //        #                                                            ###         
    /**
     * Gets the settings for spawning a creep.
     * @param {object} checkSettings The settings from checking if a creep needs to be spawned.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(checkSettings) {
        var body;

        switch (checkSettings.rcl) {
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

        return {
            body: body,
            memory: {
                role: "storer",
                home: checkSettings.home
            }
        };
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].storer || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            allCreeps = Cache.creeps[roomName] && Cache.creeps[roomName].all || [],
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled links.
        _.forEach(tasks.fillEnergy.linkTasks, (task) => {
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
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
        _.forEach(creepsWithNoTask, (creep) => {
            // Don't bother if the creep doesn't have enough energy.
            if (creep.carry[RESOURCE_ENERGY] < (room.controller.level === 8 ? 200 : room.controller.level === 7 ? 100 : 50)) {
                return;
            }
            
            _.forEach(tasks.fillEnergy.extensionTasks.sort((a, b) => a.object.pos.getRangeTo(creep) - b.object.pos.getRangeTo(creep)), (task) => {
                var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
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
            var energyMissing = task.object.energyCapacity - task.object.energy - _.reduce(_.filter(allCreeps, (c) => c.memory.currentTask && c.memory.currentTask.type === "fillEnergy" && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
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
                    if ((!room.terminal || !creep.memory.lastCollectEnergyWasStorage) && task.canAssign(creep)) {
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

        // Attempt to get energy from containers.
        _.forEach([].concat.apply([], [tasks.collectEnergy.storerTasks, tasks.collectMinerals.storerTasks]).sort((a, b) => (b.object.energy || _.sum(b.object.store) || 0) - (a.object.energy || _.sum(a.object.store) || 0)), (task) => {
            if (!task.object.energy && !_.sum(task.object.store)) {
                return;
            }
            var energy = (task.object.energy || _.sum(task.object.store) || 0) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === task.type && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carryCapacity - _.sum(c.carry));}, 0);
            if (energy >= 500) {
                _.forEach(creepsWithNoTask, (creep) => {
                    creep.memory.lastCollectEnergyWasStorage = false;
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                        energy -= creep.carryCapacity - _.sum(creep.carry);
                        if (energy < 500) {
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

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // As a last resort, get energy from containers.
        _.forEach(tasks.collectEnergy.tasks, (task) => {
            _.forEach(creepsWithNoTask, (creep) => {
                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                    if (task.object.structureType === STRUCTURE_STORAGE) {
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
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleStorer, "RoleStorer");
}
module.exports = RoleStorer;
