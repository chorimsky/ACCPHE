import { expect, test } from "@playwright/test";
import { ACCOUNTS, alertBox, PASSWORD, signIn } from "./helpers";

test.describe("access control", () => {
  test("signed-out visitors are sent to sign-in, and come back after", async ({ page }) => {
    await page.goto("/portal/applications");
    await expect(page).toHaveURL(/\/portal\/sign-in\?next=%2Fportal%2Fapplications/);
    await page.getByLabel("Email").fill(ACCOUNTS.officer);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/portal\/applications$/);
  });

  test("a wrong password is refused without revealing whether the account exists", async ({ page }) => {
    await page.goto("/portal/sign-in");
    await page.getByLabel("Email").fill(ACCOUNTS.admin);
    await page.getByLabel("Password", { exact: true }).fill("wrong-password-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(alertBox(page)).toHaveText("The email or password is incorrect.");
    await page.getByLabel("Email").fill("nobody@example.org");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(alertBox(page)).toHaveText("The email or password is incorrect.");
  });

  const cases: [keyof typeof ACCOUNTS, string, RegExp][] = [
    ["officer", "/portal/users", /\/portal\/overview$/],
    ["editor", "/portal/applications", /\/portal\/overview$/],
    ["ethics", "/portal/news", /\/portal\/overview$/],
    ["reviewer", "/portal/overview", /\/portal\/reviews$/],
    ["c1", "/portal/applications", /\/portal\/decisions$/],
    ["institution", "/portal/directory", /\/portal\/my-application$/],
  ];

  for (const [who, path, home] of cases) {
    test(`${who} cannot open ${path}`, async ({ page }) => {
      await signIn(page, ACCOUNTS[who]);
      await page.goto(path);
      await expect(page).toHaveURL(home);
    });
  }

  test("modules a role cannot use are absent from its navigation", async ({ page }) => {
    await signIn(page, ACCOUNTS.editor);
    const nav = page.getByRole("navigation", { name: "Modules" }).first();
    await expect(nav.getByRole("link", { name: /News & articles/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Applications/ })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: /Users & access/ })).toHaveCount(0);
  });

  test("an institution sees only its own application and cannot export data", async ({ page }) => {
    await signIn(page, ACCOUNTS.institution);
    await expect(page.getByRole("heading", { name: "Sample Christian University (demo)" })).toBeVisible();
    expect((await page.request.get("/portal/export/applications")).status()).toBe(404);
    expect((await page.request.get("/portal/export/audit")).status()).toBe(404);
  });

  test("documents cannot be downloaded without access", async ({ page, request }) => {
    expect((await request.get("/api/files/00000000-0000-0000-0000-000000000000")).status()).toBe(401);
    await signIn(page, ACCOUNTS.editor);
    expect((await page.request.get("/api/files/00000000-0000-0000-0000-000000000000")).status()).toBe(404);
  });

  test("the portal is never indexed", async ({ request }) => {
    const res = await request.get("/portal/sign-in");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
  });
});
