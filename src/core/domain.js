import { z } from "zod";
import { CATEGORIES, NEIGHBORHOODS, nextStates } from "./catalog.js";

const short = (min, max) =>
  z
    .string()
    .trim()
    .min(min, `Escribe al menos ${min} caracteres.`)
    .max(max, `Máximo ${max} caracteres.`);
const barrio = z.enum(NEIGHBORHOODS.map((n) => n.id));
export const accountSchema = z.object({
  name: short(2, 70),
  email: z
    .email("Revisa el correo electrónico.")
    .transform((s) => s.toLowerCase()),
  password: z.string().min(8, "Usa al menos 8 caracteres.").max(128),
  barrio_id: barrio,
});
export const businessSchema = z.object({
  title: short(3, 100),
  description: short(15, 1800),
  barrio_id: barrio,
  category: z.enum(CATEGORIES.map(([id]) => id)),
  area: short(3, 120),
  hours: short(3, 120),
});
export const postSchema = z
  .object({
    title: short(5, 100),
    description: short(15, 1800),
    barrio_id: barrio,
    area: short(3, 120),
    module: z.enum(["solidarity", "emergency"]),
    type: z.enum(["sell", "buy", "swap", "free", "report", "help"]),
    category: short(1, 30),
    price: z.union([z.number().min(0).max(9999999), z.null()]).default(null),
    offering: z.string().trim().max(300).default(""),
    requesting: z.string().trim().max(300).default(""),
    intent: z.enum(["need", "offer"]).nullable().default(null),
    help_kind: z.enum(["donation", "loan", "favor"]).nullable().default(null),
    occurred_at: z.iso.datetime().nullable().default(null),
  })
  .superRefine((d, ctx) => {
    const issue = (path, message) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (d.module === "emergency") {
      if (
        !["report", "help"].includes(d.type) ||
        !["security", "nature"].includes(d.category)
      )
        issue("type", "Selecciona un tipo de emergencia válido.");
      if (!d.occurred_at)
        issue(
          "occurred_at",
          "Indica la fecha y hora del hecho o de la necesidad.",
        );
      if (
        d.occurred_at &&
        new Date(d.occurred_at).getTime() > Date.now() + 60000
      )
        issue("occurred_at", "La fecha no puede estar en el futuro.");
    } else {
      if (
        !["sell", "buy", "swap", "free"].includes(d.type) ||
        !CATEGORIES.some(([id]) => id === d.category)
      )
        issue("type", "Selecciona una modalidad y categoría válidas.");
      if (d.type === "swap" && (!d.offering || !d.requesting))
        issue("offering", "Indica qué ofreces y qué buscas recibir.");
      if (d.type === "free" && (!d.intent || !d.help_kind || d.price !== null))
        issue(
          "intent",
          "La ayuda gratuita requiere intención y modalidad, y no lleva precio.",
        );
    }
  });
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(600).default(""),
  recommends: z.boolean().default(false),
});
export const guidanceSchema = z.object({
  title: short(5, 120),
  body: short(20, 2000),
  institution: short(2, 100),
  source_url: z
    .url()
    .refine((v) => v.startsWith("https://"), "La fuente debe usar HTTPS."),
  category: z.enum(["security", "nature"]),
  event: short(2, 60),
  reviewed_at: z.iso.date(),
  visible: z.boolean().default(true),
});
const messageSchema = short(5, 600);
export function check(condition, message) {
  if (!condition) throw new Error(message);
}
export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0].message);
  return result.data;
}
export const isModerator = (state, userId) =>
  state.roles.some((r) => r.user_id === userId && r.role === "moderator");
