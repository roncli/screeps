var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskBuild = require("task.build"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),
    TaskRepair = require("task.repair");

//  ####           ##           ####     #                                 #      ##                 
//  #   #           #            #  #                                      #       #                 
//  #   #   ###     #     ###    #  #   ##     ###   ## #    ###   # ##   ####     #     ###   # ##  
//  ####   #   #    #    #   #   #  #    #    #      # # #      #  ##  #   #       #    #   #  ##  # 
//  # #    #   #    #    #####   #  #    #     ###   # # #   ####  #   #   #       #    #####  #     
//  #  #   #   #    #    #       #  #    #        #  # # #  #   #  #   #   #  #    #    #      #     
//  #   #   ###    ###    ###   ####    ###   ####   #   #   ####  #   #    ##    ###    ###   #     
/**
 * Represents the dismantler role.
 */
class RoleDismantler {
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
        var max = 1,
            creeps;

        if (!canSpawn) {
            return {
                name: "dismantler",
                spawn: false,
                max: max
            };
        }

        creeps = Cache.creeps[engine.room.name];

        return {
            name: "dismantler",
            spawn: _.filter(creeps && creeps.dismantler || [], (c) => c.spawning || c.ticksToLive >= 150).length < max,
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
        var energy = Math.min(checkSettings.energyCapacityAvailable, 3300),
            units = Math.floor(energy / 200),
            remainder = energy % 200,
            body = [];

        body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
        body.push(...Array(units + (remainder >= 100 && remainder < 150 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + (remainder >= 50 ? 1 : 0)).fill(MOVE));

        return {
            body: body,
            memory: {
                role: "dismantler",
                home: checkSettings.home,
                supportRoom: checkSettings.supportRoom
            }
        };
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].dismantler || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check critical repairs.
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name !== roomName), (creep) => {
            _.forEach(TaskRepair.getCriticalTasks(creep.room), (task) => {
                if (_.filter(Cache.creeps[task.structure.room.name] && Cache.creeps[task.structure.room.name].all || [], (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id).length === 0) {
                    if (task.canAssign(creep)) {
                        creep.say("CritRepair");
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

        // Check for construction sites.
        _.forEach(creepsWithNoTask, (creep) => {
            var constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
            if (constructionSites.length > 0) {
                var task = new TaskBuild(constructionSites[0].id);
                if (task.canAssign(creep)) {
                    creep.say("Build");
                    assigned.push(creep.name);
                }
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for unfilled containers.
        _.forEach([].concat.apply([], [tasks.fillEnergy.storageTasks, tasks.fillEnergy.containerTasks]), (task) => {
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) !== -1 && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
            if (energyMissing > 0) {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, task.object), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Container");
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

        // Check for structures needing dismantling.
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === roomName), (creep) => {
            _.forEach(tasks.dismantle.tasks, (task) => {
                if (_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "dismantle" && c.memory.currentTask.id === task.id).length > 0) {
                    return;
                }
                if (task.canAssign(creep)) {
                    creep.say("Dismantle");
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

        // Check for dropped resources in current room.
        _.forEach(creepsWithNoTask, (creep) => {
            _.forEach(TaskPickupResource.getTasks(creep.room), (task) => {
                if (_.filter(task.resource.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "pickupResource" && c.memory.currentTask.id === task.id).length > 0) {
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

        // Rally remaining creeps.
        _.forEach(creepsWithNoTask, (creep) => {
            var task = new TaskRally(creep.memory.home);
            task.canAssign(creep);
        });
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoleDismantler, "RoleDismantler");
}
module.exports = RoleDismantler;
