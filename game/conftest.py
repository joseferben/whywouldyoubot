import pytest

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
    return PlayerFactory.create()


@pytest.fixture
def chat_line() -> ChatLine:
    return ChatLineFactory.create()