export function canRead(state, record, userId) {
  return (
    !!record &&
    !record.deleted_at &&
    (record.visibility === "visible" ||
      record.author_id === userId ||
      isModerator(state, userId))
  );
}
export function target(state, scope, id) {
  check(["business", "post"].includes(scope), "Recurso no válido.");
  const record = state[scope === "business" ? "businesses" : "posts"].find(
    (r) => r.id === id,
  );
  check(
    record && !record.deleted_at,
    "Esta publicación ya no está disponible.",
  );
  return record;
}
function saveContact(state, scope, record, contact, id, now) {
  state.contacts = state.contacts.filter(
    (c) => !(c.scope === scope && c.entity_id === record.id),
  );
  if (!contact?.consent) return;
  check(
    ["whatsapp", "email"].includes(contact.channel),
    "Selecciona un canal de contacto.",
  );
  const value = String(contact.value || "").trim();
  check(
    contact.channel === "email"
      ? z.email().safeParse(value).success
      : /^\+?[0-9]{8,15}$/.test(value),
    "Revisa el contacto: correo válido o teléfono internacional, sin espacios.",
  );
  state.contacts.push({
    id: id(),
    scope,
    entity_id: record.id,
    author_id: record.author_id,
    channel: contact.channel,
    value,
    consent_at: now,
  });
}

