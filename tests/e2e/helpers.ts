import { expect, type Page } from "@playwright/test";
import { DEMO_PASSWORD } from "../../src/server/demo-credentials";

export const PASSWORD = DEMO_PASSWORD;

export const ACCOUNTS = {
  admin: "admin@accphe.test",
  officer: "officer@accphe.test",
  editor: "editor@accphe.test",
  ethics: "ethics@accphe.test",
  reviewer: "reviewer@accphe.test",
  c1: "commissioner.a@accphe.test",
  c2: "commissioner.b@accphe.test",
  c3: "commissioner.c@accphe.test",
  institution: "registrar@example.edu",
} as const;

/** Sign in through the real form (dismisses any previous session first). */
export async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.context().clearCookies();
  await page.goto("/portal/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/portal/sign-in"));
}

/** Accept every confirm() dialog on the page. */
export function autoConfirm(page: Page) {
  page.on("dialog", (d) => void d.accept());
}

export async function toast(page: Page, text: string | RegExp) {
  await expect(page.locator(".toast")).toContainText(text);
}

/** The form's error alert (Next.js also renders an empty role="alert" route announcer). */
export const alertBox = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');
