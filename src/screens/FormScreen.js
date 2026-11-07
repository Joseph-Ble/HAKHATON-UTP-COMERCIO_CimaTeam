import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  Page,
  T,
  Stack,
  Button,
  Field,
  Choice,
  Toggle,
  Info,
  ErrorText,
  colors,
} from "../components/ui.js";
import { useApp } from "../data/AppProvider.js";
import { businessSchema, postSchema } from "../core/domain.js";
import {
  CATEGORIES,
  NEIGHBORHOODS,
  EMERGENCIES,
  TYPES,
} from "../core/catalog.js";
import { SignInPrompt } from "./DetailScreens.js";

export function FormScreen() {
  const params = useLocalSearchParams();
  const { data, user, barrio, command } = useApp();
  const scope = params.scope === "business" ? "business" : "post";
  const business = scope === "business";
  const existing = (business ? data.businesses : data.posts).find(
    (p) => p.id === params.id,
  );
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      area: "",
      hours: "Lunes a sábado · 9:00 a 18:00",
      barrio_id: barrio,
      category:
        params.category || (params.module === "emergency" ? "nature" : "other"),
      type: params.type || "sell",
      module: params.module || "solidarity",
      offering: "",
      requesting: "",
      intent: "need",
      help_kind: "loan",
      price_text: "",
      date_text: new Date()
        .toLocaleString("sv-SE", { timeZone: "America/Lima" })
        .slice(0, 16),
      contact_consent: false,
      contact_channel: "whatsapp",
      contact_value: "",
    },
  });
  useEffect(() => {
    if (!existing) return;
    const contact = data.contacts.find(
      (c) => c.scope === scope && c.entity_id === existing.id,
    );
    reset({
      ...existing,
      price_text: existing.price == null ? "" : String(existing.price),
      date_text: existing.occurred_at
        ? new Date(existing.occurred_at)
            .toLocaleString("sv-SE", { timeZone: "America/Lima" })
            .slice(0, 16)
        : "",
      contact_consent: !!contact,
      contact_channel: contact?.channel || "whatsapp",
      contact_value: contact?.value || "",
    });
  }, [existing?.id]);
  const values = watch();
  const emergency = !business && values.module === "emergency";
  const field = (name, label, props = {}) => (
    <Controller
      key={name}
      control={control}
      name={name}
      render={({ field: f }) => (
        <Field
          label={label}
          value={f.value || ""}
          onChangeText={f.onChange}
          onBlur={f.onBlur}
          error={errors[name]?.message}
          {...props}
        />
      )}
    />
  );
  const submit = async (v) => {
    setBusy(true);
    setError("");
    try {
      let occurred_at = null;
      if (emergency) {
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(v.date_text))
          throw new Error("Usa fecha y hora con formato AAAA-MM-DD HH:mm.");
        occurred_at = new Date(
          `${v.date_text.replace(" ", "T")}:00-05:00`,
        ).toISOString();
      }
      const raw = {
        ...v,
        price:
          v.type === "free" || emergency || !v.price_text?.trim()
            ? null
            : Number(v.price_text.replace(",", ".")),
        occurred_at,
        intent: v.type === "free" ? v.intent : null,
        help_kind: v.type === "free" ? v.help_kind : null,
      };
      const parsed = (business ? businessSchema : postSchema).safeParse(raw);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const id = await command(
        business ? "save_business" : "save_post",
        {
          id: params.id || null,
          data: parsed.data,
          contact: {
            consent: v.contact_consent,
            channel: v.contact_channel,
            value: v.contact_value,
          },
        },
        emergency && v.category === "security"
          ? "Guardado. Tu publicación está pendiente de revisión."
          : "Tu publicación se guardó correctamente.",
      );
      router.replace({
        pathname: business ? "/ficha/[id]" : "/publicacion/[id]",
        params: { id },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!user)
    return (
      <Page back title="Comparte con tu comunidad" wide={false}>
        <SignInPrompt />
        <Button onPress={() => router.push("/cuenta")}>
          Ingresar o crear cuenta
        </Button>
      </Page>
    );
  if (params.id && (!existing || existing.author_id !== user.id))
    return (
      <Page back title="No puedes editar esta publicación">
        <ErrorText>Solo su autor puede editarla.</ErrorText>
      </Page>
    );
  return (
    <Page
      back
      wide={false}
      title={
        params.id
          ? "Editar publicación"
          : business
            ? "Tu negocio, más cerca"
            : emergency
              ? "Comparte información y apoyo"
              : "¿Qué quieres compartir?"
      }
      subtitle={
        business
          ? "Haz que tus vecinos encuentren lo que ofreces."
          : "Una publicación clara facilita un buen encuentro."
      }
    >
      <Stack style={{ gap: 22 }}>
        {!business && !params.id && (
          <Choice
            label="Modalidad"
            value={values.type}
            onChange={(v) => setValue("type", v)}
            options={Object.entries(TYPES).filter(([id]) =>
              emergency
                ? ["report", "help"].includes(id)
                : ["sell", "buy", "swap", "free"].includes(id),
            )}
          />
        )}
        {emergency ? (
          <>
            <Choice
              label="Categoría de emergencia"
              value={values.category}
              onChange={(v) => setValue("category", v)}
              options={Object.entries(EMERGENCIES)}
            />
            <Info icon="ShieldCheck" color={colors.blue}>
              Describe hechos concretos. No publiques nombres de víctimas,
              domicilios, acusaciones, rostros ni matrículas. Ante peligro
              inmediato, contacta servicios oficiales.
            </Info>
          </>
        ) : (
          <Choice
            label="Categoría"
            value={values.category}
            onChange={(v) => setValue("category", v)}
            options={CATEGORIES}
          />
        )}
        {field("title", business ? "Nombre del negocio o servicio" : "Título", {
          placeholder: business
            ? "Ej. Carpintería del barrio"
            : "Describe tu publicación en pocas palabras",
          maxLength: 100,
        })}
        {field(
          "description",
          business ? "Productos y servicios" : "Descripción",
          {
            multiline: true,
            placeholder:
              "Cuenta lo necesario para que tus vecinos te conozcan.",
            maxLength: 1800,
          },
        )}
        <Choice
          label="Barrio"
          value={values.barrio_id}
          options={NEIGHBORHOODS}
          onChange={(v) => setValue("barrio_id", v)}
        />
        {field("area", "Referencia aproximada", {
          placeholder: "Ej. Sector del parque central",
          hint: "Evita incluir el domicilio exacto de una vivienda.",
          maxLength: 120,
        })}
        {business && field("hours", "Horario de atención", { maxLength: 120 })}
        {!business &&
          ["sell", "buy"].includes(values.type) &&
          field(
            "price_text",
            values.type === "buy"
              ? "Presupuesto en soles (opcional)"
              : "Precio en soles (opcional)",
            {
              keyboardType: "decimal-pad",
              placeholder: "Ej. 150.00",
              hint: "Si lo dejas vacío se mostrará como precio no indicado.",
            },
          )}
        {values.type === "swap" && (
          <>
            {field("offering", "¿Qué ofreces?", { maxLength: 300 })}
            {field("requesting", "¿Qué quieres recibir?", { maxLength: 300 })}
          </>
        )}
        {values.type === "free" && (
          <>
            <Choice
              label="¿Qué quieres hacer?"
              value={values.intent}
              onChange={(v) => setValue("intent", v)}
              options={[
                ["need", "Necesito ayuda"],
                ["offer", "Ofrezco ayuda"],
              ]}
            />
            <Choice
              label="Tipo de ayuda"
              value={values.help_kind}
              onChange={(v) => setValue("help_kind", v)}
              options={[
                ["donation", "Donación"],
                ["loan", "Préstamo"],
                ["favor", "Favor o apoyo"],
              ]}
            />
            <Info icon="HandHeart">
              Esta modalidad es completamente gratuita. No lleva precio ni
              implica pagos.
            </Info>
          </>
        )}
        {emergency &&
          field("date_text", "Fecha y hora del hecho o necesidad", {
            placeholder: "2026-11-06 14:30",
            hint: "Formato AAAA-MM-DD HH:mm · hora de Perú",
            maxLength: 16,
          })}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.line,
            paddingTop: 20,
            gap: 12,
          }}
        >
          <T style={{ fontSize: 18, fontWeight: "700" }}>
            Contacto y privacidad
          </T>
          <T style={{ color: colors.muted, lineHeight: 22, fontSize: 13 }}>
            Puedes coordinar mediante propuestas y respuestas privadas dentro de
            la app.
          </T>
          <Toggle
            value={values.contact_consent}
            onChange={(v) => setValue("contact_consent", v)}
          >
            Además, autorizo mostrar este contacto externo a usuarios con cuenta
            que consulten mi publicación.
          </Toggle>
          {values.contact_consent && (
            <>
              <Choice
                label="Canal autorizado"
                value={values.contact_channel}
                options={[
                  ["whatsapp", "WhatsApp"],
                  ["email", "Correo"],
                ]}
                onChange={(v) => setValue("contact_channel", v)}
              />
              {field(
                "contact_value",
                values.contact_channel === "email"
                  ? "Correo de contacto"
                  : "Número internacional de WhatsApp",
                {
                  placeholder:
                    values.contact_channel === "email"
                      ? "contacto@ejemplo.com"
                      : "51912345678",
                  keyboardType:
                    values.contact_channel === "email"
                      ? "email-address"
                      : "phone-pad",
                  autoCapitalize: "none",
                  maxLength: 150,
                },
              )}
            </>
          )}
        </View>
        {emergency && values.category === "security" && (
          <Info color={colors.peach}>
            Esta publicación pasará por revisión antes de ser pública. La
            revisión puede demorar, también si solicitas ayuda.
          </Info>
        )}
        {!!error && <ErrorText>{error}</ErrorText>}
        <Button icon="Check" loading={busy} onPress={handleSubmit(submit)}>
          {params.id ? "Guardar cambios" : "Publicar"}
        </Button>
      </Stack>
    </Page>
  );
}
