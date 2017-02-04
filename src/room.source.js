var RoomObj = require("roomObj"),
    Cache = require("cache"),
    Commands = require("commands"),
    Utilities = require("utilities"),
    RoleDefender = require("role.defender"),
    RoleHealer = require("role.healer"),
    RoleMeleeAttack = require("role.meleeAttack"),
    RoleRangedAttack = require("role.rangedAttack"),
    RoleRemoteBuilder = require("role.remoteBuilder"),
    RoleRemoteCollector = require("role.remoteCollector"),
    RoleRemoteMiner = require("role.remoteMiner"),
    RoleRemoteStorer = require("role.remoteStorer"),
    RoleRemoteWorker = require("role.remoteWorker"),
    RoleSourceDefender = require("role.sourceDefender"),
    TaskBuild = require("task.build"),
    TaskFillEnergy = require("task.fillEnergy"),
    TaskFillMinerals = require("task.fillMinerals"),
    Source = function(supportRoom, stage) {
        "use strict";
    
        this.init(supportRoom, stage);
    };

Source.prototype = Object.create(RoomObj.prototype);
Source.prototype.constructor = Source;

Source.prototype.init = function(supportRoom, stage) {
    "use strict";
    
    RoomObj.call(this);

    this.type = "source";
    this.supportRoom = supportRoom;
    this.stage = stage || 1;
};

Source.prototype.stage1Tasks = function(room, supportRoom) {
    "use strict";
    
    var tasks = {
        fillEnergy: {
            storageTasks: TaskFillEnergy.getStorageTasks(supportRoom),
            containerTasks: TaskFillEnergy.getContainerTasks(supportRoom)
        },
        fillMinerals: {
            storageTasks: TaskFillMinerals.getStorageTasks(supportRoom),
            terminalTasks: TaskFillMinerals.getTerminalTasks(supportRoom)
        }
    };
    
    if (!room.unobservable) {
        tasks.build = {
            tasks: TaskBuild.getTasks(room)
        };
    }
    
    return tasks;
};

Source.prototype.stage1Spawn = function(room) {
    var roomName = room.name;

    RoleSourceDefender.checkSpawn(room);
    RoleMeleeAttack.checkSpawn(room);
    RoleRangedAttack.checkSpawn(room);
    RoleHealer.checkSpawn(room);
    RoleDefender.checkSpawn(room);

    if (!Cache.creeps[roomName] || !Cache.creeps[roomName].sourceDefender || _.filter(Cache.creeps[roomName].sourceDefender, (c) => !c.spawning).length === 0) {
        return;
    }

    RoleRemoteBuilder.checkSpawn(room);
};

Source.prototype.stage1AssignTasks = function(room, tasks) {
    RoleSourceDefender.assignTasks(room, tasks);
    RoleMeleeAttack.assignTasks(room, tasks);
    RoleRangedAttack.assignTasks(room, tasks);
    RoleHealer.assignTasks(room, tasks);
    RoleDefender.assignTasks(room, tasks);
    RoleRemoteBuilder.assignTasks(room);
    RoleRemoteMiner.assignTasks(room, tasks);
    RoleRemoteWorker.assignTasks(room, tasks);
    RoleRemoteStorer.assignTasks(room, tasks);
    RoleRemoteCollector.assignTasks(room, tasks);
};

Source.prototype.stage1Manage = function(room, supportRoom) {
    var sources, containers, roomName, sites;
    
    if (!room.unobservable) {
        sources = [].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]);
        containers = Cache.containersInRoom(room);
        roomName = room.name;

        // Check to see if we have built containers.  If so, move to stage 2.
        if (containers.length === sources.length) {
            this.stage = 2;

            // Loop through containers to get first container by source.
            _.forEach(containers, (container) => {
                var source = Utilities.objectsClosestToObj([].concat.apply([], [sources, room.find(FIND_MINERALS)]), container)[0];

                // If this container is for a mineral, skip it.
                if (source instanceof Mineral) {
                    return;
                }

                // Convert builders to workers.
                _.forEach(Cache.creeps[roomName] && Cache.creeps[roomName].remoteBuilder || [], (creep) => {
                    creep.memory.role = "remoteWorker";
                    creep.memory.container = Utilities.objectsClosestToObj(containers, source)[0].id;
                });
                return false;
            });

        }

        // Check to see if we have construction sites for the containers.  If not, create them.
        sites = room.find(FIND_MY_CONSTRUCTION_SITES);
        if (sites.length === 0) {
            _.forEach(sources, (source) => {
                var location = PathFinder.search(source.pos, {pos: Cache.spawnsInRoom(supportRoom)[0].pos, range: 1}, {swampCost: 1}).path[0];

                if (
                    _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s instanceof StructureContainer).length === 0 &&
                    _.filter(sites, (s) => s.pos.x === location.x && s.pos.y === location.y && s instanceof StructureContainer).length === 0
                ) {
                    // Build the container.
                    room.createConstructionSite(location.x, location.y, STRUCTURE_CONTAINER);
                }
            });
        } 
    }
};

Source.prototype.stage1 = function(room, supportRoom) {
    "use strict";

    // Get tasks.
    var tasks = this.stage1Tasks(room, supportRoom);

    // Spawn new creeps.
    this.stage1Spawn(room);

    // Assign tasks to creeps.
    this.stage1AssignTasks(room, tasks);

    this.stage1Manage(room, supportRoom);
};

