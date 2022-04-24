from __future__ import annotations

import logging
from math import floor
from pathlib import Path, PurePosixPath
from typing import Any, Iterable, List, Optional

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
        self,
        x: int,
        y: int,
        gid: int = 0,
        description: Optional[str] = None,
        image_paths: List[str] = [],
        obstacle: bool = True,
    ) -> None:
        self.x = x
        self.y = y
        self.gid = gid
        self.image_paths = image_paths
        self.obstacle = obstacle
        self.description = description

    def __repr__(self) -> str:
        return f'{self.x}/{self.y} {"w" if self.obstacle else "nw"}'


class Map:
    def __str__(self) -> str:
        return "\n".join("".join(repr(i)) for i in self.tiles)

    def __repr__(self) -> str:
        return self.__str__()

    @property
    def renderable_tiles(self) -> Iterable[Iterable[Tile]]:
        return [*zip(*self.tiles)]

    @staticmethod
    def process_tile(
        tile: Any, layer: TiledTileLayer, tiles: List[List[Optional[Tile]]]
    ) -> None:
        (x, y, image) = tile
        image_path = PurePosixPath(image[0])
        image_path = str(image_path.relative_to(APPS_DIR / "static"))
        if tiles[x][y] is None:
            tiles[x][y] = Tile(
                x=x,
                y=y,
                gid=layer.data[x][y],
                image_paths=[image_path],
            )
            properties = tiled_map.get_tile_properties_by_gid(layer.data[x][y])
            if properties:
                tiles[x][y].description = properties.get("description")  # type: ignore
        else:
            tiles[x][y].image_paths.append(image_path)  # type: ignore

        # Process obstacle layer
        if layer.name == OBSTACLE_LAYER_NAME:
            tiles[x][y].obstacle = False  # type:ignore

    @staticmethod
    def of_file(tiled_map: TiledMap) -> Map:
        tiles: List[List[Optional[Tile]]] = [
            [None] * tiled_map.height for i in range(tiled_map.width)
        ]

        for layer in tiled_map.layers:
            # Object layers don't have tiles
            if type(layer) == TiledTileLayer:
                for tile in layer.tiles():
                    Map.process_tile(tile, layer, tiles)
        return Map(tiles=tiles)  # type: ignore

    def __init__(
        self, tiles: List[List[Tile]] = [], tiled_map: Optional[TiledMap] = None
    ) -> None:
        if tiled_map is None and len(tiles) == 0:
            raise Exception(
                "Provide either a list of tiles or a Tiled file to create a WorldMap"
            )
        if tiled_map is not None:
            world_map = Map.of_file(tiled_map)
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
    ) -> Map:
        tiles = []
        x_padding = floor(width / 2)
        y_padding = floor(height / 2)
        for col in world_map_cache.world_map.tiles[x - x_padding : x + x_padding + 1]:
            tiles.append(col[y - y_padding : y + y_padding + 1])
        return Map(tiles=tiles)


class MapCache:
    def __init__(self, world_map: Map) -> None:
        self.world_map = world_map


world_map_cache = MapCache(Map(tiled_map=tiled_map))
