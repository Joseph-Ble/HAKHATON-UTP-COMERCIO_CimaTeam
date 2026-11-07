// Optional, explicit setup for a NEW example project. Never run on a live community.
import { createClient } from "@supabase/supabase-js";
import { createSeed, IDS, SEED_PASSWORD } from "../src/data/seed.js";
if (!process.argv.includes("--examples"))
  throw new Error(
    "Usa --examples solamente en un proyecto Supabase nuevo de pruebas.",
  );
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret)
  throw new Error(
    "Configura URL y SUPABASE_SECRET_KEY en el entorno local. No incluyas la clave secreta en el APK.",
  );
const client = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: existing, error: checkError } = await client
  .from("businesses")
  .select("id")
  .limit(1);
if (checkError) throw new Error(checkError.message);
if (existing.length)
  throw new Error(
    "Se detuvo la carga: el proyecto ya contiene negocios. No se sobrescribirán sus datos.",
  );
const mapping = new Map();
for (const [oldId, email, name] of [
  [IDS.ana, "ana@vecinos.example", "Ana Torres"],
  [IDS.luis, "luis@vecinos.example", "Luis Mendoza"],
  [IDS.mod, "comunidad@vecinos.example", "Equipo de comunidad"],
]) {
  const { data, error } = await client.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { name, barrio_id: "san-miguel" },
  });
  if (error) throw new Error(error.message);
  mapping.set(oldId, data.user.id);
}
const seed = createSeed();
for (const table of ["businesses", "posts", "reviews", "offers"]) {
  const rows = seed[table].map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, mapping.get(v) || v]),
    ),
  );
  const { error } = await client.from(table).insert(rows);
  if (error) throw new Error(`Error al cargar ${table}: ${error.message}`);
}
const { error } = await client
  .from("user_roles")
  .insert({ user_id: mapping.get(IDS.mod), role: "moderator" });
if (error) throw new Error(error.message);
console.log(
  "Cargados perfiles, negocios, publicaciones y coordinación de ejemplo. Las cuentas están documentadas en README.",
);
