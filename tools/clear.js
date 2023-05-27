const fs = require('fs');
const path = require('path');

const clear = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(thing => {
    const thingPath = path.resolve(dir, thing);

    fs.rmSync(thingPath, { recursive: true })
  });
};

clear(path.resolve(__dirname, '../build'));