/**
 * A way to proxy calls so the profiler picks them up.
 */

var Profiler = require("screeps-profiler");

class Proxy {
    static run(name, fx) {
        Profiler.registerFN(fx, `Proxy.${name}`)();
    }
}

if (Memory.profiling) {
    Profiler.registerObject(Proxy, "Proxy");
}
module.exports = Proxy;
