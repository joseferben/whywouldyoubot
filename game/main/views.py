from typing import Any, Dict

from django.contrib.auth.mixins import LoginRequiredMixin
from django.forms.forms import BaseForm
from django.http.response import HttpResponse
from django.shortcuts import render
from django.views.generic.base import ContextMixin, TemplateView, View
from django.views.generic.edit import FormMixin

from .chat import Chat
from .forms import ChatCreateForm
from .models import Player


class ChatMixin(ContextMixin):
    def get_context_data(self, **kwargs: Any) -> Dict[str, Any]:
        assert self.request.user.is_authenticated  # type: ignore
        player: Player = Player.of_user(self.request.user)  # type:ignore
        context = super().get_context_data(**kwargs)
        context["chat_lines"] = player.chat_list()
        return context


class PlayerMixin(LoginRequiredMixin):
    def get_player(self) -> Player:
        assert self.request.user.is_authenticated  # type: ignore
        return Player.of_user(self.request.user)  # type:ignore


class MapView(LoginRequiredMixin, ChatMixin, TemplateView):
    template_name = "main/map.html"


class InventoryView(LoginRequiredMixin, ChatMixin, TemplateView):
    template_name = "main/inventory.html"


class CharacterView(LoginRequiredMixin, ChatMixin, TemplateView):
    template_name = "main/character.html"


class SettingsView(LoginRequiredMixin, ChatMixin, TemplateView):
    template_name = "main/settings.html"


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