// Deterministic business rules shared by the local repository and meaningful tests.
// Remote mode enforces these rules again inside PostgreSQL, independently of this code.
export function applyCommand(input, userId, command, options = {}) {
  const state = JSON.parse(JSON.stringify(input));
  const id = options.id || (() => globalThis.crypto.randomUUID());
  const now = options.now || new Date().toISOString();
  const profile = state.profiles.find((u) => u.id === userId);
  check(profile, "Inicia sesión para continuar.");
  const p = command.payload || {};
  const mod = isModerator(state, userId);
  let result;
  const own = (r) =>
    check(
      r.author_id === userId,
      "Solo puedes modificar tus propias publicaciones.",
    );
  const event = (scope, record, from, to) =>
    state.history.push({
      id: id(),
      scope,
      entity_id: record.id,
      actor_id: userId,
      from_status: from,
      to_status: to,
      created_at: now,
    });
  switch (command.action) {
    case "save_business":
    case "save_post": {
      const scope = command.action === "save_business" ? "business" : "post";
      const values = parse(
        scope === "business" ? businessSchema : postSchema,
        p.data,
      );
      const list = state[scope === "business" ? "businesses" : "posts"];
      if (p.id) {
        const record = target(state, scope, p.id);
        own(record);
        if (scope === "post")
          check(
            values.type === record.type && values.module === record.module,
            "La modalidad no puede cambiarse después de publicar.",
          );
        // An author can never undo a moderator's hide. Security edits return to review.
        const visibility =
          record.visibility === "hidden"
            ? "hidden"
            : scope === "post" &&
                values.module === "emergency" &&
                values.category === "security"
              ? "pending"
              : record.visibility;
        Object.assign(record, values, { updated_at: now, visibility });
        saveContact(state, scope, record, p.contact, id, now);
        result = record.id;
      } else {
        const record = {
          ...values,
          id: id(),
          author_id: userId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
          is_example: false,
          visibility:
            values.module === "emergency" && values.category === "security"
              ? "pending"
              : "visible",
          status: values.type === "help" ? "open" : "active",
        };
        list.push(record);
        event(scope, record, null, record.status);
        saveContact(state, scope, record, p.contact, id, now);
        result = record.id;
      }
      break;
    }
    case "status": {
      const record = target(state, p.scope, p.id);
      own(record);
      check(
        nextStates(record, p.scope).includes(p.status),
        "Este cambio de estado no está permitido.",
      );
      event(p.scope, record, record.status, p.status);
      record.status = p.status;
      record.updated_at = now;
      if (["served", "cancelled"].includes(p.status))
        state.offers
          .filter((o) => o.post_id === record.id && o.status === "pending")
          .forEach((o) => {
            o.status = "rejected";
            o.updated_at = now;
          });
      result = record.id;
      break;
    }
    case "retire": {
      const record = target(state, p.scope, p.id);
      own(record);
      record.deleted_at = now;
      record.updated_at = now;
      event(p.scope, record, record.status, "retired");
      state.contacts = state.contacts.filter(
        (c) => !(c.scope === p.scope && c.entity_id === p.id),
      );
      result = record.id;
      break;
    }
    case "review": {
      const record = target(state, p.scope, p.id);
      check(
        canRead(state, record, userId) && record.visibility === "visible",
        "La publicación no está disponible para valorar.",
      );
      check(
        record.author_id !== userId,
        "No puedes valorar tu propia publicación.",
      );
      check(
        p.scope === "business" ||
          (record.module === "solidarity" && record.status === "completed"),
        "Solo puedes valorar experiencias solidarias finalizadas.",
      );
      check(
        !state.reviews.some(
          (r) =>
            r.scope === p.scope &&
            r.entity_id === p.id &&
            r.author_id === userId,
        ),
        "Ya registraste una valoración de esta publicación.",
      );
      const data = parse(reviewSchema, p.data);
      result = id();
      state.reviews.push({
        ...data,
        recommends: p.scope === "business" && data.recommends,
        id: result,
        scope: p.scope,
        entity_id: p.id,
        author_id: userId,
        barrio_id: profile.barrio_id,
        created_at: now,
      });
      break;
    }
    case "offer": {
      const record = target(state, "post", p.id);
      check(
        record.type === "help" &&
          record.visibility === "visible" &&
          ["open", "coordinating"].includes(record.status),
        "Esta solicitud ya no recibe ofertas de ayuda.",
      );
      check(
        record.author_id !== userId,
        "No puedes ofrecer ayuda a tu propia solicitud.",
      );
      check(
        !state.offers.some(
          (o) => o.post_id === p.id && o.volunteer_id === userId,
        ),
        "Ya enviaste una oferta para esta solicitud.",
      );
      result = id();
      state.offers.push({
        id: result,
        post_id: p.id,
        volunteer_id: userId,
        message: parse(messageSchema, p.message),
        reply: "",
        status: "pending",
        created_at: now,
        updated_at: now,
      });
      break;
    }
    case "reply_offer": {
      const offer = state.offers.find((o) => o.id === p.id);
      check(offer, "Oferta no disponible.");
      const record = target(state, "post", offer.post_id);
      check(
        ["open", "coordinating"].includes(record.status),
        "La solicitud está cerrada.",
      );
      if (p.status === "withdrawn")
        check(
          offer.volunteer_id === userId && offer.status === "pending",
          "No puedes retirar esta oferta.",
        );
      else {
        own(record);
        check(
          ["accepted", "rejected"].includes(p.status) &&
            offer.status === "pending",
          "La oferta ya fue procesada.",
        );
      }
      offer.status = p.status;
      offer.reply = String(p.reply || "")
        .trim()
        .slice(0, 600);
      offer.updated_at = now;
      if (p.status === "accepted" && record.status === "open") {
        event("post", record, "open", "coordinating");
        record.status = "coordinating";
        record.updated_at = now;
      }
      result = offer.id;
      break;
    }
    case "request_contact": {
      const record = target(state, p.scope, p.id);
      check(
        record.visibility === "visible" &&
          record.author_id !== userId &&
          ["active", "open", "coordinating"].includes(record.status),
        "No puedes enviar esta propuesta.",
      );
      check(
        !state.responses.some(
          (r) =>
            r.scope === p.scope && r.entity_id === p.id && r.from_id === userId,
        ),
        "Ya enviaste una propuesta. Revisa Mi actividad.",
      );
      result = id();
      state.responses.push({
        id: result,
        scope: p.scope,
        entity_id: p.id,
        from_id: userId,
        author_id: record.author_id,
        message: parse(messageSchema, p.message),
        reply: "",
        status: "pending",
        created_at: now,
      });
      break;
    }
    case "reply_contact": {
      const response = state.responses.find((r) => r.id === p.id);
      check(
        response && response.author_id === userId,
        "No puedes responder esta propuesta.",
      );
      target(state, response.scope, response.entity_id);
      response.reply = parse(messageSchema, p.reply);
      response.status = "answered";
      result = response.id;
      break;
    }
    case "report": {
      const record = target(state, p.scope, p.id);
      check(canRead(state, record, userId), "Publicación no disponible.");
      check(
        !state.reports.some(
          (r) =>
            r.scope === p.scope &&
            r.entity_id === p.id &&
            r.reporter_id === userId &&
            r.status === "open",
        ),
        "Ya reportaste esta publicación.",
      );
      result = id();
      state.reports.push({
        id: result,
        scope: p.scope,
        entity_id: p.id,
        reporter_id: userId,
        reason: parse(messageSchema, p.reason),
        status: "open",
        created_at: now,
      });
      break;
    }
    case "moderate": {
      check(mod, "Esta acción requiere permisos de moderación.");
      const record = target(state, p.scope, p.id);
      check(["visible", "hidden"].includes(p.visibility), "Acción no válida.");
      event(p.scope, record, record.visibility, p.visibility);
      record.visibility = p.visibility;
      record.updated_at = now;
      state.reports
        .filter((r) => r.scope === p.scope && r.entity_id === p.id)
        .forEach((r) => {
          r.status = "resolved";
        });
      result = record.id;
      break;
    }
    case "save_guidance": {
      check(mod, "Esta acción requiere permisos editoriales.");
      const data = parse(guidanceSchema, p.data);
      check(
        data.reviewed_at <= now.slice(0, 10),
        "La fecha de revisión no puede estar en el futuro.",
      );
      const existing = state.guidance.find((g) => g.id === p.id);
      if (p.id) check(existing, "Recomendación no encontrada.");
      if (existing) {
        Object.assign(existing, data);
        result = existing.id;
      } else {
        result = id();
        state.guidance.push({ ...data, id: result });
      }
      break;
    }
    case "update_profile": {
      profile.name = parse(short(2, 70), p.name);
      profile.barrio_id = parse(barrio, p.barrio_id);
      result = userId;
      break;
    }
    case "revoke_contact": {
      const record = target(state, p.scope, p.id);
      own(record);
      state.contacts = state.contacts.filter(
        (c) => !(c.scope === p.scope && c.entity_id === p.id),
      );
      result = record.id;
      break;
    }
    default:
      throw new Error("Acción no reconocida.");
  }
  return { state, result };
}

