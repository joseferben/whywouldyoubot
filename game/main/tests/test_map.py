import pytest

from game.main.map import Map, world_map_cache
from game.main.world import MiniMap


@pytest.mark.django_db
def test_map_of_file():
    world_map = world_map_cache.world_map

    assert world_map.tiles[0][0] is None

    assert world_map.tiles[525][534].x == 525
    assert world_map.tiles[525][534].y == 534

    assert world_map.tiles[525][534].obstacle
    assert not world_map.tiles[520][528].obstacle


@pytest.mark.django_db
def test_mini_map_small(map_small: Map):
    mini_map = MiniMap.get_by_location(0, 0, width=1, height=1)

    assert mini_map.tiles[0][0].x == map_small.tiles[0][0].x
    assert mini_map.tiles[0][0].y == map_small.tiles[0][0].y


@pytest.mark.django_db
def test_mini_map(map_medium: Map):
    mini_map = MiniMap.get_by_location(2, 2, width=3, height=3)

    assert len(mini_map.tiles) == 3
    assert len(mini_map.tiles[0]) == 3
    assert not mini_map.tiles[0][0].obstacle
    assert not mini_map.tiles[1][2].obstacle
    assert not mini_map.tiles[2][0].obstacle
