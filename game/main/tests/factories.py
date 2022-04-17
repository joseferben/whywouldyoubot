import factory

from game.main.models import ChatLine, Player
from game.users.tests.factories import UserFactory


class PlayerFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Player

    user = factory.SubFactory(UserFactory)


class ChatLineFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ChatLine

    sayer = factory.SubFactory(PlayerFactory)
