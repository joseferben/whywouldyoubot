from django.apps import AppConfig


class MainConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "game.main"

    def ready(self) -> None:
        # flake8: noqa
        import game.main.receivers
