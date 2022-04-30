import datetime

import factory
import pytest
from django.db.models.signals import post_save
from faker import Faker
from redis_om.model.migrations.migrator import Migrator

from game.main.map import Map, MapTile, static_map_cache
from game.main.models import ChatLine, Player
from game.users.models import User
from game.users.tests.factories import UserFactory

fake = Faker()


@pytest.fixture(autouse=True)
def run_before():
    Player.db().flushall()
    Migrator().run()
    yield


@pytest.fixture(autouse=True)
def media_storage(settings, tmpdir):
    settings.MEDIA_ROOT = tmpdir.strpath


@pytest.fixture
def user() -> User:
    with factory.django.mute_signals(post_save):
        return UserFactory.create()


@pytest.fixture
def player(user: User) -> Player:
    with factory.django.mute_signals(post_save):
        return Player.create(user=user)


@pytest.fixture
def chat_line(player: Player) -> ChatLine:
    chat_line = ChatLine(
        sayer_pk=player.pk, message=fake.sentence(), created_at=datetime.date.today()
    )
    chat_line.save()
    return chat_line


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
    static_map_cache.static_map = world_map
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
    static_map_cache.static_map = world_map
    return world_map
