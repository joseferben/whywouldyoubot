from typing import Any, Dict

from django.views.generic.base import ContextMixin, TemplateView

from .models import Player


class ChatMixin(ContextMixin):
    def get_context_data(self, **kwargs: Any) -> Dict[str, Any]:
        assert self.request.user.is_authenticated  # type: ignore
        player: Player = Player.of_user(self.request.user)  # type:ignore
        context = super().get_context_data(**kwargs)
        context["chat"] = player.get_chat()
        return context


class MapView(ChatMixin, TemplateView):
    template_name = "main/map.html"


class InventoryView(ChatMixin, TemplateView):
    template_name = "main/inventory.html"


class CharacterView(ChatMixin, TemplateView):
    template_name = "main/character.html"


class SettingsView(ChatMixin, TemplateView):
    template_name = "main/settings.html"
