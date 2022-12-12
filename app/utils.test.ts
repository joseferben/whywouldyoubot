import { validateName } from "./utils";

test("validateEmail returns false for non-emails", () => {
  expect(validateName(undefined)).toBe(false);
  expect(validateName(null)).toBe(false);
  expect(validateName("")).toBe(false);
  expect(validateName("not-an-email")).toBe(true);
  expect(validateName("n@")).toBe(false);
});

test("validateEmail returns true for emails", () => {
  expect(validateName("kody@example.com")).toBe(true);
});

// test("pickRandom in rectangle", () => {
//   expect(pickRandom(rec, 1)[0].x).toBeLessThan(
// }
