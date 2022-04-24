import pytest

from game.main.map import Map, MapTile, world_map_cache
from game.main.models import ChatLine, Player
from game.main.tests.factories import ChatLineFactory, PlayerFactory
from game.users.models import User
from game.users.tests.factories import UserFactory


@pytest.fixture(autouse=True)
def media_storage(settings, tmpdir):
    settings.MEDIA_ROOT = tmpdir.strpath


@pytest.fixture
def user() -> User:
    return UserFactory.create()


@pytest.fixture
def player() -> Player:
    return PlayerFactory.create()  # type: ignore


@pytest.fixture
def chat_line() -> ChatLine:
    return ChatLineFactory.create()


@pytest.fixture
def map_small() -> Map:
    world_map = Map(
        tiles=[
            [
                MapTile(x=0, y=0),
                MapTile(obstacle=False, x=0, y=1),
            ],
            [MapTile(x=1, y=0), MapTile(x=1, y=1)],
        ]
    )
    world_map_cache.world_map = world_map
    return world_map


@pytest.fixture
def map_medium() -> Map:
    world_map = Map(
        tiles=[
            [
                MapTile(x=0, y=0),
                MapTile(x=1, y=0),
                MapTile(x=2, y=0),
                MapTile(x=3, y=0, obstacle=False),
                MapTile(x=4, y=0),
            ],
            [
                MapTile(x=0, y=1),
                MapTile(x=1, y=1, obstacle=False),
                MapTile(x=2, y=1),
                MapTile(x=3, y=1),
                MapTile(x=4, y=1),
            ],
            [
                MapTile(x=0, y=2),
                MapTile(x=1, y=2),
                MapTile(x=2, y=2),
                MapTile(x=3, y=2, obstacle=False),
                MapTile(x=4, y=2),
            ],
            [
                MapTile(x=0, y=3),
                MapTile(x=1, y=3, obstacle=False),
                MapTile(x=2, y=3),
                MapTile(x=3, y=3),
                MapTile(x=4, y=3),
            ],
            [
                MapTile(x=0, y=4, obstacle=False),
                MapTile(x=1, y=4),
                MapTile(x=2, y=4),
                MapTile(x=3, y=4),
                MapTile(x=4, y=4),
            ],
        ]
    )
    world_map_cache.world_map = world_map
    return world_map
