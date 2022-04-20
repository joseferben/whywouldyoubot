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
from game.main.map import MINI_MAP_ROW_LENGTH, MiniMapTile, WorldMap
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
    ) -> Dict[int, Dict[int, Tuple[List[str], int, int, bool]]]:
        # TODO use WorldMap as input
        result: Dict[int, Dict[int, Tuple[List[str], int, int, bool]]] = {}
        for layer in tiled_map.layers:
            try:
                for x, y, image in layer.tiles():
                    if abs(self.x - x) <= 4 and abs(self.y - y) <= 2:
                        image_path = PurePosixPath(image[0])
                        image_path = str(image_path.relative_to(APPS_DIR / "static"))
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

    def get_mini_map(self) -> List[List[MiniMapTile]]:
        # TODO use WorldMap as input
        d = self._get_dict()
        result_all: List[MiniMapTile] = []
        for rows in d.values():
            for image_paths, x, y, walkable in rows.values():
                result_all.append(
                    MiniMapTile(x=x, y=y, walkable=walkable, image_paths=image_paths)
                )
        result: List[List[MiniMapTile]] = [
            result_all[i : i + MINI_MAP_ROW_LENGTH]
            for i in range(0, len(result_all), MINI_MAP_ROW_LENGTH)
        ]
        return result

    def get_chat_list(
        self,
    ) -> QuerySet[ChatLine]:
        return ChatLine.objects.order_by("-created").all()[:25]

    def __str__(self) -> str:
        return self.user.username

    def _is_adjacent(self, x: int, y: int) -> bool:
        return abs(x - self.x) <= 1 and abs(y - self.y) <= 1

    def can_walk(self, x: int, y: int, world_map: WorldMap) -> bool:
        return (
            self._is_adjacent(x, y)
            and not ((self.x == x) and (self.y == y))
            and world_map.get(x, y).walkable
        )

    def walk(self, x: int, y: int, world_map: WorldMap) -> None:
        if not self.can_walk(x, y, world_map):
            raise Exception("Can not walk there")
        self.x = x
        self.y = y
