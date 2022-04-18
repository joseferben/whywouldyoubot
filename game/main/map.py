from pathlib import PurePosixPath
from typing import List


class Tile:
    def __init__(
        self, x: int, y: int, walkable: bool, image_paths: List[PurePosixPath]
    ) -> None:
        self.x = x
        self.y = y
        self.walkable = walkable
        self.image_paths = image_paths
