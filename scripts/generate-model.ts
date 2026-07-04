import fs from "node:fs";
import path from "node:path";

const rawModel = process.argv[2];

if (!rawModel) {
  console.error("Usage: npm run generate:model <model>");
  process.exit(1);
}

const schemaPath = path.join(
  process.cwd(),
  "src",
  "lib",
  "powersync",
  "powersync_app_schema.ts"
);

if (!fs.existsSync(schemaPath)) {
  console.error(`Could not find schema file: ${schemaPath}`);
  process.exit(1);
}

const schemaSource = fs.readFileSync(schemaPath, "utf8");

const pascal = toPascal(rawModel);
const camel = toCamel(rawModel);
const plural = toPlural(camel);

const tableVarName = plural;
const tableConstName = `${toUpperSnake(plural)}_TABLE`;

const tableInfo = extractPowerSyncTable(schemaSource, tableVarName);

if (!tableInfo) {
  console.error(
    `Could not find PowerSync table definition: const ${tableVarName} = new Table({ ... })`
  );
  process.exit(1);
}

const featureDir = path.join(process.cwd(), "src", "features","models", plural);

if (fs.existsSync(featureDir)) {
  console.error(`Feature '${plural}' already exists.`);
  process.exit(1);
}

fs.mkdirSync(featureDir, { recursive: true });

const repoFile = path.join(featureDir, `${pascal}Repo.ts`);
const storeFile = path.join(featureDir, `${pascal}Store.ts`);

fs.writeFileSync(
  repoFile,
  repoTemplate({
    pascal,
    tableConstName,
  })
);

fs.writeFileSync(
  storeFile,
  storeTemplate({
    pascal,
    repoName: `${pascal}Repo`,
    interfaceBody: tableInfo.interfaceBody,
  })
);

console.log(`✓ Created feature '${plural}'`);
console.log(`  table variable: ${tableVarName}`);
console.log(`  table constant: ${tableConstName}`);
console.log(`  ${repoFile}`);
console.log(`  ${storeFile}`);

function repoTemplate(args: {
  pascal: string;
  tableConstName: string;
}): string {
  const { pascal, tableConstName } = args;

  return `import { ${tableConstName} } from "@/lib/powersync/powersync_app_schema";
import { system } from "@/lib/powersync/powersync_system";
import { uuid } from "@/lib/powersync/powersync_uuid";

const { db } = system;

export async function get${pascal}s() {
    return await db
        .selectFrom(${tableConstName})
        .selectAll()
        .execute();
}

export async function get${pascal}ById(id: string) {
    return await db
        .selectFrom(${tableConstName})
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();
}

export async function create${pascal}(input: unknown) {
    const id = uuid();

    return await db
        .insertInto(${tableConstName})
        .values({
            id,
            ...(input as object),
        } as any)
        .execute();
}

export async function update${pascal}(id: string, input: unknown) {
    return await db
        .updateTable(${tableConstName})
        .where("id", "=", id)
        .set(input as any)
        .execute();
}

export async function delete${pascal}(id: string) {
    return await db
        .deleteFrom(${tableConstName})
        .where("id", "=", id)
        .execute();
}
`;
}

function storeTemplate(args: {
  pascal: string;
  repoName: string;
  interfaceBody: string;
}): string {
  const { pascal, repoName, interfaceBody } = args;

  return `import { create } from "zustand";
import * as repo from "./${repoName}";

export interface ${pascal} {
${indent(interfaceBody.trim(), 4)}
}

interface ${pascal}Store {
    items: ${pascal}[];
    selectedItem: ${pascal} | null;
    loading: boolean;
    error: string | null;

    loadItems(): Promise<void>;
    loadItemById(id: string): Promise<void>;
    createItem(input: unknown): Promise<void>;
    updateItem(id: string, input: unknown): Promise<void>;
    deleteItem(id: string): Promise<void>;
    refresh(): Promise<void>;
    clearSelection(): void;
    clearError(): void;
}

/**
 * Zustand working-set stub.
 *
 * PowerSync is the full local database.
 * This store only holds the current UI-facing slice.
 */
export const use${pascal}Store = create<${pascal}Store>((set, get) => ({
    items: [],
    selectedItem: null,
    loading: false,
    error: null,

    loadItems: async () => {
        set({ loading: true, error: null });

        try {
            const items = await repo.get${pascal}s();
            set({ items, loading: false });
        } catch (err) {
            set({
                loading: false,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    },

    loadItemById: async (id: string) => {
        set({ loading: true, error: null });

        try {
            const selectedItem = await repo.get${pascal}ById(id);
            set({ selectedItem: selectedItem ?? null, loading: false });
        } catch (err) {
            set({
                loading: false,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    },

    createItem: async (input: unknown) => {
        await repo.create${pascal}(input);
        await get().loadItems();
    },

    updateItem: async (id: string, input: unknown) => {
        await repo.update${pascal}(id, input);
        await get().loadItems();

        if (get().selectedItem?.id === id) {
            await get().loadItemById(id);
        }
    },

    deleteItem: async (id: string) => {
        await repo.delete${pascal}(id);
        await get().loadItems();

        if (get().selectedItem?.id === id) {
            set({ selectedItem: null });
        }
    },

    refresh: async () => {
        await get().loadItems();
    },

    clearSelection: () => {
        set({ selectedItem: null });
    },

    clearError: () => {
        set({ error: null });
    },
}));
`;
}

function extractPowerSyncTable(
  source: string,
  tableVarName: string
): { interfaceBody: string } | null {
  const tableRegex = new RegExp(
    `const\\s+${escapeRegExp(tableVarName)}\\s*=\\s*new\\s+Table\\s*\\(\\s*{([\\s\\S]*?)}\\s*\\)\\s*;?`,
    "m"
  );

  const match = source.match(tableRegex);

  if (!match) return null;

  const columnsBlock = match[1];

  const fields: string[] = ["id: string;"];

  for (const rawLine of columnsBlock.split("\n")) {
    const line = rawLine.trim().replace(/,$/, "");

    if (!line) continue;

    const colMatch = line.match(
      /^([A-Za-z0-9_]+)\s*:\s*column\.([A-Za-z0-9_]+)/
    );

    if (!colMatch) continue;

    const columnName = colMatch[1];
    const columnType = colMatch[2];

    fields.push(`${columnName}: ${mapPowerSyncColumnType(columnType)} | null;`);
  }

  return {
    interfaceBody: fields.join("\n"),
  };
}

function mapPowerSyncColumnType(columnType: string): string {
  switch (columnType) {
    case "text":
      return "string";
    case "integer":
      return "number";
    case "real":
      return "number";
    case "blob":
      return "Uint8Array";
    default:
      return "unknown";
  }
}

function toPascal(value: string): string {
  return value
    .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) =>
      c ? c.toUpperCase() : ""
    )
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

function toCamel(value: string): string {
  const p = toPascal(value);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function toPlural(value: string): string {
  if (value.endsWith("s")) return value;
  if (value.endsWith("y")) return value.slice(0, -1) + "ies";
  return `${value}s`;
}

function toUpperSnake(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toUpperCase();
}

function indent(value: string, spaces: number): string {
  const pad = " ".repeat(spaces);

  return value
    .split("\n")
    .map((line) => pad + line.trim())
    .join("\n");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}