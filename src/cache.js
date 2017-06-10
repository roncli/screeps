//   ###                 #
//  #   #                #
//  #       ###    ###   # ##    ###
//  #          #  #   #  ##  #  #   #
//  #       ####  #      #   #  #####
//  #   #  #   #  #   #  #   #  #
//   ###    ####   ###   #   #   ###
/**
 * A class that caches data.
 */
class Cache {
    //                           #
    //                           #
    // ###    ##    ###    ##   ###
    // #  #  # ##  ##     # ##   #
    // #     ##      ##   ##     #
    // #      ##   ###     ##     ##
    /**
     * Resets the cache.
     * @return {void}
     */
    static reset() {
        // Caches for objects.
        this.extensions = {};
        this.hostileConstructionSites = {};
        this.hostiles = {};
        this.spawns = {};
        this.resources = {};
        this.sortedRepairableStructures = {};

        // Long term objects.
        if (Game.time % 2 === 0 || !this.containers) {
            this.containers = {};
            this.costMatrixes = {};
            this.criticalRepairableStructures = {};
            this.extractors = {};
            this.labs = {};
            this.links = {};
            this.nukers = {};
            this.portals = {};
            this.powerBanks = {};
            this.powerSpawns = {};
            this.repairableStructures = {};
            this.sortedResources = {};
            this.sourceKeepers = {};
            this.towers = {};
        }

        // Caches for data.
        this.armies = {};
        this.creepTasks = {};
        this.spawning = {};
        this.rooms = {};

        // Cache for log.
        this.log = {
            events: [],
            hostiles: [],
            creeps: [],
            spawns: [],
            structures: [],
            rooms: {},
            army: {}
        };

        // Cache for credits.
        ({market: {credits: this.credits}} = Game);

        // Cache the global visual and the time if we have visualizations on.
        if (Memory.visualizations) {
            this.globalVisual = new RoomVisual();
            this.time = new Date()
                .toLocaleString("en-US", {timeZone: "America/Los_Angeles"})
                .replace(",", "");
        }
    }

