import React, { useState } from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Page,
  T,
  Row,
  Button,
  Action,
  Icon,
  CardGrid,
  ItemCard,
  SectionTitle,
  SearchBox,
  Chip,
  Pill,
  Info,
  Empty,
  Town,
  ListingStatus,
  colors,
  fonts,
  openURL,
} from "../components/ui.js";
import { useApp } from "../data/AppProvider.js";
import { useListing } from "../data/useReadModels.js";
import {
  CATEGORIES,
  EMERGENCIES,
  areaLabel,
  formatDate,
  matches,
  reviewStats,
} from "../core/catalog.js";

function create(scope, extras = {}) {
  router.push({ pathname: "/crear", params: { scope, ...extras } });
}
const publicRows = (rows, barrio) =>
  rows.filter(
    (r) =>
      r.barrio_id === barrio && r.visibility === "visible" && !r.deleted_at,
  );
const fresh = (rows) =>
  [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
export function HomeScreen() {
  const { data, barrio } = useApp();
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  const businesses = fresh(
    publicRows(data.businesses, barrio).filter((b) => b.status === "active"),
  );
  const posts = fresh(
    publicRows(data.posts, barrio).filter(
      (p) => p.module === "solidarity" && p.status === "active",
    ),
  );
  return (
    <Page>
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          padding: wide ? 36 : 22,
          borderRadius: 24,
          backgroundColor: "#E9F0E3",
          gap: 12,
          overflow: "hidden",
        }}
      >
        <View style={{ flex: 1, gap: wide ? 18 : 12 }}>
          <Row>
            <View
              style={{
                width: 7,
                height: 7,
                backgroundColor: colors.green,
                borderRadius: 5,
              }}
            />
            <T
              style={{
                fontSize: 11,
                fontFamily: fonts.bold,
                letterSpacing: 1.4,
              }}
            >
              CERCA DE TI, CERCA DE TODOS
            </T>
          </Row>
          <View>
            <T
              accessibilityRole="header"
              style={{
                fontFamily: fonts.title,
                fontSize: wide ? 49 : 32,
                letterSpacing: -2,
              }}
            >
              Tu barrio.
            </T>
            <T
              style={{
                fontFamily: fonts.title,
                fontSize: wide ? 49 : 32,
                color: colors.green,
                letterSpacing: -2,
              }}
            >
              Más cerca.
            </T>
          </View>
          <T
            style={{
              color: "#5E7565",
              fontSize: 15,
              lineHeight: 24,
              maxWidth: 420,
            }}
          >
            {wide
              ? "Encuentra lo que necesitas, comparte lo que tienes y construyamos comunidad, entre vecinos."
              : "Negocios, intercambios y apoyo. Todo empieza con un vecino."}
          </T>
          <Row style={{ gap: 6, display: wide ? "flex" : "none" }}>
            <Icon name="MapPin" size={14} />
            <T style={{ fontSize: 12, fontFamily: fonts.medium }}>
              {areaLabel(barrio)}, Lima
            </T>
            <T style={{ color: "#A0B39E" }}> · </T>
            <T style={{ fontSize: 12, color: colors.muted }}>
              Tu punto de encuentro
            </T>
          </Row>
        </View>
        <View
          style={{
            display: wide ? "flex" : "none",
            width: wide ? "37%" : "100%",
            justifyContent: "flex-end",
            marginBottom: wide ? 0 : -24,
          }}
        >
          <Town />
        </View>
      </View>
      <SectionTitle
        title="¿Qué hacemos hoy?"
        subtitle="Tres formas de hacer más por nuestra comunidad."
      />
      <CardGrid>
        {[
          {
            title: "Economía local",
            subtitle: "El talento está a unas cuadras",
            body: "Descubre negocios, oficios y servicios recomendados por tus vecinos.",
            icon: "Store",
            bg: colors.peach,
            ink: "#B86147",
            path: "/local",
            cta: "Explorar mi barrio",
          },
          {
            title: "Economía solidaria",
            subtitle: "Compartir nos acerca",
            body: "Compra, vende, intercambia o ayuda. Siempre hay algo que podemos compartir.",
            icon: "HandHeart",
            bg: colors.mint,
            ink: colors.green,
            path: "/solidaria",
            cta: "Conectar con vecinos",
          },
          {
            title: "Respuesta ante emergencias",
            subtitle: "Una comunidad que se cuida",
            body: "Prepárate, comparte información y coordina apoyo cuando haga falta.",
            icon: "ShieldCheck",
            bg: colors.blue,
            ink: colors.navy,
            path: "/emergencias",
            cta: "Cuidarnos juntos",
          },
        ].map((m) => (
          <Pressable
            accessibilityRole="button"
            key={m.path}
            onPress={() => router.push(m.path)}
            style={({ pressed }) => ({
              backgroundColor: m.bg,
              padding: wide ? 25 : 18,
              borderRadius: 18,
              gap: wide ? 17 : 13,
              flex: 1,
              flexDirection: wide ? "column" : "row",
              alignItems: wide ? "stretch" : "center",
              minHeight: wide ? 285 : 94,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View
              style={{
                width: 47,
                height: 47,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 14,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Icon name={m.icon} color={m.ink} size={26} />
            </View>
            <View style={{ gap: 8, flex: wide ? undefined : 1 }}>
              <T
                style={{
                  fontFamily: fonts.title,
                  fontSize: wide ? 22 : 18,
                  lineHeight: wide ? 29 : 24,
                  letterSpacing: -0.7,
                }}
              >
                {m.title}
              </T>
              <T style={{ fontSize: 12, color: m.ink, fontFamily: fonts.bold }}>
                {m.subtitle}
              </T>
              <T
                style={{
                  display: wide ? "flex" : "none",
                  color: "#68776D",
                  lineHeight: 21,
                  fontSize: 13,
                }}
              >
                {m.body}
              </T>
            </View>
            <Row
              style={{
                justifyContent: "space-between",
                marginTop: wide ? "auto" : 0,
              }}
            >
              <T
                style={{
                  display: wide ? "flex" : "none",
                  fontFamily: fonts.bold,
                  fontSize: 13,
                  color: m.ink,
                }}
              >
                {m.cta}
              </T>
              <Icon name="ArrowRight" color={m.ink} size={18} />
            </Row>
          </Pressable>
        ))}
      </CardGrid>
      <SectionTitle
        title="Lo bueno está cerca"
        subtitle="Conoce a quienes dan vida a tu barrio."
        action="Ver negocios"
        onPress={() => router.push("/local")}
      />
      <CardGrid>
        {businesses.slice(0, 3).map((b) => (
          <ItemCard key={b.id} item={b} scope="business" />
        ))}
      </CardGrid>
      {!businesses.length && (
        <Empty
          title="Conozcamos los negocios de tu barrio"
          action="Registrar negocio"
          onPress={() => create("business")}
        />
      )}
      <View
        style={{
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 16,
          padding: 22,
        }}
      >
        <Row style={{ gap: 16, alignItems: "flex-start" }}>
          <View
            style={{
              backgroundColor: colors.peach,
              padding: 12,
              borderRadius: 12,
            }}
          >
            <Icon name="Heart" color={colors.coral} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <T style={{ fontFamily: fonts.title, fontSize: 20 }}>
              Un pequeño gesto. Un gran barrio.
            </T>
            <T style={{ fontSize: 13, color: colors.muted, lineHeight: 21 }}>
              Una herramienta prestada, un libro compartido o una mano amiga. Tu
              ayuda puede hacer la diferencia.
            </T>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/solidaria",
                  params: { tipo: "free" },
                })
              }
            >
              <Row style={{ marginTop: 5 }}>
                <T
                  style={{
                    color: colors.green,
                    fontFamily: fonts.bold,
                    fontSize: 13,
                  }}
                >
                  Descubrir ayuda gratuita
                </T>
                <Icon name="ArrowRight" size={16} />
              </Row>
            </Pressable>
          </View>
        </Row>
      </View>
      <SectionTitle
        title="El barrio comparte"
        subtitle="Publicaciones para conectar con tus vecinos."
        action="Ver publicaciones"
        onPress={() => router.push("/solidaria")}
      />
      <CardGrid>
        {posts.slice(0, 3).map((p) => (
          <ItemCard key={p.id} item={p} />
        ))}
      </CardGrid>
    </Page>
  );
}
export function LocalScreen() {
  const { data, barrio } = useApp();
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("all"),
    [sort, setSort] = useState("recent");
  let localRows = fresh(
    publicRows(data.businesses, barrio).filter(
      (b) =>
        b.status === "active" &&
        matches(b, search) &&
        (category === "all" || b.category === category),
    ),
  );
  if (sort === "recommended")
    localRows = localRows.sort(
      (a, b) =>
        reviewStats(data.reviews, "business", b.id, barrio).local -
        reviewStats(data.reviews, "business", a.id, barrio).local,
    );
  const list = useListing(
    "business",
    { barrio_id: barrio, search, category, sort },
    localRows,
  );
  const rows = list.rows;
  return (
    <Page
      title="El talento de tu barrio"
      subtitle="Negocios, oficios y servicios. Cerca de casa, recomendados por vecinos."
      actions={
        <Button icon="Plus" onPress={() => create("business")}>
          Registrar mi negocio
        </Button>
      }
    >
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Busca un negocio, producto u oficio…"
      />
      <Row style={{ flexWrap: "wrap" }}>
        <Chip selected={category === "all"} onPress={() => setCategory("all")}>
          Todas las categorías
        </Chip>
        {CATEGORIES.map(([id, name, icon]) => (
          <Chip
            key={id}
            icon={icon}
            selected={category === id}
            onPress={() => setCategory(id)}
          >
            {name}
          </Chip>
        ))}
      </Row>
      <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <T style={{ fontSize: 13, color: colors.muted }}>
          {rows.length}{" "}
          {list.remote
            ? rows.length === 1
              ? "negocio cargado"
              : "negocios cargados"
            : rows.length === 1
              ? "negocio encontrado"
              : "negocios encontrados"}{" "}
          en {areaLabel(barrio)}
        </T>
        <Row>
          <Chip selected={sort === "recent"} onPress={() => setSort("recent")}>
            Recientes
          </Chip>
          <Chip
            selected={sort === "recommended"}
            onPress={() => setSort("recommended")}
          >
            Recomendados
          </Chip>
        </Row>
      </Row>
      <CardGrid>
        {rows.map((r) => (
          <ItemCard key={r.id} scope="business" item={r} />
        ))}
      </CardGrid>
      <ListingStatus list={list} />
      {!rows.length && !list.loading && !list.error && (
        <Empty
          action="Registrar un negocio"
          onPress={() => create("business")}
        />
      )}
    </Page>
  );
}
export function SolidarityScreen() {
  const params = useLocalSearchParams();
  const { data, barrio } = useApp();
  const type = ["sell", "buy", "swap", "free"].includes(params.tipo)
    ? params.tipo
    : "sell";
  const [search, setSearch] = useState(""),
    [activeOnly, setActiveOnly] = useState(true),
    [intent, setIntent] = useState("all");
  const localRows = fresh(
    publicRows(data.posts, barrio).filter(
      (p) =>
        p.module === "solidarity" &&
        p.type === type &&
        matches(p, search) &&
        (!activeOnly || ["active", "coordinating"].includes(p.status)) &&
        (type !== "free" || intent === "all" || p.intent === intent),
    ),
  );
  const list = useListing(
    "post",
    {
      barrio_id: barrio,
      module: "solidarity",
      type,
      search,
      activeOnly,
      intent: type === "free" ? intent : "all",
    },
    localRows,
  );
  const rows = list.rows;
  const change = (tipo) => router.setParams({ tipo });
  return (
    <Page
      title="Compartir nos acerca"
      subtitle="Lo que ya no usas, lo que buscas y lo que puedes aportar. Todo empieza con un vecino."
      actions={
        <Button
          icon="Plus"
          onPress={() => create("post", { type, module: "solidarity" })}
        >
          Publicar
        </Button>
      }
    >
      <Row style={{ flexWrap: "wrap", gap: 12 }}>
        {[
          ["sell", "¿Quieres vender?", "Store"],
          ["buy", "¿Quieres comprar?", "Search"],
          ["swap", "¿Quieres intercambiar?", "Leaf"],
        ].map(([id, name, icon]) => (
          <Button
            key={id}
            variant={type === id ? "primary" : "secondary"}
            icon={icon}
            onPress={() => change(id)}
          >
            {name}
          </Button>
        ))}
      </Row>
      <Pressable
        accessibilityRole="button"
        onPress={() => change("free")}
        style={{
          padding: 18,
          backgroundColor: type === "free" ? colors.green : colors.mint,
          borderRadius: 13,
        }}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <Row style={{ flex: 1 }}>
            <Icon
              name="HandHeart"
              color={type === "free" ? "white" : colors.green}
            />
            <T
              style={{
                flex: 1,
                fontFamily: fonts.bold,
                color: type === "free" ? "white" : colors.green,
              }}
            >
              Ayuda gratuita, donación y préstamo
            </T>
          </Row>
          <Icon
            name="ArrowRight"
            size={18}
            color={type === "free" ? "white" : colors.green}
          />
        </Row>
      </Pressable>
      <SectionTitle
        title={
          type === "sell"
            ? "Ofertas de tus vecinos"
            : type === "buy"
              ? "Lo que buscan los vecinos"
              : type === "swap"
                ? "Demos y recibamos"
                : "Ayudarnos sin dinero"
        }
        subtitle={
          type === "buy"
            ? "Publica lo que necesitas o descubre ofertas disponibles."
            : "Explora las publicaciones y coordina con su autor."
        }
      />
      {type === "buy" && (
        <Button
          variant="secondary"
          onPress={() => change("sell")}
          icon="Search"
        >
          Ver ofertas disponibles
        </Button>
      )}
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Buscar en las publicaciones…"
      />
      <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <Row style={{ flexWrap: "wrap" }}>
          <Chip
            selected={activeOnly}
            onPress={() => setActiveOnly(!activeOnly)}
          >
            {activeOnly ? "Solo activas" : "Todos los estados"}
          </Chip>
          {type === "free" &&
            [
              ["all", "Todo"],
              ["need", "Necesito ayuda"],
              ["offer", "Ofrezco ayuda"],
            ].map(([id, name]) => (
              <Chip
                key={id}
                selected={intent === id}
                onPress={() => setIntent(id)}
              >
                {name}
              </Chip>
            ))}
        </Row>
        <T style={{ color: colors.muted, fontSize: 12 }}>
          {rows.length} publicaciones
        </T>
      </Row>
      <CardGrid>
        {rows.map((p) => (
          <ItemCard key={p.id} item={p} />
        ))}
      </CardGrid>
      <ListingStatus list={list} />
      {!rows.length && !list.loading && !list.error && (
        <Empty
          action="Crear publicación"
          onPress={() => create("post", { type, module: "solidarity" })}
        />
      )}
    </Page>
  );
}
export function EmergencyScreen() {
  const { categoria } = useLocalSearchParams();
  const { data, barrio, refresh } = useApp();
  const [search, setSearch] = useState(""),
    [onlyHelp, setOnlyHelp] = useState(false);
  const category = ["security", "nature"].includes(categoria)
    ? categoria
    : null;
  const localRows = fresh(
    publicRows(data.posts, barrio).filter(
      (p) =>
        p.module === "emergency" &&
        p.category === category &&
        (!onlyHelp || p.type === "help") &&
        matches(p, search),
    ),
  );
  const list = useListing(
    "post",
    {
      barrio_id: barrio,
      module: "emergency",
      category: category || "all",
      type: onlyHelp ? "help" : "all",
      search,
    },
    localRows,
    !!category,
  );
  const rows = list.rows;
  if (!category)
    return (
      <Page
        title="Una comunidad que se cuida"
        subtitle="Infórmate, prepárate y coordina apoyo de forma responsable."
      >
        <Info icon="ShieldCheck">
          Ante peligro inmediato, contacta primero a los servicios oficiales.
          EntreVecinos no reemplaza a Policía, Bomberos ni Defensa Civil.
        </Info>
        <CardGrid>
          {[
            [
              "security",
              "Inseguridad ciudadana",
              "Información para cuidarte, comunicar incidentes y coordinar apoyo sin exponerte.",
              "ShieldCheck",
              colors.blue,
            ],
            [
              "nature",
              "Fenómenos naturales",
              "Preparación ante sismos, lluvias, inundaciones y efectos del fenómeno El Niño.",
              "Leaf",
              colors.mint,
            ],
          ].map(([id, title, text, icon, bg]) => (
            <Pressable
              key={id}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/emergencias",
                  params: { categoria: id },
                })
              }
              style={{
                padding: 28,
                borderRadius: 18,
                backgroundColor: bg,
                minHeight: 235,
                gap: 18,
              }}
            >
              <Icon name={icon} size={32} />
              <T style={{ fontFamily: fonts.title, fontSize: 23 }}>{title}</T>
              <T style={{ color: colors.muted, lineHeight: 22 }}>{text}</T>
              <Icon name="ArrowRight" />
            </Pressable>
          ))}
        </CardGrid>
        <SectionTitle
          title="Canales de apoyo"
          subtitle="Fuentes identificadas y contactos oficiales."
        />
        <Button
          variant="secondary"
          icon="BookOpen"
          onPress={() => router.push("/directorio")}
        >
          Ver directorio de apoyo
        </Button>
      </Page>
    );
  return (
    <Page
      back
      title={EMERGENCIES[category]}
      subtitle="Primero nos informamos. Después nos organizamos."
      actions={
        <Button
          icon="Plus"
          onPress={() =>
            create("post", { module: "emergency", category, type: "help" })
          }
        >
          Publicar
        </Button>
      }
    >
      <Info icon="ShieldCheck">
        Si hay violencia activa, rescate o riesgo eléctrico, busca un lugar
        seguro y contacta los servicios oficiales. No te expongas para ayudar.
      </Info>
      <Button
        variant="secondary"
        icon="BookOpen"
        onPress={() => router.push("/directorio")}
      >
        Servicios oficiales y grupos de apoyo
      </Button>
      <SectionTitle
        title="Información institucional"
        subtitle="Orientación educativa con fuentes. No son alertas en tiempo real."
      />
      {data.guidance
        .filter((g) => g.category === category && g.visible)
        .map((g) => (
          <View
            key={g.id}
            style={{
              padding: 24,
              borderRadius: 16,
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.line,
              gap: 13,
            }}
          >
            <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <Pill>
                {g.institution} · {g.event}
              </Pill>
              <T style={{ fontSize: 11, color: colors.muted }}>
                Revisión: {formatDate(`${g.reviewed_at}T12:00:00Z`)}
              </T>
            </Row>
            <T style={{ fontFamily: fonts.title, fontSize: 20 }}>{g.title}</T>
            <T style={{ lineHeight: 23, color: colors.muted }}>{g.body}</T>
            <Action
              variant="ghost"
              icon="ExternalLink"
              onPress={() => openURL(g.source_url)}
            >
              Consultar fuente original
            </Action>
          </View>
        ))}
      <SectionTitle
        title="Lo que comparte la comunidad"
        subtitle="Reportes vecinales no verificados. Revisa siempre la fecha del hecho."
      />
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Buscar reportes o necesidades…"
      />
      <Row style={{ flexWrap: "wrap" }}>
        <Chip selected={!onlyHelp} onPress={() => setOnlyHelp(false)}>
          Todos los reportes
        </Chip>
        <Chip
          icon="HandHeart"
          selected={onlyHelp}
          onPress={() => setOnlyHelp(true)}
        >
          Solicitudes de ayuda
        </Chip>
        <Action icon="RefreshCw" variant="ghost" onPress={refresh}>
          Actualizar
        </Action>
      </Row>
      {category === "security" && (
        <T style={{ fontSize: 12, color: colors.muted }}>
          Las publicaciones y sus ediciones pasan por revisión antes de ser
          públicas. La revisión puede demorar.
        </T>
      )}
      <CardGrid>
        {rows.map((p) => (
          <ItemCard key={p.id} item={p} />
        ))}
      </CardGrid>
      <ListingStatus list={list} />
      {!rows.length && !list.loading && !list.error && (
        <Empty
          action="Solicitar apoyo"
          onPress={() =>
            create("post", { module: "emergency", category, type: "help" })
          }
        />
      )}
    </Page>
  );
}
export function SupportScreen() {
  const { data } = useApp();
  return (
    <Page
      back
      title="Canales de apoyo"
      subtitle="Recursos oficiales para informarte y pedir asistencia."
    >
      <Info>
        La disponibilidad local no está confirmada por EntreVecinos. Ante
        peligro inmediato utiliza los canales oficiales.
      </Info>
      {data.services.map((s) => (
        <View
          key={s.id}
          style={{
            backgroundColor: colors.white,
            padding: 24,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.line,
            gap: 14,
          }}
        >
          <Pill>{s.category}</Pill>
          <T style={{ fontFamily: fonts.title, fontSize: 22 }}>{s.title}</T>
          <T style={{ color: colors.muted, lineHeight: 23 }}>{s.description}</T>
          <Row style={{ flexWrap: "wrap" }}>
            {s.phone && (
              <Action
                onPress={() => openURL(`tel:${s.phone}`)}
                icon="MessageCircle"
              >
                Llamar al {s.phone}
              </Action>
            )}
            <Action
              variant="secondary"
              icon="ExternalLink"
              onPress={() => openURL(s.source_url)}
            >
              Fuente oficial
            </Action>
          </Row>
          <T style={{ color: colors.muted, fontSize: 11 }}>
            Revisado el {formatDate(`${s.reviewed_at}T12:00:00Z`)}
          </T>
        </View>
      ))}
    </Page>
  );
}
