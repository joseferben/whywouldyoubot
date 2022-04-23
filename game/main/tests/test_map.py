import pytest

from game.main.map import WorldMap, world_map_cache


@pytest.mark.django_db
def test_map_of_file():
    world_map = world_map_cache.world_map

    assert world_map.tiles[0][0] is None

    assert world_map.tiles[525][534].x == 525
    assert world_map.tiles[525][534].y == 534

    assert world_map.tiles[525][534].walkable
    assert not world_map.tiles[520][528].walkable


@pytest.mark.django_db
def test_mini_map_small(map_small: WorldMap):
    mini_map = map_small.get_mini_map(0, 0, width=1, height=1)

    assert mini_map.tiles[0][0] == map_small.tiles[0][0]


@pytest.mark.django_db
def test_mini_map(map_medium: WorldMap):
    mini_map = map_medium.get_mini_map(2, 2, width=3, height=3)

    assert len(mini_map.tiles) == 3
    assert len(mini_map.tiles[0]) == 3
    assert not mini_map.tiles[0][0].walkable
    assert not mini_map.tiles[1][2].walkable
    assert not mini_map.tiles[2][0].walkable
