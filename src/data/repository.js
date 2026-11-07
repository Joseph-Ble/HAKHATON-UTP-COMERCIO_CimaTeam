import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import { AppState, Platform } from "react-native";
import { createClient, processLock } from "@supabase/supabase-js";
import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import {
  accountSchema,
  applyCommand,
  check,
  parse,
  publicSnapshot,
} from "../core/domain.js";
import { createSeed, IDS, SEED_LOCAL_CREDENTIALS } from "./seed.js";
import { sessionStorage } from "./sessionStorage.js";
import { parseAuthLink } from "../core/authLinks.js";
import { remoteError } from "../core/remoteErrors.js";

const STORE_KEY = "entrevecinos.local.v1";
const SESSION_KEY = "entrevecinos.session";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const mode = url || key ? "remote" : "local";
const hash = async (password, salt) =>
  bytesToHex(
    await pbkdf2Async(sha256, password, salt, { c: 210000, dkLen: 32 }),
  );

class LocalRepository {
  mode = "local";
  state = null;
  user = null;
  queue = Promise.resolve();
  async init() {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (raw) {
      this.state = JSON.parse(raw);
      check(
        this.state.version === 1,
        "Los datos locales requieren una versión compatible.",
      );
    } else {
      this.state = createSeed();
      this.state.accounts = [
        ["ana@vecinos.example", IDS.ana],
        ["luis@vecinos.example", IDS.luis],
        ["comunidad@vecinos.example", IDS.mod],
      ].map(([email, id]) => ({ email, id, ...SEED_LOCAL_CREDENTIALS }));
      await this.persist(this.state);
    }
    const session = await sessionStorage.getItem(SESSION_KEY);
    this.user = this.state.profiles.find((p) => p.id === session) || null;
    return this.user;
  }
  async persist(state) {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(state));
    this.state = state;
  }
  async snapshot() {
    const { accounts, ...state } = this.state;
    return publicSnapshot(state, this.user?.id);
  }
  async signIn(email, password) {
    const account = this.state.accounts.find(
      (a) => a.email === email.trim().toLowerCase(),
    );
    check(
      account && (await hash(password, account.salt)) === account.password_hash,
      "Correo o contraseña incorrectos.",
    );
    await sessionStorage.setItem(SESSION_KEY, account.id);
    this.user = this.state.profiles.find((p) => p.id === account.id);
    return this.user;
  }
  async signUp(values) {
    return this.serialize(async () => {
      const data = parse(accountSchema, values);
      check(
        !this.state.accounts.some((a) => a.email === data.email),
        "Este correo ya tiene una cuenta.",
      );
      const salt = Crypto.randomUUID(),
        id = Crypto.randomUUID();
      const profile = {
        id,
        name: data.name,
        barrio_id: data.barrio_id,
        created_at: new Date().toISOString(),
      };
      const next = JSON.parse(JSON.stringify(this.state));
      next.profiles.push(profile);
      next.accounts.push({
        id,
        email: data.email,
        salt,
        password_hash: await hash(data.password, salt),
      });
      await this.persist(next);
      await sessionStorage.setItem(SESSION_KEY, id);
      this.user = profile;
      return profile;
    });
  }
  async signOut() {
    await sessionStorage.removeItem(SESSION_KEY);
    this.user = null;
  }
  serialize(task) {
    const operation = this.queue.then(task);
    this.queue = operation.catch(() => {});
    return operation;
  }
  async command(action, payload) {
    const actor = this.user?.id;
    return this.serialize(async () => {
      const { state, result } = applyCommand(
        this.state,
        actor,
        { action, payload },
        { id: () => Crypto.randomUUID() },
      );
      await this.persist(state);
      this.user = this.state.profiles.find((p) => p.id === actor);
      return result;
    });
  }
  async recover() {
    throw new Error(
      "Las cuentas guardadas en este dispositivo no usan correo de recuperación. En ajustes encontrarás las cuentas de ejemplo.",
    );
  }
}

