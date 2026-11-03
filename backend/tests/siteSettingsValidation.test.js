import test from "node:test";
import assert from "node:assert/strict";
import { publicSiteSettings, siteSettingsUpdateInput } from "../src/siteSettingsValidation.js";
import { createSocketCorsOptions } from "../src/securityConfig.js";

test("site settings DTO ignores executable HTML and server-owned fields", () => {
  const input = siteSettingsUpdateInput({
    siteName: " Self Excellence ",
    primaryColor: "#f52246",
    customHeaderHtml: "<script>alert(1)</script>",
    singletonKey: "attacker",
    _id: "attacker"
  });
  assert.equal(input.siteName, "Self Excellence");
  assert.equal(input.primaryColor, "#f52246");
  assert.equal("customHeaderHtml" in input, false);
  assert.equal("singletonKey" in input, false);
  assert.equal("_id" in input, false);
});

test("public site settings never expose custom header HTML", () => {
  const output = publicSiteSettings({ siteName: "Self Excellence", customHeaderHtml: "<script>alert(1)</script>" });
  assert.equal(output.siteName, "Self Excellence");
  assert.equal("customHeaderHtml" in output, false);
});

test("Socket.IO uses the HTTP origin allowlist", async () => {
  const cors = createSocketCorsOptions();
  const allowed = await new Promise((resolve, reject) => cors.origin("http://127.0.0.1:5173", (error, result) => error ? reject(error) : resolve(result)));
  assert.equal(allowed, true);
  await assert.rejects(() => new Promise((resolve, reject) => cors.origin("https://evil.example", (error, result) => error ? reject(error) : resolve(result))), /not allowed/i);
});
