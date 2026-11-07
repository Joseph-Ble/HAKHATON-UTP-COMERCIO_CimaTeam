import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import {
  Page,
  T,
  Stack,
  Row,
  Button,
  Action,
  SectionTitle,
  Choice,
  Sheet,
  Field,
  Toggle,
  Pill,
  Info,
  colors,
  fonts,
} from "../components/ui.js";
import { useApp } from "../data/AppProvider.js";
import { EMERGENCIES } from "../core/catalog.js";

export function ModerationScreen() {
  const { data, moderator, command } = useApp();
  const [tab, setTab] = useState("content"),
    [editing, setEditing] = useState(null);
  const edit = (g) =>
    setEditing(
      g || {
        title: "",
        body: "",
        institution: "",
        source_url: "",
        category: "nature",
        event: "",
        reviewed_at: new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Lima",
        }),
        visible: true,
      },
    );
  if (!moderator)
    return (
      <Page back title="Administración de comunidad">
        <Info icon="LockKeyhole">
          Esta sección requiere un perfil autorizado.
        </Info>
      </Page>
    );
  const reported = new Set(
    data.reports.filter((r) => r.status === "open").map((r) => r.entity_id),
  );
  const items = [
    ...data.businesses.map((i) => ({ ...i, scope: "business" })),
    ...data.posts.map((i) => ({ ...i, scope: "post" })),
  ].filter(
    (r) => !r.deleted_at && (reported.has(r.id) || r.visibility !== "visible"),
  );
  return (
    <Page
      back
      title="Cuidemos la comunidad"
      subtitle="Revisa contenido, resuelve reportes y mantén las fuentes al día."
    >
      <Row>
        <Button
          variant={tab === "content" ? "primary" : "secondary"}
          onPress={() => setTab("content")}
        >
          Moderación
        </Button>
        <Button
          variant={tab === "guidance" ? "primary" : "secondary"}
          onPress={() => setTab("guidance")}
        >
          Información institucional
        </Button>
      </Row>
      {tab === "content" ? (
        <Stack>
          <SectionTitle title="Contenido por revisar" />
          {items.map((i) => (
            <View
              key={i.id}
              style={{
                padding: 23,
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 16,
                gap: 13,
              }}
            >
              <Pill>
                {
                  {
                    pending: "Pendiente",
                    hidden: "Oculto",
                    visible: "Visible · reportado",
                  }[i.visibility]
                }
              </Pill>
              <T style={{ fontFamily: fonts.title, fontSize: 20 }}>{i.title}</T>
              <T style={{ lineHeight: 23 }}>{i.description}</T>
              {data.reports
                .filter((r) => r.entity_id === i.id)
                .map((r) => (
                  <Info key={r.id} color={colors.peach}>
                    Motivo: {r.reason} ·{" "}
                    {r.status === "open" ? "Por revisar" : "Resuelto"}
                  </Info>
                ))}
              <Row style={{ flexWrap: "wrap" }}>
                <Action
                  onPress={() =>
                    command(
                      "moderate",
                      { scope: i.scope, id: i.id, visibility: "visible" },
                      "Contenido aprobado y reportes resueltos.",
                    )
                  }
                >
                  Aprobar publicación
                </Action>
                <Action
                  variant="secondary"
                  onPress={() =>
                    command(
                      "moderate",
                      { scope: i.scope, id: i.id, visibility: "hidden" },
                      "Contenido oculto.",
                    )
                  }
                >
                  Ocultar
                </Action>
                <Button
                  variant="ghost"
                  onPress={() =>
                    router.push({
                      pathname:
                        i.scope === "business"
                          ? "/ficha/[id]"
                          : "/publicacion/[id]",
                      params: { id: i.id },
                    })
                  }
                >
                  Ver detalle
                </Button>
              </Row>
            </View>
          ))}
          {!items.length && (
            <Info icon="CircleCheck">
              No hay contenido pendiente de revisión.
            </Info>
          )}
        </Stack>
      ) : (
        <Stack>
          <Button icon="Plus" onPress={() => edit()}>
            Añadir recomendación
          </Button>
          {data.guidance.map((g) => (
            <View
              key={g.id}
              style={{
                backgroundColor: colors.white,
                padding: 20,
                borderRadius: 13,
                borderWidth: 1,
                borderColor: colors.line,
                gap: 10,
              }}
            >
              <Pill>
                {g.visible ? "Visible" : "Oculta"} · {g.institution}
              </Pill>
              <T style={{ fontFamily: fonts.bold, fontSize: 18 }}>{g.title}</T>
              <T style={{ color: colors.muted }}>{g.body}</T>
              <Button variant="secondary" onPress={() => edit(g)}>
                Editar recomendación
              </Button>
            </View>
          ))}
        </Stack>
      )}
      <Sheet
        visible={!!editing}
        title="Recomendación institucional"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <Stack>
            {[
              ["title", "Título"],
              ["institution", "Institución"],
              ["event", "Tipo de evento"],
              ["source_url", "URL HTTPS de la fuente"],
              ["reviewed_at", "Fecha de revisión (AAAA-MM-DD)"],
              ["body", "Contenido breve"],
            ].map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={editing[key]}
                onChangeText={(v) => setEditing({ ...editing, [key]: v })}
                multiline={key === "body"}
                autoCapitalize={key === "source_url" ? "none" : "sentences"}
                maxLength={key === "body" ? 2000 : 300}
              />
            ))}
            <Choice
              label="Categoría"
              value={editing.category}
              options={Object.entries(EMERGENCIES)}
              onChange={(v) => setEditing({ ...editing, category: v })}
            />
            <Toggle
              value={editing.visible}
              onChange={(v) => setEditing({ ...editing, visible: v })}
            >
              Mostrar recomendación
            </Toggle>
            <Info>
              Comprueba que el enlace corresponda al contenido antes de
              publicar. No atribuyas respaldo institucional a la app.
            </Info>
            <Action
              onPress={async () => {
                await command("save_guidance", {
                  id: editing.id || null,
                  data: editing,
                });
                setEditing(null);
              }}
            >
              Guardar recomendación
            </Action>
          </Stack>
        )}
      </Sheet>
    </Page>
  );
}
