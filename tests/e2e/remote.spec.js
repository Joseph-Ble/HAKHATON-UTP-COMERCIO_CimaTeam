import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { createTestDatabase } from "../helpers/database.js";
import { IDS } from "../../src/data/seed.js";

// Exercise the real Supabase SDK/read adapter against a local test database.
// The .test host is intercepted; no request or credential goes to a real service.
test.describe("remote adapter with simulated Auth and real PostgreSQL reads", () => {
  test.skip(
    !process.env.VECINOS_REMOTE_TEST_URL,
    "Build/serve the synthetic remote test bundle to run this suite.",
  );
  let db, queue, calls;
  const user = {
    id: IDS.luis,
    aud: "authenticated",
    role: "authenticated",
    email: "luis@vecinos.example",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    created_at: "2026-10-20T15:00:00Z",
  };
  const token = () =>
    [
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      Buffer.from(
        JSON.stringify({
          sub: user.id,
          aud: "authenticated",
          role: "authenticated",
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString("base64url"),
      "synthetic-not-a-real-signature",
    ].join(".");
  test.beforeEach(async ({ page }) => {
    ({ db } = await createTestDatabase({ extraBusinesses: 515 }));
    queue = Promise.resolve();
    calls = [];
    await page.route("https://supabase.example.test/**", async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      calls.push({ path: url.pathname, method: req.method() });
      const headers = {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
      };
      if (req.method() === "OPTIONS")
        return route.fulfill({ status: 204, headers });
      const session = {
        access_token: token(),
        refresh_token: "synthetic-refresh-only",
        token_type: "bearer",
        expires_in: 3600,
        user,
      };
      if (url.pathname === "/auth/v1/recover")
        return route.fulfill({ status: 200, headers, body: "{}" });
      if (url.pathname === "/auth/v1/token")
        return route.fulfill({
          status: 200,
          headers,
          body: JSON.stringify(session),
        });
      if (url.pathname === "/auth/v1/user")
        return route.fulfill({
          status: 200,
          headers,
          body: JSON.stringify(user),
        });
      if (url.pathname === "/auth/v1/logout")
        return route.fulfill({ status: 204, headers });
      const command = url.pathname.split("/").at(-1);
      if (
        !["get_context", "get_listing", "get_item", "app_command"].includes(
          command,
        )
      )
        return route.fulfill({
          status: 404,
          headers,
          body: JSON.stringify({ message: "Unknown test route" }),
        });
      const args = req.postDataJSON() || {};
      const signed =
        req.headers().authorization === `Bearer ${token()}` ||
        req.headers().authorization?.includes("synthetic-not-a-real-signature");
      const operation = queue.then(async () => {
        await db.exec("reset role");
        await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
          signed ? IDS.luis : "",
        ]);
        await db.exec(`set role ${signed ? "authenticated" : "anon"}`);
        let sql, values;
        if (command === "get_context") {
          sql = "select public.get_context($1) as data";
          values = [args.zone];
        }
        if (command === "get_listing") {
          sql = "select public.get_listing($1,$2::jsonb,$3,$4) as data";
          values = [
            args.item_scope,
            JSON.stringify(args.filters),
            args.page_index,
            args.page_size,
          ];
        }
        if (command === "get_item") {
          sql = "select public.get_item($1,$2,$3) as data";
          values = [args.item_scope, args.item_id, args.zone];
        }
        if (command === "app_command") {
          sql = "select public.app_command($1,$2::jsonb) as data";
          values = [args.action_name, JSON.stringify(args.payload)];
        }
        return (await db.query(sql, values)).rows[0].data;
      });
      queue = operation.catch(() => {});
      try {
        return await route.fulfill({
          status: 200,
          headers,
          body: JSON.stringify(await operation),
        });
      } catch (e) {
        return await route.fulfill({
          status: 400,
          headers,
          body: JSON.stringify({ message: e.message }),
        });
      }
    });
  });
  test.afterEach(async () => {
    await queue;
    await db?.close();
  });
  test("search, pagination and direct access reach items beyond the initial home feed", async ({
    page,
  }) => {
    await page.goto(`${process.env.VECINOS_REMOTE_TEST_URL}/local`);
    await expect(
      page.getByRole("button", { name: "Ver más resultados", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Ver más resultados", exact: true })
      .click();
    await expect(page.getByText(/48 negocios/)).toBeVisible();
    await page
      .getByLabel("Buscar", { exact: true })
      .fill("Servicio remoto 515");
    await page
      .getByRole("button", { name: "Servicio remoto 515", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Servicio remoto 515" }),
    ).toBeVisible();
    const hex = createHash("md5").update("remote-extra-515").digest("hex");
    const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    await page.goto(`${process.env.VECINOS_REMOTE_TEST_URL}/ficha/${id}`);
    await expect(
      page.getByRole("heading", { name: "Servicio remoto 515" }),
    ).toBeVisible();
    expect(calls.some((c) => c.path.endsWith("/get_item"))).toBeTruthy();
  });
  test("password recovery exchanges a code, updates the password and signs out", async ({
    page,
  }) => {
    await page.goto(`${process.env.VECINOS_REMOTE_TEST_URL}/cuenta`);
    await page.getByLabel("Correo electrónico").fill("luis@vecinos.example");
    await page
      .getByRole("button", { name: "Recuperar contraseña", exact: true })
      .click();
    await expect(
      page.getByText(/recibirás instrucciones para cambiar/),
    ).toBeVisible();
    await page.goto(
      `${process.env.VECINOS_REMOTE_TEST_URL}/recuperar?code=synthetic-example-code`,
    );
    await page
      .getByLabel("Nueva contraseña", { exact: true })
      .fill("ClaveDePruebaExclusiva2026!");
    await page
      .getByLabel("Confirma la nueva contraseña")
      .fill("ClaveDePruebaExclusiva2026!");
    await page
      .getByRole("button", { name: "Guardar nueva contraseña", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Qué bueno verte por aquí" }),
    ).toBeVisible();
    expect(
      calls.some((c) => c.path === "/auth/v1/user" && c.method === "PUT"),
    ).toBeTruthy();
    expect(calls.some((c) => c.path === "/auth/v1/logout")).toBeTruthy();
    expect(page.url()).not.toContain("code=");
  });
});
