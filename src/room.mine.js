var RoomObj = require("roomObj"),
    Cache = require("cache"),
    Commands = require("commands"),
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
        supportRoom, oldRoomType, tasks;

    // If there are no energy sources, bail.
    if (!room.unobservable && room.find(FIND_SOURCES).length === 0) {
        return;
    }

    // Can't see the support room, we have bigger problems, so just bail.
    if (!(supportRoom = Game.rooms[Memory.rooms[room.name].roomType.supportRoom])) {
        return;
    }

    // If the controller is ours, convert this to a base.
    if (room.controller && room.controller.my) {
        oldRoomType = Memory.rooms[room.name].roomType.type;
        Commands.setRoomType(room.name, {type: "base", region: room.memory.region});
        Commands.claimRoom(supportRoom.name, room.name, false);
        switch (oldRoomType) {
            case "mine":
                _.forEach(Cache.creepsInRoom("all", room), (creep) => {
                    switch (creep.memory.role) {
                        case "remoteBuilder":
                        case "remoteWorker":
                            creep.memory.role = "worker";
                            creep.memory.home = room.name;
                            creep.memory.homeSource = Utilities.objectsClosestToObj(room.find(FIND_SOURCES), creep)[0].id;
                            break;
                        case "remoteReserver":
                            creep.suicide();
                            break;
                        case "remoteStorer":
                            creep.memory.role = "storer";
                            creep.memory.home = creep.memory.supportRoom;
                            break;
                        case "dismantler":
                            creep.memory.home = room.name;
                            creep.memory.supportRoom = room.name;
                            break;
                    }
                });
        }
        return;
    }

    if (this.stage === 1) {
        // Spawn new creeps.
        RoleRemoteBuilder.checkSpawn(room);
        RoleRemoteReserver.checkSpawn(room);

        // Get tasks.
        if (!room.unobservable) {
            tasks = {
                build: {
                    tasks: TaskBuild.getTasks(room)
                }
            };
        }

        // Assign tasks to creeps.                    
        RoleRemoteBuilder.assignTasks(room);
        RoleRemoteReserver.assignTasks(room);

        if (!room.unobservable) {
            // Check to see if we have built containers.  If so, move to stage 2.
            if (Cache.containersInRoom(room).length === room.find(FIND_SOURCES).length) {
                this.stage = 2;

                // Loop through containers to get first container by source.
                _.forEach(Cache.containersInRoom(room), (container) => {
                    var source;

                    // If this container is for a mineral, skip it.
                    if ((source = Utilities.objectsClosestToObj([].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]), container)[0]) instanceof Mineral) {
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
            if (room.find(FIND_MY_CONSTRUCTION_SITES).length === 0) {
                _.forEach(room.find(FIND_SOURCES), (source) => {
                    var location = PathFinder.search(source.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1}).path[0];

                    if (
                        _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureContainer).length === 0 &&
                        _.filter(room.find(FIND_MY_CONSTRUCTION_SITES), (s) => s.pos.x === location.x && s.pos.y === location.y && s instanceof StructureContainer).length === 0
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
            if (Cache.containersInRoom(room).length !== room.find(FIND_SOURCES).length) {
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
                storageTasks: TaskFillEnergy.getStorageTasks(supportRoom),
                containerTasks: TaskFillEnergy.getContainerTasks(supportRoom)
            },
            fillMinerals: {
                labTasks: TaskFillMinerals.getLabTasks(supportRoom),
                storageTasks: TaskFillMinerals.getStorageTasks(supportRoom),
                terminalTasks: TaskFillMinerals.getTerminalTasks(supportRoom)
            }
        };

        // Get tasks.
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
        }

        // Assign tasks to creeps.                    
        RoleRemoteMiner.assignTasks(room, tasks);
        RoleRemoteWorker.assignTasks(room, tasks);
        RoleRemoteStorer.assignTasks(room, tasks);
        RoleRemoteReserver.assignTasks(room, tasks);
        RoleDismantler.assignTasks(room, tasks);
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
