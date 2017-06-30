const Cache = require("cache"),
    Commands = require("commands"),
    RoomEngine = require("roomEngine"),
    Utilities = require("utilities"),
    RoleDismantler = require("role.dismantler"),
    RoleRemoteBuilder = require("role.remoteBuilder"),
    RoleRemoteMiner = require("role.remoteMiner"),
    RoleRemoteReserver = require("role.remoteReserver"),
    RoleRemoteStorer = require("role.remoteStorer"),
    RoleRemoteWorker = require("role.remoteWorker");

//  ####                        #   #    #
//  #   #                       #   #
//  #   #   ###    ###   ## #   ## ##   ##    # ##    ###
//  ####   #   #  #   #  # # #  # # #    #    ##  #  #   #
//  # #    #   #  #   #  # # #  #   #    #    #   #  #####
//  #  #   #   #  #   #  # # #  #   #    #    #   #  #
//  #   #   ###    ###   #   #  #   #   ###   #   #   ###
/**
 * A class that represents a mine room.
 */
class RoomMine extends RoomEngine {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new mine room.
     * @param {Room} room The room.
     */
    constructor(room) {
        const {rooms: {[room.name]: roomMemory}} = Memory,
            {roomType} = roomMemory;

        super();
        this.type = "mine";
        this.room = room;
        ({rooms: {[roomType.supportRoom]: this.supportRoom}} = Game);
        this.stage = roomType.stage || 1;

        // Initialize memory.
        if (!room.memory.maxCreeps) {
            room.memory.maxCreeps = {};
        }
    }

    // ###   #  #  ###
    // #  #  #  #  #  #
    // #     #  #  #  #
    // #      ###  #  #
    /**
     * Runs the room.
     * @return {void}
     */
    run() {
        const {room, room: {controller}} = this;

        // If there are no energy sources, bail.
        if (!room.unobservable && room.find(FIND_SOURCES).length === 0) {
            return;
        }

        // Can't see the support room, we have bigger problems, so just bail.
        if (!Game.rooms[Memory.rooms[room.name].roomType.supportRoom]) {
            return;
        }

        // If the controller is ours, convert this to a base.
        if (this.type === "mine" && controller && controller.my) {
            this.convert();

            return;
        }

        if (this.stage === 1) {
            this.stage1();
        }

        if (this.stage === 2) {
            this.stage2();
        }
    }

    //                                      #
    //                                      #
    //  ##    ##   ###   # #    ##   ###   ###
    // #     #  #  #  #  # #   # ##  #  #   #
    // #     #  #  #  #  # #   ##    #      #
    //  ##    ##   #  #   #     ##   #       ##
    /**
     * Converts the mine to a base.
     * @return {void}
     */
    convert() {
        const {supportRoom: {name: supportRoomName}, room, room: {name: roomName}} = this,
            {rooms: {[roomName]: memory}} = Memory,
            {creeps: {[roomName]: creeps}} = Cache;

        Commands.claimRoom(supportRoomName, roomName, false);
        Commands.setRoomType(roomName, {type: "base", region: memory.region});

        _.forEach(creeps && creeps.all || [], (creep) => {
            const {memory: creepMemory} = creep;

            switch (creepMemory.role) {
                case "remoteBuilder":
                case "remoteWorker":
                    creepMemory.role = "worker";
                    creepMemory.home = roomName;
                    ({0: {id: creepMemory.homeSource}} = Utilities.objectsClosestToObj(room.find(FIND_SOURCES), creep));
                    break;
                case "remoteReserver":
                    creep.suicide();
                    break;
                case "remoteStorer":
                    creepMemory.role = "storer";
                    creepMemory.home = supportRoomName;
                    break;
                case "dismantler":
                    creepMemory.home = roomName;
                    creepMemory.supportRoom = roomName;
                    break;
            }
        });
    }

    //         #                       #
    //         #                      ##
    //  ###   ###    ###   ###   ##    #
    // ##      #    #  #  #  #  # ##   #
    //   ##    #    # ##   ##   ##     #
    // ###      ##   # #  #      ##   ###
    //                     ###
    /**
     * Runs the room while it is in stage 1.
     * @return {void}
     */
    stage1() {
        // Get tasks.
        this.stage1Tasks();

        // Spawn new creeps.
        this.stage1Spawn();

        // Assign tasks to creeps.
        this.stage1AssignTasks();

        if (!this.room.unobservable) {
            this.stage1Manage();
            this.defend();
        }
    }

