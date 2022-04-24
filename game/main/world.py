from __future__ import annotations

from math import floor
from typing import Dict, List, Tuple

from django.db.models.query import QuerySet

from game.main.map import MapTile, world_map_cache
from game.main.models import Player

MINI_MAP_HEIGHT = 5
MINI_MAP_WIDTH = 9


class TileThing:
    pass


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
        self.players = players


class MiniMap:
    def __init__(self, tiles: List[List[WorldTile]]) -> None:
        self.tiles = tiles

    def renderable_tiles(self) -> List[Tuple[WorldTile]]:
        return [*zip(*self.tiles)]

    @staticmethod
    def _player_lookup_dict(
        players: QuerySet[Player],
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
        players: QuerySet[Player] = Player.objects.filter(
            x__gte=x - x_padding,
            x__lte=x + x_padding,
            y__gte=y - y_padding,
            y__lte=y + y_padding,
        )
        players_dict = MiniMap._player_lookup_dict(players)
        for idx_x, col in enumerate(
            world_map_cache.world_map.tiles[x - x_padding : x + x_padding + 1]
        ):
            tiles.append([])
            for tile in col[y - y_padding : y + y_padding + 1]:
                world_tile = WorldTile(
                    map_tile=tile,
                    players=players_dict.get(tile.x, {}).get(tile.y, []),
                )
                tiles[idx_x].append(world_tile)
        return MiniMap(tiles=tiles)


class World:
    @staticmethod
    def get(x: int, y: int) -> WorldTile:
        players = list(Player.objects.filter(x=x, y=y))
        return WorldTile(map_tile=world_map_cache.world_map.get(x, y), players=players)

    @staticmethod
    def get_other_player_list(player: Player) -> QuerySet[Player]:
        return Player.objects.filter(x=player.x, y=player.y).exclude(pk=player.id)

    @staticmethod
    def get_mini_map_of_player(player: Player) -> MiniMap:
        return MiniMap.get_by_location(player.x, player.y)
