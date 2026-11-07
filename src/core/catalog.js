export const APP_NAME = "EntreVecinos";
export const NEIGHBORHOODS = [
  { id: "san-miguel", name: "San Miguel", district: "Lima" },
  { id: "pueblo-libre", name: "Pueblo Libre", district: "Lima" },
];
export const CATEGORIES = [
  ["shops", "Tiendas y minimarkets", "Store"],
  ["hardware", "Ferreterías", "Hammer"],
  ["education", "Educación y apoyo escolar", "GraduationCap"],
  ["food", "Alimentos y restaurantes", "Utensils"],
  ["health", "Salud y bienestar", "HeartPulse"],
  ["home", "Servicios técnicos y del hogar", "Wrench"],
  ["beauty", "Belleza y cuidado personal", "Scissors"],
  ["other", "Otros servicios y emprendimientos", "Sparkles"],
];
export const TYPES = {
  sell: "Venta",
  buy: "Compra",
  swap: "Intercambio",
  free: "Ayuda gratuita",
  report: "Reporte vecinal",
  help: "Solicitud de ayuda",
};
export const EMERGENCIES = {
  security: "Inseguridad ciudadana",
  nature: "Fenómenos naturales",
};
export const STATES = {
  active: "Activa",
  coordinating: "En coordinación",
  completed: "Finalizada",
  cancelled: "Cancelada",
  open: "Abierta",
  served: "Atendida",
  archived: "Archivada",
  inactive: "Desactivada",
};
export const OFFER_STATES = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "No aceptada",
  withdrawn: "Retirada",
};
export const categoryLabel = (id) =>
  CATEGORIES.find(([key]) => key === id)?.[1] || EMERGENCIES[id] || "Comunidad";
export const areaLabel = (id) =>
  NEIGHBORHOODS.find((n) => n.id === id)?.name || "Tu barrio";
export const normalize = (s = "") =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export const matches = (record, query) =>
  normalize(
    `${record.title} ${record.description} ${record.offering || ""} ${record.requesting || ""} ${categoryLabel(record.category)}`,
  ).includes(normalize(query).trim());
export const formatDate = (date) =>
  new Date(date).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Lima",
  });
export function reviewStats(reviews, scope, id, barrio) {
  const rows = reviews.filter((r) => r.scope === scope && r.entity_id === id);
  return {
    count: rows.length,
    average: rows.length
      ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length
      : 0,
    local: rows.filter((r) => r.recommends && r.barrio_id === barrio).length,
  };
}
export function nextStates(item, scope) {
  if (scope === "business")
    return item.status === "active" ? ["inactive"] : ["active"];
  if (item.type === "report")
    return item.status === "active" ? ["archived"] : [];
  if (item.type === "help")
    return (
      {
        open: ["coordinating", "cancelled"],
        coordinating: ["served", "cancelled"],
      }[item.status] || []
    );
  return (
    {
      active: ["coordinating", "completed", "cancelled"],
      coordinating: ["completed", "cancelled"],
    }[item.status] || []
  );
}