export function publicSnapshot(state, userId) {
  const view = JSON.parse(JSON.stringify(state));
  const mod = isModerator(state, userId);
  view.businesses = view.businesses.filter((r) => canRead(state, r, userId));
  view.posts = view.posts.filter((r) => canRead(state, r, userId));
  const visible = (scope, id) =>
    (scope === "business" ? view.businesses : view.posts).some(
      (r) => r.id === id,
    );
  view.reviews = view.reviews.filter((r) => visible(r.scope, r.entity_id));
  view.contacts = userId
    ? view.contacts.filter(
        (r) =>
          visible(r.scope, r.entity_id) &&
          (r.author_id === userId ||
            scopeRecord(state, r.scope, r.entity_id)?.visibility === "visible"),
      )
    : [];
  view.offers = view.offers.filter((o) => {
    const post = view.posts.find((p) => p.id === o.post_id);
    return post && (post.author_id === userId || o.volunteer_id === userId);
  });
  view.responses = view.responses.filter(
    (r) =>
      visible(r.scope, r.entity_id) &&
      (r.author_id === userId || r.from_id === userId),
  );
  view.history = view.history.filter((h) => visible(h.scope, h.entity_id));
  view.reports = view.reports.filter((r) => mod || r.reporter_id === userId);
  view.roles = view.roles.filter((r) => r.user_id === userId);
  view.guidance = view.guidance.filter((g) => g.visible || mod);
  return view;
}
function scopeRecord(state, scope, id) {
  return state[scope === "business" ? "businesses" : "posts"].find(
    (r) => r.id === id,
  );
}
