import test from "node:test";
import assert from "node:assert/strict";

import { isAdminEmailAllowed, parseAdminEmailAllowlist } from "../src/lib/admin-access";

test("admin email allowlist normalizes configured addresses and denies others", () => {
  const allowedEmails = parseAdminEmailAllowlist(" Admin@Example.test, other@example.test ,, ");

  assert.equal(isAdminEmailAllowed(" admin@example.TEST ", allowedEmails), true);
  assert.equal(isAdminEmailAllowed("other@example.test", allowedEmails), true);
  assert.equal(isAdminEmailAllowed("user@example.test", allowedEmails), false);
  assert.equal(isAdminEmailAllowed(undefined, allowedEmails), false);
  assert.deepEqual([...parseAdminEmailAllowlist("")], []);
});