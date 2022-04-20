import pytest

from game.main.map import WorldMap
from game.main.models import Player


@pytest.mark.django_db
def test_walk(player: Player, map_small: WorldMap):
    player.x = 0
    player.y = 0

    # own location
    assert player.can_walk(0, 0, map_small) is False
    with pytest.raises(Exception):
        player.walk(0, 0, map_small)

    # non adjacent tiles
    assert player.can_walk(2, 2, map_small) is False
    with pytest.raises(Exception):
        player.walk(2, 2, map_small)

    # obstacle
    assert player.can_walk(1, 0, map_small) is False
    with pytest.raises(Exception):
        player.walk(1, 0, map_small)

    assert player.can_walk(0, 1, map_small)
    player.walk(0, 1, map_small)
