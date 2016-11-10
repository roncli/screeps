/**
 * A way to proxy calls so the profiler picks them up.
 */

var Proxy = {
    run: (name, fx) => {
        "use strict";

        Proxy.name = fx;
        Proxy.name();
        delete Proxy.name;
    }
};

require("screeps-profiler").registerObject(Proxy, "Proxy");
module.exports = Proxy;
