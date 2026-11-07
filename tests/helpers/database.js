import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createSeed } from "../../src/data/seed.js";

export async function createTestDatabase({ extraBusinesses = 0 } = {}) {
  const db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth,public to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`,
  );
  const directory = new URL("../../supabase/migrations/", import.meta.url);
  for (const name of (await fs.readdir(directory))
    .filter((n) => n.endsWith(".sql"))
    .sort())
    await db.exec(await fs.readFile(new URL(name, directory), "utf8"));
  const seed = createSeed();
  for (const p of seed.profiles)
    await db.query(
      "insert into auth.users(id,raw_user_meta_data) values($1,$2::jsonb)",
      [p.id, JSON.stringify({ ...p, role: "moderator" })],
    );
  for (const table of [
    "user_roles",
    "businesses",
    "posts",
    "reviews",
    "offers",
  ]) {
    for (const row of table === "user_roles" ? seed.roles : seed[table]) {
      const entries = Object.entries(row);
      await db.query(
        `insert into public.${table}(${entries.map(([k]) => k).join(",")}) values(${entries.map((_, i) => "$" + (i + 1)).join(",")})`,
        entries.map(([, v]) => v),
      );
    }
  }
  if (extraBusinesses)
    await db.query(
      `insert into public.businesses(id,author_id,barrio_id,title,description,category,area,hours,created_at) select md5('remote-extra-'||n)::uuid,$1,'san-miguel','Servicio remoto '||n,'Mantenimiento y apoyo para pequeños arreglos en el barrio.','home','Sector del parque','De lunes a sábado',now()-n*interval '1 day' from generate_series(1,$2::integer) n`,
      [seed.profiles[0].id, extraBusinesses],
    );
  return { db, seed };
}
