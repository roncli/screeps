var memory = [];

class Segment {
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
    
    static init() {
        RawMemory.setActiveSegments([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
    
    get memory() {
        return memory[this.id];
    }
    
    set memory(value) {
        memory[this.id] = value;
    }
    
    set() {
        RawMemory.segments[this.id] = JSON.stringify(memory[this.id]);
    }
}

if (Memory.profiling) {
    require("screeps-profiler").registerObject(Segment, "Segment");
}
module.exports = Segment;
