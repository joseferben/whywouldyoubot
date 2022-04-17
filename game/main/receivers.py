from django.db.models.signals import post_save
from django.dispatch import receiver

from game.main.models import Player
from game.users.models import User


@receiver(post_save, sender=User)
def create_player(sender, instance: User, created: bool, **kwargs):
    if created:
        Player.create(user=instance)
