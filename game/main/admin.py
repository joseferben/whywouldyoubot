# -*- coding: utf-8 -*-
from django.contrib import admin

from .models import Player


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ("id", "created", "modified", "user")
    list_filter = ("created", "modified", "user")
