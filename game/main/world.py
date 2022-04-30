from __future__ import annotations

from math import floor
from random import random
from typing import Dict, Iterable, List, Tuple

from game.main.map import Map, MapTile, NpcSpawner, static_map_cache
from game.main.models import Npc, Player

MINI_MAP_HEIGHT = 5
MINI_MAP_WIDTH = 9


class WorldTile(MapTile):
    def __init__(
        self, map_tile: MapTile, players: List[Player], *args, **kwargs
    ) -> None:
        super().__init__(
            x=map_tile.x,
            y=map_tile.y,
            gid=map_tile.gid,
            description=map_tile.description,
            image_paths=map_tile.image_paths,
            obstacle=map_tile.obstacle,
            *args,
            **kwargs,
        )
        # TODO consider fetching players lazily using @property
        self.players = players


class MiniMap:
    def __init__(self, tiles: List[List[WorldTile]]) -> None:
        self.tiles = tiles

    def renderable_tiles(self) -> List[Tuple[WorldTile]]:
        return [*zip(*self.tiles)]

    @staticmethod
    def _player_lookup_dict(
        players: List[Player],
    ) -> Dict[int, Dict[int, List[Player]]]:
        player_dict = {}
        for player in players:
            if player_dict.get(player.x):
                if player_dict.get(player.y):
                    if player_dict[player.x][player.y] is not None:
                        player_dict[player.x][player.y].append(player)
                    else:
                        player_dict[player.x][player.y] = [player]
                else:
                    player_dict[player.x][player.y] = [player]
            else:
                player_dict[player.x] = {}
                player_dict[player.x][player.y] = [player]
        return player_dict

    @staticmethod
    def get_by_location(
        x: int,
        y: int,
        width: int = MINI_MAP_WIDTH,
        height: int = MINI_MAP_HEIGHT,
    ) -> MiniMap:
        tiles: List[List[WorldTile]] = []
        x_padding = floor(width / 2)
        y_padding = floor(height / 2)
        players: List[Player] = Player.find(
            Player.x >= x - x_padding,
            Player.x <= x + x_padding,
            Player.y >= y - y_padding,
            Player.y <= y + y_padding,
            # flake8: noqa
            Player.logged_in == 1,
        ).all()  # type: ignore
        players_dict = MiniMap._player_lookup_dict(players)
        for idx_x, col in enumerate(
            static_map_cache.static_map.tiles[x - x_padding : x + x_padding + 1]
        ):
            tiles.append([])
            for tile in col[y - y_padding : y + y_padding + 1]:
                world_tile = WorldTile(
                    map_tile=tile,
                    players=players_dict.get(tile.x, {}).get(tile.y, []),
                )
                tiles[idx_x].append(world_tile)
        return MiniMap(tiles=tiles)


class WorldNpcSpawner:
    def __init__(self, npc_spawner: NpcSpawner) -> None:
        self.npc_spawner = npc_spawner

    @property
    def tiles(self) -> List[WorldTile]:
        """Return the tiles within the spawner"""
        (x, y, width, height) = self.npc_spawner.bbox
        result: List[WorldTile] = []
        for col in static_map_cache.static_map.tiles[x : x + width]:
            for tile in col[y : y + height]:
                # TODO consider passing players here
                result.append(WorldTile(map_tile=tile, players=[]))
        return result

    @property
    def amount_actual(self) -> int:
        """Return the amount of NPCs of that kind within the spawner"""
        (x, y, width, height) = self.npc_spawner.bbox
        return len(
            Npc.find(
                Npc.kind == self.npc_spawner.npc_kind.name,
                Npc.x >= x,
                Npc.x <= x + width,
                Npc.y >= y,
                Npc.y <= y + height,
            ).all()
        )

    @property
    def amount_max(self) -> int:
        return self.npc_spawner.amount_max

    @property
    def name(self) -> str:
        return self.npc_spawner.npc_kind.name

    def spawn(self, tile: WorldTile) -> None:
        npc = Npc(kind=self.npc_spawner.npc_kind.name, x=tile.x, y=tile.y)
        print(f"spawned {npc}")
        npc.save()


class World:
    @staticmethod
    def npc_spawners() -> Iterable[WorldNpcSpawner]:
        return map(
            lambda npc_spawner: WorldNpcSpawner(npc_spawner=npc_spawner),
            static_map_cache.static_map.npc_spawners,
        )

    @staticmethod
    def get(x: int, y: int) -> WorldTile:
        players = Player.find(Player.x == x, Player.y == y).all()
        return WorldTile(
            map_tile=static_map_cache.static_map.get(x, y), players=players
        )

    @staticmethod
    def get_other_player_list(player: Player) -> List[Player]:
        return Player.find(
            Player.x == player.x,
            Player.y == player.y,
            Player.logged_in == 1,
            Player.pk != player.pk,
        ).all()

    @staticmethod
    def get_mini_map_of_player(player: Player) -> MiniMap:
        return MiniMap.get_by_location(player.x, player.y)

    @staticmethod
    def npcs_spawn():
        for npc_spawner in World.npc_spawners():
            assert npc_spawner.amount_actual is not None
            assert npc_spawner.amount_max is not None
            if npc_spawner.amount_actual < npc_spawner.amount_max:
                for tile in npc_spawner.tiles:
                    if random() >= 0.95:
                        npc_spawner.spawn(tile)
