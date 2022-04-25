from __future__ import annotations

import logging
from pathlib import Path

import pytmx
from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import AnonymousUser
from django.db import models
from django.db.models.query import QuerySet
from django_extensions.db.models import TimeStampedModel

from game.main.map import Map
from game.users.models import User

logger = logging.getLogger(__name__)

tiled_map = pytmx.TiledMap(settings.APPS_DIR / Path("static/assets/map/map.tmx"))


class ChatLine(TimeStampedModel):
    sayer = models.ForeignKey["Player"](
        "main.Player", on_delete=models.CASCADE, blank=True, null=True
    )
    message = models.TextField()


class CanNotWalkException(Exception):
    pass


class Player(TimeStampedModel):
    id: int

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    x = models.PositiveIntegerField(default=530)
    y = models.PositiveIntegerField(default=540)
    avatar = models.PositiveIntegerField(default=1)
    logged_in = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    last_interacted_at = models.DateTimeField(auto_now=True)

    @staticmethod
    def of_user(user: AbstractBaseUser | AnonymousUser) -> Player:
        return Player.objects.get(user=user)

    @staticmethod
    def create(user: User) -> Player:
        return Player.objects.create(user=user)

    def get_chat_list(
        self,
    ) -> QuerySet[ChatLine]:
        return ChatLine.objects.order_by("-created").all()[:25]

    def __str__(self) -> str:
        return self.user.username

    def _is_adjacent(self, x: int, y: int) -> bool:
        return abs(x - self.x) <= 1 and abs(y - self.y) <= 1

    def can_walk(self, x: int, y: int, world_map: Map) -> bool:
        return (
            self._is_adjacent(x, y)
            and not ((self.x == x) and (self.y == y))
            and world_map.get(x, y).obstacle
        )

    def walk(self, x: int, y: int, world_map: Map) -> None:
        if not self.can_walk(x, y, world_map):
            raise CanNotWalkException("Can not walk there")
        self.x = x
        self.y = y

    @property
    def level(self) -> int:
        return 42

    @property
    def avatar_path(self) -> str:
        return f"assets/avatars/{self.avatar}.png"
