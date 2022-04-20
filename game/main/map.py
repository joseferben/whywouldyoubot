from __future__ import annotations

from typing import List

MINI_MAP_ROW_LENGTH = 9


class TileDoesNotExistError(BaseException):
    pass


class WorldTile:
    def __init__(self, walkable: bool = True) -> None:
        self.walkable = walkable


class WorldMap:
    tiles: List[List[WorldTile]]

    def __init__(self, tiles: List[List[WorldTile]]) -> None:
        self.tiles = tiles

    def get(self, x: int, y: int) -> WorldTile:
        try:
            return self.tiles[y][x]
        except IndexError:
            raise TileDoesNotExistError()


class WorldMapCache:
    def __init__(self, world_map: WorldMap) -> None:
        self.world_map = world_map


# TODO
world_map_cache = WorldMapCache(WorldMap(tiles=[]))


class MiniMapTile:
    def __init__(self, x: int, y: int, walkable: bool, image_paths: List[str]) -> None:
        self.x = x
        self.y = y
        self.walkable = walkable
        self.image_paths = image_paths
