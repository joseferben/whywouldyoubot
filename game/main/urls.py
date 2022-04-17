from django.urls import path

from .views import CharacterView, InventoryView, MapView, SettingsView

app_name = "main"

urlpatterns = [
    path("/map/", MapView.as_view(), name="map"),
    path("/character/", CharacterView.as_view(), name="character"),
    path("/inventory/", InventoryView.as_view(), name="inventory"),
    path("/settings/", SettingsView.as_view(), name="settings"),
]
