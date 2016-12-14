var p = new Promise((resolve, reject) => {
    try {
        setTimeout(() => {
            throw "haha";
        }, 1000);
        resolve();
    } catch (err) {
        reject(err);
    }
});

p.then(() => {
    console.log("Complete.");
});

p.catch((err) => {
    console.log("ERROR DISCOVERED!");
    console.log(err);
});
