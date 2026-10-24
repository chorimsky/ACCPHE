import { expect, test } from "@playwright/test";

test.describe("public website", () => {
  test("every page renders with one h1, canonical URL and structured data", async ({ page }) => {
    for (const path of ["/", "/about", "/accreditation", "/accreditation/programs", "/accreditation/programs/apply", "/directory/programs", "/standards", "/governance", "/directory", "/news", "/apply", "/contact", "/privacy", "/accessibility", "/terms"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("h1"), path).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]'), path).toHaveAttribute("href", path === "/" ? /^https?:\/\/[^/]+\/?$/ : new RegExp(`${path}$`));
      expect(await page.locator('script[type="application/ld+json"]').count(), path).toBeGreaterThanOrEqual(2);
    }
  });

  test("the Accreditation page opens with the benefits of accreditation", async ({ page }) => {
    await page.goto("/accreditation");
    const benefits = page.locator("#c-benefits");
    await expect(benefits.getByRole("heading", { level: 2 })).toHaveText("The Academic and Professional Benefits of ACCPHE Accreditation");
    await expect(benefits.getByText("Elevate Your Institution. Strengthen Your Credibility. Advance Your Global Influence.")).toBeVisible();
    await expect(benefits.getByRole("listitem")).toHaveCount(7);
    await expect(benefits.getByRole("heading", { name: "Institutional Growth and Competitive Advantage" })).toBeVisible();
  });

  test("program accreditation has its own page under Accreditation", async ({ page }) => {
    await page.goto("/accreditation");
    await page.getByRole("link", { name: "Explore Program Accreditation" }).click();
    await expect(page).toHaveURL(/\/accreditation\/programs$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Independent Program Accreditation & Recognition");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Accreditation" })).toBeVisible();
    await expect(page.locator("#p-standards li")).toHaveCount(8);
    await expect(page.locator("#p-process li")).toHaveCount(6);
    await expect(page.getByText("does not, by itself, constitute government approval")).toBeVisible();
    await page.getByRole("link", { name: "Ask a question" }).click();
    await expect(page.locator('select[name="route"]')).toHaveValue("Program accreditation");
  });

  test("unknown addresses show the site 404 with navigation", async ({ page }) => {
    const res = await page.goto("/no-such-page");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This page could not be found" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" }).first()).toBeVisible();
  });

  test("site search finds a standard and deep-links to it", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("/");
    const dialog = page.getByRole("dialog", { name: "Search" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("textbox", { name: "Search" }).fill("financial integrity");
    await dialog.getByRole("button", { name: /Financial Integrity and Institutional Sustainability/ }).click();
    await expect(page).toHaveURL(/\/standards#standard-9$/);
    await expect(page.getByRole("heading", { name: "Financial Integrity and Institutional Sustainability", level: 3 })).toBeVisible();
  });

  test("standards are all in the HTML for search engines", async ({ request }) => {
    const html = await (await request.get("/standards")).text();
    for (const t of ["Institutional Mission and Identity", "Professional Relevance and Societal Contribution", "Conflict of Interest"]) expect(html).toContain(t);
  });

  test("FAQ opens one answer at a time", async ({ page }) => {
    await page.goto("/accreditation#c-faq");
    const q = page.getByRole("button", { name: "Can an institution lose its accreditation?" });
    await q.click();
    await expect(q).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("may be subject to conditions, suspension, withdrawal, or expiration")).toBeVisible();
  });

  test("pathway finder suggests Associate Membership when not yet ready", async ({ page }) => {
    await page.goto("/apply");
    const finder = page.getByRole("region", { name: "Find the right pathway" });
    await finder.getByRole("group").nth(0).getByRole("button", { name: "Yes" }).click();
    await finder.getByRole("button", { name: "Not yet" }).click();
    await finder.getByRole("group").nth(2).getByRole("button", { name: "No" }).click();
    await expect(finder.getByText("Suggested pathway")).toBeVisible();
    await finder.getByRole("button", { name: "Use this pathway" }).click();
    await expect(page.getByRole("radio", { name: "Associate Membership", exact: true })).toBeChecked();
  });

  test("language selector translates navigation and explains English is authoritative", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Language").selectOption("fr");
    await expect(page.getByRole("note")).toContainText("anglais, qui fait foi");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await page.getByRole("button", { name: "English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("robots, sitemap and llms.txt are served", async ({ request }) => {
    expect((await request.get("/robots.txt")).status()).toBe(200);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/news/proposed-institutional-accreditation-standards-published");
    expect(await (await request.get("/llms.txt")).text()).toContain("ACCPHE membership is not accreditation");
  });

  test("contact form validates and records the message", async ({ page }) => {
    await page.goto("/contact?topic=verification");
    await expect(page.getByLabel("Nature of inquiry *")).toHaveValue("Status verification");
    await page.getByLabel("Full name *").fill("E2E Correspondent");
    await page.getByLabel("Email *").fill("e2e@example.org");
    await page.getByLabel("Message *").fill("Please confirm the status of a named institution.");
    await page.getByRole("button", { name: "Send Message" }).click();
    await expect(page.getByRole("heading", { name: "Message received" })).toBeVisible();
  });
});
