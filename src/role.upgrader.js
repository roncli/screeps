var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskHarvest = require("task.harvest"),
    TaskRally = require("task.rally"),

    Upgrader = {
        checkSpawn: (room) => {
            "use strict";

            var upgraders = Cache.creepsInRoom("upgrader", room),
                storage = room.storage,
                controller = room.controller,
                storageEnergy, count, max;

            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            if (storage) {
                storageEnergy = storage.store[RESOURCE_ENERGY];
            }

            // If there is not enough energy in storage, ignore the room.
            count = _.filter(upgraders, (c) => c.spawning || c.ticksToLive >= 150).length;
            if (!storage || storageEnergy < Memory.upgradeEnergy) {
                max = 0;
            } else {
                // If we have less than max upgraders, spawn an upgrader.
                max = 1;
            }

            if (count < max || (controller && controller.level < 8 && storage && storageEnergy > 900000)) {
                Upgrader.spawn(room);
            }

            // Output upgrader count in the report.
            if (upgraders.length > 0 || max > 0) {
                Cache.log.rooms[room.name].creeps.push({
                    role: "upgrader",
                    count: upgraders.length,
                    max: max
                });
            }

            // Support smaller rooms in the region.
            _.forEach(_.filter(Game.rooms, (r) => r.memory && r.memory.roomType && r.memory.roomType.type === "base" && r.memory.region === room.memory.region && r.name !== room.name && r.controller && r.controller.my && r.controller.level < 6), (otherRoom) => {
                if (_.filter(Cache.creepsInRoom("upgrader", otherRoom), (c) => c.memory.supportRoom === room.name).length === 0) {
                    Upgrader.spawn(otherRoom, room);
                }
            });
        },
        
        spawn: (room, supportRoom) => {
            "use strict";

            var body = [],
                controller = room.controller,
                workCount = 0,
                canBoost = false,
                roomName = room.name,
                supportRoomName, spawns, storage, energy, units, remainder, count, spawnToUse, name, labToBoostWith;

            if (!supportRoom) {
                supportRoom = room;
            }
            supportRoomName = supportRoom.name;
            spawns = Cache.spawnsInRoom(supportRoom);
            storage = supportRoom.storage;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }
            
            // Check if we have a link in range of the controller and build the creep accordingly.
            if (Cache.linksInRoom(room).length >= 2 && Utilities.objectsClosestToObj(Cache.linksInRoom(room), controller)[0].pos.getRangeTo(controller) <= 2) {
                // Get the total energy in the room, limited to 4100, or 1950 at RCL 8.
                energy = Math.min(supportRoom.energyCapacityAvailable, controller.level === 8 ? 1950 : 4100);
                units = Math.floor((energy - Math.ceil(energy / 3200) * 50) / 250);
                remainder = (energy - Math.ceil(energy / 3200) * 50) % 250;
    
                // Create the body based on the energy.
                for (count = 0; count < units; count++) {
                    body.push(WORK);
                    body.push(WORK);
                    workCount += 2;
                }
    
                if (remainder >= 150) {
                    body.push(WORK);
                    workCount++;
                }

                for (count = 0; count < Math.ceil(energy / 3200); count++) {
                    body.push(CARRY);
                }

                for (count = 0; count < units; count++) {
                    body.push(MOVE);
                }
    
                if (remainder >= 50) {
                    body.push(MOVE);
                }
            } else {
                // Get the total energy in the room, limited to 3300, or 3000 at RCL 8.
                energy = Math.min(supportRoom.energyCapacityAvailable, controller.level === 8 ? 3000 : 3300);
                units = Math.floor(energy / 200);
                remainder = energy % 200;
    
                // Create the body based on the energy.
                for (count = 0; count < units; count++) {
                    body.push(WORK);
                    workCount++;
                }
    
                if (remainder >= 150) {
                    body.push(WORK);
                    workCount++;
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
            }

            if (workCount > 0 && storage && Cache.labsInRoom(supportRoom).length > 0 && (Math.max(storage.store[RESOURCE_GHODIUM_HYDRIDE] || 0, storage.store[RESOURCE_GHODIUM_ACID] || 0, storage.store[RESOURCE_CATALYZED_GHODIUM_ACID] || 0)) >= 30 * workCount) {
                canBoost = !!(labToBoostWith = Utilities.getLabToBoostWith(supportRoom)[0]);
            }

            // Create the creep from the first listed spawn that is available, spawning only in the current room if they are being boosted.
            if (Cache.labsInRoom(supportRoom).length < 3) {
                spawnToUse = _.sortBy(_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body) && s.room.memory.region === supportRoom.memory.region), (s) => s.room.name === supportRoomName ? 0 : 1)[0];
            } else {
                spawnToUse = _.filter(spawns, (s) => !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body))[0];
            }

            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "upgrader-" + roomName + "-" + Game.time.toFixed(0).substring(4), {role: "upgrader", home: roomName, supportRoom: supportRoomName, homeSource: Utilities.objectsClosestToObj(room.find(FIND_SOURCES), spawns[0])[0].id, labs: canBoost ? [labToBoostWith.id] : []});
            Cache.spawning[spawnToUse.id] = typeof name !== "number";

            if (typeof name !== "number" && canBoost) {
                // Set the lab to be in use.
                labToBoostWith.creepToBoost = name;
                labToBoostWith.resource = (storage.store[RESOURCE_CATALYZED_GHODIUM_ACID] >= 30 * workCount) ? RESOURCE_CATALYZED_GHODIUM_ACID : ((storage.store[RESOURCE_GHODIUM_ACID] >= 30 * workCount) ? RESOURCE_GHODIUM_ACID : RESOURCE_GHODIUM_HYDRIDE);
                labToBoostWith.amount = 30 * workCount;
                supportRoom.memory.labsInUse.push(labToBoostWith);

                // If anything is coming to fill the lab, stop it.
                _.forEach(_.filter(Cache.creepsInRoom("all", supportRoom), (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && c.memory.currentTask.id === labToBoostWith.id), (creep) => {
                    delete creep.memory.currentTask;
                });
            }

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInRoom("upgrader", room)), (c) => _.sum(c.carry) > 0 || (!c.spawning && c.ticksToLive > 150)),
                assigned = [],
                controller = room.controller;

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If not yet boosted, go get boosts.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
                var task = new TaskRally(creep.memory.labs[0]);
                task.canAssign(creep);
                assigned.push(creep.name);
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Check for controllers to upgrade.
            _.forEach(tasks.upgradeController.tasks, (task) => {
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, controller), (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Controller");
                        assigned.push(creep.name);
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            });
            
            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to get energy from the closest link to the controller.
            _.forEach(creepsWithNoTask, (creep) => {
                var links = Utilities.objectsClosestToObj(Cache.linksInRoom(room), controller),
                    task;

                if (links.length > 0 && links[0].energy > 0) {
                    task = new TaskCollectEnergy(links[0].id);
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                    }
                }
            });

            _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
            assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // Attempt to get energy from containers.
            _.forEach(tasks.collectEnergy.tasks, (task) => {
                _.forEach(creepsWithNoTask, (creep) => {
                    if (task.canAssign(creep)) {
                        creep.say("Collecting");
                        assigned.push(creep.name);
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];
            });

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If there are no full containers in the room, attempt to assign harvest task to remaining creeps.
            if (_.filter(Cache.containersInRoom(room), (c) => c.energy > 0).length === 0 && !room.storage) {
                // Attempt to assign harvest task to remaining creeps.
                _.forEach(creepsWithNoTask, (creep) => {
                    var task = new TaskHarvest();
                    if (task.canAssign(creep)) {
                        creep.say("Harvesting");
                        assigned.push(creep.name);
                    }
                });
                _.remove(creepsWithNoTask, (c) => assigned.indexOf(c.name) !== -1);
                assigned = [];

                if (creepsWithNoTask.length === 0) {
                    return;
                }
            }

            // Rally remaining creeps.
            _.forEach(TaskRally.getHarvesterTasks(creepsWithNoTask), (task) => {
                task.canAssign(task.creep);
            });
        }
    };

require("screeps-profiler").registerObject(Upgrader, "RoleUpgrader");
module.exports = Upgrader;
