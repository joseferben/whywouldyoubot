import pytest

from game.main.map import WorldMap, WorldTile, world_map_cache
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
def map_small() -> WorldMap:
    world_map = WorldMap(
        tiles=[
            [
                WorldTile(x=0, y=0),
                WorldTile(walkable=False, x=1, y=0),
                WorldTile(x=2, y=0),
            ],
            [WorldTile(x=0, y=1), WorldTile(x=1, y=1), WorldTile(x=2, y=1)],
            [WorldTile(x=0, y=2), WorldTile(x=1, y=2), WorldTile(x=2, y=2)],
        ]
    )
    world_map_cache.world_map = world_map
    return world_map
