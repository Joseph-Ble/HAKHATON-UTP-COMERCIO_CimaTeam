import { test, expect } from "@playwright/test";
const login = async (page, name) => {
  await page.goto("/ajustes");
  await page.getByRole("button", { name, exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Lo que compartimos" }),
  ).toBeVisible();
};
const fillBasic = async (page, title) => {
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page
    .getByLabel("Descripción", { exact: true })
    .fill(
      "Publicación de ejemplo para comprobar una coordinación respetuosa entre vecinos.",
    );
  await page
    .getByLabel("Referencia aproximada")
    .fill("Sector del parque central");
};
test("A01–A03: public browsing, search, neighborhoods and a mobile layout", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("¿Qué hacemos hoy?")).toBeVisible();
  await expect(page.getByText("Demo", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Ver negocios ↗" }).click();
  await page.getByLabel("Buscar", { exact: true }).fill("gasfitero");
  await expect(
    page.getByRole("button", { name: "Manos a la obra", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "La tiendita de Ana", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "San Miguel TU COMUNIDAD" }).click();
  await page
    .getByRole("button", { name: "Pueblo Libre · Lima", exact: true })
    .click();
  await page.getByLabel("Buscar", { exact: true }).fill("");
  await expect(
    page.getByRole("button", { name: "Aula Compartida", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Mi cuenta", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/inicio-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("A04–A05/A14: business ownership, review, reporting and moderation", async ({
  page,
}) => {
  await login(page, "Ana Torres");
  await page.goto("/crear?scope=business");
  await page
    .getByLabel("Nombre del negocio o servicio")
    .fill("Taller del Parque");
  await page
    .getByLabel("Productos y servicios")
    .fill("Gasfitería, carpintería y mantenimiento de muebles para el barrio.");
  await page.getByLabel("Referencia aproximada").fill("Alrededores del parque");
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Taller del Parque" }),
  ).toBeVisible();
  const url = page.url();
  await expect(
    page.getByRole("button", { name: "Editar información", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Valorar mi experiencia", exact: true }),
  ).toHaveCount(0);
  await login(page, "Luis Mendoza");
  await page.goto(url);
  await expect(
    page.getByRole("button", { name: "Editar información", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Valorar mi experiencia", exact: true })
    .click();
  await page.getByRole("button", { name: "4 estrellas", exact: true }).click();
  await page
    .getByLabel("Cuéntanos tu experiencia (opcional)")
    .fill("Atención muy clara y cercana.");
  await page
    .getByRole("button", { name: "Guardar valoración", exact: true })
    .click();
  await expect(page.getByText("Atención muy clara y cercana.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Valorar mi experiencia", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Atención muy clara y cercana.")).toBeVisible();
  await page
    .getByRole("button", { name: "Reportar contenido", exact: true })
    .click();
  await page
    .getByLabel("Motivo del reporte")
    .fill("Necesita una revisión del contenido.");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await login(page, "Equipo de comunidad");
  await page.goto("/moderacion");
  await expect(
    page.getByText("Taller del Parque", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ocultar", exact: true }).click();
  await login(page, "Luis Mendoza");
  await page.goto(url);
  await expect(
    page.getByText("Esta publicación no está disponible", { exact: true }),
  ).toBeVisible();
});
test("A12–A13: create help, offer, accept, reply and close with persisted history", async ({
  page,
}) => {
  await login(page, "Ana Torres");
  await page.goto(
    "/crear?scope=post&module=emergency&category=nature&type=help",
  );
  await fillBasic(page, "Apoyo para organizar materiales");
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Apoyo para organizar materiales" }),
  ).toBeVisible();
  const url = page.url();
  await expect(page.getByText(/Reporte vecinal no verificado/)).toBeVisible();
  await login(page, "Luis Mendoza");
  await page.goto(url);
  await page
    .getByRole("button", { name: "Ofrecer ayuda", exact: true })
    .click();
  await page
    .getByLabel("Tu mensaje")
    .fill("Puedo ayudar a ordenar libros durante una hora.");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(
    page.getByText("Puedo ayudar a ordenar libros durante una hora.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ofrecer ayuda", exact: true }),
  ).toHaveCount(0);
  await login(page, "Ana Torres");
  await page.goto(url);
  await page
    .getByLabel("Respuesta para coordinar (opcional)")
    .fill("Gracias. Coordinemos aquí los materiales que vamos a preparar.");
  await page
    .getByRole("button", { name: "Aceptar ayuda", exact: true })
    .click();
  await expect(page.getByText("Aceptada", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Marcar como atendida", exact: true })
    .click();
  await expect(page.getByText("Atendida", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Historial de estado", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/ayuda-atendida.png",
    fullPage: true,
  });
  await login(page, "Luis Mendoza");
  await page.goto(url);
  await expect(page.getByText(/Coordinemos aquí los materiales/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ofrecer ayuda", exact: true }),
  ).toHaveCount(0);
});
test("A06–A09: sell, buy, swap and free help plus solidarity review", async ({
  page,
}) => {
  await login(page, "Ana Torres");
  let swapURL;
  for (const [type, title] of [
    ["sell", "Silla de madera para compartir"],
    ["buy", "Busco repostero de madera"],
    ["swap", "Beterragas por espinacas del huerto"],
    ["free", "Necesito una escalera por la tarde"],
  ]) {
    await page.goto(`/crear?scope=post&module=solidarity&type=${type}`);
    await fillBasic(page, title);
    if (type === "swap") {
      await page.getByLabel("¿Qué ofreces?").fill("Un kilo de beterragas");
      await page
        .getByLabel("¿Qué quieres recibir?")
        .fill("Un atado de espinacas");
    }
    await page.getByRole("button", { name: "Publicar", exact: true }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    if (type === "swap") swapURL = page.url();
  }
  await page.goto(swapURL);
  await page
    .getByRole("button", { name: "Marcar como finalizada", exact: true })
    .click();
  await login(page, "Luis Mendoza");
  await page.goto(swapURL);
  await page
    .getByRole("button", { name: "Valorar mi experiencia", exact: true })
    .click();
  await page
    .getByLabel("Cuéntanos tu experiencia (opcional)")
    .fill("Un intercambio amable entre vecinos.");
  await page
    .getByRole("button", { name: "Guardar valoración", exact: true })
    .click();
  await expect(
    page.getByText("Un intercambio amable entre vecinos."),
  ).toBeVisible();
  await page.goto("/solidaria?tipo=free");
  await expect(
    page.getByRole("button", {
      name: "Necesito una escalera por la tarde",
      exact: true,
    }),
  ).toBeVisible();
});
test("A10–A11/A17: official content precedes reports and emergencies have no stars", async ({
  page,
}) => {
  for (const category of ["security", "nature"]) {
    await page.goto(`/emergencias?categoria=${category}`);
    await expect(
      page.getByText("Información institucional", { exact: true }),
    ).toBeVisible();
    const source = await page
      .getByText("Información institucional", { exact: true })
      .boundingBox();
    const reports = await page
      .getByText("Lo que comparte la comunidad", { exact: true })
      .boundingBox();
    expect(source.y).toBeLessThan(reports.y);
    await expect(page.getByRole("button", { name: /estrellas/ })).toHaveCount(
      0,
    );
    await expect(
      page
        .getByRole("button", { name: "Consultar fuente original", exact: true })
        .first(),
    ).toBeVisible();
  }
  await page.goto("/directorio");
  await expect(
    page.getByText("Policía Nacional del Perú", { exact: true }),
  ).toBeVisible();
});
test("registration, login persistence, author edits and safe input errors", async ({
  page,
}) => {
  await page.goto("/cuenta");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await page.getByLabel("Nombre visible", { exact: true }).fill("Carla Vecina");
  await page.getByLabel("Correo electrónico").fill("carla@example.test");
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("UnaClaveExclusiva2026!");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Crear mi cuenta", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Lo que compartimos" }),
  ).toBeVisible();
  await page.reload();
  await page.goto("/cuenta");
  await expect(page.getByText("Carla Vecina", { exact: true })).toBeVisible();
  await page.goto("/crear?scope=business");
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(
    page.getByText("Escribe al menos 3 caracteres.", { exact: true }),
  ).toBeVisible();
});
