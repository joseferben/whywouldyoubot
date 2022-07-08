import { validateName } from "./utils";

test("validateEmail returns false for non-emails", () => {
  expect(validateName(undefined)).toBe(false);
  expect(validateName(null)).toBe(false);
  expect(validateName("")).toBe(false);
  expect(validateName("not-an-email")).toBe(false);
  expect(validateName("n@")).toBe(false);
});

test("validateEmail returns true for emails", () => {
  expect(validateName("kody@example.com")).toBe(true);
});
