from __future__ import annotations

import logging
from pathlib import Path, PurePosixPath
from typing import Dict, List, Tuple

import pytmx
from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import AnonymousUser
from django.db import models
from django.db.models.query import QuerySet
from django_extensions.db.models import TimeStampedModel

from config.settings.base import APPS_DIR
from game.main.map import Tile
from game.users.models import User

logger = logging.getLogger(__name__)

tiled_map = pytmx.TiledMap(settings.APPS_DIR / Path("static/assets/map/map.tmx"))


class ChatLine(TimeStampedModel):
    sayer = models.ForeignKey["Player"](
        "main.Player", on_delete=models.CASCADE, blank=True, null=True
    )
    message = models.TextField()


class Player(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    x = models.PositiveIntegerField(default=45)
    y = models.PositiveIntegerField(default=42)

    @staticmethod
    def of_user(user: AbstractBaseUser | AnonymousUser) -> Player:
        return Player.objects.get(user=user)

    @staticmethod
    def create(user: User) -> Player:
        return Player.objects.create(user=user)

    def _get_dict(
        self,
    ) -> Dict[int, Dict[int, Tuple[List[PurePosixPath], int, int, bool]]]:
        result: Dict[int, Dict[int, Tuple[List[PurePosixPath], int, int, bool]]] = {}
        for layer in tiled_map.layers:
            try:
                for x, y, image in layer.tiles():
                    if abs(self.x - x) <= 4 and abs(self.y - y) <= 2:
                        image_path = PurePosixPath(image[0])
                        image_path = image_path.relative_to(APPS_DIR / "static")
                        if result.get(y) is None:
                            result[y] = {}
                            result[y][x] = ([image_path], x, y, self._is_adjacent(x, y))
                        elif result.get(y).get(x) is None:  # type: ignore
                            result[y][x] = ([image_path], x, y, self._is_adjacent(x, y))
                        else:
                            (image_paths, _, _, _) = result[y][x]
                            image_paths.append(image_path)
            except Exception as e:
                logger.error(e)
        return result

    def get_map(self) -> List[Tile]:
        d = self._get_dict()
        result: List[Tile] = []
        for rows in d.values():
            for image_paths, x, y, walkable in rows.values():
                result.append(
                    Tile(x=x, y=y, walkable=walkable, image_paths=image_paths)
                )
        return result

    def get_chat_list(
        self,
    ) -> QuerySet[ChatLine]:
        return ChatLine.objects.order_by("-created").all()[:25]

    def __str__(self) -> str:
        return self.user.username

    def _is_adjacent(self, x: int, y: int) -> bool:
        return abs(x - self.x) <= 1 and abs(y - self.y) <= 1

    def walk(self, x: int, y: int) -> None:
        if not self._is_adjacent(x, y):
            raise Exception("Can only walk on adjacent tiles")
        self.x = x
        self.y = y
