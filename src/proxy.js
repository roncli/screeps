/**
 * A way to proxy calls so the profiler picks them up.
 */

var Profiler = require("screeps-profiler"),
    Proxy = {
        run: (name, fx) => {
            "use strict";

            Profiler.registerFN(fx, "Proxy." + name);
            fx();
        }
    };

Profiler.registerObject(Proxy, "Proxy");
module.exports = Proxy;
