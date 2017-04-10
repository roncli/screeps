Array.prototype.filter = function(callback, thisArg) {
    var results = [];
    var arr = this;
    for (var iterator = 0; iterator < arr.length; iterator++) {
        if (callback.call(thisArg, arr[iterator], iterator, arr)) {
            results.push(arr[iterator]);
        }
    }
    return results;
};

Array.prototype.forEach = function(callback, thisArg) {
    var arr = this;
    for (var iterator = 0; iterator < arr.length; iterator++) {
        callback.call(thisArg, arr[iterator], iterator, arr);
    }
};

Array.prototype.map = function(callback, thisArg) {
    var arr = this;
    var returnVal = [];
    for (var iterator = 0; iterator < arr.length; iterator++) {
        returnVal.push(callback.call(thisArg, arr[iterator], iterator, arr));
    }
    return returnVal;
};
