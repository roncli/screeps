const Profiler = require("screeps-profiler");

//  ####                              
//  #   #                             
//  #   #  # ##    ###   #   #  #   # 
//  ####   ##  #  #   #   # #   #   # 
//  #      #      #   #    #    #  ## 
//  #      #      #   #   # #    ## # 
//  #      #       ###   #   #      # 
//                              #   # 
//                               ###  
/**
 * A way to proxy calls so the profiler picks them up.
 */
class Proxy {
    // ###   #  #  ###   
    // #  #  #  #  #  #  
    // #     #  #  #  #  
    // #      ###  #  #  
    /**
     * Run a function to be profiled.
     * @param {string} name The name of the function reported by the profiler.
     * @param {function} fx The function to profile.
     */
    static run(name, fx) {
        Profiler.registerFN(fx, `Proxy.${name}`)();
    }
}

if (Memory.profiling) {
    Profiler.registerObject(Proxy, "Proxy");
}
module.exports = Proxy;