    //                    #           #                             ###         ###
    //                    #                                          #          #  #
    //  ##    ##   ###   ###    ###  ##    ###    ##   ###    ###    #    ###   #  #   ##    ##   # #
    // #     #  #  #  #   #    #  #   #    #  #  # ##  #  #  ##      #    #  #  ###   #  #  #  #  ####
    // #     #  #  #  #   #    # ##   #    #  #  ##    #       ##    #    #  #  # #   #  #  #  #  #  #
    //  ##    ##   #  #    ##   # #  ###   #  #   ##   #     ###    ###   #  #  #  #   ##    ##   #  #
    /**
     * Caches containers in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureContainer[]} The containers in the room.
     */
    static containersInRoom(room) {
        return this.containers[room.name] ? this.containers[room.name] : this.containers[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_CONTAINER});
    }

    //                     #    #  #         #           #          ####              ###
    //                     #    ####         #                      #                 #  #
    //  ##    ##    ###   ###   ####   ###  ###   ###   ##    #  #  ###    ##   ###   #  #   ##    ##   # #
    // #     #  #  ##      #    #  #  #  #   #    #  #   #     ##   #     #  #  #  #  ###   #  #  #  #  ####
    // #     #  #    ##    #    #  #  # ##   #    #      #     ##   #     #  #  #     # #   #  #  #  #  #  #
    //  ##    ##   ###      ##  #  #   # #    ##  #     ###   #  #  #      ##   #     #  #   ##    ##   #  #
    /**
     * Caches the cost matrix for a room.
     * @param {Room} room The room to cache for.
     * @return {CostMatrix} The cost matrix for the room.
     */
    static costMatrixForRoom(room) {
        const {name: roomName} = room;

        if (!room || room.unobservable) {
            return new PathFinder.CostMatrix();
        }

        if (!this.costMatrixes[roomName]) {
            const matrix = new PathFinder.CostMatrix();

            _.forEach(room.find(FIND_STRUCTURES), (structure) => {
                const {pos} = structure;

                if (structure.structureType === STRUCTURE_ROAD) {
                    matrix.set(pos.x, pos.y, Math.max(1, matrix.get(pos.x, pos.y)));
                } else if (structure.structureType === STRUCTURE_WALL) {
                    matrix.set(pos.x, pos.y, 255);
                } else if (structure.structureType === STRUCTURE_CONTAINER) {
                    matrix.set(pos.x, pos.y, Math.max(10, matrix.get(pos.x, pos.y)));
                } else if (!(structure.structureType === STRUCTURE_RAMPART) || !structure.my) {
                    matrix.set(pos.x, pos.y, 255);
                }
            });

            _.forEach(room.find(FIND_MY_CONSTRUCTION_SITES), (structure) => {
                const {pos} = structure;

                matrix.set(pos.x, pos.y, Math.max(5, matrix.get(pos.x, pos.y)));
            });

            _.forEach(this.portalsInRoom(room), (structure) => {
                const {pos} = structure;

                matrix.set(pos.x, pos.y, 10);
            });

            if (Memory.avoidSquares[roomName]) {
                _.forEach(Memory.avoidSquares[roomName], (square) => {
                    matrix.set(square.x, square.y, 255);
                });
            }

            this.costMatrixes[roomName] = matrix;
        }

        return this.costMatrixes[roomName];
    }

    //              #     #     #                ##    ###                      #                #     ##           ##    #                       #                             ###         ###
    //                    #                       #    #  #                                      #      #          #  #   #                       #                              #          #  #
    //  ##   ###   ##    ###   ##     ##    ###   #    #  #   ##   ###    ###  ##    ###    ###  ###    #     ##    #    ###   ###   #  #   ##   ###   #  #  ###    ##    ###    #    ###   #  #   ##    ##   # #
    // #     #  #   #     #     #    #     #  #   #    ###   # ##  #  #  #  #   #    #  #  #  #  #  #   #    # ##    #    #    #  #  #  #  #      #    #  #  #  #  # ##  ##      #    #  #  ###   #  #  #  #  ####
    // #     #      #     #     #    #     # ##   #    # #   ##    #  #  # ##   #    #     # ##  #  #   #    ##    #  #   #    #     #  #  #      #    #  #  #     ##      ##    #    #  #  # #   #  #  #  #  #  #
    //  ##   #     ###     ##  ###    ##    # #  ###   #  #   ##   ###    # #  ###   #      # #  ###   ###    ##    ##     ##  #      ###   ##     ##   ###  #      ##   ###    ###   #  #  #  #   ##    ##   #  #
    //                                                             #
    /**
     * Caches critical repairable structures in a room.
     * @param {Room} room The room to cache for.
     * @return {Structure[]} The structures in need of critical repairs.
     */
    static criticalRepairableStructuresInRoom(room) {
        return this.criticalRepairableStructures[room.name] ? this.criticalRepairableStructures[room.name] : this.criticalRepairableStructures[room.name] = _.filter(this.sortedRepairableStructuresInRoom(room), (s) => s.hits < 125000 && s.hits / s.hitsMax < 0.5);
    }

    //              #                        #                       ###         ###
    //              #                                                 #          #  #
    //  ##   #  #  ###    ##   ###    ###   ##     ##   ###    ###    #    ###   #  #   ##    ##   # #
    // # ##   ##    #    # ##  #  #  ##      #    #  #  #  #  ##      #    #  #  ###   #  #  #  #  ####
    // ##     ##    #    ##    #  #    ##    #    #  #  #  #    ##    #    #  #  # #   #  #  #  #  #  #
    //  ##   #  #    ##   ##   #  #  ###    ###    ##   #  #  ###    ###   #  #  #  #   ##    ##   #  #
    /**
     * Caches extensions in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureExtension[]} The extensions in the room.
     */
    static extensionsInRoom(room) {
        return this.extensions[room.name] ? this.extensions[room.name] : this.extensions[room.name] = room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_EXTENSION});
    }

    //              #                       #                       ###         ###
    //              #                       #                        #          #  #
    //  ##   #  #  ###   ###    ###   ##   ###    ##   ###    ###    #    ###   #  #   ##    ##   # #
    // # ##   ##    #    #  #  #  #  #      #    #  #  #  #  ##      #    #  #  ###   #  #  #  #  ####
    // ##     ##    #    #     # ##  #      #    #  #  #       ##    #    #  #  # #   #  #  #  #  #  #
    //  ##   #  #    ##  #      # #   ##     ##   ##   #     ###    ###   #  #  #  #   ##    ##   #  #
    /**
     * Caches extractors in a room.
     * @param {Room} room The room to cache for.
     * @return {Structure[]} The extractors in the room.
     */
    static extractorsInRoom(room) {
        return this.extractors[room.name] ? this.extractors[room.name] : this.extractors[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_EXTRACTOR});
    }

    // #                   #     #    ##           ##                       #                       #     #                 ##    #     #                 ###         ###
    // #                   #           #          #  #                      #                       #                      #  #         #                  #          #  #
    // ###    ##    ###   ###   ##     #     ##   #      ##   ###    ###   ###   ###   #  #   ##   ###   ##     ##   ###    #    ##    ###    ##    ###    #    ###   #  #   ##    ##   # #
    // #  #  #  #  ##      #     #     #    # ##  #     #  #  #  #  ##      #    #  #  #  #  #      #     #    #  #  #  #    #    #     #    # ##  ##      #    #  #  ###   #  #  #  #  ####
    // #  #  #  #    ##    #     #     #    ##    #  #  #  #  #  #    ##    #    #     #  #  #      #     #    #  #  #  #  #  #   #     #    ##      ##    #    #  #  # #   #  #  #  #  #  #
    // #  #   ##   ###      ##  ###   ###    ##    ##    ##   #  #  ###      ##  #      ###   ##     ##  ###    ##   #  #   ##   ###     ##   ##   ###    ###   #  #  #  #   ##    ##   #  #
    /**
     * Caches hostile construction sites in a room.  Allies are excluded.
     * @param {Room} room The room to check for hostile construction sites in.
     * @return {ConstructionSite[]} The hostile construction sites in the room.
     */
    static hostileConstructionSitesInRoom(room) {
        return this.hostileConstructionSites[room.name] ? this.hostileConstructionSites[room.name] : this.hostileConstructionSites[room.name] = room.find(FIND_HOSTILE_CONSTRUCTION_SITES, {filter: (s) => !s.owner || Memory.allies.indexOf(s.owner.username) === -1});
    }

    // #                   #     #    ##                 ###         ###
    // #                   #           #                  #          #  #
    // ###    ##    ###   ###   ##     #     ##    ###    #    ###   #  #   ##    ##   # #
    // #  #  #  #  ##      #     #     #    # ##  ##      #    #  #  ###   #  #  #  #  ####
    // #  #  #  #    ##    #     #     #    ##      ##    #    #  #  # #   #  #  #  #  #  #
    // #  #   ##   ###      ##  ###   ###    ##   ###    ###   #  #  #  #   ##    ##   #  #
    /**
     * Caches hostiles in a room.  Allies are excluded.
     * @param {Room} room The room to cache for.
     * @return {Creep[]} The hostiles in the room.
     */
    static hostilesInRoom(room) {
        const {name: roomName} = room;

        if (this.hostiles[roomName]) {
            return this.hostiles[roomName];
        }

        if (!room || room.unobservable) {
            return [];
        }

        this.hostiles[roomName] = room.find(FIND_HOSTILE_CREEPS, {filter: (c) => !c.owner || Memory.allies.indexOf(c.owner.username) === -1});

        const {memory} = room,
            threat = _.groupBy(_.map(this.hostiles[roomName], (h) => ({
                id: h.id, threat: _.sum(h.body, (bodypart) => {
                    let threatValue;

                    switch (bodypart.type) {
                        case ATTACK:
                        case RANGED_ATTACK:
                        case HEAL:
                        case WORK:
                        case TOUGH:
                            ({[bodypart.type]: threatValue} = BODYPART_COST);
                            break;
                        default:
                            return 0;
                    }

                    const {[bodypart.type]: boosts} = BOOSTS;

                    if (bodypart.boost && boosts && boosts[bodypart.boost]) {
                        const {[bodypart.boost]: boost} = boosts;

                        switch (bodypart.type) {
                            case ATTACK:
                                if (boost.attack) {
                                    threatValue *= boost.attack;
                                }
                                break;
                            case RANGED_ATTACK:
                                if (boost.rangedAttack) {
                                    threatValue *= boost.rangedAttack;
                                }
                                break;
                            case HEAL:
                                if (boost.heal) {
                                    threatValue *= boost.heal;
                                }
                                break;
                            case WORK:
                                if (boost.dismantle) {
                                    threatValue *= boost.dismantle;
                                }
                                break;
                            case TOUGH:
                                if (boost.damage) {
                                    threatValue /= boost.damage;
                                }
                                break;
                        }
                    }

                    return threatValue;
                })
            })), (value) => value.id);

        memory.threat = _.sum(_.map(_.values(threat), (t) => t[0].threat));

        this.hostiles[roomName].sort((a, b) => threat[b.id].threat - threat[a.id].threat);

        if (memory) {
            if (!memory.hostiles) {
                memory.hostiles = [];
            }

            memory.hostiles = _.map(this.hostiles[roomName], (h) => h.id);
        }

        return this.hostiles[roomName];
    }

    // ##          #            ###         ###
    //  #          #             #          #  #
    //  #     ###  ###    ###    #    ###   #  #   ##    ##   # #
    //  #    #  #  #  #  ##      #    #  #  ###   #  #  #  #  ####
    //  #    # ##  #  #    ##    #    #  #  # #   #  #  #  #  #  #
    // ###    # #  ###   ###    ###   #  #  #  #   ##    ##   #  #
    /**
     * Caches labs in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureLab[]} The labs in the room.
     */
    static labsInRoom(room) {
        return this.labs[room.name] ? this.labs[room.name] : this.labs[room.name] = room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_LAB});
    }

    // ##     #          #            ###         ###
    //  #                #             #          #  #
    //  #    ##    ###   # #    ###    #    ###   #  #   ##    ##   # #
    //  #     #    #  #  ##    ##      #    #  #  ###   #  #  #  #  ####
    //  #     #    #  #  # #     ##    #    #  #  # #   #  #  #  #  #  #
    // ###   ###   #  #  #  #  ###    ###   #  #  #  #   ##    ##   #  #
    /**
     * Caches links in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureLink[]} The links in the room.
     */
    static linksInRoom(room) {
        return this.links[room.name] ? this.links[room.name] : this.links[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_LINK});
    }

    //             #                        ###         ###
    //             #                         #          #  #
    // ###   #  #  # #    ##   ###    ###    #    ###   #  #   ##    ##   # #
    // #  #  #  #  ##    # ##  #  #  ##      #    #  #  ###   #  #  #  #  ####
    // #  #  #  #  # #   ##    #       ##    #    #  #  # #   #  #  #  #  #  #
    // #  #   ###  #  #   ##   #     ###    ###   #  #  #  #   ##    ##   #  #
    /**
     * Caches nukers in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureNuker[]} The nukers in the room.
     */
    static nukersInRoom(room) {
        return this.nukers[room.name] ? this.nukers[room.name] : this.nukers[room.name] = room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_NUKER});
    }

    //                    #          ##           ###         ###
    //                    #           #            #          #  #
    // ###    ##   ###   ###    ###   #     ###    #    ###   #  #   ##    ##   # #
    // #  #  #  #  #  #   #    #  #   #    ##      #    #  #  ###   #  #  #  #  ####
    // #  #  #  #  #      #    # ##   #      ##    #    #  #  # #   #  #  #  #  #  #
    // ###    ##   #       ##   # #  ###   ###    ###   #  #  #  #   ##    ##   #  #
    // #
    /**
     * Caches portals in a room.
     * @param {Room} room The room to cache for.
     * @return {Structure[]} The portals in the room.
     */
    static portalsInRoom(room) {
        return this.portals[room.name] ? this.portals[room.name] : this.portals[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_PORTAL});
    }

    //                               ###               #            ###         ###
    //                               #  #              #             #          #  #
    // ###    ##   #  #   ##   ###   ###    ###  ###   # #    ###    #    ###   #  #   ##    ##   # #
    // #  #  #  #  #  #  # ##  #  #  #  #  #  #  #  #  ##    ##      #    #  #  ###   #  #  #  #  ####
    // #  #  #  #  ####  ##    #     #  #  # ##  #  #  # #     ##    #    #  #  # #   #  #  #  #  #  #
    // ###    ##   ####   ##   #     ###    # #  #  #  #  #  ###    ###   #  #  #  #   ##    ##   #  #
    // #
    /**
     * Caches power banks in a room.
     * @param {Room} room The room to cache for.
     * @return {StructurePowerBank[]} The power banks in the room.
     */
    static powerBanksInRoom(room) {
        return this.powerBanks[room.name] ? this.powerBanks[room.name] : this.powerBanks[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_POWER_BANK});
    }

    //                                ##                                  ###         ###
    //                               #  #                                  #          #  #
    // ###    ##   #  #   ##   ###    #    ###    ###  #  #  ###    ###    #    ###   #  #   ##    ##   # #
    // #  #  #  #  #  #  # ##  #  #    #   #  #  #  #  #  #  #  #  ##      #    #  #  ###   #  #  #  #  ####
    // #  #  #  #  ####  ##    #     #  #  #  #  # ##  ####  #  #    ##    #    #  #  # #   #  #  #  #  #  #
    // ###    ##   ####   ##   #      ##   ###    # #  ####  #  #  ###    ###   #  #  #  #   ##    ##   #  #
    // #                                   #
    /**
     * Caches power spawns in a room.
     * @param {Room} room The room to cache for.
     * @return {StructurePowerSpawn[]} The power spawns in the room.
     */
    static powerSpawnsInRoom(room) {
        return this.powerSpawns[room.name] ? this.powerSpawns[room.name] : this.powerSpawns[room.name] = room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_POWER_SPAWN});
    }

    //                          #                #     ##           ##    #                       #                             ###         ###
    //                                           #      #          #  #   #                       #                              #          #  #
    // ###    ##   ###    ###  ##    ###    ###  ###    #     ##    #    ###   ###   #  #   ##   ###   #  #  ###    ##    ###    #    ###   #  #   ##    ##   # #
    // #  #  # ##  #  #  #  #   #    #  #  #  #  #  #   #    # ##    #    #    #  #  #  #  #      #    #  #  #  #  # ##  ##      #    #  #  ###   #  #  #  #  ####
    // #     ##    #  #  # ##   #    #     # ##  #  #   #    ##    #  #   #    #     #  #  #      #    #  #  #     ##      ##    #    #  #  # #   #  #  #  #  #  #
    // #      ##   ###    # #  ###   #      # #  ###   ###    ##    ##     ##  #      ###   ##     ##   ###  #      ##   ###    ###   #  #  #  #   ##    ##   #  #
    //             #
    /**
     * Caches repairable structures in a room.
     * @param {Room} room The room to cache for.
     * @return {Structure[]} The structures in the room.
     */
    static repairableStructuresInRoom(room) {
        return this.repairableStructures[room.name] ? this.repairableStructures[room.name] : this.repairableStructures[room.name] = room.find(FIND_STRUCTURES, {filter: (s) => (s.my || s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) && s.hits});
    }

    //                     #             #  ###                      #                #     ##           ##    #                       #                             ###         ###
    //                     #             #  #  #                                      #      #          #  #   #                       #                              #          #  #
    //  ###    ##   ###   ###    ##    ###  #  #   ##   ###    ###  ##    ###    ###  ###    #     ##    #    ###   ###   #  #   ##   ###   #  #  ###    ##    ###    #    ###   #  #   ##    ##   # #
    // ##     #  #  #  #   #    # ##  #  #  ###   # ##  #  #  #  #   #    #  #  #  #  #  #   #    # ##    #    #    #  #  #  #  #      #    #  #  #  #  # ##  ##      #    #  #  ###   #  #  #  #  ####
    //   ##   #  #  #      #    ##    #  #  # #   ##    #  #  # ##   #    #     # ##  #  #   #    ##    #  #   #    #     #  #  #      #    #  #  #     ##      ##    #    #  #  # #   #  #  #  #  #  #
    // ###     ##   #       ##   ##    ###  #  #   ##   ###    # #  ###   #      # #  ###   ###    ##    ##     ##  #      ###   ##     ##   ###  #      ##   ###    ###   #  #  #  #   ##    ##   #  #
    //                                                  #
    /**
     * Caches repairable structures in a room, sorted by hits ascending.
     * @param {Room} room The room to cache for.
     * @return {Structure[]} The structures in the room.
     */
    static sortedRepairableStructuresInRoom(room) {
        return this.sortedRepairableStructures[room.name] ? this.sortedRepairableStructures[room.name] : this.sortedRepairableStructures[room.name] = this.repairableStructuresInRoom(room).sort((a, b) => a.hits - b.hits);
    }

    //                     #             #  ###                                                     ###         ###
    //                     #             #  #  #                                                     #          #  #
    //  ###    ##   ###   ###    ##    ###  #  #   ##    ###    ##   #  #  ###    ##    ##    ###    #    ###   #  #   ##    ##   # #
    // ##     #  #  #  #   #    # ##  #  #  ###   # ##  ##     #  #  #  #  #  #  #     # ##  ##      #    #  #  ###   #  #  #  #  ####
    //   ##   #  #  #      #    ##    #  #  # #   ##      ##   #  #  #  #  #     #     ##      ##    #    #  #  # #   #  #  #  #  #  #
    // ###     ##   #       ##   ##    ###  #  #   ##   ###     ##    ###  #      ##    ##   ###    ###   #  #  #  #   ##    ##   #  #
    /**
     * Caches resources in a room, sorted by whether it's a mineral and then by amount.
     * @param {Room} room The room to cache for.
     * @return {Resource[]} The resources in the room.
     */
    static sortedResourcesInRoom(room) {
        return this.sortedResources[room.name] ? this.sortedResources[room.name] : this.sortedResources[room.name] = room.find(FIND_DROPPED_RESOURCES).sort((a, b) => {
            if (a.resourceType === RESOURCE_ENERGY && b.resourceType !== RESOURCE_ENERGY) {
                return 1;
            }
            if (a.resourceType !== RESOURCE_ENERGY && b.resourceType === RESOURCE_ENERGY) {
                return -1;
            }

            return b.amount - a.amount;
        });
    }

    //                                      #  #                                       ###         ###
    //                                      # #                                         #          #  #
    //  ###    ##   #  #  ###    ##    ##   ##     ##    ##   ###    ##   ###    ###    #    ###   #  #   ##    ##   # #
    // ##     #  #  #  #  #  #  #     # ##  ##    # ##  # ##  #  #  # ##  #  #  ##      #    #  #  ###   #  #  #  #  ####
    //   ##   #  #  #  #  #     #     ##    # #   ##    ##    #  #  ##    #       ##    #    #  #  # #   #  #  #  #  #  #
    // ###     ##    ###  #      ##    ##   #  #   ##    ##   ###    ##   #     ###    ###   #  #  #  #   ##    ##   #  #
    //                                                        #
    /**
     * Caches source keepers in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureKeeperLair[]} The source keepers in the room.
     */
    static sourceKeepersInRoom(room) {
        return this.sourceKeepers[room.name] ? this.sourceKeepers[room.name] : this.sourceKeepers[room.name] = room.find(FIND_HOSTILE_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_KEEPER_LAIR});
    }

    //                                       ###         ###
    //                                        #          #  #
    //  ###   ###    ###  #  #  ###    ###    #    ###   #  #   ##    ##   # #
    // ##     #  #  #  #  #  #  #  #  ##      #    #  #  ###   #  #  #  #  ####
    //   ##   #  #  # ##  ####  #  #    ##    #    #  #  # #   #  #  #  #  #  #
    // ###    ###    # #  ####  #  #  ###    ###   #  #  #  #   ##    ##   #  #
    //        #
    /**
     * Caches spawns in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureSpawn[]} The spawns in the room.
     */
    static spawnsInRoom(room) {
        return this.spawns[room.name] ? this.spawns[room.name] : this.spawns[room.name] = room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_SPAWN});
    }

    //  #                                   ###         ###
    //  #                                    #          #  #
    // ###    ##   #  #   ##   ###    ###    #    ###   #  #   ##    ##   # #
    //  #    #  #  #  #  # ##  #  #  ##      #    #  #  ###   #  #  #  #  ####
    //  #    #  #  ####  ##    #       ##    #    #  #  # #   #  #  #  #  #  #
    //   ##   ##   ####   ##   #     ###    ###   #  #  #  #   ##    ##   #  #
    /**
     * Caches towers in a room.
     * @param {Room} room The room to cache for.
     * @return {StructureTower[]} The towers in the room.
     */
    static towersInRoom(room) {
        return this.towers[room.name] ? this.towers[room.name] : this.towers[room.name] = room.find(FIND_MY_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_TOWER});
    }

    //                                                         ###         ###
    //                                                          #          #  #
    // ###    ##    ###    ##   #  #  ###    ##    ##    ###    #    ###   #  #   ##    ##   # #
    // #  #  # ##  ##     #  #  #  #  #  #  #     # ##  ##      #    #  #  ###   #  #  #  #  ####
    // #     ##      ##   #  #  #  #  #     #     ##      ##    #    #  #  # #   #  #  #  #  #  #
    // #      ##   ###     ##    ###  #      ##    ##   ###    ###   #  #  #  #   ##    ##   #  #
    /**
     * Caches resources in a room.
     * @param {Room} room The room to cache for.
     * @return {Resource[]} The resources in the room.
     */
    static resourcesInRoom(room) {
        return this.resources[room.name] ? this.resources[room.name] : this.resources[room.name] = room.find(FIND_DROPPED_RESOURCES).sort((a, b) => b.amount - a.amount);
    }

}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Cache, "Cache");
}
module.exports = Cache;
