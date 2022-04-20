from __future__ import annotations

import logging
from pathlib import Path, PurePosixPath
from typing import List, Optional

import pytmx
from django.conf import settings
from pytmx.pytmx import TiledMap

from config.settings.base import APPS_DIR

logger = logging.getLogger(__name__)

MINI_MAP_ROW_LENGTH = 9

OBSTACLE_LAYER_NAME = "obstacle"

tiled_map = pytmx.TiledMap(settings.APPS_DIR / Path("static/assets/map/map.tmx"))


class TileDoesNotExistError(BaseException):
    pass


class WorldTile:
    def __init__(
        self, x: int, y: int, image_paths: List[str] = [], walkable: bool = True
    ) -> None:
        self.x = x
        self.y = y
        self.image_paths = image_paths
        self.walkable = walkable


class WorldMap:
    tiles: List[List[WorldTile]]

    @staticmethod
    def of_file(tiled_map: TiledMap) -> WorldMap:
        tiles: List[List[Optional[WorldTile]]] = [
            [None] * tiled_map.width
        ] * tiled_map.height

        for layer in tiled_map.layers:
            try:
                for x, y, image in layer.tiles():
                    image_path = PurePosixPath(image[0])
                    image_path = str(image_path.relative_to(APPS_DIR / "static"))
                    if tiles[y][x] is None:
                        tiles[y][x] = WorldTile(x=x, y=y, image_paths=[image_path])
                    else:
                        tiles[y][x].image_paths.append(image_path)  # type: ignore

                    # Process obstacle layer
                    if layer.name == OBSTACLE_LAYER_NAME:
                        tiles[y][x].walkable = False  # type:ignore
            except Exception as e:
                logger.error(e)
        return WorldMap(tiles=tiles)  # type: ignore

    def __init__(
        self, tiles: List[List[WorldTile]] = [], tiled_map: Optional[TiledMap] = None
    ) -> None:
        if tiled_map is None and len(tiles) == 0:
            raise Exception(
                "Provide either a list of tiles or a Tiled file to create a WorldMap"
            )
        if tiled_map is not None:
            world_map = WorldMap.of_file(tiled_map)
            self.tiles = world_map.tiles
        else:
            self.tiles = tiles

    def get(self, x: int, y: int) -> WorldTile:
        try:
            return self.tiles[y][x]
        except IndexError:
            raise TileDoesNotExistError()


class WorldMapCache:
    def __init__(self, world_map: WorldMap) -> None:
        self.world_map = world_map


class MiniMapTile:
    def __init__(self, x: int, y: int, walkable: bool, image_paths: List[str]) -> None:
        self.x = x
        self.y = y
        self.walkable = walkable
        self.image_paths = image_paths


world_map_cache = WorldMapCache(WorldMap(tiled_map=tiled_map))