Source.prototype.stage2Manage = function(room, supportRoom) {
    var roomName = room.name,
        supportRoomName = supportRoom.name;

    // If we've lost all our creeps, something probably went wrong, so revert to stage 1.
    if (room.unobservable) {
        if (
            (Cache.creeps[roomName] && Cache.creeps[roomName].remoteMiner || []).length === 0 &&
            (Cache.creeps[roomName] && Cache.creeps[roomName].remoteWorker || []).length === 0 &&
            (Cache.creeps[roomName] && Cache.creeps[roomName].remoteStorer || []).length === 0
        ) {
            this.stage = 1;
        }
    } else {
        // Check to see if we lost built containers.  If so, move to stage 1.
        let sources = [].concat.apply([], [room.find(FIND_SOURCES), room.find(FIND_MINERALS)]);
        if (Cache.containersInRoom(room).length !== sources.length) {
            this.stage = 1;
        }

        if (_.filter(Cache.hostilesInRoom(room), (h) => h.owner && h.owner.username === "Invader").length > 0) {
            // If there are invaders in the room, spawn an army if we don't have one.
            if (!Memory.army[roomName + "-defense"]) {
                Commands.createArmy(roomName + "-defense", {reinforce: false, region: room.memory.region, boostRoom: undefined, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: 2, units: 17}, melee: {maxCreeps: 2, units: 20}, ranged: {maxCreeps: 2, units: 20}});
            }
        } else if (Memory.army[roomName + "-defense"]) {
            // Cancel army if invaders are gone.
            Memory.army[roomName + "-defense"].directive = "attack";
            Memory.army[roomName + "-defense"].success = true;
        }
    }
};

Source.prototype.stage2Spawn = function(room, supportRoom) {
    var roomName = room.name;

    RoleSourceDefender.checkSpawn(room);
    RoleMeleeAttack.checkSpawn(room);
    RoleRangedAttack.checkSpawn(room);
    RoleHealer.checkSpawn(room);
    RoleDefender.checkSpawn(room);
    
    if (!Cache.creeps[roomName] || !Cache.creeps[roomName].sourceDefender || _.filter(Cache.creeps[roomName].sourceDefender, (c) => !c.spawning).length === 0) {
        return;
    }

    RoleRemoteMiner.checkSpawn(room);
    RoleRemoteWorker.checkSpawn(room);
    RoleRemoteStorer.checkSpawn(room);
    RoleRemoteCollector.checkSpawn(room, supportRoom);
};

Source.prototype.stage2Tasks = function(room, supportRoom) {
    var roomName = room.name,
        creeps = Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteWorker || []).length > 0 || Utilities.creepsWithNoTask(Cache.creeps[roomName] && Cache.creeps[roomName].remoteStorer || []).length > 0;
        tasks = {
            fillEnergy: {
                storageTasks: creeps ? TaskFillEnergy.getStorageTasks(supportRoom) : [],
                containerTasks: creeps ? TaskFillEnergy.getContainerTasks(supportRoom) : []
            },
            fillMinerals: {
                storageTasks: creeps ? TaskFillMinerals.getStorageTasks(supportRoom) : [],
                terminalTasks: creeps ? TaskFillMinerals.getTerminalTasks(supportRoom) : []
            }
        };

    return tasks;
};

Source.prototype.stage2AssignTasks = function(room, tasks) {
    RoleSourceDefender.assignTasks(room, tasks);
    RoleMeleeAttack.assignTasks(room, tasks);
    RoleRangedAttack.assignTasks(room, tasks);
    RoleHealer.assignTasks(room, tasks);
    RoleDefender.assignTasks(room, tasks);
    RoleRemoteMiner.assignTasks(room, tasks);
    RoleRemoteWorker.assignTasks(room, tasks);
    RoleRemoteStorer.assignTasks(room, tasks);
    RoleRemoteCollector.assignTasks(room, tasks);
};

Source.prototype.stage2 = function(room, supportRoom) {
    var tasks;

    // Manage room and bail if it got reset to stage 1.    
    this.stage2Manage(room, supportRoom);
    if (this.stage === 1) {
        return;
    }
    
    // Spawn new creeps.
    if (!room.unobservable) {
        this.stage2Spawn(room, supportRoom);
    }
    
    // Get the tasks needed for this room.
    tasks = this.stage2Tasks(room, supportRoom);

    // Assign tasks to creeps.
    this.stage2AssignTasks(room, tasks);
};

Source.prototype.run = function(room) {
    "use strict";

    var supportRoom;

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
        this.convert(room, supportRoom);
        return;
    }

    if (this.stage === 1) {
        this.stage1(room, supportRoom);
    }

    if (this.stage === 2) {
        this.stage2(room, supportRoom);
    }
};

Source.prototype.toObj = function(room) {
    "use strict";

    Memory.rooms[room.name].roomType = {
        type: this.type,
        supportRoom: this.supportRoom,
        stage: this.stage
    };
};

Source.fromObj = function(roomMemory) {
    "use strict";

    return new Source(roomMemory.roomType.supportRoom, roomMemory.roomType.stage);
};

require("screeps-profiler").registerObject(Source, "RoomSource");
module.exports = Source;
