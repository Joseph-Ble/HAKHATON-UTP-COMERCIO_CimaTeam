import { test } from "node:test";
import assert from "node:assert/strict";
import { pbkdf2Sync } from "node:crypto";
import { SEED_PASSWORD, SEED_LOCAL_CREDENTIALS } from "../src/data/seed.js";

test("precomputed public example credential retains PBKDF2-SHA256 compatibility", () => {
  const expected = pbkdf2Sync(
    SEED_PASSWORD,
    SEED_LOCAL_CREDENTIALS.salt,
    210000,
    32,
    "sha256",
  ).toString("hex");
  assert.equal(SEED_LOCAL_CREDENTIALS.password_hash, expected);
});
