from __future__ import annotations

import logging
from math import floor
from pathlib import Path, PurePosixPath
from typing import Iterable, List, Optional

import pytmx
from django.conf import settings
from pytmx.pytmx import TiledMap, TiledTileLayer

from config.settings.base import APPS_DIR

logger = logging.getLogger(__name__)

MINI_MAP_HEIGHT = 5
MINI_MAP_WIDTH = 9

OBSTACLE_LAYER_NAME = "obstacle"

tiled_map = pytmx.TiledMap(settings.APPS_DIR / Path("static/assets/map/map.tmx"))


class TileDoesNotExistError(BaseException):
    pass


class Tile:
    def __init__(
        self, x: int, y: int, image_paths: List[str] = [], walkable: bool = True
    ) -> None:
        self.x = x
        self.y = y
        self.image_paths = image_paths
        self.walkable = walkable

    def __repr__(self) -> str:
        return f'{self.x}/{self.y} {"w" if self.walkable else "nw"}'


class Map:
    tiles: List[List[Tile]]

    def __init__(self, tiles: List[List[Tile]]) -> None:
        self.tiles = tiles

    def __str__(self) -> str:
        return "\n".join("".join(repr(i)) for i in self.tiles)

    def __repr__(self) -> str:
        return self.__str__()


class MiniMap(Map):
    @property
    def renderable_tiles(self) -> Iterable[Iterable[Tile]]:
        return [*zip(*self.tiles)]


class WorldMap(Map):
    @staticmethod
    def of_file(tiled_map: TiledMap) -> WorldMap:
        tiles: List[List[Optional[Tile]]] = [
            [None] * tiled_map.height for i in range(tiled_map.width)
        ]

        for layer in tiled_map.layers:
            # object layer don't have tiles
            if type(layer) == TiledTileLayer:
                for tile in layer.tiles():
                    (x, y, image) = tile
                    image_path = PurePosixPath(image[0])
                    image_path = str(image_path.relative_to(APPS_DIR / "static"))
                    if tiles[x][y] is None:
                        tiles[x][y] = Tile(x=x, y=y, image_paths=[image_path])
                    else:
                        tiles[x][y].image_paths.append(image_path)  # type: ignore

                    # Process obstacle layer
                    if layer.name == OBSTACLE_LAYER_NAME:
                        tiles[x][y].walkable = False  # type:ignore
        return WorldMap(tiles=tiles)  # type: ignore

    def __init__(
        self, tiles: List[List[Tile]] = [], tiled_map: Optional[TiledMap] = None
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

    def get(self, x: int, y: int) -> Tile:
        try:
            return self.tiles[x][y]
        except IndexError:
            raise TileDoesNotExistError()

    def get_mini_map(
        self,
        x: int,
        y: int,
        width: int = MINI_MAP_WIDTH,
        height: int = MINI_MAP_HEIGHT,
    ) -> MiniMap:
        tiles = []
        x_padding = floor(width / 2)
        y_padding = floor(height / 2)
        for col in world_map_cache.world_map.tiles[x - x_padding : x + x_padding + 1]:
            tiles.append(col[y - y_padding : y + y_padding + 1])
        return MiniMap(tiles=tiles)


class WorldMapCache:
    def __init__(self, world_map: WorldMap) -> None:
        self.world_map = world_map


world_map_cache = WorldMapCache(WorldMap(tiled_map=tiled_map))
