import logging
from typing import Any, Dict

from django.contrib.auth.mixins import LoginRequiredMixin
from django.forms.forms import BaseForm
from django.http.request import HttpRequest
from django.http.response import HttpResponse
from django.shortcuts import render
from django.views.generic.base import ContextMixin, TemplateView, View
from django.views.generic.edit import FormMixin

from game.main.map import world_map_cache
from game.main.world import MiniMap, World

from .chat import Chat
from .forms import ChatCreateForm
from .models import CanNotWalkException, Player

logger = logging.getLogger(__name__)


class ChatMixin(ContextMixin):
    def get_context_data(self, **kwargs: Any) -> Dict[str, Any]:
        assert self.request.user.is_authenticated  # type: ignore
        player: Player = Player.of_user(self.request.user)  # type:ignore
        context = super().get_context_data(**kwargs)
        context["chat_lines"] = player.get_chat_list()
        return context


class PlayerMixin(LoginRequiredMixin, ContextMixin):
    def get_player(self) -> Player:
        assert self.request.user.is_authenticated  # type: ignore
        return Player.of_user(self.request.user)  # type:ignore

    def get_context_data(self, **kwargs: Any) -> Dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context["player"] = self.get_player()
        return context


class MapMixin(PlayerMixin):
    def get_context_data(self, **kwargs: Any) -> Dict[str, Any]:
        context = super().get_context_data(**kwargs)
        player = self.get_player()
        context["mini_map"] = MiniMap.get_by_location(player.x, player.y)
        context["other_players"] = World.get_other_player_list(player)
        context["tile"] = World.get(player.x, player.y)
        return context


class MapView(MapMixin, ChatMixin, TemplateView):
    template_name = "main/map.html"
    htmx_template_name = "main/_map.html"

    def get(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        if not request.htmx:  # type: ignore
            return super().get(request, *args, **kwargs)
        else:
            return render(request, self.htmx_template_name, self.get_context_data())


class InventoryView(LoginRequiredMixin, ChatMixin, TemplateView):
    template_name = "main/inventory.html"


class CharacterView(LoginRequiredMixin, ChatMixin, TemplateView):
    template_name = "main/character.html"


class SettingsView(LoginRequiredMixin, ChatMixin, TemplateView):
    template_name = "main/settings.html"


class MapWalkView(MapMixin, ChatMixin, View):
    template_name = "main/_map.html"

    def post(self, request, *args, **kwargs):
        player: Player = self.get_player()
        x = kwargs["x"]
        y = kwargs["y"]
        try:
            player.walk(
                x=x,
                y=y,
                world_map=world_map_cache.world_map,
            )
            player.save()
        except CanNotWalkException:
            logging.warn(f"player {player} could not walk to {x}/{y}")

        return render(
            self.request,
            template_name=self.template_name,
            context=self.get_context_data(),
        )


class ChatCreateView(PlayerMixin, ChatMixin, FormMixin, View):
    form_class = ChatCreateForm
    fields = ["message"]
    template_name = "main/_chat.html"

    def post(self, request, *args, **kwargs):
        form: BaseForm = self.get_form()
        if form.is_valid():
            return self.form_valid(form)
        else:
            return self.form_invalid(form)

    def form_valid(self, form: BaseForm) -> HttpResponse:
        player: Player = self.get_player()
        Chat.add(player, form.cleaned_data["message"])
        return render(
            self.request,
            template_name=self.template_name,
            context=self.get_context_data(),
        )

    def form_invalid(self, form: BaseForm) -> HttpResponse:
        context = self.get_context_data()
        context["error"] = "Could not send chat message"
        return render(
            self.request, template_name=self.template_name, context=context, status=400
        )