    //         #                       #    ###                #
    //         #                      ##     #                 #
    //  ###   ###    ###   ###   ##    #     #     ###   ###   # #    ###
    // ##      #    #  #  #  #  # ##   #     #    #  #  ##     ##    ##
    //   ##    #    # ##   ##   ##     #     #    # ##    ##   # #     ##
    // ###      ##   # #  #      ##   ###    #     # #  ###    #  #  ###
    //                     ###
    /**
     * Tasks to perform while the room is in stage 1.
     * @return {void}
     */
    stage1Tasks() {
        const {room} = this;

        this.tasks = {};

        if (!room.unobservable) {
            this.tasks.hostiles = Cache.hostilesInRoom(room);
            this.tasks.hostileConstructionSites = Cache.hostileConstructionSitesInRoom(room);
        }
    }

    //         #                       #     ##
    //         #                      ##    #  #
    //  ###   ###    ###   ###   ##    #     #    ###    ###  #  #  ###
    // ##      #    #  #  #  #  # ##   #      #   #  #  #  #  #  #  #  #
    //   ##    #    # ##   ##   ##     #    #  #  #  #  # ##  ####  #  #
    // ###      ##   # #  #      ##   ###    ##   ###    # #  ####  #  #
    //                     ###                    #
    /**
     * Spawns creeps while the room is in stage 1.
     * @return {void}
     */
    stage1Spawn() {
        this.checkSpawn(RoleRemoteReserver, this.room.controller);
        this.checkSpawn(RoleRemoteBuilder, true);
    }

    //         #                       #     ##                  #                ###                #
    //         #                      ##    #  #                                   #                 #
    //  ###   ###    ###   ###   ##    #    #  #   ###    ###   ##     ###  ###    #     ###   ###   # #    ###
    // ##      #    #  #  #  #  # ##   #    ####  ##     ##      #    #  #  #  #   #    #  #  ##     ##    ##
    //   ##    #    # ##   ##   ##     #    #  #    ##     ##    #     ##   #  #   #    # ##    ##   # #     ##
    // ###      ##   # #  #      ##   ###   #  #  ###    ###    ###   #     #  #   #     # #  ###    #  #  ###
    //                     ###                                         ###
    /**
     * Assigns tasks to creeps while the room is in stage 1.
     * @return {void}
     */
    stage1AssignTasks() {
        const {room} = this;

        if (room.controller) {
            RoleRemoteReserver.assignTasks(this);
        }
        RoleRemoteBuilder.assignTasks(this);
        RoleRemoteMiner.assignTasks(this);
        RoleRemoteWorker.assignTasks(this);
        RoleRemoteStorer.assignTasks(this);
        RoleDismantler.assignTasks(this);
    }

    //         #                       #    #  #
    //         #                      ##    ####
    //  ###   ###    ###   ###   ##    #    ####   ###  ###    ###   ###   ##
    // ##      #    #  #  #  #  # ##   #    #  #  #  #  #  #  #  #  #  #  # ##
    //   ##    #    # ##   ##   ##     #    #  #  # ##  #  #  # ##   ##   ##
    // ###      ##   # #  #      ##   ###   #  #   # #  #  #   # #  #      ##
    //                     ###                                       ###
    /**
     * Manages the room while it is in stage 1.
     * @return {void}
     */
    stage1Manage() {
        const {room, room: {name: roomName}} = this,
            minerals = room.find(FIND_MINERALS),
            energySources = room.find(FIND_SOURCES),
            sources = Array.prototype.concat.apply([], [energySources, (/^[EW][0-9]*[4-6][NS][0-9]*[4-6]$/).test(roomName) ? minerals : []]),
            containers = Cache.containersInRoom(room),
            allSources = Array.prototype.concat.apply([], [energySources, minerals]),
            {creeps: {[roomName]: creeps}} = Cache;

        // Check to see if we have built containers.  If so, move to stage 2.
        if (containers.length >= sources.length) {
            this.stage = 2;

            // Loop through containers to get first container by source.
            _.forEach(containers, (container) => {
                const {0: source} = Utilities.objectsClosestToObj(allSources, container);

                // If this container is for a mineral, skip it.
                if (source instanceof Mineral) {
                    return true;
                }

                // Convert builders to workers.
                _.forEach(creeps && creeps.remoteBuilder || [], (creep) => {
                    const {memory} = creep;

                    memory.role = "remoteWorker";
                    ({0: {id: memory.container}} = Utilities.objectsClosestToObj(containers, source));
                });

                return false;
            });

            return;
        }

        // Check to see if we have construction sites for the containers.  If not, create them.
        const sites = room.find(FIND_MY_CONSTRUCTION_SITES);

        if (sites.length === 0) {
            _.forEach(sources, (source) => {
                const {path: {0: location}} = PathFinder.search(source.pos, {pos: Cache.spawnsInRoom(this.supportRoom)[0].pos, range: 1}, {swampCost: 1});

                if (
                    _.filter(location.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER).length === 0 &&
                    _.filter(sites, (s) => s.pos.x === location.x && s.pos.y === location.y && s.structureType === STRUCTURE_CONTAINER).length === 0
                ) {
                    // Build the container.
                    room.createConstructionSite(location.x, location.y, STRUCTURE_CONTAINER);
                }
            });
        }
    }

