import { expect, test } from "@playwright/test";
import { ACCOUNTS, autoConfirm, signIn, toast } from "./helpers";

/** Requirement: authorized staff publish articles and update institutional information without coding. */
test.describe.serial("content management", () => {
  test("an editor rewords an FAQ; the website and its structured data follow; the official text can be restored", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.editor);
    await page.goto("/portal/content/pages");
    await page.getByRole("link", { name: /Frequently asked questions/ }).click();
    await page.locator("summary", { hasText: "What is institutional accreditation?" }).click();
    const q = page.getByLabel("Question").first();
    await q.fill("What is institutional accreditation (edited)?");
    await page.getByRole("button", { name: "Save and publish" }).click();
    await toast(page, "changes are live");

    await page.goto("/accreditation#c-faq");
    await expect(page.getByRole("button", { name: "What is institutional accreditation (edited)?" })).toBeVisible();
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(" ");
    expect(ld).toContain("What is institutional accreditation (edited)?");

    await page.goto("/portal/content/pages/faqs");
    await page.getByRole("button", { name: "Restore official text" }).click();
    await toast(page, "Restored");
    await page.goto("/accreditation");
    await expect(page.getByRole("button", { name: "What is institutional accreditation?" })).toBeVisible();
  });

  test("the program accreditation page is editable and restorable", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.editor);
    await page.goto("/portal/content/pages");
    await page.getByRole("link", { name: /Independent Program Accreditation — page text/ }).click();
    await page.getByLabel("Line under the page title").fill("Quality assurance for innovative programs (edited)");
    await page.getByRole("button", { name: "Save and publish" }).click();
    await toast(page, "changes are live");
    await page.goto("/accreditation/programs");
    await expect(page.getByText("Quality assurance for innovative programs (edited)")).toBeVisible();

    await page.goto("/portal/content/pages/programs.page");
    await page.getByRole("button", { name: "Restore official text" }).click();
    await toast(page, "Restored");
    await page.goto("/accreditation/programs");
    await expect(page.getByText("Advancing Educational Innovation Through Independent Quality Assurance")).toBeVisible();
  });

  test("fixed lists cannot lose entries the workflow depends on", async ({ page }) => {
    await signIn(page, ACCOUNTS.editor);
    await page.goto("/portal/content/pages/standards");
    await expect(page.getByText("fixed number of entries")).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove" })).toHaveCount(0);
  });

  test("recording adoption of the standards changes the public wording", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.admin);
    await page.goto("/portal/content/pages/standards.meta");
    await page.getByLabel("Status").selectOption("adopted");
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(page.locator(".toast")).toContainText("Enter the date the standards were adopted");
    await page.getByLabel("Date of adoption").fill("2026-11-15");
    await page.getByRole("button", { name: "Save and publish" }).click();
    await toast(page, "changes are live");
    await page.goto("/standards");
    await expect(page.getByRole("heading", { name: /Twelve standards adopted by the Council on 15 Nov 2026/ })).toBeVisible();
    await expect(page.getByText("Adopted standard 1 of 12")).toBeVisible();
    await page.goto("/portal/content/pages/standards.meta");
    await page.getByRole("button", { name: "Restore official text" }).click();
    await toast(page, "Restored");
  });

  test("a scheduled article stays off the website until its date", async ({ page }) => {
    await signIn(page, ACCOUNTS.editor);
    await page.goto("/portal/news/new");
    await page.getByLabel("Title").fill("E2E scheduled announcement");
    await page.getByLabel("Publication date").fill("2099-01-15");
    await page.getByLabel("Summary *").fill("Published in the future.");
    await page.getByLabel("Article body").fill("## Heading\n\n- first point\n- second point\n\nSee **the standards** at [Standards](/standards).");
    await page.getByRole("button", { name: "Publish" }).click();
    await toast(page, "Published to News & Insights");
    await expect(page.getByText("Scheduled", { exact: true })).toBeVisible();
    const res = await page.request.get("/news/e2e-scheduled-announcement");
    expect(res.status()).toBe(404);
    expect(await (await page.request.get("/news/rss.xml")).text()).not.toContain("E2E scheduled announcement");
  });

  test("staff reply to website correspondence from the portal", async ({ page }) => {
    await signIn(page, ACCOUNTS.editor);
    await page.goto("/portal/messages");
    await page.getByRole("link", { name: /Sample Correspondent/ }).click();
    await page.getByPlaceholder(/Reply to Sample Correspondent/).fill("The institution you named does not appear in the directory.");
    await page.getByRole("button", { name: "Send reply" }).click();
    await toast(page, "Reply recorded. Email delivery is off, so it was not emailed — contact liaison@example.org directly.");
    await expect(page.getByText("The institution you named does not appear in the directory.")).toBeVisible();
  });

  test("officers correct application details, with the correction recorded", async ({ page }) => {
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/applications?q=Sample%20Bible");
    await page.getByRole("link", { name: "Sample Bible Institute (demo)" }).click();
    await page.getByRole("link", { name: "Edit", exact: true }).click();
    await page.getByLabel("Year established").fill("1990");
    await page.getByRole("button", { name: "Save details" }).click();
    await toast(page, "Application details saved");
    await expect(page.getByText("Application details corrected: year established.")).toBeVisible();
  });
});
