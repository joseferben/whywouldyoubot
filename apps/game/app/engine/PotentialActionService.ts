import type { Player, Action, PotentialActionMap } from "@wwyb/core";
import type { WalkService } from "./WalkService";

export class PotentialActionService {
  constructor(readonly walkService: WalkService) {}

  findByPosition(player: Player, x: number, y: number): PotentialActionMap {
    return {
      default: "walk",
      actions: { walk: { label: "Walk", action: { tag: "walk", x: x, y: y } } },
    };
  }

  execute(player: Player, action: Action) {
    if (action.tag === "walk") {
      this.walkService.startWalk(player, action.x, action.y);
    } else {
      throw new Error("unsupported action");
    }
  }
}
