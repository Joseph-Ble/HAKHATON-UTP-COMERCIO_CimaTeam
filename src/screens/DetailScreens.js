import React, { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Page,
  T,
  Row,
  Stack,
  Button,
  Action,
  Icon,
  Avatar,
  Pill,
  Stars,
  Info,
  Empty,
  Field,
  Sheet,
  Toggle,
  SectionTitle,
  colors,
  fonts,
  openURL,
} from "../components/ui.js";
import { useApp } from "../data/AppProvider.js";
import { useItem } from "../data/useReadModels.js";
import {
  TYPES,
  STATES,
  OFFER_STATES,
  categoryLabel,
  areaLabel,
  formatDate,
  reviewStats,
  nextStates,
} from "../core/catalog.js";

export function SignInPrompt({
  message = "Inicia sesión para participar en tu comunidad.",
}) {
  return (
    <Info icon="LockKeyhole">
      <T>{message} </T>
      <T
        onPress={() => router.push("/cuenta")}
        style={{ color: colors.green, fontFamily: fonts.bold }}
      >
        Ingresar →
      </T>
    </Info>
  );
}
export function OfferRow({ offer, post }) {
  const { data, user, command } = useApp();
  const [reply, setReply] = useState("");
  const owner = post.author_id === user?.id,
    name =
      data.profiles.find((p) => p.id === offer.volunteer_id)?.name || "Vecino";
  return (
    <View
      style={{
        padding: 18,
        gap: 12,
        backgroundColor: colors.white,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      <Row style={{ justifyContent: "space-between" }}>
        <Row>
          <Avatar name={name} size={32} />
          <T style={{ fontFamily: fonts.bold }}>{name}</T>
        </Row>
        <Pill>{OFFER_STATES[offer.status]}</Pill>
      </Row>
      <T style={{ lineHeight: 23 }}>{offer.message}</T>
      {!!offer.reply && (
        <Info icon="MessageCircle">Respuesta: {offer.reply}</Info>
      )}
      <T style={{ fontSize: 11, color: colors.muted }}>
        Oferta enviada el {formatDate(offer.created_at)}
      </T>
      {offer.status === "pending" &&
        ["open", "coordinating"].includes(post.status) &&
        (owner ? (
          <Stack>
            <Field
              label="Respuesta para coordinar (opcional)"
              placeholder="Indica cómo pueden organizarse de forma segura"
              multiline
              value={reply}
              onChangeText={setReply}
              maxLength={600}
            />
            <Row style={{ flexWrap: "wrap" }}>
              <Action
                icon="Check"
                onPress={() =>
                  command(
                    "reply_offer",
                    { id: offer.id, status: "accepted", reply },
                    "Oferta aceptada. La solicitud está en coordinación.",
                  )
                }
              >
                Aceptar ayuda
              </Action>
              <Action
                variant="secondary"
                onPress={() =>
                  command("reply_offer", {
                    id: offer.id,
                    status: "rejected",
                    reply,
                  })
                }
              >
                No aceptar
              </Action>
            </Row>
          </Stack>
        ) : (
          <Action
            variant="secondary"
            onPress={() =>
              command(
                "reply_offer",
                { id: offer.id, status: "withdrawn" },
                "Oferta retirada.",
              )
            }
          >
            Retirar oferta
          </Action>
        ))}
    </View>
  );
}
export function ResponseRow({ response }) {
  const { user, data, command } = useApp();
  const [reply, setReply] = useState(response.reply || "");
  const name =
    data.profiles.find((p) => p.id === response.from_id)?.name || "Vecino";
  return (
    <View
      style={{
        backgroundColor: colors.white,
        padding: 18,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: colors.line,
        gap: 12,
      }}
    >
      <Row>
        <Avatar name={name} size={32} />
        <T style={{ fontFamily: fonts.bold }}>{name}</T>
      </Row>
      <T style={{ lineHeight: 23 }}>{response.message}</T>
      {response.author_id === user?.id ? (
        <Stack>
          <Field
            label="Tu respuesta para coordinar"
            multiline
            value={reply}
            onChangeText={setReply}
            maxLength={600}
          />
          <Action
            onPress={() =>
              command(
                "reply_contact",
                { id: response.id, reply },
                "Respuesta guardada. El vecino puede verla en su actividad.",
              )
            }
          >
            Guardar respuesta
          </Action>
        </Stack>
      ) : response.reply ? (
        <Info icon="MessageCircle">{response.reply}</Info>
      ) : (
        <T style={{ color: colors.muted }}>
          Tu propuesta está pendiente de respuesta.
        </T>
      )}
    </View>
  );
}
export function DetailScreen({ scope }) {
  const { id } = useLocalSearchParams();
  const app = useApp();
  const { user, barrio, command } = app;
  const detail = useItem(scope, id);
  const { data, item } = detail;
  const [sheet, setSheet] = useState(null),
    [message, setMessage] = useState(""),
    [rating, setRating] = useState(5),
    [recommends, setRecommends] = useState(true);
  const business = scope === "business";
  if (detail.loading)
    return (
      <Page back>
        <T>Cargando publicación…</T>
      </Page>
    );
  if (detail.error)
    return (
      <Page back>
        <Info>{detail.error}</Info>
        <Action variant="secondary" onPress={app.refresh}>
          Reintentar
        </Action>
      </Page>
    );
  if (!item)
    return (
      <Page back>
        <Empty
          title="Esta publicación no está disponible"
          description="Puede haber sido retirada o estar pendiente de revisión."
          action="Volver al inicio"
          onPress={() => router.replace("/")}
        />
      </Page>
    );
  const owner = item.author_id === user?.id,
    emergency = item.module === "emergency",
    author = data.profiles.find((p) => p.id === item.author_id);
  const reviews = data.reviews.filter(
    (r) => r.scope === scope && r.entity_id === id,
  );
  const stats = item._stats || reviewStats(data.reviews, scope, id, barrio);
  const contacts = data.contacts.filter(
    (c) => c.scope === scope && c.entity_id === id,
  );
  const responses = data.responses.filter(
    (r) => r.scope === scope && r.entity_id === id,
  );
  const offers = data.offers.filter((o) => o.post_id === id);
  const history = data.history
    .filter((h) => h.scope === scope && h.entity_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const canReview =
    !emergency &&
    !owner &&
    user &&
    item.visibility === "visible" &&
    (business || item.status === "completed") &&
    !reviews.some((r) => r.author_id === user.id);
  const canCoordinate =
    item.visibility === "visible" &&
    ["active", "open", "coordinating"].includes(item.status);
  const show = (s) => {
    setMessage("");
    setSheet(s);
  };
  return (
    <Page back wide={false}>
      <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <Pill color={emergency ? colors.blue : colors.mint}>
          {business ? categoryLabel(item.category) : TYPES[item.type]}
        </Pill>
        <Pill>{STATES[item.status]}</Pill>
      </Row>
      <T
        accessibilityRole="header"
        style={{
          fontFamily: fonts.title,
          fontSize: 33,
          lineHeight: 42,
          letterSpacing: -1,
        }}
      >
        {item.title}
      </T>
      <Row style={{ flexWrap: "wrap", gap: 15 }}>
        <Row>
          <Icon name="MapPin" size={16} />
          <T style={{ fontSize: 13 }}>
            {areaLabel(item.barrio_id)} · {item.area}
          </T>
        </Row>
        <T style={{ fontSize: 12, color: colors.muted }}>
          Publicado el {formatDate(item.created_at)}
        </T>
      </Row>
      {item.visibility !== "visible" && (
        <Info color={colors.peach}>
          {item.visibility === "pending"
            ? "Pendiente de revisión. Solo tú y el equipo de moderación pueden verla hasta su aprobación."
            : "Esta publicación está oculta por moderación. Editarla no elimina esa decisión."}
        </Info>
      )}
      {emergency && (
        <Stack>
          <Info icon="ShieldCheck" color={colors.blue}>
            Reporte vecinal no verificado. No es una alerta oficial ni garantiza
            la disponibilidad de ayuda. Ante peligro inmediato, contacta
            servicios oficiales.
          </Info>
          <Button
            variant="secondary"
            onPress={() => router.push("/directorio")}
            icon="BookOpen"
          >
            Consultar canales oficiales
          </Button>
          <T style={{ fontSize: 13, fontFamily: fonts.bold }}>
            Fecha del hecho o necesidad:{" "}
            {formatDate(item.occurred_at || item.created_at)}
          </T>
        </Stack>
      )}
      <View
        style={{
          backgroundColor: colors.white,
          padding: 25,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.line,
          gap: 19,
        }}
      >
        <T style={{ fontSize: 16, lineHeight: 27 }}>{item.description}</T>
        {item.price != null && (
          <T style={{ fontFamily: fonts.title, fontSize: 27 }}>
            S/ {Number(item.price).toFixed(2)}{" "}
            <T style={{ fontSize: 12, color: colors.muted }}>
              {item.type === "buy" ? "de presupuesto" : ""}
            </T>
          </T>
        )}
        {item.type === "swap" && (
          <Stack>
            <Info icon="Leaf">Ofrezco: {item.offering}</Info>
            <Info icon="Heart">Me gustaría recibir: {item.requesting}</Info>
          </Stack>
        )}
        {item.type === "free" && (
          <Info icon="HandHeart">
            {item.intent === "need" ? "Necesito" : "Ofrezco"} ·{" "}
            {
              {
                loan: "Préstamo",
                donation: "Donación",
                favor: "Favor o apoyo",
              }[item.help_kind]
            }{" "}
            · Sin dinero
          </Info>
        )}
        {business && (
          <Row>
            <Icon name="Clock" size={18} />
            <T style={{ flex: 1, fontSize: 13 }}>{item.hours}</T>
          </Row>
        )}
        <Row
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.line,
            paddingTop: 18,
            gap: 12,
          }}
        >
          <Avatar name={author?.name} />
          <View>
            <T style={{ fontFamily: fonts.bold }}>{author?.name || "Vecino"}</T>
            <T style={{ fontSize: 12, color: colors.muted }}>
              Barrio declarado: {areaLabel(author?.barrio_id)}
            </T>
          </View>
        </Row>
      </View>
      {owner ? (
        <View style={{ gap: 14 }}>
          <SectionTitle title="Administrar publicación" />
          <Button
            icon="Settings"
            variant="secondary"
            onPress={() =>
              router.push({ pathname: "/crear", params: { scope, id } })
            }
          >
            Editar información
          </Button>
          <Row style={{ flexWrap: "wrap" }}>
            {nextStates(item, scope).map((status) => (
              <Action
                key={status}
                variant="secondary"
                onPress={() =>
                  command(
                    "status",
                    { scope, id, status },
                    `Estado actualizado: ${STATES[status]}.`,
                  )
                }
              >
                Marcar como {STATES[status].toLowerCase()}
              </Action>
            ))}
          </Row>
          {!!contacts.length && (
            <Action
              variant="secondary"
              onPress={() =>
                command(
                  "revoke_contact",
                  { scope, id },
                  "Contacto externo retirado.",
                )
              }
            >
              Retirar contacto externo
            </Action>
          )}
          <Button variant="ghost" onPress={() => show("retire")}>
            Retirar publicación
          </Button>
        </View>
      ) : !user ? (
        <SignInPrompt />
      ) : canCoordinate ? (
        <View style={{ gap: 12 }}>
          {contacts.map((c) => (
            <Action
              key={c.id}
              icon="ExternalLink"
              onPress={() =>
                openURL(
                  c.channel === "whatsapp"
                    ? `https://wa.me/${c.value.replace(/\D/g, "")}`
                    : `mailto:${encodeURIComponent(c.value)}`,
                )
              }
            >
              Contactar por {c.channel === "email" ? "correo" : "WhatsApp"}
            </Action>
          ))}
          {item.type === "help"
            ? !offers.some((o) => o.volunteer_id === user.id) && (
                <Button icon="HandHeart" onPress={() => show("offer")}>
                  Ofrecer ayuda
                </Button>
              )
            : item.type !== "report" &&
              !responses.some((r) => r.from_id === user.id) && (
                <Button icon="MessageCircle" onPress={() => show("contact")}>
                  Enviar una propuesta
                </Button>
              )}
          <T style={{ fontSize: 12, color: colors.muted }}>
            Coordina por aquí sin publicar tu teléfono. Comparte solo
            información necesaria.
          </T>
        </View>
      ) : null}
      {item.type === "help" && (owner || offers.length > 0) && (
        <Stack>
          <SectionTitle
            title={owner ? "Ofertas de ayuda recibidas" : "Tu oferta de ayuda"}
            subtitle="Información privada entre solicitante y voluntario."
          />
          {offers.map((o) => (
            <OfferRow key={o.id} offer={o} post={item} />
          ))}
          {!offers.length && (
            <T style={{ color: colors.muted }}>
              Todavía no recibiste ofertas de ayuda.
            </T>
          )}
        </Stack>
      )}
      {!!responses.length && (
        <Stack>
          <SectionTitle
            title={owner ? "Propuestas recibidas" : "Tu coordinación"}
            subtitle="Solo los participantes pueden leer estos mensajes."
          />
          {responses.map((r) => (
            <ResponseRow key={r.id} response={r} />
          ))}
        </Stack>
      )}
      {!emergency && (
        <Stack>
          <SectionTitle
            title={
              business ? "Visto Bueno Vecinal" : "Experiencias compartidas"
            }
            subtitle={
              business
                ? "Opiniones vecinales; no son una certificación de calidad."
                : "Experiencias autodeclaradas. La app no verifica transacciones."
            }
          />
          <Row>
            <T style={{ fontFamily: fonts.title, fontSize: 33 }}>
              {stats.count ? stats.average.toFixed(1) : "—"}
            </T>
            <View style={{ gap: 5 }}>
              <Stars value={stats.average} />
              <T style={{ fontSize: 12, color: colors.muted }}>
                {stats.count} valoraciones
              </T>
            </View>
          </Row>
          {business && (
            <Info icon="CheckCheck">
              {stats.local} recomendaciones de vecinos que declaran pertenecer a{" "}
              {areaLabel(barrio)}.
            </Info>
          )}
          {canReview && (
            <Button
              variant="secondary"
              icon="Star"
              onPress={() => show("review")}
            >
              Valorar mi experiencia
            </Button>
          )}
          {reviews.map((r) => (
            <View
              key={r.id}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
                paddingBottom: 15,
                gap: 8,
              }}
            >
              <Row style={{ justifyContent: "space-between" }}>
                <T style={{ fontFamily: fonts.bold }}>
                  {data.profiles.find((p) => p.id === r.author_id)?.name ||
                    "Vecino"}
                </T>
                <Stars value={r.rating} />
              </Row>
              {!!r.comment && <T style={{ lineHeight: 23 }}>{r.comment}</T>}
              <T style={{ fontSize: 11, color: colors.muted }}>
                {areaLabel(r.barrio_id)} · {formatDate(r.created_at)}
              </T>
            </View>
          ))}
        </Stack>
      )}
      {!!history.length && (
        <Stack>
          <SectionTitle title="Historial de estado" />
          {history.slice(0, 8).map((h) => (
            <Row key={h.id}>
              <Icon name="Clock" size={15} color={colors.muted} />
              <T style={{ fontSize: 12, color: colors.muted }}>
                {STATES[h.to_status] ||
                  { visible: "Visible", hidden: "Oculta", retired: "Retirada" }[
                    h.to_status
                  ] ||
                  h.to_status}{" "}
                · {formatDate(h.created_at)}{" "}
                {new Date(h.created_at).toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Lima",
                })}
              </T>
            </Row>
          ))}
        </Stack>
      )}
      {user && (
        <Button variant="ghost" icon="Flag" onPress={() => show("report")}>
          Reportar contenido
        </Button>
      )}
      <Sheet
        visible={!!sheet}
        title={
          {
            offer: "Ofrecer ayuda",
            contact: "Conecta con tu vecino",
            review: "Tu experiencia cuenta",
            report: "Reportar contenido",
            retire: "Retirar publicación",
          }[sheet] || ""
        }
        onClose={() => setSheet(null)}
      >
        <Stack>
          {sheet === "retire" ? (
            <>
              <T>
                La publicación dejará de estar disponible. Se conservarán sus
                relaciones e historial mínimo.
              </T>
              <Action
                onPress={async () => {
                  await command(
                    "retire",
                    { scope, id },
                    "Publicación retirada.",
                  );
                  setSheet(null);
                  router.replace("/actividad");
                }}
              >
                Confirmar retiro
              </Action>
            </>
          ) : sheet === "review" ? (
            <>
              <Stars value={rating} onChange={setRating} />
              <Field
                label="Cuéntanos tu experiencia (opcional)"
                multiline
                value={message}
                onChangeText={setMessage}
                maxLength={600}
              />
              {business && (
                <Toggle value={recommends} onChange={setRecommends}>
                  Recomiendo este negocio a mis vecinos.
                </Toggle>
              )}
              <Action
                onPress={async () => {
                  await command(
                    "review",
                    {
                      scope,
                      id,
                      data: {
                        rating,
                        comment: message,
                        recommends: business && recommends,
                      },
                    },
                    "Gracias por compartir tu experiencia.",
                  );
                  setSheet(null);
                }}
              >
                Guardar valoración
              </Action>
            </>
          ) : (
            <>
              <T style={{ color: colors.muted, lineHeight: 22 }}>
                {sheet === "report"
                  ? "Explica el problema. El equipo de moderación revisará el contenido."
                  : "Cuenta qué puedes aportar o qué necesitas coordinar. Evita domicilios precisos y datos de personas vulnerables."}
              </T>
              <Field
                label={sheet === "report" ? "Motivo del reporte" : "Tu mensaje"}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={600}
              />
              <Action
                onPress={async () => {
                  await command(
                    sheet === "report"
                      ? "report"
                      : sheet === "offer"
                        ? "offer"
                        : "request_contact",
                    { scope, id, message, reason: message },
                    sheet === "report"
                      ? "Reporte recibido para revisión."
                      : "Tu propuesta se guardó correctamente.",
                  );
                  setSheet(null);
                }}
              >
                Enviar
              </Action>
            </>
          )}
        </Stack>
      </Sheet>
    </Page>
  );
}
