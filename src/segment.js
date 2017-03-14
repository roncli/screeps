var memory = [],
    Segment = function(id) {
        this.id = id;
        
        if (!memory[id]) {
            try {
                memory[id] = JSON.parse(RawMemory.segments[id]);
            } catch (e) {
                memory[id] = undefined;
            }
        }
        
        return Segment.memory[id];
    };

Segment.init = () => {
    RawMemory.setActiveSegments([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
};

Segment.prototype = {
    get memory() {
        return memory[this.id];
    },
    
    set memory(value) {
        memory[this.id] = value;
    }
};

Segment.prototype.set = function() {
    RawMemory.segments[this.id] = JSON.stringify(memory[this.id]);
};

require("screeps-profiler").registerObject(Segment, "Segment");
module.exports = Segment;
