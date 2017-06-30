const Cache = require("cache"),
    Commands = require("commands"),
    RoomMine = require("room.mine"),
    RoleDefender = require("role.defender"),
    RoleHealer = require("role.healer"),
    RoleRemoteCollector = require("role.remoteCollector");

//  ####                         ###
//  #   #                       #   #
//  #   #   ###    ###   ## #   #       ###   #   #  # ##    ###    ###
//  ####   #   #  #   #  # # #   ###   #   #  #   #  ##  #  #   #  #   #
//  # #    #   #  #   #  # # #      #  #   #  #   #  #      #      #####
//  #  #   #   #  #   #  # # #  #   #  #   #  #  ##  #      #   #  #
//  #   #   ###    ###   #   #   ###    ###    ## #  #       ###    ###
/**
 * A class that represents a source room.
 */
class RoomSource extends RoomMine {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new source room.
     * @param {Room} room The room.
     */
    constructor(room) {
        super(room);

        this.type = "source";

        // We cannot convert source rooms, so remove the method.
        delete this.convert;
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

        super.stage1Tasks();

        if (!room.unobservable) {
            this.tasks.keepers = Cache.sourceKeepersInRoom(room);
            this.tasks.hurtCreeps = _.filter(Game.creeps, (c) => c.room.name === room.name && c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax);
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
        const {room, room: {name: roomName}} = this,
            {creeps: {[roomName]: creeps}} = Cache,
            defenders = creeps && creeps.defender || [];

        if (!room.unobservable) {
            this.checkSpawn(RoleDefender, true);
            this.checkSpawn(RoleHealer, true);

            if (!creeps || !defenders || _.filter(defenders, (c) => !c.spawning).length === 0) {
                return;
            }
        }

        // Call original method.
        super.stage1Spawn();
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
        RoleDefender.assignTasks(this);
        RoleHealer.assignTasks(this);

        // Call original method.
        super.stage1AssignTasks(this);
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

        super.stage2Tasks();

        if (!room.unobservable) {
            this.tasks.keepers = Cache.sourceKeepersInRoom(room).sort((a, b) => {
                if (a.ticksToSpawn && !b.ticksToSpawn) {
                    return -1;
                }

                if (!a.ticksToSpawn && b.ticksToSpawn) {
                    return 1;
                }

                return a.ticksToSpawn - b.ticksToSpawn;
            });
            this.tasks.hurtCreeps = _.filter(Game.creeps, (c) => c.room.name === room.name && c.hits < c.hitsMax).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax);
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
        const {room, room: {name: roomName}} = this,
            {creeps: {[roomName]: creeps}} = Cache,
            defenders = creeps && creeps.defender || [];

        if (!room.unobservable) {
            this.checkSpawn(RoleDefender, true);
            this.checkSpawn(RoleHealer, true);

            if (!creeps || !defenders || _.filter(defenders, (c) => !c.spawning).length === 0) {
                return;
            }

            // Call original method.
            super.stage2Spawn();

            this.checkSpawn(RoleRemoteCollector, true);
        }
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
        RoleDefender.assignTasks(this);
        RoleHealer.assignTasks(this);

        // Call original method.
        super.stage2AssignTasks();

        RoleRemoteCollector.assignTasks(this);
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
     * @return {RoomSource} The deserialized room.
     */
    static fromObj(room) {
        return new RoomSource(room);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(RoomSource, "RoomSource");
}
module.exports = RoomSource;
