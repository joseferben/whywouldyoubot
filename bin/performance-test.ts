import { json } from "stream/consumers";

function roughSizeOfObject(object) {
  var objectList = [];
  var stack = [object];
  var bytes = 0;

  while (stack.length) {
    var value = stack.pop();

    if (typeof value === "boolean") {
      bytes += 4;
    } else if (typeof value === "string") {
      bytes += value.length * 2;
    } else if (typeof value === "number") {
      bytes += 8;
    } else if (typeof value === "object" && objectList.indexOf(value) === -1) {
      objectList.push(value);

      for (var i in value) {
        stack.push(value[i]);
      }
    }
  }
  return bytes;
}

const randomObject = () => ({
  playerName: crypto.randomUUID(),
  level1: 2,
  level2: 5,
  email: crypto.randomUUID(),
});

const n = 1000000;
const result = {};
for (let i = 0; i <= n; i++) {
  //@ts-ignore
  result[i] = randomObject();
}

console.log(`start stringify with n = ${n}`);

const size = Buffer.byteLength(JSON.stringify(result));

console.log(`size of object is ${size / 1024 / 1024} MB`);

const start = Date.now();
JSON.stringify(result);
console.log(`finished in ${Date.now() - start} ms`);

export {};
