// lifecycle hooks for the backend

let started = false;

declare global {
  var __started__: boolean;
}

export async function onStart(fs: ((_: void) => Promise<any>)[]) {
  if (!global.__started__) {
    console.log("onStart()");

    for (const f of fs) {
      await f();
    }
  }
  global.__started__ = true;
}
