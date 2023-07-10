import { Database, Statement } from 'better-sqlite3';

declare class SpatialIndex {
    index: {
        [x: number]: {
            [y: number]: Set<string>;
        };
    };
    maxX: number;
    maxY: number;
    constructor();
    findByPosition(x: number, y: number): Iterable<string>;
    findByRectangle(x: number, y: number, width: number, height: number): string[];
    update(entity: {
        id: string;
        x?: number;
        y?: number;
    }): void;
    insert(entity: {
        id: string;
        x?: number;
        y?: number;
    }): void;
    bulkInsert(entities: {
        id: string;
        x: number;
        y: number;
    }[]): void;
    delete(entity: {
        id: string;
        x?: number;
        y?: number;
    }): void;
}

declare class FieldIndex {
    readonly fields: string[];
    index: Map<string, Map<string, Set<string>>>;
    constructor(fields: string[]);
    private updateIndex;
    private deleteIndex;
    insert(entity: any): void;
    update(entity: any): void;
    delete(entity: any): void;
    findBy(key: string, value: any): Iterable<string>;
    findByFilter(filter: any): Iterable<string>;
}

type Migrations = {
    [fromVersion: number]: (entity: any) => any;
};
declare class Migrator {
    readonly migrations: Migrations;
    readonly migratorTargetVersion: number;
    constructor(migrations: Migrations);
    needsMigration(entity: any): boolean;
    migrate(entity: {
        id: string;
    }): void;
}

interface JSONStore {
    delete(id: string): void;
    set(id: string, json: string, namespace?: string): void;
    all(namespace?: string): string[];
}
declare class JSONStore {
    readonly db: Database;
    deleteStmt: Statement<{
        id: string;
    }>;
    insertStmt: Statement<{
        id: string;
        namespace: string;
        data: string;
        created: number;
    }>;
    updateStmt: Statement<{
        id: string;
        data: string;
    }>;
    selectStmt: Statement<{
        namespace: string;
    }>;
    hasStmt: Statement<{
        id: string;
    }>;
    constructor(db: Database);
    private createTables;
    private prepareStatements;
}

declare class Persistor {
    readonly jsonDB: JSONStore;
    readonly namespace: string;
    readonly persistIntervalMs?: number | undefined;
    readonly persistAfterChangeCount?: number | undefined;
    defaultOpts: {
        persistIntervalMs: number;
        persistAfterChangeCount: number;
    };
    changed: Set<string>;
    timer: NodeJS.Timer | undefined;
    entities: Map<string, {
        v?: number;
        id: string;
    }> | undefined;
    constructor(jsonDB: JSONStore, namespace: string, persistIntervalMs?: number | undefined, persistAfterChangeCount?: number | undefined);
    setEntities(entities: Map<string, {
        v?: number;
        id: string;
    }>): void;
    /**
     * Load the entities from the JSON store and insert them into the in-memory store.
     */
    loadEntities(fun?: (e: any) => void): void;
    schedulePersist(): void;
    addChanged(entity: {
        id: string;
    }): void;
    persistChanged(): void;
    close(): void;
}

declare class Evictor<E extends {
    id: string;
}> {
    readonly listener: (e: E) => void;
    readonly entities: Map<string, {
        timer: NodeJS.Timer;
        entity: E;
        ttlMs: number;
    }>;
    constructor(listener: (e: E) => void);
    expire(entity: E, ttlMs?: number): void;
}

type Opts<Entity> = {
    fields?: string[];
    spatial?: boolean;
    jsonStore?: JSONStore;
    persistenceNamespace?: string;
    persistenceIntervalMs?: number;
    persistenceAfterChangeCount?: number;
    migrations?: Migrations;
    evictorListener?: (entity: Entity) => void;
};
declare class EntityDB<E extends {
    id: string;
    v?: number;
    x?: number;
    y?: number;
}> {
    readonly opts: Opts<E>;
    entities: Map<string, E>;
    persistor: Persistor;
    fieldIndex: FieldIndex;
    spatialIndex: SpatialIndex;
    migrator: Migrator;
    evictor: Evictor<E>;
    constructor(opts?: Opts<E>);
    private handleExpire;
    private loadEntity;
    private installShutdownHandlers;
    fromArray(entities: E[]): this;
    create(entity: Omit<Omit<E, "id">, "v">, opts?: {
        ttlMs?: number;
    }): E;
    insert(entity: E): void;
    update(entity: E): void;
    delete(entity: E): void;
    findAll(limit?: number): E[];
    findById(id: string): E | null;
    findByIds(ids: Iterable<string>): E[];
    findBy(key: keyof E, value: E[typeof key]): E[];
    findOneBy(key: keyof E, value: E[typeof key]): E | null;
    findByFilter(filter: Partial<E>): E[];
    findOneByFilter(filter: Partial<E>): E;
    findByPosition(x: number, y: number): Iterable<E>;
    findOneByPosition(x: number, y: number): E | null;
    findByRectangle(x: number, y: number, width: number, height: number): E[];
    count(): number;
    expire(entity: E, ttlMs?: number): void;
    close(): void;
}

export { EntityDB, JSONStore, Opts };
