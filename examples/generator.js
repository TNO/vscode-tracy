const fs = require('fs');

const amountOfRows = 10000;
const outputFile = 'dummy.tracy.json';

const levels = ["debug", "info", "warn", "error"];
const listeningValues = ["false", "false", "false", "false", "false", "false", "false", "false", "false", "true"];
const locations = ["src/tracy/viewer.js", "src/tracy/minimap.js", "src/tracy/App.js", "src/tracy/index.js", "src/tracy/log.js"];
const words = [
    "1500s", "1960s", "a", "Aldus", "also", "an", "and", "been", "book", "but", "centuries", "containing", "desktop", "dummy", 
    "electronic", "essentially", "ever", "five", "galley", "has", "in", "including", "industry", "industry's", "into", "Ipsum", 
    "is", "it", "It", "leap", "Letraset", "like", "Lorem", "make", "more", "not", "of", "only", "PageMaker", "passages", "popularised", 
    "printer", "printing", "publishing", "recently", "release", "remaining", "scrambled", "sheets", "simply", "since", "software", 
    "specimen", "standard", "survived", "text", "the", "to", "took", "type", "typesetting", "unchanged", "unknown", "versions", 
    "was", "when", "with"
];

const randomNumber = (min, max) => Math.floor(Math.random() * (max - min)) + min;
const randomFromArray = (arr) => arr[randomNumber(0, arr.length)];

const rows = [];
let time = new Date();
for (let i = 0; i < amountOfRows; i++) {
    time = new Date(time.getTime() + randomNumber(50, 1000));
    rows.push({
        timestamp: time.toISOString(),
        level: randomFromArray(levels),
        threadID: randomNumber(1, 5).toString(),
        location: randomFromArray(locations),
        message: Array(20).fill().map(() => randomFromArray(words)).join(' '),
        listening: randomFromArray(listeningValues),
    });
}

fs.writeFileSync(outputFile, JSON.stringify(rows, null, 2));
console.log(`Wrote ${amountOfRows} rows to '${outputFile}'`);
