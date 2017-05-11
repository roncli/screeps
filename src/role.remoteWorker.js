var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskBuild = require("task.build"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskHarvest = require("task.harvest"),
    TaskPickupResource = require("task.pickupResource"),
    TaskRally = require("task.rally"),
    TaskRepair = require("task.repair");

class Worker {
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
            units = Math.floor(Math.min(energy, 2000) / 200),
            secondUnits = Math.floor(Math.max((energy - 2000), 0) / 150),
            remainder = Math.min(energy, 2000) % 200,
            secondRemainder = Math.max((energy - 2000), 0) % 150,
            body = [];

        body.push(...Array(units + (remainder >= 150 ? 1 : 0)).fill(WORK));
        body.push(...Array(units + secondUnits * 2 + (remainder >= 100 && remainder < 150 ? 1 : 0) + (secondRemainder > 100 ? 1 : 0)).fill(CARRY));
        body.push(...Array(units + secondUnits + (remainder >= 50 ? 1 : 0) + (secondRemainder >= 50 ? 1 : 0)).fill(MOVE));

        return {
            body: body,
            name: "remoteWorker"
        };
    }

    static checkSpawn(room) {
        var roomName = room.name,
            supportRoom = Game.rooms[Memory.rooms[roomName].roomType.supportRoom],
            supportRoomName = supportRoom.name,
            containers = Cache.containersInRoom(room),
            workers = Cache.creeps[roomName] && Cache.creeps[roomName].remoteWorker || [],
            max = 0;

        // If there are no spawns in the support room, or the room is unobservable, or there are no containers in the room, ignore the room.
        if (Cache.spawnsInRoom(supportRoom).length === 0 || room.unobservable || containers.length === 0) {
            return;
        }

        // Loop through containers to see if we have anything we need to spawn.
        _.forEach(containers, (container) => {
            var source = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0],
                containerId = container.id;

            // If this container is for a mineral, skip it.
            if (source instanceof Mineral) {
                return;
            }

            max += 1;

            if (_.filter(workers, (c) => (c.spawning || c.ticksToLive >= 150 + (Memory.lengthToContainer && Memory.lengthToContainer[containerId] && Memory.lengthToContainer[containerId][supportRoomName] ? Memory.lengthToContainer[containerId][supportRoomName] : 0) * 2) && c.memory.container === containerId).length === 0) {
                Worker.spawn(room, supportRoom, containerId);
            }

            // Only 1 worker per room.
            return false;
        });

        // Output remote worker count in the report.
        if (Memory.log && (workers.length > 0 || max > 0) && Cache.log.rooms[roomName]) {
            Cache.log.rooms[roomName].creeps.push({
                role: "remoteWorker",
                count: workers.length,
                max: max
            });
        }
    }

    static spawn(room, supportRoom, id) {
        var body = [],
            roomName = room.name,
            supportRoomName = supportRoom.name,
            energy, units, secondUnits, remainder, secondRemainder, count, spawnToUse, name;

        // Fail if all the spawns are busy.
        if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
            return false;
        }

        // Get the total energy in the room, limited to 3000.
        energy = Math.min(supportRoom.energyCapacityAvailable, 3000);
        units = Math.floor(energy / 200);
        secondUnits = Math.floor((energy - 2000) / 150);
        remainder = energy % 200;
        secondRemainder = (energy - 2000) % 150;

        // Create the body based on the energy.
        for (count = 0; count < units && count < 10; count++) {
            body.push(WORK);
        }

        if (energy < 2000 && remainder >= 150) {
            body.push(WORK);
        }

        for (count = 0; count < units && count < 10; count++) {
            body.push(CARRY);
        }

        for (count = 0; count < secondUnits; count++) {
            body.push(CARRY);
            body.push(CARRY);
        }

        if (energy < 2000 && remainder >= 100 && remainder < 150) {
            body.push(CARRY);
        }

        if (energy > 2000 && secondRemainder >= 100) {
            body.push(CARRY);
        }

        for (count = 0; count < units && count < 10; count++) {
            body.push(MOVE);
        }

        for (count = 0; count < secondUnits; count++) {
            body.push(MOVE);
        }

        if (energy < 2000 && remainder >= 50) {
            body.push(MOVE);
        }

        if (energy > 2000 && secondRemainder >= 50) {
            body.push(MOVE);
        }

        // Create the creep from the first listed spawn that is available.
        spawnToUse = _.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region).sort((a, b) => (a.room.name === supportRoomName ? 0 : 1) - (b.room.name === supportRoomName ? 0 : 1))[0];
        if (!spawnToUse) {
            return false;
        }
        name = spawnToUse.createCreep(body, `remoteWorker-${roomName}-${Game.time.toFixed(0).substring(4)}`, {role: "remoteWorker", home: roomName, supportRoom: supportRoomName, container: id});
        if (spawnToUse.room.name === supportRoomName) {
            Cache.spawning[spawnToUse.id] = typeof name !== "number";
        }

        return typeof name !== "number";
    }

    static assignTasks(room, tasks) {
        var roomName = room.name,
            creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteWorker || []), (c) => _.sum(c.carry) > 0 || !c.spawning && c.ticksToLive > 150),
            assigned = [];

        if (creepsWithNoTask.length === 0) {
            return;
        }

        // Check for 1-progress construction sites.
        _.forEach(creepsWithNoTask, (creep) => {
            var sites = _.filter(creep.room.find(FIND_MY_CONSTRUCTION_SITES), (c) => c.progressTotal === 1);
            
            if (sites.length > 0) {
                var task = new TaskBuild(sites[0].id);
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
            var energyMissing = task.object.storeCapacity - _.sum(task.object.store) - _.reduce(_.filter(task.object.room.find(FIND_MY_CREEPS), (c) => c.memory.currentTask && ["fillEnergy", "fillMinerals"].indexOf(c.memory.currentTask.type) && c.memory.currentTask.id === task.id), function(sum, c) {return sum + (c.carry[RESOURCE_ENERGY] || 0);}, 0);
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

        // Check for dropped resources in current room.
        _.forEach(creepsWithNoTask, (creep) => {
            if (creep.room.name !== room.name) {
                return;
            }
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

        // Attempt to get energy from containers.
        if (!room.unobservable) {
            _.forEach(creepsWithNoTask, (creep) => {
                var task = new TaskCollectEnergy(creep.memory.container);

                if (task.canAssign(creep)) {
                    creep.say("Collecting");
                    assigned.push(creep.name);
                }
            });
        }

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
    require("screeps-profiler").registerObject(Worker, "RoleRemoteWorker");
}
module.exports = Worker;
