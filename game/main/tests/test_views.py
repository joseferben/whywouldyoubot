import pytest
from django.test import Client
from django.urls.base import reverse

from game.conftest import player
from game.main.map import Map
from game.main.models import ChatLine, Player


@pytest.mark.django_db
def test_chat_create_view(client: Client, player: Player):
    client.force_login(player.user)
    chat_line_txt = "Hello, this is a test"

    response = client.post(reverse("main:chat_create"), data={"message": chat_line_txt})

    assert response.status_code == 200
    chat_line = ChatLine.objects.get()
    assert chat_line_txt in chat_line.message
    assert chat_line_txt in str(response.content)


@pytest.mark.django_db
def test_chat(client: Client, player: Player, chat_line: ChatLine, map_small: Map):
    client.force_login(player.user)

    response = client.get(reverse("main:map"))

    assert response.status_code == 200
    assert chat_line.message in str(response.content)


@pytest.mark.django_db
def test_walk(client: Client, player: Player, map_small: Map):
    player.x = 0
    player.y = 0
    player.save()

    client.force_login(player.user)

    response = client.post(reverse("main:walk"), data={"x": 1, "y": 0}, follow=True)

    assert response.status_code == 200
    player.refresh_from_db()
    assert player.x == 1
    assert player.y == 0


player_1 = player
player_2 = player


@pytest.mark.django_db
def test_field_other_players(client: Client, player_1: Player, player_2: Player):
    player_1.x = player_2.x = 1
    player_1.y = player_2.y = 1
    player_1.save()
    player_2.save()

    client.force_login(player_1.user)

    response = client.get(reverse("main:map"))

    assert response.status_code == 200
    assert player_2.user.username in str(response.content)
