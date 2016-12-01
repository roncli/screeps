var Cache = require("cache"),
    Utilities = require("utilities"),
    TaskRally = require("task.rally"),

    Upgrader = {
        checkSpawn: (room) => {
            "use strict";

            var count, sources, max;
            
            // If there are no spawns in the room, ignore the room.
            if (Cache.spawnsInRoom(room).length === 0) {
                return;
            }

            // If there is not enough energy in storage, ignore the room.
            if (!room.storage || room.storage.store[RESOURCE_ENERGY] < 100000) {
                return;
            }

            // If we have less than max upgraders, spawn an upgrader.
            count = _.filter(Cache.creepsInRoom("upgrader", room), (c) => c.spawning || c.ticksToLive >= 150).length;
            max = 1;

            if (count < max) {
                Upgrader.spawn(room);
            }

            // Output upgrader count in the report.
            Cache.log.rooms[room.name].creeps.push({
                role: "upgrader",
                count: Cache.creepsInRoom("upgrader", room).length,
                max: max
            });
        },
        
        spawn: (room) => {
            "use strict";

            var body = [], workCount = 0, canBoost = false,
                energy, count, spawnToUse, name, labToBoostWith;

            // Fail if all the spawns are busy.
            if (_.filter(Game.spawns, (s) => !s.spawning && !Cache.spawning[s.id]).length === 0) {
                return false;
            }

            // Get the total energy in the room, limited to 3300, or 3000 at RCL 8.
            energy = Math.min(room.energyCapacityAvailable, room.controller.level === 8 ? 3000 : 3300);

            // Create the body based on the energy.
            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(WORK);
                workCount++;
            }

            if (energy % 200 >= 150) {
                body.push(WORK);
                workCount++;
            }

            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(CARRY);
            }

            if (energy % 200 >= 100 && energy % 200 < 150) {
                body.push(CARRY);
            }

            for (count = 0; count < Math.floor(energy / 200); count++) {
                body.push(MOVE);
            }

            if (energy % 200 >= 50) {
                body.push(MOVE);
            }

            if (workCount > 0 && room.storage && Cache.labsInRoom(room).length > 0 && room.storage.store[RESOURCE_GHODIUM_HYDRIDE] >= 30 * workCount) {
                canBoost = !!(labToBoostWith = Utilities.getLabToBoostWith(room));
            }

            // Create the creep from the first listed spawn that is available, spawning only in the current room if they are being boosted.
            spawnToUse = _.sortBy(_.filter(Game.spawns, (s) => (!canBoost || s.room.name === room.name) && !s.spawning && !Cache.spawning[s.id] && s.room.energyAvailable >= Utilities.getBodypartCost(body)), (s) => s.room.name === room.name ? 0 : 1)[0];
            if (!spawnToUse) {
                return false;
            }
            name = spawnToUse.createCreep(body, "upgrader-" + room.name + "-" + Game.time.toFixed(0).substring(4), {role: "upgrader", home: room.name, labs: canBoost ? [labToBoostWith.id] : []});
            if (spawnToUse.room.name === room.name) {
                Cache.spawning[spawnToUse.id] = true;
            }

            if (typeof name !== "number" && canBoost) {
                // Set the lab to be in use.
                labToBoostWith.creepToBoost = name;
                labToBoostWith.resource = RESOURCE_GHODIUM_HYDRIDE;
                labToBoostWith.amount = 30 * workCount;
                room.memory.labsInUse.push(labToBoostWith);

                // If anything is coming to fill the lab, stop it.
                _.forEach(_.filter(Cache.creepsInRoom("all", room), (c) => c.memory.currentTask && c.memory.currentTask.type === "fillMinerals" && c.memory.currentTask.id === labToBoostWith.id), (creep) => {
                    delete creep.memory.currentTask;
                });
            }

            return typeof name !== "number";
        },

        assignTasks: (room, tasks) => {
            "use strict";

            var creepsWithNoTask = _.filter(Utilities.creepsWithNoTask(Cache.creepsInRoom("upgrader", room)), (c) => _.sum(c.carry) > 0 || (!c.spawning && c.ticksToLive > 150)),
                assigned = [];

            if (creepsWithNoTask.length === 0) {
                return;
            }

            // If not yet boosted, go get boosts.
            _.forEach(_.filter(creepsWithNoTask, (c) => c.memory.labs && c.memory.labs.length > 0), (creep) => {
                var task = new TaskRally(creep.labs[0]);
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
                _.forEach(Utilities.objectsClosestToObj(creepsWithNoTask, room.controller), (creep) => {
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

            // Rally remaining creeps.
            _.forEach(TaskRally.getHarvesterTasks(creepsWithNoTask), (task) => {
                task.canAssign(task.creep);
            });
        }
    };

require("screeps-profiler").registerObject(Upgrader, "RoleUpgrader");
module.exports = Upgrader;
