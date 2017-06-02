//  ####                   ##     #     ##
//  #   #                 #  #           #
//  #   #  # ##    ###    #      ##      #     ###   # ##
//  ####   ##  #  #   #  ####     #      #    #   #  ##  #
//  #      #      #   #   #       #      #    #####  #
//  #      #      #   #   #       #      #    #      #
//  #      #       ###    #      ###    ###    ###   #
/**
 * A class that profiles JavaScript objects in Screeps.
 */
class Profiler {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Initializes the profiler.
     */
    constructor() {
        const {profiler: data} = Memory;

        this.callStack = [];
        this.stackStats = data && data.stackStats || {};
        this.functionStats = data && data.functionStats || {};
        this.profiling = data && data.profileUntil && data.profileUntil <= Game.time || false;

        Game.profiler = this;
    }

    //         #                 #
    //         #                 #
    //  ###   ###    ###  ###   ###
    // ##      #    #  #  #  #   #
    //   ##    #    # ##  #      #
    // ###      ##   # #  #       ##
    /**
     * Starts profiling.
     * @param {number} [length=10] The number of ticks to profile for.
     * @return {void}
     */
    start(length) {
        if (!length || typeof length !== "number") {
            length = 10;
        }

        this.profiling = {
            stackStats: {},
            functionStats: {},
            profileUntil: Game.time + length
        };
    }

    //                     #    #    ##
    //                    # #         #
    // ###   ###    ##    #    ##     #     ##
    // #  #  #  #  #  #  ###    #     #    # ##
    // #  #  #     #  #   #     #     #    ##
    // ###   #      ##    #    ###   ###    ##
    // #
    /**
     * A function to replace the original object with a new object that's profiled.
     * @param {object} obj The object to profile.
     * @param {string} name The name to call the function.
     * @return {object} The profiled object.
     */
    profile(obj, name) {
        // If the object has already been profiled, just return itself.
        if (!this.profiling || obj.isProfiled) {
            return obj;
        }

        const profiler = this;

        // For each property that's not the constructor or the prototype, wrap it.
        _.forEach(Object.getOwnPropertyNames(obj), (property) => {
            const {[property]: objProperty} = obj;

            if (typeof objProperty === "function" && ["constructor", "prototype"].indexOf(property) === -1) {
                obj[property] = profiler.wrapFunction(objProperty, `${name}.${property}`, false);
            }
        });

        // If this object is a class, in order to profile the constructor we have to create a new class that has a wrapped constructor, and then wrap all of the prototype's functions.
        if (obj.prototype) {
            // Backup the new object.
            const oldObj = obj;

            /**
             * Wraps the constructor into a new function.
             * @return {object} An instanciated object.
             */
            obj = function() {
                profiler.wrapFunction(oldObj.prototype.constructor, `${name}.constructor`, true)();

                return this;
            };

            // Transfer the prototype from the backup object to the new object.
            ({prototype: obj.prototype} = oldObj);

            // Name the object.
            Object.defineProperty(obj, "name", {value: name});

            // Profile the prototype functions.
            profiler.profile(obj.prototype, name);

            // Put all of the static methods from the backup object onto the new object.
            _.forEach(Object.getOwnPropertyNames(oldObj), (property) => {
                if (typeof oldObj[property] === "function" && ["constructor", "prototype"].indexOf(property) === -1) {
                    ({[property]: obj[property]} = oldObj);
                }
            });

            // Mark that this object has been profiled so that it is not profiled twice.
            obj.isProfiled = true;
        }

        // Return the profiled object.
        return obj;
    }

    //                         ####                     #     #
    //                         #                        #
    // #  #  ###    ###  ###   ###   #  #  ###    ##   ###   ##     ##   ###
    // #  #  #  #  #  #  #  #  #     #  #  #  #  #      #     #    #  #  #  #
    // ####  #     # ##  #  #  #     #  #  #  #  #      #     #    #  #  #  #
    // ####  #      # #  ###   #      ###  #  #   ##     ##  ###    ##   #  #
    //                   #
    /**
     *
     * @param {function} fx The function to profile.
     * @param {string} name The name of the function.
     * @param {bool} isConstructor Whether this function is a constructor, which will need to be called differently.
     * @return {function} The wrapped function.
     */
    wrapFunction(fx, name, isConstructor) {
        const profiler = this,

            /**
             * Profiles a function.
             * @return {*} The result from the original function.
             */
            newFx = (...args) => {
                let result;

                // If we are profiling, profile the function and return the result from the original function, otherwise just return the result from the original function.

                if (profiler.profiling) {
                    // Set the start time.
                    const start = Game.cpu.getUsed();

                    // Push the name of the function on to the stack.
                    profiler.callStack.push(name);

                    // Get the result from the original function.
                    if (isConstructor) {
                        result = new (Function.prototype.bind.apply(fx, args))();
                    } else {
                        result = fx.apply(this, args);
                    }

                    // Record the time elapsed.
                    profiler.record(Game.cpu.getUsed() - start);

                    // Pop the function from the stack.
                    profiler.callStack.pop();
                } else if (isConstructor) {
                    result = new (Function.prototype.bind.apply(fx, args))();
                } else {
                    result = fx.apply(this, args);
                }

                // Return the result from the original function.
                return result;
            };

        // Return the wrapped function.
        return newFx;
    }

    //                                  #
    //                                  #
    // ###    ##    ##    ##   ###    ###
    // #  #  # ##  #     #  #  #  #  #  #
    // #     ##    #     #  #  #     #  #
    // #      ##    ##    ##   #      ###
    /**
     * Records performance statistics about the current function.
     * @param {number} time The amount of time to record.
     * @return {void}
     */
    record(time) {
        const {callStack, stackStats, functionStats} = this,
            stackKey = callStack.join(":"),
            {[callStack.length - 1]: functionKey} = callStack;

        // Setup the stack trace stats.
        if (!stackStats[stackKey]) {
            stackStats[stackKey] = {
                calls: 0,
                time: 0
            };
        }

        // Setup the function stats.
        if (!functionStats[functionKey]) {
            functionStats[functionKey] = {
                calls: 0,
                time: 0
            };
        }

        const {[stackKey]: stackStatsValue} = stackStats,
            {[functionKey]: functionStatsValue} = functionStats;

        // Increment the number of calls.
        stackStatsValue.calls++;
        functionStatsValue.calls++;

        // Increase the total elapsed time of the call.
        stackStatsValue.time += time;
        functionStatsValue.time += time;
    }
}

module.exports = Profiler;
