import { config } from "./config";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required");
if (!process.env.DISCORD_CLIENT_ID)
  throw new Error("DISCORD_CLIENT_ID is required");
if (!process.env.DISCORD_CLIENT_SECRET)
  throw new Error("DISCORD_CLIENT_SECRET is required");
if (!process.env.DISCORD_CALLBACK_URL)
  throw new Error("DISCORD_CALLBACK_URL is required");

console.log("NODE_ENV", process.env.NODE_ENV);
console.log("DB_FILE_PATH", process.env.DB_FILE_PATH);

const configServer = {
  ...config,
  dbFilePath: process.env.DB_FILE_PATH || "db.sqlite3",
  redisConnectionString: process.env.REDIS_CONNECTION_STRING,
  sessionSecret: process.env.SESSION_SECRET,
  discordClientId: process.env.DISCORD_CLIENT_ID,
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET,
  discordCallbackUrl: process.env.DISCORD_CALLBACK_URL,
};

export type ConfigServer = typeof configServer;

export { configServer };
