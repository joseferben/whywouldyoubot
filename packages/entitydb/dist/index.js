"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var entitydb_exports = {};
__export(entitydb_exports, {
  EntityDB: () => EntityDB,
  JSONStore: () => JSONStore
});
module.exports = __toCommonJS(entitydb_exports);

// src/EntityDB.ts
var import_nanoid = require("nanoid");
var import_tiny_invariant3 = __toESM(require("tiny-invariant"));

// src/SpatialIndex.ts
var SpatialIndex = class {
  constructor() {
    this.maxX = 0;
    this.maxY = 0;
    this.index = {};
  }
  findByPosition(x, y) {
    var _a;
    return ((_a = this.index[x]) == null ? void 0 : _a[y]) || [];
  }
  findByRectangle(x, y, width, height) {
    const ids = [];
    for (let i = x; i < x + width; i++) {
      for (let j = y; j < y + height; j++) {
        ids.push(...this.findByPosition(i, j));
      }
    }
    return ids;
  }
  update(entity) {
    if (entity.x === void 0 || entity.y === void 0) {
      throw new Error("Can not use spatial index without x or y");
    }
    this.delete(entity);
    this.insert(entity);
  }
  insert(entity) {
    if (entity.x === void 0 || entity.y === void 0) {
      throw new Error("Can not use spatial index without x or y");
    }
    if (entity.x > this.maxX) {
      this.maxX = entity.x;
    }
    if (entity.y > this.maxY) {
      this.maxY = entity.y;
    }
    const { id, x, y } = entity;
    this.index[x] = this.index[x] || {};
    this.index[x][y] = this.index[x][y] || /* @__PURE__ */ new Set();
    this.index[x][y].add(id);
  }
  bulkInsert(entities) {
    for (const entity of entities) {
      this.insert(entity);
    }
  }
  delete(entity) {
    var _a, _b, _c;
    if (entity.x === void 0 || entity.y === void 0) {
      throw new Error("Can not use spatial index without x or y");
    }
    const { id, x, y } = entity;
    if ((_b = (_a = this.index[x]) == null ? void 0 : _a[y]) == null ? void 0 : _b.has(id)) {
      (_c = this.index[x][y]) == null ? void 0 : _c.delete(id);
    }
  }
};

// src/FieldIndex.ts
var FieldIndex = class {
  constructor(fields) {
    this.fields = fields;
    this.index = /* @__PURE__ */ new Map();
    fields.forEach((field) => this.index.set(field, /* @__PURE__ */ new Map()));
  }
  updateIndex(entity) {
    for (const [key, value] of this.index.entries()) {
      const index = value.get(String(entity[key])) || /* @__PURE__ */ new Set();
      index.add(entity.id);
      value.set(String(entity[key]), index);
    }
  }
  deleteIndex(entity) {
    for (const [key, value] of this.index.entries()) {
      const index = value.get(String(entity[key])) || /* @__PURE__ */ new Set();
      index.delete(entity.id);
      value.set(String(entity[key]), index);
    }
  }
  insert(entity) {
    this.updateIndex(entity);
  }
  update(entity) {
    this.updateIndex(entity);
  }
  delete(entity) {
    this.deleteIndex(entity);
  }
  findBy(key, value) {
    const index = this.index.get(key);
    if (!index) {
      throw new Error(`Index not found for key ${key}`);
    }
    const ids = index.get(String(value)) || /* @__PURE__ */ new Set();
    const result = [];
    for (const id of ids) {
      result.push(id);
    }
    return result;
  }
  findByFilter(filter) {
    let ids;
    for (const [key, value] of Object.entries(filter)) {
      if (key === "id") {
        return [value];
      }
      const index = this.index.get(key);
      if (!index) {
        throw new Error(`Index not found for key ${key}`);
      }
      const foundIds = index.get(String(value)) || /* @__PURE__ */ new Set();
      if (!ids) {
        ids = new Set(foundIds);
      } else {
        ids = new Set([...ids].filter((id) => foundIds.has(id)));
      }
    }
    return ids ?? [];
  }
};

