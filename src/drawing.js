var Drawing = {
    progressBar: (room, x, y, w, h, value, max, options) => {
        if (options.showMax === undefined) {
            options.showMax = true;
        }
        if (options.valueDecimals === undefined) {
            options.valueDecimals = 0;
        }
        room.visual
            .rect(x, y, w, h, {fill: options.background})
            .rect(x, y, w * Math.min(value / max, 1), h, {fill: options.bar})
            .text((options.label ? options.label + " " : "") + value.toFixed(options.valueDecimals) + (options.showMax ? "/" + max.toFixed(0) : "") + (options.showDetails ? " (" + (100 * value / max).toFixed(3) + "%) " + (max - value).toFixed(0) + " to go" : ""), x + w / 2, y + h / 2 + 0.25, {align: "center", color: options.color});
    },

    sparkline: (room, x, y, w, h, values, options) => {
        _.forEach(options, (option) => {
            room.visual.poly(_.map(values, (v, i) => [x + w * (i / (values.length - 1)), y + h * (v[option.key] / (option.max - option.min))]), option);
        });
    }
};

require("screeps-profiler").registerObject(Drawing, "Drawing");
module.exports = Drawing;
