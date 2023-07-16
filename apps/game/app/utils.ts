import { useMatches } from "@remix-run/react";
import { useMemo } from "react";
import type { Player } from "@wwyb/core";

const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id]
  );
  return route?.data;
}

function isUser(player: any): player is Player {
  return (
    player && typeof player === "object" && typeof player.userId === "string"
  );
}

export function useOptionalPlayer(): Player | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function usePlayer(): Player {
  const maybePlayer = useOptionalPlayer();
  if (!maybePlayer) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead."
    );
  }
  return maybePlayer;
}

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}

function isAscii(str: string) {
  return /[\p{ASCII}]+/u.test(str);
}

export function validateName(name: unknown): name is string {
  return (
    typeof name === "string" &&
    name.length > 3 &&
    name.length < 25 &&
    isAscii(name)
  );
}

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
