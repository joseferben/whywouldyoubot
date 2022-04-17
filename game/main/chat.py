from game.main.models import ChatLine, Player


class Chat:
    @staticmethod
    def add(player: Player, message: str) -> None:
        ChatLine.objects.create(sayer=player, message=message)
