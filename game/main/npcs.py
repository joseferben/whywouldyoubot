import inspect
import sys
from abc import ABC
from typing import Dict, Tuple

from inflection import underscore


class NpcKind(ABC):
    @property
    def name(self) -> str:
        class_name = self.__class__.__name__
        return underscore(class_name).replace("_npc_kind", "")

    description: str
    attack: Tuple[int, int]
    strength: Tuple[int, int]
    defense: Tuple[int, int]


class BeeNpcKind(NpcKind):
    attack = (1, 3)
    strength = (1, 2)
    defense = (1, 2)


class MouseNpcKind(NpcKind):
    attack = (1, 3)
    strength = (2, 3)
    defense = (1, 2)


class GoblinNpcKind(NpcKind):
    attack = (3, 5)
    strength = (2, 7)
    defense = (2, 3)


class WolfNpcKind(NpcKind):
    attack = (5, 8)
    strength = (3, 5)
    defense = (2, 3)


class BearNpcKind(NpcKind):
    attack = (5, 8)
    strength = (3, 5)
    defense = (3, 6)


class CrabNpcKind(NpcKind):
    attack = (1, 3)
    strength = (2, 3)
    defense = (4, 7)


class CowNpcKind(NpcKind):
    attack = (1, 2)
    strength = (1, 2)
    defense = (1, 3)


class WizardNpcKind(NpcKind):
    attack = (2, 4)
    strength = (4, 7)
    defense = (1, 2)


module = __name__

registry: Dict[str, NpcKind] = {}

for name, class_obj in inspect.getmembers(sys.modules[module]):
    if inspect.isclass(class_obj):
        if not class_obj.__name__ == "ABC":
            obj = class_obj()
            name = obj.name
            if not name == "npc_kind":
                registry[name] = obj


def get_by_name(name: str) -> NpcKind:
    try:
        return registry[name]
    except KeyError:
        registered_kinds = ", ".join(list(registry.keys()))
        raise KeyError(
            f"npc kind {name} is not in the registry, please choose one of the"
            f" following: {registered_kinds}"
        )
