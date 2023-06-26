export type Migrations = {
  [fromVersion: number]: (entity: any) => any;
};

export class Migrator {
  readonly migratorTargetVersion: number;

  constructor(readonly migrations: Migrations) {
    this.migratorTargetVersion = 0;
    if (migrations) {
      try {
        const versions = Object.keys(migrations).map((v) => parseInt(v));
        this.migratorTargetVersion = Math.max(...versions) + 1;
      } catch (e) {
        console.error(e);
        console.error("Migrators must be an object with integer keys");
      }
    }
  }

  needsMigration(entity: any) {
    return (entity.v || 0) < this.migratorTargetVersion;
  }

  migrate(entity: { id: string }) {
    for (let i = (entity as any).v || 0; i < this.migratorTargetVersion; i++) {
      console.log(`Migrating ${entity.id} from ${i} to ${i + 1}`);
      const migrator = this.migrations?.[i];
      if (!migrator) {
        throw new Error(`No migrator for version ${i}`);
      }
      const id = entity.id;
      const migrated = migrator(entity);
      for (const key of Object.keys(entity)) {
        delete (entity as any)[key as string];
      }
      for (const [key, value] of Object.entries(migrated)) {
        (entity as any)[key] = value;
      }
      (entity as any).v = i + 1;
      entity.id = id;
    }
  }
}
