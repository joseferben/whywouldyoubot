from __future__ import annotations

import logging
import os
import pickle
from pathlib import Path, PurePosixPath
from typing import Any, Iterable, List, Optional, Tuple

import pytmx
from checksumdir import dirhash
from django.conf import settings
from pytmx.pytmx import TiledMap, TiledTileLayer

logger = logging.getLogger(__name__)

OBSTACLE_LAYER_NAME = "obstacle"
NPC_SPAWN_LAYER_NAME = "npc_spawn"


class TileDoesNotExistError(BaseException):
    pass


class NpcSpawner:
    def __init__(self, name: str, bbox: Tuple[int, int, int, int]) -> None:
        self.name = name
        self.bbox = bbox


class MapTile:
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
    def renderable_tiles(self) -> Iterable[Iterable[MapTile]]:
        return [*zip(*self.tiles)]

    @staticmethod
    def process_tile(
        tiled_map: TiledMap,
        tile: Any,
        layer: TiledTileLayer,
        tiles: List[List[Optional[MapTile]]],
    ) -> None:
        (x, y, image) = tile
        image_path = PurePosixPath(image[0])
        image_path = PurePosixPath("/".join(image_path.parts[-3:]))
        image_path = str("assets" / image_path)
        if tiles[x][y] is None:
            tiles[x][y] = MapTile(
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
    def of_file(tiled_map: TiledMap, file_hash: Optional[str] = None) -> Map:
        tiles: List[List[Optional[MapTile]]] = [
            [None] * tiled_map.height for i in range(tiled_map.width)
        ]
        spawners: List[NpcSpawner] = []

        for layer in tiled_map.layers:
            if type(layer) == TiledTileLayer:
                # Process tiled layer
                for tile in layer.tiles():
                    Map.process_tile(tiled_map, tile, layer, tiles)
            else:
                # Process object layers
                for obj in layer:
                    # Process npc spawn layer
                    if layer.name == NPC_SPAWN_LAYER_NAME:
                        bbox = (
                            int(obj.x / 16),
                            int(obj.y / 16),
                            int(obj.width / 16),
                            int(obj.height / 16),
                        )
                        spawners.append(NpcSpawner(name=obj.name, bbox=bbox))
        return Map(file_hash=file_hash, tiles=tiles, spawners=spawners)  # type: ignore

    def __init__(
        self,
        file_hash: Optional[str] = None,
        tiles: List[List[MapTile]] = [],
        tiled_map: Optional[TiledMap] = None,
        spawners: List[NpcSpawner] = [],
    ) -> None:
        if tiled_map is None and len(tiles) == 0:
            raise Exception(
                "Provide either a list of tiles or a Tiled file to create a WorldMap"
            )
        if tiled_map is not None:
            world_map = Map.of_file(tiled_map, file_hash=file_hash)
            self.tiles = world_map.tiles
        else:
            self.tiles = tiles
        self.file_hash = file_hash
        self.spawners = spawners

    def get(self, x: int, y: int) -> MapTile:
        try:
            return self.tiles[x][y]
        except IndexError:
            raise TileDoesNotExistError()


MAP_DIR = settings.APPS_DIR / Path("static/assets/map")
MAP_CACHE_FILE = settings.GAME_CACHE_DIR / "map"


class MapCache:
    def __init__(self) -> None:
        Path(settings.GAME_CACHE_DIR).mkdir(parents=True, exist_ok=True)
        actual_hash = dirhash(MAP_DIR, "md5")
        if not os.path.exists(MAP_CACHE_FILE):
            open(MAP_CACHE_FILE, "a").close()
        with open(MAP_CACHE_FILE, "rb") as map_cache_file_read:
            cached_world_map: Optional[Map] = None
            try:
                cached_world_map = pickle.load(map_cache_file_read)
            except EOFError:
                cached_world_map = Map(file_hash="", tiles=[[]])
            assert cached_world_map is not None
            if (
                not settings.GAME_CACHE_BYPASS
                and actual_hash == cached_world_map.file_hash
            ):
                print(f"found cached map with hash {actual_hash}")
                self.world_map = cached_world_map
            else:
                print(
                    f"cached map hash {cached_world_map.file_hash} is different from"
                    f" actual hash {actual_hash}"
                )
                world_map = Map(
                    file_hash=actual_hash,
                    tiled_map=pytmx.TiledMap(MAP_DIR / "map.tmx"),
                )
                with open(MAP_CACHE_FILE, "wb") as map_cache_file_write:
                    pickle.dump(world_map, map_cache_file_write)
                self.world_map = world_map


world_map_cache = MapCache()
