import pytest
from django.test import Client
from django.urls.base import reverse

from game.main.map import WorldMap
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
def test_chat(client: Client, player: Player, chat_line: ChatLine):
    client.force_login(player.user)

    response = client.get(reverse("main:map"))

    assert response.status_code == 200
    assert chat_line.message in str(response.content)


@pytest.mark.django_db
def test_walk(client: Client, player: Player, map_small: WorldMap):
    player.x = 0
    player.y = 0
    player.save()

    client.force_login(player.user)

    response = client.post(reverse("main:walk"), data={"x": 1, "y": 0}, follow=True)

    assert response.status_code == 200
    player.refresh_from_db()
    assert player.x == 1
    assert player.y == 0
