import { getItemKinds } from "@wwyb/core";

// pure config
export const config = {
  tileRenderedSize: 80,
  spawnPosition: {
    x: 560,
    y: 580,
  },
  obstacleLayerName: "obstacles",
  // the client sees n tiles in each direction
  playerVisibility: 20,
  mapPath: "map",
  // the local path to assets
  assetsDirPath: "public/assets",
  // the assets route path when they are served
  assetsRoutePath: "/assets",
  // how long to wait before logging out idle users
  idleLogoutMs: 1000 * 60,
  emojiDuration: 1000 * 5,
  userSessionKey: "user",
  items: getItemKinds(),
  maxBotsPerPlayer: 3,
};