// src/Migrator.ts
var Migrator = class {
  constructor(migrations) {
    this.migrations = migrations;
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
  needsMigration(entity) {
    return (entity.v || 0) < this.migratorTargetVersion;
  }
  migrate(entity) {
    var _a;
    for (let i = entity.v || 0; i < this.migratorTargetVersion; i++) {
      console.log(`Migrating ${entity.id} from ${i} to ${i + 1}`);
      const migrator = (_a = this.migrations) == null ? void 0 : _a[i];
      if (!migrator) {
        throw new Error(`No migrator for version ${i}`);
      }
      const id = entity.id;
      const migrated = migrator(entity);
      for (const key of Object.keys(entity)) {
        delete entity[key];
      }
      for (const [key, value] of Object.entries(migrated)) {
        entity[key] = value;
      }
      entity.v = i + 1;
      entity.id = id;
    }
  }
};

// src/Persistor.ts
var import_tiny_invariant = __toESM(require("tiny-invariant"));
var usedNamespaces = /* @__PURE__ */ new Set();
var Persistor = class {
  constructor(jsonDB, namespace, persistIntervalMs, persistAfterChangeCount) {
    this.jsonDB = jsonDB;
    this.namespace = namespace;
    this.persistIntervalMs = persistIntervalMs;
    this.persistAfterChangeCount = persistAfterChangeCount;
    this.defaultOpts = {
      persistIntervalMs: 1e3,
      persistAfterChangeCount: process.env.NODE_ENV === "production" ? 10 : 0
    };
    this.changed = /* @__PURE__ */ new Set();
    if (usedNamespaces.has(namespace)) {
      throw new Error(`Persistor namespace ${namespace} already in use`);
    }
    usedNamespaces.add(namespace);
  }
  setEntities(entities) {
    this.entities = entities;
    this.schedulePersist();
  }
  /**
   * Load the entities from the JSON store and insert them into the in-memory store.
   */
  loadEntities(fun) {
    const jsons = this.jsonDB.all(this.namespace);
    for (const json of jsons) {
      (0, import_tiny_invariant.default)(json.id !== void 0, "Entity must have an id");
      if (json.v === void 0) {
        json.v = 0;
      }
      const entity = json;
      if (fun)
        fun(entity);
    }
  }
  schedulePersist() {
    this.timer = setInterval(() => {
      this.persistChanged();
    }, this.persistIntervalMs || this.defaultOpts.persistIntervalMs);
  }
  addChanged(entity) {
    this.changed.add(entity.id);
    const hasChangedEnough = this.changed.size > (this.persistAfterChangeCount !== void 0 ? this.persistAfterChangeCount : this.defaultOpts.persistAfterChangeCount);
    if (hasChangedEnough) {
      this.persistChanged();
    }
  }
  persistChanged() {
    if (!this.jsonDB)
      return;
    if (!this.entities)
      throw new Error("Entities not set" + this.namespace);
    const n = this.changed.size;
    for (const id of this.changed) {
      const entity = this.entities.get(id);
      try {
        if (!entity) {
          this.jsonDB.delete(id);
        } else {
          this.jsonDB.set(entity.id, entity, this.namespace);
        }
      } catch (e) {
        console.error(e);
        console.error("Failed to persist changed", entity || id);
      }
      this.changed.delete(id);
    }
    if (n > 0)
      console.log("persisted", n, "entities", this.namespace);
  }
  close() {
    console.log("shutdown gracefully, persisting entities", this.namespace);
    this.timer && clearInterval(this.timer);
    this.persistChanged();
    usedNamespaces.delete(this.namespace);
    this.jsonDB.db.close();
  }
};

// src/Evictor.ts
var import_tiny_invariant2 = __toESM(require("tiny-invariant"));
var Evictor = class {
  constructor(listener) {
    this.listener = listener;
    this.entities = /* @__PURE__ */ new Map();
  }
  expire(entity, ttlMs) {
    const found = this.entities.get(entity.id);
    if (found) {
      clearTimeout(found.timer);
      this.entities.set(entity.id, {
        timer: setTimeout(
          () => {
            var _a;
            (_a = this.listener) == null ? void 0 : _a.call(this, entity);
          },
          !ttlMs ? found.ttlMs : ttlMs
        ),
        entity,
        ttlMs: found.ttlMs
      });
    } else {
      (0, import_tiny_invariant2.default)(
        ttlMs !== void 0,
        "ttlMs must be provided if entity not found"
      );
      this.entities.set(entity.id, {
        timer: setTimeout(() => {
          var _a;
          (_a = this.listener) == null ? void 0 : _a.call(this, entity);
        }, ttlMs),
        entity,
        ttlMs
      });
    }
  }
};

// src/EntityDB.ts
var EntityDB = class {
  constructor(opts = {}) {
    this.opts = opts;
    var _a, _b;
    this.entities = /* @__PURE__ */ new Map();
    if (opts.jsonStore && opts.persistenceNamespace) {
      this.persistor = new Persistor(
        opts.jsonStore,
        opts.persistenceNamespace,
        opts.persistenceIntervalMs,
        opts.persistenceAfterChangeCount
      );
    } else if (opts.jsonStore && !opts.persistenceNamespace) {
      throw new Error(
        "persistenceNamespace must be provided if using jsonStore"
      );
    }
    if (opts.fields) {
      this.fieldIndex = new FieldIndex(opts.fields);
    }
    if (opts.spatial) {
      this.spatialIndex = new SpatialIndex();
    }
    if (opts.migrations) {
      this.migrator = new Migrator(opts.migrations);
    }
    this.evictor = new Evictor(this.handleExpire.bind(this));
    (_a = this.persistor) == null ? void 0 : _a.setEntities(this.entities);
    (_b = this.persistor) == null ? void 0 : _b.loadEntities(this.loadEntity.bind(this));
    this.installShutdownHandlers();
  }
  handleExpire(entity) {
    var _a, _b;
    this.delete(entity);
    (_b = (_a = this.opts).evictorListener) == null ? void 0 : _b.call(_a, entity);
  }
  loadEntity(entity) {
    var _a, _b, _c;
    if ((_a = this.migrator) == null ? void 0 : _a.needsMigration(entity)) {
      this.migrator.migrate(entity);
      this.insert(entity);
    } else {
      this.entities.set(entity.id, entity);
      (_b = this.fieldIndex) == null ? void 0 : _b.update(entity);
      (_c = this.spatialIndex) == null ? void 0 : _c.update(entity);
    }
  }
  installShutdownHandlers() {
    if (typeof process === "undefined")
      return;
    process.on("SIGINT", () => {
      this.close();
    });
    process.on("SIGTERM", () => {
      this.close();
    });
    process.on("exit", () => {
      this.close();
    });
  }
  fromArray(entities) {
    entities.forEach((e) => this.insert(e));
    return this;
  }
  create(entity, opts) {
    var _a;
    const id = (0, import_nanoid.nanoid)();
    const v = ((_a = this.migrator) == null ? void 0 : _a.migratorTargetVersion) || 0;
    const toInsert = { id, v, ...entity };
    this.insert(toInsert);
    if (opts == null ? void 0 : opts.ttlMs) {
      this.evictor.expire(toInsert, opts.ttlMs);
    }
    return toInsert;
  }
  insert(entity) {
    var _a, _b, _c;
    if (this.migrator && this.migrator.needsMigration(entity)) {
      this.migrator.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    (_a = this.fieldIndex) == null ? void 0 : _a.update(entity);
    (_b = this.spatialIndex) == null ? void 0 : _b.update(entity);
    (_c = this.persistor) == null ? void 0 : _c.addChanged(entity);
  }
  update(entity) {
    var _a, _b, _c, _d;
    if ((_a = this.migrator) == null ? void 0 : _a.needsMigration(entity)) {
      this.migrator.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    (_b = this.fieldIndex) == null ? void 0 : _b.update(entity);
    (_c = this.spatialIndex) == null ? void 0 : _c.update(entity);
    (_d = this.persistor) == null ? void 0 : _d.addChanged(entity);
  }
  delete(entity) {
    var _a, _b, _c;
    this.entities.delete(entity.id);
    (_a = this.fieldIndex) == null ? void 0 : _a.delete(entity);
    (_b = this.spatialIndex) == null ? void 0 : _b.delete(entity);
    (_c = this.persistor) == null ? void 0 : _c.addChanged(entity);
  }
  findAll(limit) {
    const result = [];
    for (const entity of this.entities.values()) {
      result.push(entity);
      if (limit && result.length >= limit) {
        break;
      }
    }
    return result;
  }
  findById(id) {
    return this.entities.get(id) ?? null;
  }
  findByIds(ids) {
    const result = [];
    for (const id of ids) {
      const entity = this.findById(id);
      if (entity != null) {
        result.push(entity);
      }
    }
    return result;
  }
  findBy(key, value) {
    if (!this.fieldIndex)
      throw new Error("Field index needed for findByFilter");
    if (key === "id") {
      const entity = this.findById(value);
      return entity ? [entity] : [];
    }
    const ids = Array.from(this.fieldIndex.findBy(key, value));
    return this.findByIds(ids);
  }
  findOneBy(key, value) {
    const result = this.findBy(key, value);
    if (result.length > 1) {
      throw new Error(`Expected 1 result, got ${result.length}`);
    }
    return result[0] ?? null;
  }
  findByFilter(filter) {
    if (!this.fieldIndex)
      throw new Error("Field index needed for findByFilter");
    const ids = Array.from(this.fieldIndex.findByFilter(filter));
    return this.findByIds(ids || []);
  }
  findOneByFilter(filter) {
    const result = this.findByFilter(filter);
    if (result.length > 1) {
      throw new Error(`Expected 1 result, got ${result.length}`);
    }
    return result[0] ?? null;
  }
  findByPosition(x, y) {
    if (!this.spatialIndex)
      throw new Error("SpatialIndex needed for findByPosition");
    const ids = this.spatialIndex.findByPosition(x, y);
    const result = [];
    for (const id of ids) {
      const entity = this.entities.get(id);
      (0, import_tiny_invariant3.default)(entity, `Entity ${id} not found`);
      result.push(entity);
    }
    return result;
  }
  findOneByPosition(x, y) {
    const result = Array.from(this.findByPosition(x, y));
    if (result.length > 1) {
      throw new Error(`Expected 1 result, got ${result.length}`);
    }
    return result[0] ?? null;
  }
  findByRectangle(x, y, width, height) {
    if (!this.spatialIndex)
      throw new Error("SpatialIndex needed for findByRectangle");
    const ids = this.spatialIndex.findByRectangle(x, y, width, height);
    const result = [];
    for (const id of ids) {
      const entity = this.entities.get(id);
      (0, import_tiny_invariant3.default)(entity, `Entity ${id} not found`);
      result.push(entity);
    }
    return result;
  }
  count() {
    return this.entities.size;
  }
  expire(entity, ttlMs) {
    var _a;
    (_a = this.evictor) == null ? void 0 : _a.expire(entity, ttlMs);
  }
  close() {
    var _a;
    (_a = this.persistor) == null ? void 0 : _a.close();
  }
};

// src/JSONStore.ts
var JSONStore = class {
  constructor(db) {
    this.db = db;
    this.createTables();
    this.prepareStatements();
  }
  createTables() {
    this.db.prepare(
      `
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        namespace TEXT NOT NULL,
        data TEXT NOT NULL CHECK(json_valid(data)),
        created INT NOT NULL
      )
    `
    ).run();
    this.db.prepare(
      "CREATE INDEX IF NOT EXISTS entities_created ON entities(created)"
    );
    this.db.prepare(
      "CREATE INDEX IF NOT EXISTS entities_namespace ON entities(namespace)"
    );
  }
  prepareStatements() {
    this.selectStmt = this.db.prepare(
      "SELECT id, data FROM entities WHERE namespace = @namespace ORDER BY created ASC"
    );
    this.deleteStmt = this.db.prepare("DELETE FROM entities WHERE id = @id");
    this.insertStmt = this.db.prepare(
      "INSERT INTO entities VALUES (@id, @namespace, @data, @created)"
    );
    this.updateStmt = this.db.prepare(
      "UPDATE entities SET data = @data WHERE id = @id"
    );
    this.hasStmt = this.db.prepare("SELECT id FROM entities WHERE id = @id");
  }
  delete(id) {
    this.deleteStmt.run({ id });
  }
  set(id, json, namespace = "def") {
    if (this.hasStmt.get({ id })) {
      this.updateStmt.run({ id, data: JSON.stringify(json) });
    } else {
      this.insertStmt.run({
        id,
        namespace,
        data: JSON.stringify(json),
        created: Date.now()
      });
    }
  }
  all(namespace = "def") {
    return this.selectStmt.all({ namespace }).map(
      (row) => JSON.parse(row.data)
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EntityDB,
  JSONStore
});