    //    #          #                  #
    //    #         # #                 #
    //  ###   ##    #     ##   ###    ###
    // #  #  # ##  ###   # ##  #  #  #  #
    // #  #  ##     #    ##    #  #  #  #
    //  ###   ##    #     ##   #  #   ###
    /**
     * Defends the room from invaders.
     * @return {void}
     */
    defend() {
        const {room, room: {name: roomName, memory: {threat}}, supportRoom, supportRoom: {name: supportRoomName}} = this,
            armyName = `${roomName}-defense`,
            hostiles = Cache.hostilesInRoom(room),
            {armies: {[armyName]: army}} = Cache;

        if (_.filter(hostiles, (h) => h.owner && ["Invader", "Source Keeper"].indexOf(h.owner.username) === -1).length > 0 && threat && threat > 0) {
            const maxCreeps = Math.ceil(threat / (BODYPART_COST[ATTACK] * 300));

            if (army) {
                army.boostRoom = "any";
                army.healer.maxCreeps = 2 * maxCreeps;
                army.melee.maxCreeps = maxCreeps;
                army.melee.escort = true;
                army.ranged.maxCreeps = maxCreeps;
                army.ranged.escort = true;
                army.success = false;
                army.reinforce = true;
            } else {
                Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: "any", buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: maxCreeps * 2, units: 20}, melee: {maxCreeps, units: 20, escort: true}, ranged: {maxCreeps, units: 20, escort: true}});
            }
        } else if (_.filter(hostiles, (h) => h.owner && h.owner.username === "Invader").length > 0) {
            // If there are invaders in the room, spawn an army if we don't have one.
            if (!army) {
                const {energyCapacityAvailable} = supportRoom;

                Commands.createArmy(armyName, {reinforce: false, region: room.memory.region, boostRoom: void 0, buildRoom: supportRoomName, stageRoom: supportRoomName, attackRoom: roomName, dismantle: [], dismantler: {maxCreeps: 0, units: 20}, healer: {maxCreeps: this.type === "source" ? 2 : 1, units: Math.min(Math.floor((energyCapacityAvailable - 300) / 300), 20)}, melee: {maxCreeps: this.type === "source" ? 2 : 1, units: Math.min(Math.floor((energyCapacityAvailable - 300) / 130), 20)}, ranged: {maxCreeps: 0, units: 20}});
            }
        } else if (army) {
            // Cancel army if invaders are gone.
            army.directive = "attack";
            army.success = true;
            army.reinforce = false;
        }
    }

    //         #                       ##
    //         #                      #  #
    //  ###   ###    ###   ###   ##      #
    // ##      #    #  #  #  #  # ##    #
    //   ##    #    # ##   ##   ##     #
    // ###      ##   # #  #      ##   ####
    //                     ###
    /**
     * Runs the room while it is in stage 2.
     * @return {void}
     */
    stage2() {
        // Manage room and bail if it got reset to stage 1.
        this.stage2Manage();
        this.defend();

        if (this.stage === 1) {
            return;
        }

        // Get the tasks needed for this room.
        this.stage2Tasks();

        // Spawn new creeps.
        if (!this.room.unobservable) {
            this.stage2Spawn();
        }

        // Assign tasks to creeps.
        this.stage2AssignTasks();
    }

    //         #                       ##   #  #
    //         #                      #  #  ####
    //  ###   ###    ###   ###   ##      #  ####   ###  ###    ###   ###   ##
    // ##      #    #  #  #  #  # ##    #   #  #  #  #  #  #  #  #  #  #  # ##
    //   ##    #    # ##   ##   ##     #    #  #  # ##  #  #  # ##   ##   ##
    // ###      ##   # #  #      ##   ####  #  #   # #  #  #   # #  #      ##
    //                     ###                                       ###
    /**
     * Manages the room while it is in stage 2.
     * @return {void}
     */
    stage2Manage() {
        const {room, room: {name: roomName}} = this,
            {creeps: {[roomName]: creeps}} = Cache;

        // If we've lost all our creeps, something probably went wrong, so revert to stage 1.
        if (room.unobservable) {
            if (
                (creeps && creeps.remoteMiner || []).length === 0 &&
                (creeps && creeps.remoteWorker || []).length === 0 &&
                (creeps && creeps.remoteStorer || []).length === 0 &&
                (creeps && creeps.remoteReserver || []).length === 0
            ) {
                this.stage = 1;
            }
        } else if (Cache.containersInRoom(room).length < Array.prototype.concat.apply([], [room.find(FIND_SOURCES), (/^[EW][0-9]*[4-6][NS][0-9]*[4-6]$/).test(room.name) ? room.find(FIND_MINERALS) : []]).length) {
            // We lost built containers.  If so, move to stage 1.
            this.stage = 1;
        }
    }

    //         #                       ##   ###                #
    //         #                      #  #   #                 #
    //  ###   ###    ###   ###   ##      #   #     ###   ###   # #    ###
    // ##      #    #  #  #  #  # ##    #    #    #  #  ##     ##    ##
    //   ##    #    # ##   ##   ##     #     #    # ##    ##   # #     ##
    // ###      ##   # #  #      ##   ####   #     # #  ###    #  #  ###
    //                     ###
    /**
     * Tasks to perform while the room is in stage 2.
     * @return {void}
     */
    stage2Tasks() {
        const {room} = this;

        this.tasks = {};

        if (!room.unobservable) {
            this.tasks.hostiles = Cache.hostilesInRoom(room);
            this.tasks.hostileConstructionSites = Cache.hostileConstructionSitesInRoom(room);
            this.tasks.energyStructures = Cache.containersInRoom(room);
            this.tasks.mineralStructures = Cache.containersInRoom(room);
        }
    }

    //         #                       ##    ##
    //         #                      #  #  #  #
    //  ###   ###    ###   ###   ##      #   #    ###    ###  #  #  ###
    // ##      #    #  #  #  #  # ##    #     #   #  #  #  #  #  #  #  #
    //   ##    #    # ##   ##   ##     #    #  #  #  #  # ##  ####  #  #
    // ###      ##   # #  #      ##   ####   ##   ###    # #  ####  #  #
    //                     ###                    #
    /**
     * Spawns creeps while the room is in stage 2.
     * @return {void}
     */
    stage2Spawn() {
        const {room} = this;

        // Bail if there are hostiles.
        if (Cache.hostilesInRoom(room).length > 0) {
            return;
        }

        const {dismantle, dismantle: {[room.name]: dismantleRoom}} = Memory;

        this.checkSpawn(RoleRemoteReserver, room.controller);
        this.checkSpawn(RoleRemoteMiner, true);
        this.checkSpawn(RoleRemoteWorker, true);
        this.checkSpawn(RoleRemoteStorer, true);
        this.checkSpawn(RoleDismantler, !!(dismantle && dismantleRoom && dismantleRoom.length > 0));
    }

    //         #                       ##    ##                  #                ###                #
    //         #                      #  #  #  #                                   #                 #
    //  ###   ###    ###   ###   ##      #  #  #   ###    ###   ##     ###  ###    #     ###   ###   # #    ###
    // ##      #    #  #  #  #  # ##    #   ####  ##     ##      #    #  #  #  #   #    #  #  ##     ##    ##
    //   ##    #    # ##   ##   ##     #    #  #    ##     ##    #     ##   #  #   #    # ##    ##   # #     ##
    // ###      ##   # #  #      ##   ####  #  #  ###    ###    ###   #     #  #   #     # #  ###    #  #  ###
    //                     ###                                         ###
    /**
     * Assigns tasks to creeps while the room is in stage 2.
     * @return {void}
     */
    stage2AssignTasks() {
        const {room} = this;

        if (room.controller) {
            RoleRemoteReserver.assignTasks(this);
        }
        RoleRemoteMiner.assignTasks(this);
        RoleRemoteWorker.assignTasks(this);
        RoleRemoteStorer.assignTasks(this);
        RoleDismantler.assignTasks(this);
    }

    //  #           ##   #       #
    //  #          #  #  #
    // ###    ##   #  #  ###     #
    //  #    #  #  #  #  #  #    #
    //  #    #  #  #  #  #  #    #
    //   ##   ##    ##   ###   # #
    //                          #
    /**
     * Serialize the room to an object.
     * @return {void}
     */
    toObj() {
        Memory.rooms[this.room.name].roomType = {
            type: this.type,
            supportRoom: this.supportRoom.name,
            stage: this.stage
        };
    }

    //   #                      ##   #       #
    //  # #                    #  #  #
    //  #    ###    ##   # #   #  #  ###     #
    // ###   #  #  #  #  ####  #  #  #  #    #
    //  #    #     #  #  #  #  #  #  #  #    #
    //  #    #      ##   #  #   ##   ###   # #
    //                                      #
    /**
     * Deserializes room from an object.
     * @param {Room} room The room to deserialize from.
     * @return {RoomMine} The deserialized room.
     */
    static fromObj(room) {
        return new RoomMine(room);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoomMine, "RoomMine");
}
module.exports = RoomMine;
