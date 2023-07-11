import { config } from "~/config";
import { WorldMapService } from "~/engine/WorldMapService";

WorldMapService.export(
  `${config.mapPath}/map.tmx`,
  `${config.mapPath}/map.json`
);
