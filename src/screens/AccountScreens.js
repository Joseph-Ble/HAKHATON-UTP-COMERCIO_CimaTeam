import React, { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import {
  Page,
  T,
  Row,
  Stack,
  Field,
  Choice,
  Button,
  Action,
  Toggle,
  ErrorText,
  Avatar,
  SectionTitle,
  CardGrid,
  ItemCard,
  Pill,
  Info,
  Empty,
  colors,
  fonts,
} from "../components/ui.js";
import { useApp } from "../data/AppProvider.js";
import {
  NEIGHBORHOODS,
  areaLabel,
  formatDate,
  OFFER_STATES,
} from "../core/catalog.js";
import { ResponseRow, SignInPrompt } from "./DetailScreens.js";
import { SEED_PASSWORD } from "../data/seed.js";

export function AccountScreen() {
  const app = useApp();
  const [register, setRegister] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [zone, setZone] = useState(app.barrio),
    [accept, setAccept] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (app.profile) {
      setName(app.profile.name);
      setZone(app.profile.barrio_id);
    }
  }, [app.profile?.id]);
  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (register) {
        if (!accept)
          throw new Error("Confirma las reglas de convivencia para continuar.");
        await app.signUp({ name, email, password, barrio_id: zone });
      } else await app.signIn(email, password);
      setPassword("");
      app.setNotice("Qué bueno tenerte aquí.");
      router.replace("/actividad");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (app.user)
    return (
      <Page
        wide={false}
        title="Tu lugar en la comunidad"
        subtitle="Administra tu perfil y lo que compartes con tus vecinos."
      >
        <Row style={{ gap: 16 }}>
          <Avatar name={app.profile?.name} size={64} />
          <View style={{ gap: 5 }}>
            <T style={{ fontFamily: fonts.title, fontSize: 23 }}>
              {app.profile?.name || "Vecino"}
            </T>
            <T style={{ color: colors.muted, fontSize: 13 }}>
              {areaLabel(app.profile?.barrio_id)}
            </T>
          </View>
        </Row>
        <Field
          label="Nombre visible"
          value={name}
          onChangeText={setName}
          maxLength={70}
        />
        <Choice
          label="Mi barrio declarado"
          value={zone}
          options={NEIGHBORHOODS}
          onChange={setZone}
        />
        <Info>
          El barrio de tu perfil se usa al recomendar. Cambiar el barrio de
          consulta en la cabecera no modifica este perfil ni tus opiniones
          anteriores.
        </Info>
        <Action
          onPress={() =>
            app.command(
              "update_profile",
              { name, barrio_id: zone },
              "Perfil actualizado.",
            )
          }
        >
          Guardar perfil
        </Action>
        <Button
          variant="secondary"
          icon="Bell"
          onPress={() => router.push("/actividad")}
        >
          Ver mis publicaciones y coordinaciones
        </Button>
        {app.moderator && (
          <Button
            icon="ShieldCheck"
            variant="secondary"
            onPress={() => router.push("/moderacion")}
          >
            Administración de comunidad
          </Button>
        )}
        <Button
          variant="secondary"
          icon="Settings"
          onPress={() => router.push("/ajustes")}
        >
          Ajustes e información
        </Button>
        <Action
          icon="LogOut"
          variant="ghost"
          onPress={async () => {
            await app.signOut();
            setEmail("");
            setPassword("");
            app.setNotice("Cerraste tu sesión.");
          }}
        >
          Cerrar sesión
        </Action>
      </Page>
    );
  return (
    <Page
      back
      wide={false}
      title={register ? "Hagamos comunidad" : "Qué bueno verte por aquí"}
      subtitle={
        register
          ? "Crea tu cuenta para compartir, recomendar y ayudar."
          : "Ingresa para conectar con quienes están cerca."
      }
    >
      <View
        style={{
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 20,
          padding: 25,
          gap: 19,
        }}
      >
        <Row>
          <Button
            variant={!register ? "primary" : "secondary"}
            onPress={() => {
              setRegister(false);
              setError("");
            }}
          >
            Ingresar
          </Button>
          <Button
            variant={register ? "primary" : "secondary"}
            onPress={() => {
              setRegister(true);
              setError("");
            }}
          >
            Crear cuenta
          </Button>
        </Row>
        {register && (
          <Field
            label="Nombre visible"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            maxLength={70}
          />
        )}
        <Field
          label="Correo electrónico"
          placeholder="tu@correo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          maxLength={150}
        />
        <Field
          label="Contraseña"
          placeholder="Al menos 8 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={register ? "new-password" : "current-password"}
          maxLength={128}
        />
        {register && (
          <>
            <Choice
              label="Tu barrio"
              value={zone}
              options={NEIGHBORHOODS}
              onChange={setZone}
            />
            <Toggle value={accept} onChange={setAccept}>
              Me comprometo a compartir información respetuosa y a proteger los
              datos personales de mis vecinos.
            </Toggle>
          </>
        )}
        {!!error && <ErrorText>{error}</ErrorText>}
        <Button loading={busy} icon="ArrowRight" onPress={submit}>
          {register ? "Crear mi cuenta" : "Entrar a mi comunidad"}
        </Button>
        {!register && app.mode === "remote" && (
          <Action
            variant="ghost"
            onPress={async () => {
              if (!email)
                throw new Error("Escribe primero tu correo electrónico.");
              const message = await app.recover(email);
              app.setNotice(message);
            }}
          >
            Recuperar contraseña
          </Action>
        )}
      </View>
      <T style={{ textAlign: "center", fontSize: 13, color: colors.muted }}>
        Puedes explorar los tres módulos sin iniciar sesión.
      </T>
      <Button variant="ghost" onPress={() => router.replace("/")}>
        Seguir explorando
      </Button>
    </Page>
  );
}
export function ActivityScreen() {
  const { data, user, refresh } = useApp();
  const [tab, setTab] = useState("posts");
  if (!user)
    return (
      <Page
        title="Tu actividad"
        subtitle="Todo lo que compartes y coordinas, en un solo lugar."
      >
        <SignInPrompt />
        <Button onPress={() => router.push("/cuenta")}>Ingresar</Button>
      </Page>
    );
  const posts = data.posts.filter(
      (p) => p.author_id === user.id && !p.deleted_at,
    ),
    businesses = data.businesses.filter(
      (p) => p.author_id === user.id && !p.deleted_at,
    );
  const offers = data.offers.filter(
    (o) =>
      o.volunteer_id === user.id ||
      data.posts.some((p) => p.id === o.post_id && p.author_id === user.id),
  );
  return (
    <Page
      title="Lo que compartimos"
      subtitle="Tus publicaciones, negocios y conversaciones de coordinación."
      actions={
        <Action variant="secondary" icon="RefreshCw" onPress={refresh}>
          Actualizar
        </Action>
      }
    >
      <Row style={{ flexWrap: "wrap" }}>
        {[
          ["posts", "Mis publicaciones"],
          ["businesses", "Mis negocios"],
          ["coordination", "Coordinación"],
        ].map(([id, title]) => (
          <Button
            key={id}
            variant={tab === id ? "primary" : "secondary"}
            onPress={() => setTab(id)}
          >
            {title}
          </Button>
        ))}
      </Row>
      {tab === "posts" && (
        <>
          <CardGrid>
            {posts.map((p) => (
              <ItemCard key={p.id} item={p} />
            ))}
          </CardGrid>
          {!posts.length && (
            <Empty
              action="Crear publicación"
              onPress={() =>
                router.push({ pathname: "/crear", params: { scope: "post" } })
              }
            />
          )}
        </>
      )}
      {tab === "businesses" && (
        <>
          <CardGrid>
            {businesses.map((b) => (
              <ItemCard key={b.id} item={b} scope="business" />
            ))}
          </CardGrid>
          {!businesses.length && (
            <Empty
              title="Tu negocio también tiene un lugar aquí"
              action="Registrar negocio"
              onPress={() =>
                router.push({
                  pathname: "/crear",
                  params: { scope: "business" },
                })
              }
            />
          )}
        </>
      )}
      {tab === "coordination" && (
        <Stack>
          <SectionTitle
            title="Ofertas de ayuda"
            subtitle="Enviadas por ti y recibidas en tus solicitudes."
          />
          {offers.map((o) => {
            const p = data.posts.find((p) => p.id === o.post_id);
            return (
              <Pressable
                key={o.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/publicacion/[id]",
                    params: { id: o.post_id },
                  })
                }
                style={{
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.line,
                  padding: 20,
                  borderRadius: 13,
                  gap: 10,
                }}
              >
                <Row style={{ justifyContent: "space-between" }}>
                  <T style={{ fontFamily: fonts.bold, flex: 1 }}>
                    {p?.title || "Solicitud de ayuda"}
                  </T>
                  <Pill>{OFFER_STATES[o.status]}</Pill>
                </Row>
                <T style={{ fontSize: 13, color: colors.muted }}>{o.message}</T>
                {!!o.reply && (
                  <T style={{ fontSize: 13 }}>Respuesta: {o.reply}</T>
                )}
                <T
                  style={{
                    color: colors.green,
                    fontSize: 12,
                    fontFamily: fonts.bold,
                  }}
                >
                  Abrir coordinación →
                </T>
              </Pressable>
            );
          })}
          {!offers.length && (
            <T style={{ color: colors.muted }}>
              Todavía no tienes ofertas de ayuda.
            </T>
          )}
          <SectionTitle title="Propuestas y respuestas" />
          {data.responses.map((r) => (
            <Stack key={r.id}>
              <Button
                variant="ghost"
                onPress={() =>
                  router.push({
                    pathname:
                      r.scope === "business"
                        ? "/ficha/[id]"
                        : "/publicacion/[id]",
                    params: { id: r.entity_id },
                  })
                }
              >
                Ver publicación relacionada →
              </Button>
              <ResponseRow response={r} />
            </Stack>
          ))}
          {!data.responses.length && (
            <T style={{ color: colors.muted }}>
              Aquí aparecerán tus propuestas y las respuestas de tus vecinos.
            </T>
          )}
        </Stack>
      )}
    </Page>
  );
}
export function SettingsScreen() {
  const { mode, signIn, user } = useApp();
  return (
    <Page
      back
      wide={false}
      title="Acerca de EntreVecinos"
      subtitle="Hecho para acercarnos, compartir y cuidarnos."
    >
      <Info icon="Heart">
        Nuestra comunidad conecta negocios, intercambios y apoyo vecinal. Cada
        recomendación es una opinión; cada reporte vecinal es información no
        verificada.
      </Info>
      <SectionTitle title="Datos y conexión" />
      <T style={{ lineHeight: 24 }}>
        {mode === "local"
          ? "Esta instalación guarda los datos en este dispositivo. Incluye perfiles y publicaciones de ejemplo para explorar los flujos. Los cambios permanecen al cerrar la app, pero no se comparten con otros dispositivos y se pueden perder al desinstalarla."
          : "Esta instalación está conectada a Supabase. Las publicaciones visibles se comparten entre los dispositivos conectados. Se necesita Internet para consultar y guardar cambios."}
      </T>
      <SectionTitle title="Privacidad y convivencia" />
      <T style={{ lineHeight: 24 }}>
        Tu correo de acceso no se publica. El contacto externo es voluntario y
        puedes retirarlo desde tu publicación. Los mensajes de coordinación son
        privados entre los participantes. Evita compartir domicilios precisos,
        datos de personas vulnerables o acusaciones.
      </T>
      <T style={{ lineHeight: 24 }}>
        Los barrios son declarados por los usuarios. La app no verifica
        residencia, transacciones ni reportes. Las recomendaciones
        institucionales enlazan fuentes identificadas y no implican respaldo de
        las instituciones al aplicativo.
      </T>
      {mode === "local" && (
        <Stack>
          <SectionTitle
            title="Cuentas de ejemplo"
            subtitle="Úsalas para recorrer los flujos desde distintos perfiles."
          />
          <T style={{ fontSize: 13 }}>
            Contraseña de estas cuentas: {SEED_PASSWORD}
          </T>
          {[
            ["Ana Torres", "ana@vecinos.example"],
            ["Luis Mendoza", "luis@vecinos.example"],
            ["Equipo de comunidad", "comunidad@vecinos.example"],
          ].map(([name, email]) => (
            <Action
              key={email}
              variant="secondary"
              onPress={async () => {
                await signIn(email, SEED_PASSWORD);
                router.replace("/actividad");
              }}
            >
              {name}
            </Action>
          ))}
          <T style={{ color: colors.muted, fontSize: 12 }}>
            Las cuentas locales son para datos de ejemplo. Utiliza una
            contraseña exclusiva si creas otra cuenta en esta instalación.
          </T>
        </Stack>
      )}
      <T style={{ color: colors.muted, fontSize: 12 }}>
        EntreVecinos · versión 1.0.0 · CimaTeam
      </T>
    </Page>
  );
}
