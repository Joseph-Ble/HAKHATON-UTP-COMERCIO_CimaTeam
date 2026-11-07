import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createSeed, IDS } from "../src/data/seed.js";

test("PostgreSQL migration, RPC and RLS enforce the security boundary", async (t) => {
  const db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key, raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth,public to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`,
  );
  await db.exec(
    await fs.readFile(
      new URL(
        "../supabase/migrations/202611070001_initial.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await fs.readFile(
      new URL(
        "../supabase/migrations/202611070002_editorial.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
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
    const rows = table === "user_roles" ? seed.roles : seed[table];
    for (const row of rows) {
      const entries = Object.entries(row);
      await db.query(
        `insert into public.${table}(${entries.map(([k]) => k).join(",")}) values(${entries.map((_, i) => "$" + (i + 1)).join(",")})`,
        entries.map(([, v]) => v),
      );
    }
  }
  const as = async (id) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      id || "",
    ]);
    await db.exec(`set role ${id ? "authenticated" : "anon"}`);
  };
  const rpc = async (action, payload) => {
    const r = await db.query("select public.app_command($1,$2::jsonb) as id", [
      action,
      JSON.stringify(payload),
    ]);
    return r.rows[0].id;
  };
  const rows = async (sql) => (await db.query(sql)).rows;
  let businessId, helpId, offerId;
  await t.test(
    "visitors read public data but no private offers, contacts, roles or reports",
    async () => {
      await as(null);
      assert.equal((await rows("select * from public.businesses")).length, 4);
      for (const table of ["offers", "contacts", "user_roles", "reports"])
        assert.equal((await rows("select * from public." + table)).length, 0);
      assert.ok(!(await rows("select * from public.profiles"))[0].email);
      assert.equal((await rows("select * from public.guidance")).length, 3);
      assert.equal((await rows("select * from public.services")).length, 2);
      await assert.rejects(() =>
        rpc("update_profile", { name: "Intruso", barrio_id: "san-miguel" }),
      );
    },
  );
  await t.test(
    "authenticated users cannot edit tables directly or self-assign roles",
    async () => {
      await as(IDS.luis);
      await assert.rejects(
        () =>
          db.query(
            "insert into public.user_roles(user_id,role) values($1,$2)",
            [IDS.luis, "moderator"],
          ),
        /permission denied/,
      );
      await assert.rejects(
        () => db.exec("update public.profiles set name='Intruso'"),
        /permission denied/,
      );
      await assert.rejects(
        () =>
          rpc("moderate", {
            scope: "business",
            id: seed.businesses[0].id,
            visibility: "hidden",
          }),
        /moderación/,
      );
    },
  );
  await t.test(
    "author is derived from session and another user cannot modify resource",
    async () => {
      await as(IDS.ana);
      businessId = await rpc("save_business", {
        data: {
          ...seed.businesses[0],
          title: "Nuevo negocio vecinal",
          author_id: IDS.luis,
        },
        contact: { consent: true, channel: "email", value: "ana@example.test" },
      });
      assert.equal(
        (
          await rows(
            `select author_id from public.businesses where id='${businessId}'`,
          )
        )[0].author_id,
        IDS.ana,
      );
      await as(IDS.luis);
      await assert.rejects(
        () =>
          rpc("status", {
            scope: "business",
            id: businessId,
            status: "inactive",
          }),
        /propias/,
      );
      assert.equal((await rows("select * from public.contacts")).length, 1);
      await as(null);
      assert.equal((await rows("select * from public.contacts")).length, 0);
    },
  );
  await t.test(
    "database checks rating uniqueness, range, self-rating and historical barrio",
    async () => {
      await as(IDS.ana);
      await assert.rejects(
        () =>
          rpc("review", {
            scope: "business",
            id: businessId,
            data: { rating: 5 },
          }),
        /propia/,
      );
      await as(IDS.luis);
      await assert.rejects(
        () =>
          rpc("review", {
            scope: "business",
            id: businessId,
            data: { rating: 6 },
          }),
        /check constraint/,
      );
      await rpc("review", {
        scope: "business",
        id: businessId,
        data: { rating: 4, recommends: true, barrio_id: "pueblo-libre" },
      });
      await assert.rejects(
        () =>
          rpc("review", {
            scope: "business",
            id: businessId,
            data: { rating: 5 },
          }),
        /Ya registraste/,
      );
      const review = (
        await rows(
          `select * from public.reviews where entity_id='${businessId}'`,
        )
      )[0];
      assert.equal(review.barrio_id, "san-miguel");
    },
  );
  await t.test(
    "request, offer, private reply and closure preserve a real state history",
    async () => {
      await as(IDS.ana);
      helpId = await rpc("save_post", {
        data: {
          ...seed.posts[7],
          title: "Solicitud de apoyo preventivo",
          occurred_at: "2026-10-20T15:00:00Z",
        },
      });
      await assert.rejects(
        () => rpc("offer", { id: helpId, message: "Quiero ayudar" }),
        /propia/,
      );
      await as(IDS.luis);
      offerId = await rpc("offer", {
        id: helpId,
        message: "Puedo colaborar con los materiales.",
      });
      await assert.rejects(
        () => rpc("offer", { id: helpId, message: "Puedo colaborar otra vez" }),
        /Ya enviaste/,
      );
      await assert.rejects(
        () => rpc("status", { scope: "post", id: helpId, status: "served" }),
        /propias/,
      );
      await as(IDS.mod);
      assert.ok(
        !(await rows("select * from public.offers")).some(
          (o) => o.id === offerId,
        ),
      );
      await as(IDS.ana);
      await rpc("reply_offer", {
        id: offerId,
        status: "accepted",
        reply: "Coordinemos una actividad segura.",
      });
      await rpc("status", { scope: "post", id: helpId, status: "served" });
      assert.equal(
        (await rows(`select status from public.posts where id='${helpId}'`))[0]
          .status,
        "served",
      );
      assert.equal(
        (await rows(`select * from public.history where entity_id='${helpId}'`))
          .length,
        3,
      );
      await assert.rejects(
        () => rpc("status", { scope: "post", id: helpId, status: "open" }),
        /no está permitido/,
      );
    },
  );
  await t.test(
    "pending and hidden security reports are protected, including edits and direct reads",
    async () => {
      await as(IDS.ana);
      const data = {
        ...seed.posts[5],
        status: "active",
        title: "Reporte para revisión vecinal",
      };
      const id = await rpc("save_post", { data });
      await as(IDS.luis);
      assert.equal(
        (await rows(`select * from public.posts where id='${id}'`)).length,
        0,
      );
      await as(IDS.mod);
      await rpc("moderate", { scope: "post", id, visibility: "visible" });
      await as(IDS.luis);
      assert.equal(
        (await rows(`select * from public.posts where id='${id}'`)).length,
        1,
      );
      await rpc("report", {
        scope: "post",
        id,
        reason: "Hay información que requiere una revisión.",
      });
      await as(IDS.mod);
      await rpc("moderate", { scope: "post", id, visibility: "hidden" });
      await as(IDS.ana);
      await rpc("save_post", { id, data });
      assert.equal(
        (await rows(`select visibility from public.posts where id='${id}'`))[0]
          .visibility,
        "hidden",
      );
      await as(IDS.luis);
      assert.equal(
        (await rows(`select * from public.posts where id='${id}'`)).length,
        0,
      );
    },
  );
  await t.test(
    "invalid contact rolls back a publication, and revoke removes access",
    async () => {
      await as(IDS.ana);
      const before = (await rows("select * from public.businesses")).length;
      await assert.rejects(
        () =>
          rpc("save_business", {
            data: { ...seed.businesses[0], title: "No debe quedar guardado" },
            contact: { consent: true, channel: "whatsapp", value: "invalid" },
          }),
        /contacto/,
      );
      assert.equal(
        (await rows("select * from public.businesses")).length,
        before,
      );
      await rpc("revoke_contact", { scope: "business", id: businessId });
      await as(IDS.luis);
      assert.equal((await rows("select * from public.contacts")).length, 0);
    },
  );
  await t.test(
    "editorial permissions and profile updates do not grant authority",
    async () => {
      await as(IDS.luis);
      await rpc("update_profile", {
        name: "Luis Mendoza",
        barrio_id: "pueblo-libre",
        role: "moderator",
      });
      assert.equal((await rows("select * from public.user_roles")).length, 0);
      await assert.rejects(
        () => rpc("save_guidance", { data: seed.guidance[0] }),
        /editoriales/,
      );
      await as(IDS.mod);
      const id = await rpc("save_guidance", {
        data: { ...seed.guidance[0], title: "Nueva orientación institucional" },
      });
      assert.ok(id);
    },
  );
  await db.close();
});
