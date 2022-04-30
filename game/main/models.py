from __future__ import annotations

import datetime
import logging
import random
from typing import List

from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import AnonymousUser
from redis_om import Field, HashModel
from redis_om.model.migrations.migrator import Migrator

from game.main.map import Map
from game.main.npcs import NpcKind, get_kind_by_name
from game.users.models import User

logger = logging.getLogger(__name__)


class ChatLine(HashModel):
    sayer_pk: str = Field(index=True)
    message: str
    created_at: datetime.date = Field(index=True)

    @property
    def sayer(self) -> Player:
        return Player.get(pk=self.sayer_pk)  # type:ignore

    def __str__(self) -> str:
        return self.key()


class CanNotWalkException(Exception):
    pass


class Npc(HashModel):
    kind_name: str = Field(index=True)
    x: int = Field(index=True)
    y: int = Field(index=True)
    attack: int
    strength: int
    defense: int

    @staticmethod
    def create(kind_name: str, x: int, y: int) -> Npc:
        npc_kind = get_kind_by_name(kind_name)
        attack = random.choice(range(npc_kind.attack[0], npc_kind.attack[1]))
        strength = random.choice(range(npc_kind.strength[0], npc_kind.strength[1]))
        defense = random.choice(range(npc_kind.defense[0], npc_kind.defense[1]))
        npc = Npc(
            kind_name=kind_name,
            x=x,
            y=y,
            attack=attack,
            strength=strength,
            defense=defense,
        )
        npc.save()
        return npc

    @property
    def kind(self) -> NpcKind:
        return get_kind_by_name(self.kind_name)

    @property
    def avatar_path(self) -> str:
        return f"assets/npcs/{self.kind_name}.png"

    @property
    def level(self) -> int:
        return self.attack + self.strength + self.defense


class Player(HashModel):
    user_pk: int = Field(index=True)
    x: int = Field(index=True)
    y: int = Field(index=True)
    logged_in: int = Field(index=True)

    avatar: int
    created_at: datetime.date

    @property
    def user(self) -> User:
        return User.objects.get(pk=self.user_pk)

    @staticmethod
    def create(
        user: AbstractBaseUser | AnonymousUser,
    ) -> Player:
        player = Player(
            user_pk=user.pk,
            x=settings.GAME_SPAWN_LOCATION_X,
            y=settings.GAME_SPAWN_LOCATION_Y,
            avatar=1,
            logged_in=True,
            created_at=datetime.date.today(),
        )
        player.save()
        return player

    @staticmethod
    def of_user(
        user: AbstractBaseUser | AnonymousUser,
    ) -> Player:
        return Player.find(Player.user_pk == user.pk).first()

    def get_chat_list(
        self,
    ) -> List[ChatLine]:
        chat_lines = ChatLine.find().sort_by("created_at").all()[:25]
        chat_lines.reverse()
        return chat_lines

    def __str__(self) -> str:
        return self.key()

    def _is_adjacent(self, x: int, y: int) -> bool:
        return abs(x - self.x) <= 1 and abs(y - self.y) <= 1

    def can_walk(self, x: int, y: int, world_map: Map) -> bool:
        return (
            self._is_adjacent(x, y)
            and not ((self.x == x) and (self.y == y))
            and not world_map.get(x, y).obstacle
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


Migrator().run()
