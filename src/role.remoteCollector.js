var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally");

//  ####           ##           ####                         #             ###           ##     ##                   #                  
//  #   #           #           #   #                        #            #   #           #      #                   #                  
//  #   #   ###     #     ###   #   #   ###   ## #    ###   ####    ###   #       ###     #      #     ###    ###   ####    ###   # ##  
//  ####   #   #    #    #   #  ####   #   #  # # #  #   #   #     #   #  #      #   #    #      #    #   #  #   #   #     #   #  ##  # 
//  # #    #   #    #    #####  # #    #####  # # #  #   #   #     #####  #      #   #    #      #    #####  #       #     #   #  #     
//  #  #   #   #    #    #      #  #   #      # # #  #   #   #  #  #      #   #  #   #    #      #    #      #   #   #  #  #   #  #     
//  #   #   ###    ###    ###   #   #   ###   #   #   ###     ##    ###    ###    ###    ###    ###    ###    ###     ##    ###   #     
/**
 * Represents the remote collector role.
 */
class RoleRemoteCollector {
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
     * @param {bool} canSpawn Whether we can spawn a creep.
     * @return {object} The settings to use for checking spawns.
     */
    static checkSpawnSettings(engine, canSpawn) {
        var max = engine.type === "cleanup" ? 3 : 1,
            creeps;

        if (!canSpawn) {
            return {
                name: "remoteCollector",
                spawn: false,
                max: max
            };
        }

        creeps = Cache.creeps[engine.room.name];

        return {
            name: "remoteCollector",
            spawn: _.filter(creeps && creeps.remoteCollector || [], (c) => c.spawning || c.ticksToLive >= 300).length < max,
            spawnFromRegion: true,
            max: max
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
        var energy = Math.min(checkSettings.energyCapacityAvailable, 2400),
            units = Math.floor(energy / 150),
            body = [];

        body.push(...Array(units * 2).fill(CARRY));
        body.push(...Array(units).fill(MOVE));

        return {
            body: body,
            memory: {
                role: "remoteCollector",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom
            }
        };
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creeps = Cache.creeps[roomName],
            creepsWithNoTask = Utilities.creepsWithNoTask(creeps && creeps.remoteCollector || []),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for dropped resources in current room.
        _.forEach(creepsWithNoTask, (creep) => {
            _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                if (_.sum(creeps && creeps.all || [], (c) => c.memory.currentTask && c.memory.currentTask.id === task.idG ? c.carryCapacity - _.sum(c.carry) : 0) >= task.resource.amount) {
                    return;
                }
                if (task.canAssign(creep)) {
                    creep.say("Pickup");
                    assigned.push(creep.name);
                    return false;
                }
            });
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to get minerals from containers.
        if (tasks.collectMinerals && tasks.collectMinerals.cleanupTasks) {
            _.forEach(tasks.collectMinerals.cleanupTasks, (task) => {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                    }
                });

                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];

                if (creepsWithNoTask.length === 0) {
                    return;
                }
            });
        }

        if (tasks.collectEnergy && tasks.collectEnergy.cleanupTasks) {
            // Attempt to get energy from containers.
            _.forEach(tasks.collectEnergy.cleanupTasks, (task) => {
                _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === roomName), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                    }
                });

                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];

                if (creepsWithNoTask.length === 0) {
                    return;
                }
            });
        }

        // Check for unfilled storage.
        _.forEach(tasks.fillEnergy.storageTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
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

        // Check for unfilled containers.
        _.forEach(tasks.fillEnergy.containerTasks, (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + _.sum(c.carry);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Container");
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

        // Rally remaining creeps.
        _.forEach(creepsWithNoTask, (creep) => {
            var task;
            
            if (_.sum(creep.carry) > 0) {
                task = new TaskRally(creep.memory.supportRoom);
            } else {
                task = new TaskRally(creep.memory.home);
            }
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleRemoteCollector, "RoleRemoteCollector");
}
module.exports = RoleRemoteCollector;
