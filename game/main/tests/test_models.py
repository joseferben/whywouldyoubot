import pytest

from game.main.models import Player


@pytest.mark.django_db
def test_walk(player: Player):
    player.x = 30
    player.y = 31

    player.walk(31, 31)

    assert player.x == 31
    assert player.y == 31


@pytest.mark.django_db
def test_walk_fails(player: Player):
    with pytest.raises(Exception):
        player.x = 20
        player.y = 31

        player.walk(31, 31)

        assert player.x == 31
        assert player.y == 31
