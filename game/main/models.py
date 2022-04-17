from __future__ import annotations

from datetime import datetime
from typing import List, Tuple

from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import AnonymousUser
from django.db import models
from django_extensions.db.models import TimeStampedModel

from game.users.models import User


class Player(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    @staticmethod
    def of_user(user: AbstractBaseUser | AnonymousUser) -> Player:
        return Player.objects.get(user=user)

    def get_chat(
        self,
    ) -> List[Tuple[str, str, datetime]]:
        return []
