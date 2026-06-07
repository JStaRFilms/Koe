import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "../..");
const envPath = path.join(workspaceRoot, ".env.local");
const migrationsPath = path.resolve(__dirname, "../db/migrations");

function loadEnv(filePath) {
  const values = {};
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function quoteIdent(name) {
  return `"${String(name).replaceAll("\"", "\"\"")}"`;
}

function splitSql(sqlText) {
  const statements = [];
  let current = "";
  let single = false;
  let double = false;
  let dollarTag = null;

  for (let i = 0; i < sqlText.length; i += 1) {
    const ch = sqlText[i];
    const next = sqlText[i + 1];

    if (!single && !double && !dollarTag && ch === "-" && next === "-") {
      while (i < sqlText.length && sqlText[i] !== "\n") current += sqlText[i++];
      if (i < sqlText.length) current += sqlText[i];
      continue;
    }

    if (!single && !double && !dollarTag && ch === "/" && next === "*") {
      current += ch + next;
      i += 2;
      while (i < sqlText.length && !(sqlText[i] === "*" && sqlText[i + 1] === "/")) current += sqlText[i++];
      if (i < sqlText.length) {
        current += sqlText[i] + sqlText[i + 1];
        i += 1;
      }
      continue;
    }

    if (!single && !double && ch === "$") {
      const match = sqlText.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (match) {
        const tag = match[0];
        current += tag;
        i += tag.length - 1;
        if (dollarTag === tag) dollarTag = null;
        else if (!dollarTag) dollarTag = tag;
        continue;
      }
    }

    if (!double && !dollarTag && ch === "'" && !single) single = true;
    else if (single && ch === "'" && next === "'") {
      current += ch + next;
      i += 1;
      continue;
    } else if (single && ch === "'") single = false;
    else if (!single && !dollarTag && ch === "\"") double = !double;

    if (!single && !double && !dollarTag && ch === ";") {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      continue;
    }

    current += ch;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function tableCounts(sql) {
  const tables = await sql`select tablename from pg_tables where schemaname = 'public' order by tablename`;
  const counts = [];
  for (const { tablename } of tables) {
    const ident = `${quoteIdent("public")}.${quoteIdent(tablename)}`;
    const rows = await sql.query(`select count(*)::int as count from ${ident}`);
    counts.push({ table: tablename, rows: rows[0].count });
  }
  return counts;
}

async function main() {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing ${envPath}`);
  }

  const env = loadEnv(envPath);
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from root .env.local");
  }

  const url = new URL(env.DATABASE_URL);
  const sql = neon(env.DATABASE_URL);
  const tables = await sql`select tablename from pg_tables where schemaname = 'public' order by tablename`;

  console.log(`Clearing ${url.pathname.slice(1)} on ${url.host}...`);
  if (tables.length > 0) {
    const tableList = tables.map(({ tablename }) => `${quoteIdent("public")}.${quoteIdent(tablename)}`).join(", ");
    await sql.query(`truncate table ${tableList} restart identity cascade`);
  }

  const migrations = fs.readdirSync(migrationsPath).filter((name) => name.endsWith(".sql")).sort();
  let applied = 0;
  for (const name of migrations) {
    const statements = splitSql(fs.readFileSync(path.join(migrationsPath, name), "utf8"));
    for (const statement of statements) {
      await sql.query(statement);
      applied += 1;
    }
  }

  console.log(`Replayed ${applied} migration statements.`);
  console.table(await tableCounts(sql));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
