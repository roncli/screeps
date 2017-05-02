var fs = require("fs"),
    modConcat = require("module-concat"),
    compile = require("google-closure-compiler-js").compile;

modConcat("../src/main.js", "./main.js", {paths: ["../src"]}, () => {
    fs.readFile("./main.js", {encoding: "utf8"}, (err, data) => {
        fs.writeFile("../bin/main.js", compile({jsCode: [{src: data}]}).compiledCode, () => {
            console.log("Complete.");
        });
    });
});
