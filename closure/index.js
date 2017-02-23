var fs = require("fs"),
    compile = require("google-closure-compiler-js").compile;

fs.readdir("../src", (err, files) => {
    files.forEach((file) => {
        fs.readFile("../src/" + file, {encoding: "utf8"}, (err, data) => {
            fs.writeFile("../bin/" + file, compile({jsCode: [{src: data}]}).compiledCode, () => {});
            console.log(file);
        });
    });
});
