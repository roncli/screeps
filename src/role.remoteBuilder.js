var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskBuild = require("task.build"),
    TaskHarvest = require("task.harvest"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),
    TaskRepair = require("task.repair");

//  ####           ##           ####                         #            ####            #     ##        #               
//  #   #           #           #   #                        #             #  #                  #        #               
//  #   #   ###     #     ###   #   #   ###   ## #    ###   ####    ###    #  #  #   #   ##      #     ## #   ###   # ##  
//  ####   #   #    #    #   #  ####   #   #  # # #  #   #   #     #   #   ###   #   #    #      #    #  ##  #   #  ##  # 
//  # #    #   #    #    #####  # #    #####  # # #  #   #   #     #####   #  #  #   #    #      #    #   #  #####  #     
//  #  #   #   #    #    #      #  #   #      # # #  #   #   #  #  #       #  #  #  ##    #      #    #  ##  #      #     
//  #   #   ###    ###    ###   #   #   ###   #   #   ###     ##    ###   ####    ## #   ###    ###    ## #   ###   #     
/**
 * Represents the remote builder role.
 */
class RoleRemoteBuilder {
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
        var creeps = Cache.creeps[engine.room.name],
            max = 2;

        return {
            spawn: (creeps && creeps.remoteBuilder || []).length < max,
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
     * @param {RoomEngine} engine The room engine to spawn for.
     * @return {object} The settings for spawning a creep.
     */
    static spawnSettings(engine) {
        var energy = Math.min(engine.room.energyCapacityAvailable, 3300),
            units = Math.floor(energy / 200),
            remainder = energy % 200,
            body = [];

        body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
        body.push(...Array(units + (remainder >= 100 && remainder < 150 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + (remainder >= 50 ? 1 : 0)).fill(MOVE));

        return {
            body: body,
            name: "remoteBuilder"
        };
    }

    static spawn(room, supportRoom) {
        var body = [],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, remainder, count, spawnToUse, name;

        // Fail if all the spawns are busy.
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }

        // Get the total energy in the room, limited to 3300.
        energy = Math.min(supportRoom.energyCapacityAvailable, 3300);
        units = Math.floor(energy / 200);
        remainder = energy % 200;

        // Create the body based on the energy.
        for (count = 0; count < units; count++) {
            body.push(WORK);
        }

        if (remainder >= 150) {
            body.push(WORK);
        }

        for (count = 0; count < units; count++) {
            body.push(CARRY);
        }

        if (remainder >= 100 && remainder < 150) {
            body.push(CARRY);
        }

        for (count = 0; count < units; count++) {
            body.push(MOVE);
        }

        if (remainder >= 50) {
            body.push(MOVE);
        }

        // Create the creep from the first listed spawn that is available.
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `remoteBuilder-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "remoteBuilder", home: roomName, supportRoom: supportRoomName});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteBuilder || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for enemy construction sites and rally to them.
        _.forEach(_.filter(creepsWithNoTask, (c) => c.room.name === room.name), (creep) => {
            if (room.find(FIND_HOSTILE_CONSTRUCTION_SITES).length > 0) {
                var task = new TaskRally(room.find(FIND_HOSTILE_CONSTRUCTION_SITES)[0].id);
                task.canAssign(creep);
                creep.say("Stomping");
                assigned.push(creep.name);
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check critical repairs.
        _.forEach(creepsWithNoTask, (creep) => {
            _.forEach(TaskRepair.getCriticalTasks(creep.room), (task) => {
                if (_.filter(task.structure.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && c.memory.currentTask.type === "repair" && c.memory.currentTask.id === task.id).length === 0) {
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
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
                if (constructionSites.length > 0) {
                    var task = new TaskBuild(Utilities.objectsClosestToObj(constructionSites, creep)[0].id);
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
        }
        
        // Check for dropped resources in current room.
        _.forEach(creepsWithNoTask, (creep) => {
            if (creep.room.name === creep.memory.home) {
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
            }
        });

        _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
        assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Attempt to assign harvest task to remaining creeps.
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskHarvest(),
                    sources = Utilities.objectsClosestToObj(_.filter(room.find(FIND_SOURCES), (s) => s.energy > 0), creep);
                
                if (sources.length === 0) {
                    return false;
                }

                creep.memory.homeSource = sources[0].id;

                if (task.canAssign(creep)) {
                    creep.say("Harvesting");
                    assigned.push(creep.name);
                }
            });
        }

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
    require("screeps-profiler").registerObject(RoleRemoteBuilder, "RoleRemoteBuilder");
}
module.exports = RoleRemoteBuilder;
