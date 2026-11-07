import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
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
import { createSeed, IDS, SEED_PASSWORD } from "./seed.js";
import { sessionStorage } from "./sessionStorage.js";

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
      const salt = Crypto.randomUUID();
      const password_hash = await hash(SEED_PASSWORD, salt);
      this.state.accounts = [
        ["ana@vecinos.example", IDS.ana],
        ["luis@vecinos.example", IDS.luis],
        ["comunidad@vecinos.example", IDS.mod],
      ].map(([email, id]) => ({ email, id, salt, password_hash }));
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
  async init() {
    check(
      url && key,
      "Configura tanto la URL como la clave publicable de Supabase.",
    );
    check(url.startsWith("https://"), "Supabase debe usar HTTPS.");
    this.client = createClient(url, key, {
      auth: {
        storage: sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    });
    this.client.auth.onAuthStateChange((_event, session) => {
      this.user = session?.user || null;
      this.onAuthChange?.(this.user);
    });
    if (Platform.OS !== "web")
      AppState.addEventListener("change", (s) =>
        s === "active"
          ? this.client.auth.startAutoRefresh()
          : this.client.auth.stopAutoRefresh(),
      );
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    this.user = data.session?.user || null;
    return this.user;
  }
  async snapshot() {
    const tables = [
      "profiles",
      "businesses",
      "posts",
      "reviews",
      "offers",
      "responses",
      "contacts",
      "history",
      "guidance",
      "services",
      "reports",
    ];
    const results = await Promise.all(
      tables.map((table) => this.client.from(table).select("*").limit(500)),
    );
    const state = {};
    results.forEach((r, i) => {
      if (r.error)
        throw new Error(`No se pudo cargar ${tables[i]}: ${r.error.message}`);
      state[tables[i]] = r.data;
    });
    const { data, error } = await this.client.from("user_roles").select("*");
    if (error) throw error;
    state.roles = data;
    return state;
  }
  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    this.user = data.user;
    return data.user;
  }
  async signUp(values) {
    const v = parse(accountSchema, values);
    const { data, error } = await this.client.auth.signUp({
      email: v.email,
      password: v.password,
      options: { data: { name: v.name, barrio_id: v.barrio_id } },
    });
    if (error) throw error;
    if (!data.session)
      throw new Error(
        "Cuenta creada. Revisa tu correo para confirmar el registro y luego inicia sesión.",
      );
    this.user = data.user;
    return data.user;
  }
  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
    this.user = null;
  }
  async command(action, payload) {
    const { data, error } = await this.client.rpc("app_command", {
      action_name: action,
      payload,
    });
    if (error) throw new Error(error.message);
    return data;
  }
  async recover(email) {
    const { error } = await this.client.auth.resetPasswordForEmail(
      email.trim(),
    );
    if (error) throw error;
    return "Si existe una cuenta con ese correo, recibirás instrucciones. La URL de recuperación debe estar configurada en Supabase.";
  }
}
export const repository =
  mode === "remote" ? new RemoteRepository() : new LocalRepository();
