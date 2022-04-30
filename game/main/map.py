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

from game.main.npcs import NpcKind, get_kind_by_name

logger = logging.getLogger(__name__)

OBSTACLE_LAYER_NAME = "obstacle"
NPC_SPAWN_LAYER_NAME = "npc_spawn"


class TileDoesNotExistError(BaseException):
    pass


class NpcSpawner:
    DEFAULT_AMOUNT_MAX = 10

    def __init__(
        self,
        name: str,
        # anchor top left corner
        bbox: Tuple[int, int, int, int],
        amount_max: int = DEFAULT_AMOUNT_MAX,
    ) -> None:
        self.npc_kind: NpcKind = get_kind_by_name(name)
        self.bbox = bbox
        self.amount_max = amount_max or NpcSpawner.DEFAULT_AMOUNT_MAX

    def __str__(self) -> str:
        return self.npc_kind.name


class MapTile:
    def __init__(
        self,
        x: int,
        y: int,
        obstacle: bool = False,
        gid: int = 0,
        description: Optional[str] = None,
        image_paths: List[str] = [],
    ) -> None:
        self.x = x
        self.y = y
        self.gid = gid
        self.image_paths = image_paths
        self.obstacle = obstacle
        self.description = description

    def __repr__(self) -> str:
        return f'{self.x}/{self.y} {"o" if self.obstacle else "no"}'


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
            tiles[x][y].obstacle = True  # type:ignore

    @staticmethod
    def _of_file(tiled_map: TiledMap) -> Tuple[List[List[MapTile]], List[NpcSpawner]]:
        tiles: List[List[Optional[MapTile]]] = [
            [None] * tiled_map.height for i in range(tiled_map.width)
        ]
        npc_spawners: List[NpcSpawner] = []

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
                        amount_max = obj.properties.get("amount_max")
                        npc_spawners.append(
                            NpcSpawner(name=obj.name, bbox=bbox, amount_max=amount_max)
                        )
        return (tiles, npc_spawners)  # type: ignore

    def __init__(
        self,
        npc_spawners: List[NpcSpawner] = [],
        file_hash: Optional[str] = None,
        tiles: List[List[MapTile]] = [],
        tiled_map: Optional[TiledMap] = None,
    ) -> None:
        if tiled_map is None and len(tiles) == 0:
            raise Exception(
                "Provide either a list of tiles or a Tiled file to create a WorldMap"
            )
        if tiled_map is not None:
            (tiles, npc_spawners) = Map._of_file(tiled_map)
            self.tiles = tiles
            self.npc_spawners = npc_spawners
        else:
            self.tiles = tiles
            self.npc_spawners = npc_spawners
        self.file_hash = file_hash

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
            cached_static_map: Optional[Map] = None
            try:
                cached_static_map = pickle.load(map_cache_file_read)
            except EOFError:
                cached_static_map = Map(tiles=[[]], npc_spawners=[])
            assert cached_static_map is not None
            if (
                not settings.GAME_CACHE_BYPASS
                and actual_hash == cached_static_map.file_hash
            ):
                print(f"found cached map with hash {actual_hash}")
                self.static_map = cached_static_map
            else:
                print(
                    f"cached map hash {cached_static_map.file_hash} is different from"
                    f" actual hash {actual_hash}"
                )
                static_map = Map(
                    file_hash=actual_hash,
                    tiled_map=pytmx.TiledMap(MAP_DIR / "map.tmx"),
                )
                with open(MAP_CACHE_FILE, "wb") as map_cache_file_write:
                    pickle.dump(static_map, map_cache_file_write)
                self.static_map = static_map


static_map_cache = MapCache()
