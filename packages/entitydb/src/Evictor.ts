export class Evictor<E extends { id: string }> {
  readonly entities = new Map<
    string,
    { timer: NodeJS.Timer; entity: E; ttlMs: number }
  >();

  constructor(readonly listener: (e: E) => void) {}

  expire(entity: E, ttlMs?: number) {
    const found = this.entities.get(entity.id);
    if (found) {
      clearTimeout(found.timer);
      this.entities.set(entity.id, {
        timer: setTimeout(
          () => {
            this.listener?.(entity);
          },
          !ttlMs ? found.ttlMs : ttlMs
        ),
        entity,
        ttlMs: found.ttlMs,
      });
    } else {
      if (ttlMs === undefined)
        throw new Error("ttlMs must be provided if entity not found");
      this.entities.set(entity.id, {
        timer: setTimeout(() => {
          this.listener?.(entity);
        }, ttlMs),
        entity,
        ttlMs: ttlMs,
      });
    }
  }
}
