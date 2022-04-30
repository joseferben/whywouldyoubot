from django.core.management.base import BaseCommand

from game.main.world import World


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "--despawn",
            help="Despawns all NPCs",
        )

    def handle(self, *args, **options):
        if options["despawn"]:
            World.npcs_despawn()
        else:
            World.npcs_spawn()
