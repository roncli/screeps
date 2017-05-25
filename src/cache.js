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
     */
    static reset() {
        // Caches for objects.
        this.containers = {};
        this.costMatrixes = {};
        this.extensions = {};
        this.extractors = {};
        this.hostiles = {};
        this.labs = {};
        this.links = {};
        this.nukers = {};
        this.portals = {};
        this.powerBanks = {};
        this.powerSpawns = {};
        this.repairableStructures = {};
        this.resources = {};
        this.sortedRepairableStructures = {};
        this.sortedResources = {};
        this.sourceKeepers = {};
        this.spawns = {};
        this.towers = {};

        // Caches for data.
        this.armies = {};
        this.creepTasks = {};
        this.minerals = {};
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
        this.credits = Game.market.credits;

        // Cache the global visual and the time if we have visualizations on.
        if (Memory.visualizations) {
            this.globalVisual = new RoomVisual();
            this.time = new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}).replace(",", "");
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
        return this.containers[room.name] ? this.containers[room.name] : this.containers[room.name] = _.filter(room.find(FIND_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER);
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
        var roomName = room.name;

        if (!room || room.unobservable) {
            return new PathFinder.CostMatrix();
        }

        if (!this.costMatrixes[roomName]) {
            let matrix = new PathFinder.CostMatrix();

            _.forEach(room.find(FIND_STRUCTURES), (structure) => {
                var pos = structure.pos;
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
                var pos = structure.pos;
                matrix.set(pos.x, pos.y, Math.max(5, matrix.get(pos.x, pos.y)));
            });
            
            _.forEach(this.portalsInRoom(room), (structure) => {
                var pos = structure.pos;
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
        return this.extensions[room.name] ? this.extensions[room.name] : this.extensions[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_EXTENSION);
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
        var hostiles, memory, threat;

        if (!room || room.unobservable) {
            return [];
        }

        hostiles = this.hostiles[room.name] ? this.hostiles[room.name] : this.hostiles[room.name] = _.filter(room.find(FIND_HOSTILE_CREEPS), (c) => !c.owner || Memory.allies.indexOf(c.owner.username) === -1);
        memory = room.memory,
        threat = _.groupBy(_.map(hostiles, (h) => ({id: h.id, threat: _.reduce(h.body, (total, bodypart) => {
            var threat,
                boosts;

            switch (bodypart.type) {
                case ATTACK:
                case RANGED_ATTACK:
                case HEAL:
                case WORK:
                case TOUGH:
                    threat = BODYPART_COST[bodypart.type];
                    break;
                default:
                    return total;
            }

            boosts = BOOSTS[bodypart.type];

            if (bodypart.boost && boosts && boosts[bodypart.boost]) {
                let boost = boosts[bodypart.boost];

                switch (bodypart.type) {
                    case ATTACK:
                        if (boost.attack) {
                            threat *= boost.attack;
                        }
                        break;
                    case RANGED_ATTACK:
                        if (boost.rangedAttack) {
                            threat *= boost.rangedAttack;
                        }
                        break;
                    case HEAL:
                        if (boost.heal) {
                            threat *= boost.heal;
                        }
                        break;
                    case WORK:
                        if (boost.dismantle) {
                            threat *= boost.dismantle;
                        }
                        break;
                    case TOUGH:
                        if (boost.damage) {
                            threat /= boost.damage;
                        }
                        break;
                }
            }

            return total + threat;
        })}), 0), (value) => value.id);

        hostiles.sort((a, b) => threat[b.id].threat - threat[a.id].threat);

        if (memory) {
            if (!memory.hostiles) {
                memory.hostiles = [];
            }

            memory.hostiles = _.map(hostiles, (h) => h.id);
        }

        return hostiles;
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
        return this.labs[room.name] ? this.labs[room.name] : this.labs[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_LAB);
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
        return this.nukers[room.name] ? this.nukers[room.name] : this.nukers[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_NUKER);
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
        return this.powerSpawns[room.name] ? this.powerSpawns[room.name] : this.powerSpawns[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_POWER_SPAWN);
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
        return this.sortedResources[room.name] ? this.sortedResources[room.name] : this.sortedResources[room.name] = room.room.find(FIND_DROPPED_RESOURCES).sort((a, b) => {
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
        return this.spawns[room.name] ? this.spawns[room.name] : this.spawns[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_SPAWN);
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
        return this.towers[room.name] ? this.towers[room.name] : this.towers[room.name] = _.filter(room.find(FIND_MY_STRUCTURES), (s) => s.structureType === STRUCTURE_TOWER);
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
