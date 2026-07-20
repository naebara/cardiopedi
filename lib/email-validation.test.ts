import assert from "node:assert/strict";
import test from "node:test";
import { getEmailTypoSuggestion, validateOptionalEmail } from "./email-validation.ts";

test("accepts an empty optional email", () => {
  assert.deepEqual(validateOptionalEmail("  "), { isValid: true, normalizedEmail: "" });
});

test("normalizes the domain of a valid email", () => {
  assert.deepEqual(validateOptionalEmail(" copil@GMAIL.COM "), {
    isValid: true,
    normalizedEmail: "copil@gmail.com",
  });
});

test("rejects malformed email addresses", () => {
  assert.equal(validateOptionalEmail("copil@@gmail.com").isValid, false);
  assert.equal(validateOptionalEmail("copil@gmail").isValid, false);
  assert.equal(validateOptionalEmail(".copil@gmail.com").isValid, false);
  assert.equal(validateOptionalEmail("copil..test@gmail.com").isValid, false);
});

test("suggests corrections for common provider and TLD typos", () => {
  assert.equal(getEmailTypoSuggestion("copil@iahoo.vom"), "copil@yahoo.com");
  assert.equal(validateOptionalEmail("copil@iahoo.vom").isValid, false);
  assert.equal(getEmailTypoSuggestion("copil@gmial.com"), "copil@gmail.com");
});

test("does not alter a valid custom domain", () => {
  assert.equal(getEmailTypoSuggestion("copil@clinica.ro"), null);
  assert.equal(validateOptionalEmail("copil@clinica.ro").isValid, true);
});
