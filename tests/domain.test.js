import test from "node:test";
import assert from "node:assert/strict";
import { createSeed, IDS } from "../src/data/seed.js";
import { applyCommand, publicSnapshot } from "../src/core/domain.js";
import { matches, reviewStats } from "../src/core/catalog.js";
const BUSINESS = "20000000-0000-4000-8000-000000000003";
const HELP = "30000000-0000-4000-8000-000000000008";
const SELL = "30000000-0000-4000-8000-000000000001";
const run = (state, user, action, payload) =>
  applyCommand(state, user, { action, payload });

test("public navigation data includes all four solidarity types and both emergency categories", () => {
  const state = publicSnapshot(createSeed(), null);
  assert.deepEqual(
    [
      ...new Set(
        state.posts.filter((p) => p.module === "solidarity").map((p) => p.type),
      ),
    ].sort(),
    ["buy", "free", "sell", "swap"],
  );
  assert.deepEqual(
    [
      ...new Set(
        state.posts
          .filter((p) => p.module === "emergency")
          .map((p) => p.category),
      ),
    ].sort(),
    ["nature", "security"],
  );
  assert.equal(state.offers.length, 0);
  assert.equal(state.roles.length, 0);
  assert.ok(state.businesses.some((b) => matches(b, "gasfitero")));
});
test("visitor and another owner cannot mutate resources", () => {
  const state = createSeed();
  assert.throws(
    () =>
      run(state, null, "status", {
        scope: "business",
        id: BUSINESS,
        status: "inactive",
      }),
    /Inicia sesión/,
  );
  assert.throws(
    () =>
      run(state, IDS.luis, "status", {
        scope: "business",
        id: BUSINESS,
        status: "inactive",
      }),
    /propias/,
  );
  assert.equal(
    state.businesses.find((b) => b.id === BUSINESS).status,
    "active",
  );
});
test("one rating per business and author, with server-derived historical barrio", () => {
  let { state } = run(createSeed(), IDS.luis, "review", {
    scope: "business",
    id: BUSINESS,
    data: {
      rating: 4,
      comment: "Buen servicio",
      recommends: true,
      barrio_id: "pueblo-libre",
    },
  });
  assert.equal(state.reviews.at(-1).barrio_id, "san-miguel");
  assert.throws(
    () =>
      run(state, IDS.luis, "review", {
        scope: "business",
        id: BUSINESS,
        data: { rating: 5 },
      }),
    /Ya registraste/,
  );
  assert.throws(
    () =>
      run(state, IDS.ana, "review", {
        scope: "business",
        id: BUSINESS,
        data: { rating: 5 },
      }),
    /propia/,
  );
  const stats = reviewStats(state.reviews, "business", BUSINESS, "san-miguel");
  assert.equal(stats.local, 1);
  assert.equal(stats.average, 4);
  state = run(state, IDS.luis, "update_profile", {
    name: "Luis Mendoza",
    barrio_id: "pueblo-libre",
    role: "moderator",
  }).state;
  assert.equal(state.reviews.at(-1).barrio_id, "san-miguel");
  assert.equal(state.roles.length, 1);
});
test("cannot rate emergencies or incomplete solidarity experiences", () => {
  assert.throws(
    () =>
      run(createSeed(), IDS.luis, "review", {
        scope: "post",
        id: HELP,
        data: { rating: 5 },
      }),
    /finalizadas/,
  );
  assert.throws(
    () =>
      run(createSeed(), IDS.luis, "review", {
        scope: "post",
        id: SELL,
        data: { rating: 5 },
      }),
    /finalizadas/,
  );
  let { state } = run(createSeed(), IDS.ana, "status", {
    scope: "post",
    id: SELL,
    status: "completed",
  });
  state = run(state, IDS.luis, "review", {
    scope: "post",
    id: SELL,
    data: { rating: 5, comment: "Experiencia autodeclarada" },
  }).state;
  assert.equal(state.reviews.at(-1).rating, 5);
});
test("help offers have ownership, uniqueness, private replies and atomic history", () => {
  let state = createSeed();
  assert.throws(
    () => run(state, IDS.ana, "offer", { id: HELP, message: "Quiero ayudar" }),
    /propia/,
  );
  assert.throws(
    () => run(state, IDS.luis, "offer", { id: HELP, message: "Quiero ayudar" }),
    /Ya enviaste/,
  );
  const offer = state.offers[0];
  assert.equal(publicSnapshot(state, IDS.mod).offers.length, 0);
  state = run(state, IDS.ana, "reply_offer", {
    id: offer.id,
    status: "accepted",
    reply: "Coordinemos los materiales por aquí.",
  }).state;
  assert.equal(state.posts.find((p) => p.id === HELP).status, "coordinating");
  assert.equal(state.history.at(-1).to_status, "coordinating");
  assert.throws(
    () =>
      run(state, IDS.luis, "status", {
        scope: "post",
        id: HELP,
        status: "served",
      }),
    /propias/,
  );
  state = run(state, IDS.ana, "status", {
    scope: "post",
    id: HELP,
    status: "served",
  }).state;
  assert.throws(
    () => run(state, IDS.mod, "offer", { id: HELP, message: "Puedo ayudar" }),
    /ya no recibe/,
  );
  assert.throws(
    () =>
      run(state, IDS.ana, "status", {
        scope: "post",
        id: HELP,
        status: "open",
      }),
    /no está permitido/,
  );
});
test("security edits return to review and cannot undo moderator hiding", () => {
  const payload = {
    data: {
      title: "Información sobre iluminación",
      description: "Se observó una luminaria apagada en la zona pública.",
      module: "emergency",
      type: "report",
      category: "security",
      barrio_id: "san-miguel",
      area: "Zona del parque",
      occurred_at: "2026-10-20T12:00:00Z",
    },
  };
  let { state, result: id } = run(createSeed(), IDS.ana, "save_post", payload);
  assert.equal(state.posts.at(-1).visibility, "pending");
  assert.ok(!publicSnapshot(state, IDS.luis).posts.some((p) => p.id === id));
  assert.throws(
    () =>
      run(state, IDS.luis, "moderate", {
        scope: "post",
        id,
        visibility: "visible",
      }),
    /moderación/,
  );
  state = run(state, IDS.mod, "moderate", {
    scope: "post",
    id,
    visibility: "visible",
  }).state;
  assert.ok(publicSnapshot(state, IDS.luis).posts.some((p) => p.id === id));
  state = run(state, IDS.mod, "moderate", {
    scope: "post",
    id,
    visibility: "hidden",
  }).state;
  state = run(state, IDS.ana, "save_post", { ...payload, id }).state;
  assert.equal(state.posts.at(-1).visibility, "hidden");
});
test("contacts are explicitly consented, never exposed to visitors and revocable", () => {
  const b = createSeed().businesses.find((b) => b.id === BUSINESS);
  let { state } = run(createSeed(), IDS.ana, "save_business", {
    id: BUSINESS,
    data: b,
    contact: { consent: true, channel: "email", value: "ana@example.test" },
  });
  assert.equal(publicSnapshot(state, null).contacts.length, 0);
  assert.equal(publicSnapshot(state, IDS.luis).contacts.length, 1);
  state = run(state, IDS.ana, "revoke_contact", {
    scope: "business",
    id: BUSINESS,
  }).state;
  assert.equal(state.contacts.length, 0);
});
test("a failed operation leaves state untouched, including contact and history", () => {
  const state = createSeed(),
    before = JSON.stringify(state);
  assert.throws(
    () =>
      run(state, IDS.ana, "save_business", {
        id: BUSINESS,
        data: state.businesses[2],
        contact: { consent: true, channel: "whatsapp", value: "invalid" },
      }),
    /contacto/,
  );
  assert.equal(JSON.stringify(state), before);
});
test("private proposals allow coordination without external contact", () => {
  let { state, result } = run(createSeed(), IDS.luis, "request_contact", {
    scope: "post",
    id: SELL,
    message: "Me interesa, ¿podemos coordinar por aquí?",
  });
  assert.equal(publicSnapshot(state, IDS.mod).responses.length, 0);
  state = run(state, IDS.ana, "reply_contact", {
    id: result,
    reply: "Sí, podemos acordar una hora por este medio.",
  }).state;
  assert.ok(publicSnapshot(state, IDS.luis).responses[0].reply);
});
test("free help validates intent, modality and absence of money", () => {
  const p = {
    title: "Necesito una herramienta",
    description: "Necesito una escalera por una tarde y la devolveré.",
    module: "solidarity",
    type: "free",
    category: "hardware",
    barrio_id: "san-miguel",
    area: "Zona del parque",
    price: 10,
    intent: "need",
    help_kind: "loan",
  };
  assert.throws(
    () => run(createSeed(), IDS.luis, "save_post", { data: p }),
    /no lleva precio/,
  );
  const { state } = run(createSeed(), IDS.luis, "save_post", {
    data: { ...p, price: null },
  });
  assert.equal(state.posts.at(-1).type, "free");
});
test("retiring preserves records but removes them from views and contact lookup", () => {
  const { state } = run(createSeed(), IDS.ana, "retire", {
    scope: "business",
    id: BUSINESS,
  });
  assert.ok(state.businesses.find((b) => b.id === BUSINESS).deleted_at);
  assert.ok(
    !publicSnapshot(state, IDS.luis).businesses.some((b) => b.id === BUSINESS),
  );
  assert.equal(state.history.at(-1).to_status, "retired");
});
