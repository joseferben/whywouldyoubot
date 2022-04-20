import factory
from django.db.models import signals

from game.main.models import ChatLine, Player
from game.users.tests.factories import UserFactory


@factory.django.mute_signals(signals.post_save)
class PlayerFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Player

    x = 2
    y = 2
    user = factory.SubFactory(UserFactory)


class ChatLineFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ChatLine

    sayer = factory.SubFactory(PlayerFactory)