class RemoteRepository {
  mode = "remote";
  user = null;
  authLinkError = "";
  async init() {
    check(
      url && key,
      "Configura tanto la URL como la clave publicable de Supabase.",
    );
    check(url.startsWith("https://"), "Supabase debe usar HTTPS.");
    this.authSubscription?.unsubscribe();
    this.linkSubscription?.remove();
    this.appStateSubscription?.remove();
    this.client = createClient(url, key, {
      auth: {
        storage: sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: "pkce",
        lock: processLock,
      },
    });
    const { data: subscription } = this.client.auth.onAuthStateChange(
      (_event, session) => {
        this.user = session?.user || null;
        this.onAuthChange?.(this.user);
      },
    );
    this.authSubscription = subscription.subscription;
    if (Platform.OS !== "web")
      this.appStateSubscription = AppState.addEventListener("change", (s) =>
        s === "active"
          ? this.client.auth.startAutoRefresh()
          : this.client.auth.stopAutoRefresh(),
      );
    const { data, error } = await this.client.auth.getSession();
    if (error) throw remoteError(error);
    this.user = data.session?.user || null;
    const initial = await Linking.getInitialURL();
    if (initial) await this.acceptAuthLink(initial);
    this.linkSubscription = Linking.addEventListener(
      "url",
      ({ url: incoming }) => {
        this.acceptAuthLink(incoming);
      },
    );
    return this.user;
  }
  async acceptAuthLink(incoming) {
    const parsed = parseAuthLink(
      incoming,
      Platform.OS === "web" ? globalThis.location?.origin : null,
    );
    if (!parsed) return;
    try {
      if (parsed.error) throw new Error(parsed.error);
      const result = parsed.code
        ? await this.client.auth.exchangeCodeForSession(parsed.code)
        : await this.client.auth.setSession({
            access_token: parsed.accessToken,
            refresh_token: parsed.refreshToken,
          });
      if (result.error) throw result.error;
      this.user = result.data.user || result.data.session?.user || null;
      this.authLinkError = "";
      this.onAuthError?.("");
      if (Platform.OS === "web")
        globalThis.history?.replaceState(
          globalThis.history.state,
          "",
          globalThis.location.pathname,
        );
    } catch {
      this.authLinkError =
        "No se pudo validar el enlace. Puede haber vencido o haberse abierto en otro dispositivo. Solicita uno nuevo.";
      this.onAuthError?.(this.authLinkError);
    }
  }
  async read(name, args) {
    const { data, error } = await this.client.rpc(name, args);
    if (error)
      throw remoteError(
        error,
        "No se pudo cargar la información. Vuelve a intentarlo.",
      );
    return data;
  }
  async snapshot(barrio = "san-miguel") {
    return this.read("get_context", { zone: barrio });
  }
  async list(scope, filters, page = 0) {
    return this.read("get_listing", {
      item_scope: scope,
      filters,
      page_index: page,
      page_size: 24,
    });
  }
  async detail(scope, id, barrio) {
    return this.read("get_item", {
      item_scope: scope,
      item_id: id,
      zone: barrio,
    });
  }
  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw remoteError(error);
    this.user = data.user;
    return data.user;
  }
  async signUp(values) {
    const v = parse(accountSchema, values);
    const { data, error } = await this.client.auth.signUp({
      email: v.email,
      password: v.password,
      options: {
        emailRedirectTo: Linking.createURL("cuenta"),
        data: { name: v.name, barrio_id: v.barrio_id },
      },
    });
    if (error) throw remoteError(error);
    if (!data.session)
      throw new Error(
        "Cuenta creada. Revisa tu correo para confirmar el registro y luego inicia sesión.",
      );
    this.user = data.user;
    return data.user;
  }
  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw remoteError(error);
    this.user = null;
  }
  async command(action, payload) {
    const { data, error } = await this.client.rpc("app_command", {
      action_name: action,
      payload,
    });
    if (error) throw remoteError(error);
    return data;
  }
  async recover(email) {
    const { error } = await this.client.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: Linking.createURL("recuperar") },
    );
    if (error) throw remoteError(error);
    return "Si existe una cuenta con ese correo, recibirás instrucciones para cambiar tu contraseña.";
  }
  async resetPassword(password) {
    check(
      password.length >= 8 && password.length <= 128,
      "Usa una contraseña de 8 a 128 caracteres.",
    );
    const { error } = await this.client.auth.updateUser({ password });
    if (error)
      throw remoteError(
        error,
        "No se pudo cambiar la contraseña. Solicita un enlace nuevo.",
      );
  }
}
export const repository =
  mode === "remote" ? new RemoteRepository() : new LocalRepository();
