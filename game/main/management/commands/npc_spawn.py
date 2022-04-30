from django.core.management.base import BaseCommand

from game.main.world import World


class Command(BaseCommand):
    def handle(self, *args, **options):
        World.npcs_spawn()
