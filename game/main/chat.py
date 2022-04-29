import datetime

from game.main.models import ChatLine, Player


class Chat:
    @staticmethod
    def add(player: Player, message: str) -> None:
        ChatLine(
            sayer_pk=player.pk, message=message, created_at=datetime.date.today()
        ).save()
