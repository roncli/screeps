var memory = [];

//   ###                                       #    
//  #   #                                      #    
//  #       ###    ## #  ## #    ###   # ##   ####  
//   ###   #   #  #  #   # # #  #   #  ##  #   #    
//      #  #####   ##    # # #  #####  #   #   #    
//  #   #  #      #      # # #  #      #   #   #  # 
//   ###    ###    ###   #   #   ###   #   #    ##  
//                #   #                             
//                 ###                              
/**
 * Represents a segment of memory.
 */
class Segment {
    //                           #                       #                
    //                           #                       #                
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###   
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #  
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #     
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #     
    /**
     * Gets a segment of memory.
     * @param {number} id The ID number of the segment to retrieve from 1 to 10.
     */
    constructor(id) {
        this.id = id;
        
        if (!memory[id]) {
            try {
                memory[id] = JSON.parse(RawMemory.segments[id]);
            } catch (e) {
                memory[id] = undefined;
            }
        }
    }

    //  #           #     #    
    //                    #    
    // ##    ###   ##    ###   
    //  #    #  #   #     #    
    //  #    #  #   #     #    
    // ###   #  #  ###     ##  
    /**
     * Initializes the active segments for the next tick.
     */
    static init() {
        RawMemory.setActiveSegments([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }

    // # #    ##   # #    ##   ###   #  #  
    // ####  # ##  ####  #  #  #  #  #  #  
    // #  #  ##    #  #  #  #  #      # #  
    // #  #   ##   #  #   ##   #       #   
    //                                #    
    /**
     * Gets the memory for this segment.
     * @return {object} The memory for this segment.
     */
    get memory() {
        return memory[this.id];
    }

    /**
     * Sets the memory for this segment.
     * @param {object} value The memory to set this segment to.
     */
    set memory(value) {
        memory[this.id] = value;
    }

    //         #                      
    //         #                      
    //  ###   ###    ##   ###    ##   
    // ##      #    #  #  #  #  # ##  
    //   ##    #    #  #  #     ##    
    // ###      ##   ##   #      ##   
    /**
     * Stores the segment to memory.
     */
    store() {
        RawMemory.segments[this.id] = JSON.stringify(memory[this.id]);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Segment, "Segment");
}
module.exports = Segment;
