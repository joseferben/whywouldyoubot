/**
 * The provided init function is run exactly once,
 * even when the require cache is purged.
 * @param k The key to use for the cache
 */
export function initOnce<E>(k: string, init: () => E): [E, boolean] {
  // these values can survive esbuild rebuilds, returns true if value was cached
  const globalKey = `__${k}__`;
  if (process.env.NODE_ENV === "production") {
    return [init(), false];
  } else {
    if (process.env.BYPASS_CACHE) return [init(), false];
    // @ts-ignore
    if (!global[globalKey]) {
      // @ts-ignore
      global[globalKey] = init();
      // @ts-ignore
      return [global[globalKey], false];
    }
    // @ts-ignore
    return [global[globalKey], true];
  }
}
