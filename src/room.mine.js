var RoomObj = require("roomObj"),
    Cache = require("cache"),
    Utilities = require("utilities"),
    RoleDismantler = require("role.dismantler"),
    RoleRemoteBuilder = require("role.remoteBuilder"),
    RoleRemoteMiner = require("role.remoteMiner"),
    RoleRemoteReserver = require("role.remoteReserver"),
    RoleRemoteStorer = require("role.remoteStorer"),
    RoleRemoteWorker = require("role.remoteWorker"),
    TaskBuild = require("task.build"),
    TaskCollectEnergy = require("task.collectEnergy"),
    TaskCollectMinerals = require("task.collectMinerals"),
    TaskDismantle = require("task.dismantle"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals"),
    TaskHeal = require("task.heal"),
    TaskRally = require("task.rally"),
    TaskRangedAttack = require("task.rangedAttack"),
    TaskRepair = require("task.repair"),
    TaskUpgradeController = require("task.upgradeController"),
    Mine = function(supportRoom, stage) {
        RoomObj.call(this);

        this.type = "mine";
        this.supportRoom = supportRoom;
        this.stage = stage || 1;
    };

Mine.prototype = Object.create(RoomObj.prototype);
Mine.prototype.constructor = Mine;

Mine.prototype.run = function(room) {
    "use strict";

    var completed = [],
        supportRoom, spawnToUse, tasks;

    // If there are no energy sources, bail.
    if (!room.unobservable && Cache.energySourcesInRoom(room).length === 0) {
        return;
    }

    // Can't see the support room, we have bigger problems, so just bail.
    if (!(supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom])) {
        return;
    }

    if (this.stage === 1) {
        // Spawn new creeps.
        RoleRemoteBuilder.checkSpawn(room);

        // Output room report.
        if (!room.unobservable) {
            tasks = {
                build: {
                    tasks: TaskBuild.getTasks(room)
                }
            };
            if (tasks.build.tasks.length > 0) {
                console.log("    Structures to build: " + tasks.build.tasks.length);
            }
        }

        // Assign tasks to creeps.                    
        RoleRemoteBuilder.assignTasks(room);

        if (!room.unobservable) {
            // Check to see if we have built containers.  If so, move to stage 2.
            if (Cache.containersInRoom(room).length === Cache.energySourcesInRoom(room).length) {
                this.stage = 2;

                // Loop through containers to get first container by source.
                _.forEach(Cache.containersInRoom(room), (container) => {
                    var source;

                    // If this container is for a mineral, skip it.
                    if ((source = Utilities.objectsClosestToObj([].concat.apply([], [Cache.energySourcesInRoom(room), Cache.mineralsInRoom(room)]), container)[0]) instanceof Mineral) {
                        return;
                    }

                    // Convert builders to workers.
                    _.forEach(Cache.creepsInRoom("remoteBuilder", room), (creep) => {
                        creep.memory.role = "remoteWorker";
                        creep.memory.container = Utilities.objectsClosestToObj(Cache.containersInRoom(room), source)[0].id;
                    });
                    return false;
                });

            }

            // Check to see if we have construction sites for the containers.  If not, create them.
            if (Cache.constructionSitesInRoom(room).length === 0) {
                spawnToUse = _.filter(Cache.spawnsInRoom(room), (s) => !s.spawning && !Cache.spawning[s.id])[0];

                _.forEach(Cache.energySourcesInRoom(room), (source) => {
                    var location = PathFinder.search(source.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1}).path[0];

                    if (
                        _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                        _.filter(Cache.constructionSitesInRoom(room), (s) => s.pos.x === location.x && s.pos.y === location.y && s.structureType === STRUCTURE_CONTAINER).length === 0
                    ) {
                        // Build the container.
                        room.createConstructionSite(location.x, location.y, STRUCTURE_CONTAINER);
                    }
                });
            } 
        }
    }

    if (this.stage === 2) {
        // If we've lost all our creeps, something probably went wrong, so revert to stage 1.
        if (room.unobservable) {
            if (
                Cache.creepsInRoom("remoteMiner", room).length === 0 &&
                Cache.creepsInRoom("remoteWorker", room).length === 0 &&
                Cache.creepsInRoom("remoteStorer", room).length === 0 &&
                Cache.creepsInRoom("remoteReserver", room).length === 0
            ) {
                this.stage = 1;
            }
        } else {
            // Check to see if we lost built containers.  If so, move to stage 1.
            if (Cache.containersInRoom(room).length !== Cache.energySourcesInRoom(room).length) {
                this.stage = 1;
            }

            // Spawn new creeps.
            RoleRemoteMiner.checkSpawn(room);
            RoleRemoteWorker.checkSpawn(room);
            RoleRemoteStorer.checkSpawn(room);
            RoleRemoteReserver.checkSpawn(room);
            if (Memory.dismantle && Memory.dismantle[room.name] && Memory.dismantle[room.name].length > 0) {
                RoleDismantler.checkSpawn(room, supportRoom);
            }
        }

        // Get the tasks needed for this room.
        tasks = {
            fillEnergy: {
                fillStorageTasks: TaskFillEnergy.getFillStorageTasks(supportRoom),
                fillContainerTasks: TaskFillEnergy.getFillContainerTasks(supportRoom),
                fillLinkTask: TaskFillEnergy.getFillLinkTask(room, supportRoom)
            },
            fillMinerals: {
                fillStorageTasks: TaskFillMinerals.getFillStorageTasks(supportRoom)
            }
        };

        // Output room report.
        if (!room.unobservable) {
            tasks.build = {
                tasks: TaskBuild.getTasks(room)
            };
            tasks.heal = {
                tasks: TaskHeal.getTasks(room)
            };
            tasks.repair = {
                criticalTasks: TaskRepair.getCriticalTasks(room),
                tasks: TaskRepair.getTasks(room)
            };
            tasks.dismantle = {
                tasks: []
            };

            if (Memory.dismantle && Memory.dismantle[room.name] && Memory.dismantle[room.name].length > 0) {
                _.forEach(Memory.dismantle[room.name], (pos) => {
                    var structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
                    if (structures.length === 0) {
                        completed.push(pos);
                    } else {
                        tasks.dismantle.tasks = tasks.dismantle.tasks.concat(_.map(structures, (s) => new TaskDismantle(s.id)));
                    }
                });
                _.forEach(completed, (complete) => {
                    _.remove(Memory.dismantle[room.name], (d) => d.x === complete.x && d.y === complete.y);
                });
            } else {
                _.forEach(Cache.creepsInRoom("dismantler", room), (creep) => {
                    creep.memory.role = "remoteWorker";
                    creep.memory.container = Cache.containersInRoom(room)[0].id;
                });
            }

            if (tasks.build.tasks.length > 0) {
                console.log("    Structures to build: " + tasks.build.tasks.length);
            }
            if (tasks.repair.criticalTasks.length > 0) {
                console.log("    Critical repairs needed: " + tasks.repair.criticalTasks.length);
                _.forEach(_.take(tasks.repair.criticalTasks, 5), (task) => {
                    console.log("      " + task.structure.structureType + " " + task.structure.pos.x + "," + task.structure.pos.y + " " + task.structure.hits + "/" + task.structure.hitsMax + " " + (100 * task.structure.hits / task.structure.hitsMax).toFixed(3) + "%");
                });
            }
            if (Cache.hostilesInRoom(room).length > 0) {
                console.log("    Hostiles: " + Cache.hostilesInRoom(room).length);
                _.forEach(_.take(Cache.hostilesInRoom(room), 5), (enemy) => {
                    console.log("      " + enemy.pos.x + "," + enemy.pos.y + " " + enemy.hits + "/" + enemy.hitsMax + " " + (100 * enemy.hits / enemy.hitsMax).toFixed(3) + "% " + (enemy.owner ? enemy.owner.username : ""));
                });
            }
            if (tasks.heal.tasks.length > 0) {
                console.log("    Creeps to heal: " + tasks.heal.tasks.length);
                _.forEach(_.take(tasks.heal.tasks, 5), (task) => {
                    console.log("      " + task.ally.pos.x + "," + task.ally.pos.y + " " + task.ally.hits + "/" + task.ally.hitsMax + " " + (100 * task.ally.hits / task.ally.hitsMax).toFixed(3) + "%");
                });
            }
        }

        // Assign tasks to creeps.                    
        RoleRemoteMiner.assignTasks(room, tasks);
        RoleRemoteWorker.assignTasks(room, tasks);
        RoleRemoteStorer.assignTasks(room, tasks);
        RoleRemoteReserver.assignTasks(room, tasks);
        if (Memory.dismantle && Memory.dismantle[room.name] && Memory.dismantle[room.name].length > 0) {
            RoleDismantler.assignTasks(room, tasks);
        }
    }
};

Mine.prototype.toObj = function(room) {
    "use strict";

    Memory.rooms[room.name].roomType = {
        type: this.type,
        supportRoom: this.supportRoom,
        stage: this.stage
    }
};

Mine.fromObj = function(roomMemory) {
    "use strict";

    return new Mine(roomMemory.roomType.supportRoom, roomMemory.roomType.stage);
};

require("screeps-profiler").registerObject(Mine, "RoomMine");
module.exports = Mine;
