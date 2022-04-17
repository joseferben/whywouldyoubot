from django.urls import path

from .views import CharacterView, ChatCreateView, InventoryView, MapView, SettingsView

app_name = "main"

urlpatterns = [
    path("map/", MapView.as_view(), name="map"),
    path("character/", CharacterView.as_view(), name="character"),
    path("inventory/", InventoryView.as_view(), name="inventory"),
    path("settings/", SettingsView.as_view(), name="settings"),
    path("chat/", ChatCreateView.as_view(), name="chat_create"),
]
