import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { repository } from "./repository.js";

const Context = createContext(null);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 20000 },
    mutations: { retry: false },
  },
});
export const useApp = () => useContext(Context);
function Provider({ children }) {
  const client = useQueryClient();
  const [booted, setBooted] = useState(false),
    [bootError, setBootError] = useState("");
  const [user, setUser] = useState(null),
    [barrio, setBarrioState] = useState("san-miguel");
  const [notice, setNotice] = useState("");
  const init = async () => {
    setBootError("");
    try {
      const me = await repository.init();
      setUser(me);
      const stored = await AsyncStorage.getItem("entrevecinos.barrio");
      if (stored) setBarrioState(stored);
      repository.onAuthChange = (u) => {
        setUser(u);
        client.clear();
      };
      setBooted(true);
    } catch (e) {
      setBootError(e.message);
    }
  };
  useEffect(() => {
    init();
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const query = useQuery({
    queryKey: ["snapshot", user?.id || "visitor"],
    queryFn: () => repository.snapshot(),
    enabled: booted,
  });
  const refresh = async () => {
    const result = await query.refetch();
    if (result.error) throw result.error;
    return result.data;
  };
  const command = async (
    action,
    payload,
    success = "Guardado correctamente.",
  ) => {
    const id = await repository.command(action, payload);
    const result = await query.refetch();
    if (result.error) {
      setNotice(
        "Se guardó, pero no se pudo actualizar la vista. Vuelve a cargar.",
      );
    } else if (success) setNotice(success);
    return id;
  };
  const authenticate = async (method, ...args) => {
    const me = await repository[method](...args);
    client.clear();
    setUser(me);
    return me;
  };
  const setBarrio = async (id) => {
    await AsyncStorage.setItem("entrevecinos.barrio", id);
    setBarrioState(id);
  };
  if (!booted)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 32,
          backgroundColor: "#F7F8F4",
          gap: 16,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: "#173F35",
            textAlign: "center",
          }}
        >
          EntreVecinos
        </Text>
        {bootError ? (
          <Text
            onPress={init}
            accessibilityRole="button"
            style={{ color: "#A22F25", textAlign: "center" }}
          >
            {bootError}
            {"\n\n"}Toca para reintentar
          </Text>
        ) : (
          <ActivityIndicator color="#173F35" />
        )}
      </View>
    );
  const empty = {
    profiles: [],
    businesses: [],
    posts: [],
    reviews: [],
    offers: [],
    responses: [],
    history: [],
    contacts: [],
    reports: [],
    guidance: [],
    services: [],
    roles: [],
  };
  const data = query.data || empty;
  const profile = data.profiles.find((p) => p.id === user?.id);
  return (
    <Context.Provider
      value={{
        data,
        user,
        profile,
        barrio,
        setBarrio,
        command,
        refresh,
        loading: query.isPending,
        error: query.error?.message,
        mode: repository.mode,
        notice,
        setNotice,
        signIn: (...args) => authenticate("signIn", ...args),
        signUp: (...args) => authenticate("signUp", ...args),
        signOut: async () => {
          await repository.signOut();
          client.clear();
          setUser(null);
        },
        recover: (email) => repository.recover(email),
        moderator: data.roles.some(
          (r) => r.user_id === user?.id && r.role === "moderator",
        ),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function AppProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>{children}</Provider>
    </QueryClientProvider>
  );
}
