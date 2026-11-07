import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  MapPin,
  ChevronDown,
  Plus,
  Search,
  Store,
  HandHeart,
  ShieldCheck,
  Home,
  UserRound,
  Bell,
  X,
  Check,
  Star,
  Wrench,
  Hammer,
  GraduationCap,
  Utensils,
  HeartPulse,
  Scissors,
  Sparkles,
  RefreshCw,
  BookOpen,
  Clock,
  Heart,
  Leaf,
  Bike,
  MessageCircle,
  CircleHelp,
  LogOut,
  Settings,
  Flag,
  CircleCheck,
  CheckCheck,
  LockKeyhole,
  ExternalLink,
} from "lucide-react-native";
import Svg, { Path, Rect, Circle, Line } from "react-native-svg";
import { useApp } from "../data/AppProvider.js";
import {
  NEIGHBORHOODS,
  areaLabel,
  categoryLabel,
  TYPES,
  STATES,
  formatDate,
  reviewStats,
} from "../core/catalog.js";

export const colors = {
  ink: "#183E35",
  muted: "#6E7D75",
  green: "#20594A",
  mint: "#E4EFE5",
  canvas: "#F7F8F4",
  line: "#E3E8DF",
  coral: "#DD7259",
  peach: "#F8E8DF",
  blue: "#E5EDF3",
  navy: "#36566B",
  white: "#FFFFFF",
  error: "#A63F32",
};
export const fonts = {
  regular: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  bold: "DMSans_700Bold",
  title: "Manrope_700Bold",
};
const icons = {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  MapPin,
  ChevronDown,
  Plus,
  Search,
  Store,
  HandHeart,
  ShieldCheck,
  Home,
  UserRound,
  Bell,
  X,
  Check,
  Star,
  Wrench,
  Hammer,
  GraduationCap,
  Utensils,
  HeartPulse,
  Scissors,
  Sparkles,
  RefreshCw,
  BookOpen,
  Clock,
  Heart,
  Leaf,
  Bike,
  MessageCircle,
  CircleHelp,
  LogOut,
  Settings,
  Flag,
  CircleCheck,
  CheckCheck,
  LockKeyhole,
  ExternalLink,
};
export const Icon = ({
  name = "Sparkles",
  size = 20,
  color = colors.ink,
  ...rest
}) => {
  const C = icons[name] || Sparkles;
  return <C size={size} color={color} strokeWidth={1.7} {...rest} />;
};
export const T = ({ children, style, ...props }) => (
  <Text {...props} style={[styles.text, style]}>
    {children}
  </Text>
);
export const Row = ({ children, style }) => (
  <View style={[styles.row, style]}>{children}</View>
);
export const Stack = ({ children, style }) => (
  <View style={[{ gap: 16 }, style]}>{children}</View>
);
export function Button({
  children,
  onPress,
  icon,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  testID,
}) {
  const light = variant !== "primary";
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        light ? styles.buttonLight : styles.buttonPrimary,
        variant === "ghost" && {
          backgroundColor: "transparent",
          borderWidth: 0,
        },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={light ? colors.green : colors.white}
        />
      ) : (
        icon && (
          <Icon
            name={icon}
            color={light ? colors.green : colors.white}
            size={18}
          />
        )
      )}
      <T
        style={{
          fontFamily: fonts.bold,
          color: light ? colors.green : colors.white,
        }}
      >
        {children}
      </T>
    </Pressable>
  );
}
export function Action({ onPress, children, ...props }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <View style={{ gap: 8 }}>
      <Button
        {...props}
        loading={busy}
        onPress={async () => {
          setBusy(true);
          setError("");
          try {
            await onPress();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {children}
      </Button>
      {!!error && <ErrorText>{error}</ErrorText>}
    </View>
  );
}
export const ErrorText = ({ children }) => (
  <T accessibilityRole="alert" style={{ color: colors.error, fontSize: 13 }}>
    {children}
  </T>
);
export function Chip({ children, selected, onPress, icon, color }) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected && {
          backgroundColor: colors.green,
          borderColor: colors.green,
        },
        color && { backgroundColor: color, borderColor: color },
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={15}
          color={selected ? colors.white : colors.green}
        />
      )}
      <T
        style={{
          fontSize: 12,
          fontFamily: fonts.medium,
          color: selected ? colors.white : colors.ink,
        }}
      >
        {children}
      </T>
    </Pressable>
  );
}
export const Pill = ({
  children,
  color = colors.mint,
  textColor = colors.green,
}) => (
  <View
    style={{
      alignSelf: "flex-start",
      backgroundColor: color,
      borderRadius: 6,
      paddingHorizontal: 9,
      paddingVertical: 5,
    }}
  >
    <T style={{ fontSize: 11, fontFamily: fonts.bold, color: textColor }}>
      {children}
    </T>
  </View>
);
export function Field({ label, error, hint, multiline, style, ...props }) {
  return (
    <View style={[{ gap: 7 }, style]}>
      <T style={styles.label}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8C978F"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        {...props}
        style={[
          styles.input,
          multiline && { minHeight: 112, paddingTop: 14 },
          error && { borderColor: colors.error },
        ]}
      />
      {error ? (
        <ErrorText>{error}</ErrorText>
      ) : hint ? (
        <T style={{ fontSize: 12, color: colors.muted }}>{hint}</T>
      ) : null}
    </View>
  );
}
export function Toggle({ value, onChange, children }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      aria-checked={value}
      onPress={() => onChange(!value)}
      style={[
        styles.row,
        { gap: 10, paddingVertical: 8, alignItems: "flex-start" },
      ]}
    >
      <View
        style={{
          height: 22,
          width: 22,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: value ? colors.green : "#ABB7AA",
          backgroundColor: value ? colors.green : colors.white,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {value && <Icon name="Check" size={16} color="white" />}
      </View>
      <T style={{ flex: 1, fontSize: 13, lineHeight: 20 }}>{children}</T>
    </Pressable>
  );
}
export function Sheet({ visible, title, onClose, children }) {
  if (!visible) return null;
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Cerrar ventana"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.modal}>
          <Row style={{ justifyContent: "space-between", marginBottom: 20 }}>
            <T style={{ fontFamily: fonts.title, fontSize: 22, flex: 1 }}>
              {title}
            </T>
            <Pressable
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
              onPress={onClose}
              style={{ padding: 10 }}
            >
              <Icon name="X" />
            </Pressable>
          </Row>
          <ScrollView keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function Choice({ label, value, options, onChange }) {
  return (
    <View style={{ gap: 8 }}>
      <T style={styles.label}>{label}</T>
      <Row style={{ flexWrap: "wrap" }}>
        {options.map((o) => {
          const id = Array.isArray(o) ? o[0] : o.id;
          const name = Array.isArray(o) ? o[1] : o.name;
          return (
            <Chip key={id} selected={value === id} onPress={() => onChange(id)}>
              {name}
            </Chip>
          );
        })}
      </Row>
    </View>
  );
}
export const SectionTitle = ({ title, subtitle, action, onPress }) => (
  <Row
    style={{
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginTop: 6,
    }}
  >
    <View style={{ flex: 1, gap: 5 }}>
      <T style={{ fontFamily: fonts.title, fontSize: 23, letterSpacing: -0.7 }}>
        {title}
      </T>
      {subtitle && (
        <T style={{ color: colors.muted, fontSize: 13 }}>{subtitle}</T>
      )}
    </View>
    {action && (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <T
          style={{ color: colors.green, fontFamily: fonts.bold, fontSize: 13 }}
        >
          {action} ↗
        </T>
      </Pressable>
    )}
  </Row>
);
export const Info = ({
  children,
  icon = "CircleHelp",
  color = colors.mint,
}) => (
  <Row
    style={{
      padding: 16,
      borderRadius: 12,
      backgroundColor: color,
      alignItems: "flex-start",
      gap: 10,
    }}
  >
    <Icon name={icon} size={19} />
    <T style={{ flex: 1, fontSize: 13, lineHeight: 20 }}>{children}</T>
  </Row>
);
export function Empty({
  title = "Todavía no hay publicaciones en tu zona",
  description = "Una comunidad empieza con alguien que comparte. Puedes ser tú.",
  action,
  onPress,
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
      <View style={styles.emptyIcon}>
        <Icon name="Leaf" size={28} />
      </View>
      <T style={{ fontFamily: fonts.title, fontSize: 18, textAlign: "center" }}>
        {title}
      </T>
      <T style={{ color: colors.muted, textAlign: "center", maxWidth: 360 }}>
        {description}
      </T>
      {action && (
        <Button onPress={onPress} variant="secondary" icon="Plus">
          {action}
        </Button>
      )}
    </View>
  );
}
export function Stars({ value, onChange, count }) {
  return (
    <Row style={{ gap: 4 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Pressable
          key={i}
          accessibilityLabel={`${i + 1} estrellas`}
          accessibilityRole={onChange ? "button" : "text"}
          onPress={() => onChange?.(i + 1)}
          disabled={!onChange}
          style={onChange && { padding: 6 }}
        >
          <Star
            size={onChange ? 28 : 14}
            strokeWidth={1.5}
            color="#C7923D"
            fill={i < Math.round(value) ? "#D8A34E" : "transparent"}
          />
        </Pressable>
      ))}
      {count !== undefined && (
        <T style={{ color: colors.muted, fontSize: 12, marginLeft: 4 }}>
          ({count})
        </T>
      )}
    </Row>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "¿Qué estás buscando?",
}) {
  return (
    <Row style={styles.search}>
      <Icon name="Search" color={colors.muted} />
      <TextInput
        accessibilityLabel="Buscar"
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#849188"
        style={{
          flex: 1,
          fontFamily: fonts.regular,
          fontSize: 15,
          color: colors.ink,
          paddingVertical: 13,
          outlineStyle: "none",
        }}
      />
      {!!value && (
        <Pressable
          accessibilityLabel="Limpiar búsqueda"
          onPress={() => onChange("")}
        >
          <Icon name="X" size={18} />
        </Pressable>
      )}
    </Row>
  );
}
export function Avatar({ name = "?", size = 40, color = colors.mint }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <T style={{ fontFamily: fonts.bold, fontSize: size * 0.34 }}>
        {name
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("")}
      </T>
    </View>
  );
}
export function ItemCard({ item, scope = "post", style }) {
  const { data, barrio } = useApp();
  const business = scope === "business";
  const stats = reviewStats(data.reviews, scope, item.id, barrio);
  const color = business
    ? colors.mint
    : item.module === "emergency"
      ? colors.blue
      : item.type === "free"
        ? colors.mint
        : colors.peach;
  const icon = business
    ? item.category === "home"
      ? "Wrench"
      : item.category === "hardware"
        ? "Hammer"
        : "Store"
    : item.type === "free"
      ? "HandHeart"
      : item.type === "swap"
        ? "Leaf"
        : item.module === "emergency"
          ? "ShieldCheck"
          : "Bike";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={() =>
        router.push({
          pathname: business ? "/ficha/[id]" : "/publicacion/[id]",
          params: { id: item.id },
        })
      }
      style={({ pressed }) => [
        styles.itemCard,
        style,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Row style={{ justifyContent: "space-between" }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: color,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            name={icon}
            size={24}
            color={business ? colors.green : colors.coral}
          />
        </View>
        <Icon name="ArrowUpRight" size={19} color={colors.muted} />
      </Row>
      <View style={{ gap: 8 }}>
        <T
          style={{
            fontSize: 11,
            fontFamily: fonts.bold,
            color: colors.muted,
            letterSpacing: 0.7,
          }}
        >
          {business
            ? categoryLabel(item.category).toUpperCase()
            : TYPES[item.type]?.toUpperCase()}
        </T>
        <T
          numberOfLines={2}
          style={{ fontFamily: fonts.title, fontSize: 18, lineHeight: 25 }}
        >
          {item.title}
        </T>
        <T
          numberOfLines={2}
          style={{ fontSize: 13, color: colors.muted, lineHeight: 21 }}
        >
          {item.description}
        </T>
      </View>
      <View style={{ gap: 9, marginTop: "auto" }}>
        {business ? (
          <Row>
            <Stars value={stats.average} count={stats.count} />
            <T style={{ fontSize: 12 }}>
              {stats.average ? stats.average.toFixed(1) : "Sin valoraciones"}
            </T>
          </Row>
        ) : (
          <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <Pill color={color}>{STATES[item.status]}</Pill>
            {item.price != null && (
              <T style={{ fontFamily: fonts.bold }}>
                S/ {Number(item.price).toFixed(2)}
              </T>
            )}
          </Row>
        )}
        <Row>
          <Icon name="MapPin" size={13} color={colors.muted} />
          <T style={{ fontSize: 12, color: colors.muted }}>
            {areaLabel(item.barrio_id)}
          </T>
        </Row>
        {item.module === "emergency" && (
          <T style={{ fontSize: 11, color: colors.navy }}>
            Reporte no verificado ·{" "}
            {formatDate(item.occurred_at || item.created_at)}
          </T>
        )}
      </View>
    </Pressable>
  );
}
export function CardGrid({ children }) {
  const { width } = useWindowDimensions();
  return (
    <View
      style={{
        flexDirection: width >= 700 ? "row" : "column",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      {React.Children.map(
        children,
        (child) =>
          child && (
            <View
              style={{
                width:
                  width >= 1050 ? "31.9%" : width >= 700 ? "48.6%" : "100%",
              }}
            >
              {child}
            </View>
          ),
      )}
    </View>
  );
}
export async function openURL(url) {
  if (!/^(https:\/\/|mailto:|tel:)/.test(url))
    throw new Error("Este enlace no es válido.");
  await Linking.openURL(url);
}
export function Town() {
  return (
    <Svg width="100%" height="180" viewBox="0 0 330 180">
      <Circle cx="260" cy="40" r="24" fill="#ECD7A5" />
      <Path d="M0 155Q75 100 150 150T330 145V180H0Z" fill="#BBD2BA" />
      <Rect x="50" y="67" width="67" height="83" rx="3" fill="#F3D2B5" />
      <Path d="M40 70L84 37L126 70Z" fill="#D67A60" />
      <Rect x="75" y="111" width="20" height="39" rx="3" fill="#557868" />
      <Rect x="61" y="83" width="15" height="17" rx="2" fill="#FCF5DF" />
      <Rect x="91" y="83" width="15" height="17" rx="2" fill="#FCF5DF" />
      <Rect x="140" y="88" width="95" height="64" fill="#E4E8C9" />
      <Path d="M130 89L185 51L243 89Z" fill="#6D9278" />
      <Rect x="153" y="103" width="69" height="24" rx="2" fill="#FCF5DF" />
      <Rect x="177" y="123" width="20" height="29" fill="#557868" />
      <Path
        d="M147 108H228"
        stroke="#D67A60"
        strokeWidth="12"
        strokeDasharray="11 6"
      />
      <Line
        x1="279"
        y1="111"
        x2="279"
        y2="154"
        stroke="#557868"
        strokeWidth="5"
      />
      <Circle cx="278" cy="99" r="23" fill="#71966F" />
      <Circle cx="263" cy="113" r="15" fill="#71966F" />
      <Path
        d="M82 155Q150 145 199 172"
        stroke="#F7F2E5"
        strokeWidth="12"
        fill="none"
      />
    </Svg>
  );
}
export function Page({
  children,
  title,
  subtitle,
  back = false,
  actions,
  wide = true,
}) {
  const { width } = useWindowDimensions();
  const desktop = width >= 850;
  const app = useApp();
  const path = usePathname();
  const [zones, setZones] = useState(false);
  const [refreshing, setRefreshing] = useState(false),
    [refreshError, setRefreshError] = useState("");
  const refresh = async () => {
    setRefreshing(true);
    setRefreshError("");
    try {
      await app.refresh();
    } catch (e) {
      setRefreshError(e.message);
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <View
          style={[styles.headerInner, { paddingHorizontal: desktop ? 32 : 20 }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="EntreVecinos, inicio"
            onPress={() => router.push("/")}
          >
            <Row style={{ gap: 8 }}>
              <View style={styles.logo}>
                <Icon name="Home" size={21} color="white" />
              </View>
              <T
                style={{
                  fontFamily: fonts.title,
                  fontSize: desktop ? 23 : 18,
                  letterSpacing: -1,
                }}
              >
                entre<T style={{ color: colors.coral }}>vecinos</T>
              </T>
            </Row>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setZones(true)}
            style={[styles.row, { gap: 6 }]}
          >
            <Icon name="MapPin" size={16} color={colors.green} />
            <View>
              <T
                style={{ fontSize: desktop ? 13 : 12, fontFamily: fonts.bold }}
              >
                {areaLabel(app.barrio)}
              </T>
              {desktop && (
                <T style={{ fontSize: 10, color: colors.muted }}>
                  TU COMUNIDAD
                </T>
              )}
            </View>
            <Icon name="ChevronDown" size={14} />
          </Pressable>
          <Row>
            {desktop && (
              <Pressable
                accessibilityLabel="Mi actividad"
                onPress={() => router.push("/actividad")}
                style={{ padding: 10 }}
              >
                <Icon name="Bell" />
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={app.user ? "Mi perfil" : "Ingresar"}
              onPress={() => router.push("/cuenta")}
              style={styles.account}
            >
              {app.user ? (
                <Avatar size={32} name={app.profile?.name || "Vecino"} />
              ) : (
                <Icon name="UserRound" size={18} />
              )}
              {desktop && (
                <T style={{ fontSize: 13, fontFamily: fonts.bold }}>
                  {app.user
                    ? app.profile?.name?.split(" ")[0] || "Mi cuenta"
                    : "Ingresar"}
                </T>
              )}
            </Pressable>
          </Row>
        </View>
      </View>
      {desktop && (
        <View style={styles.nav}>
          <Row
            style={{
              maxWidth: 1120,
              width: "100%",
              alignSelf: "center",
              gap: 28,
            }}
          >
            {[
              ["/", "Inicio"],
              ["/local", "Economía local"],
              ["/solidaria", "Economía solidaria"],
              ["/emergencias", "Emergencias"],
            ].map(([p, label]) => (
              <Pressable
                key={p}
                onPress={() => router.push(p)}
                style={{
                  paddingVertical: 15,
                  borderBottomWidth: 2,
                  borderBottomColor: path === p ? colors.green : "transparent",
                }}
              >
                <T
                  style={{
                    color: path === p ? colors.green : colors.muted,
                    fontSize: 13,
                    fontFamily: path === p ? fonts.bold : fonts.regular,
                  }}
                >
                  {label}
                </T>
              </Pressable>
            ))}
          </Row>
        </View>
      )}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: desktop ? 32 : 20,
          paddingTop: desktop ? 30 : 24,
          paddingBottom: 50,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            width: "100%",
            maxWidth: wide ? 1120 : 680,
            alignSelf: "center",
            gap: 26,
          }}
        >
          {back && (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
              }
            >
              <Row>
                <Icon name="ArrowLeft" size={17} />
                <T style={{ fontSize: 13 }}>Volver</T>
              </Row>
            </Pressable>
          )}
          {title && (
            <Row
              style={{
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <View style={{ flex: 1, minWidth: 200, gap: 8 }}>
                <T
                  accessibilityRole="header"
                  style={{
                    fontFamily: fonts.title,
                    fontSize: desktop ? 34 : 29,
                    letterSpacing: -1.1,
                  }}
                >
                  {title}
                </T>
                {subtitle && (
                  <T style={{ color: colors.muted, lineHeight: 22 }}>
                    {subtitle}
                  </T>
                )}
              </View>
              {actions}
            </Row>
          )}
          {app.loading && <ActivityIndicator color={colors.green} />}
          {!!(app.error || refreshError) && (
            <View style={{ gap: 10 }}>
              <ErrorText>{app.error || refreshError}</ErrorText>
              <Button
                variant="secondary"
                icon="RefreshCw"
                loading={refreshing}
                onPress={refresh}
              >
                Volver a cargar
              </Button>
            </View>
          )}
          {children}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.line,
              paddingTop: 24,
              marginTop: 10,
            }}
          >
            <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <T style={{ fontSize: 12, color: colors.muted }}>
                Lo mejor de tu barrio está en su gente.
              </T>
              <Pressable onPress={() => router.push("/ajustes")}>
                <T style={{ fontSize: 12, color: colors.muted }}>
                  Acerca de EntreVecinos ↗
                </T>
              </Pressable>
            </Row>
          </View>
        </View>
      </ScrollView>
      {!desktop && (
        <SafeAreaView
          edges={["bottom"]}
          style={{
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderTopColor: colors.line,
          }}
        >
          <Row
            style={{
              justifyContent: "space-around",
              paddingTop: 8,
              paddingBottom: 8,
            }}
          >
            {[
              ["/", "Home", "Inicio"],
              ["/actividad", "Bell", "Actividad"],
              ["/cuenta", "UserRound", "Mi cuenta"],
            ].map(([p, icon, label]) => (
              <Pressable
                accessibilityRole="button"
                key={p}
                onPress={() => router.push(p)}
                style={{
                  alignItems: "center",
                  gap: 3,
                  minWidth: 70,
                  padding: 4,
                }}
              >
                <Icon
                  name={icon}
                  size={21}
                  color={path === p ? colors.green : colors.muted}
                />
                <T
                  style={{
                    fontSize: 10,
                    color: path === p ? colors.green : colors.muted,
                  }}
                >
                  {label}
                </T>
              </Pressable>
            ))}
          </Row>
        </SafeAreaView>
      )}
      {!!app.notice && (
        <Pressable
          accessibilityRole="alert"
          onPress={() => app.setNotice("")}
          style={styles.toast}
        >
          <Icon name="CircleCheck" color="white" />
          <T style={{ flex: 1, color: "white", fontSize: 13 }}>{app.notice}</T>
          <Icon name="X" size={16} color="white" />
        </Pressable>
      )}
      <Sheet
        visible={zones}
        title="¿En qué barrio buscamos?"
        onClose={() => setZones(false)}
      >
        <Stack>
          <T style={{ color: colors.muted }}>
            Explora tu zona o conoce lo que comparten otras comunidades.
          </T>
          {NEIGHBORHOODS.map((n) => (
            <Action
              key={n.id}
              variant={app.barrio === n.id ? "primary" : "secondary"}
              icon="MapPin"
              onPress={async () => {
                await app.setBarrio(n.id);
                setZones(false);
              }}
            >
              {n.name} · {n.district}
            </Action>
          ))}
        </Stack>
      </Sheet>
    </SafeAreaView>
  );
}
export const styles = StyleSheet.create({
  text: { fontFamily: fonts.regular, color: colors.ink, fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerInner: {
    minHeight: 78,
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  account: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    padding: 7,
    borderRadius: 24,
  },
  nav: {
    backgroundColor: colors.white,
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  button: {
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 17,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },
  buttonPrimary: { backgroundColor: colors.green },
  buttonLight: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chip: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 13,
    minHeight: 38,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.white,
  },
  label: { fontFamily: fonts.bold, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: "#DCE3D8",
    backgroundColor: colors.white,
    padding: 13,
    minHeight: 48,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
    borderRadius: 10,
    outlineStyle: "none",
  },
  search: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 15,
    gap: 11,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 17,
    padding: 22,
    gap: 18,
    minHeight: 290,
    flex: 1,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    backgroundColor: colors.mint,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(18,39,30,0.45)",
    padding: 22,
  },
  modal: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "88%",
    backgroundColor: colors.canvas,
    borderRadius: 22,
    padding: 24,
  },
  toast: {
    position: "absolute",
    bottom: 90,
    left: 20,
    right: 20,
    maxWidth: 540,
    alignSelf: "center",
    backgroundColor: colors.green,
    padding: 17,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 5,
  },
});
