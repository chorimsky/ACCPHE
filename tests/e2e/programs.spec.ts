import path from "node:path";
import { expect, test } from "@playwright/test";
import { ACCOUNTS, alertBox, autoConfirm, signIn, toast } from "./helpers";

/**
 * Independent Program Accreditation & Recognition, end to end:
 * public program application → staff review steps → reviewer rates the eight program standards → Commission vote →
 * decision → draft program record with a verification number → verified and published → public directory of approved
 * programs, verification-number lookup, and ongoing quality assurance.
 */
test.describe.serial("program accreditation", () => {
  const PROGRAM = `E2E Certificate in Pastoral Care ${Date.now().toString().slice(-5)}`;
  const DEMO = "Sample CPD Course in Ministry Practice (demo)";
  let verification = "";

  test("1. a provider applies for program accreditation through the public form", async ({ page }) => {
    await page.goto("/accreditation/programs");
    await page.getByRole("link", { name: "Apply for Program Accreditation" }).first().click();
    await expect(page).toHaveURL(/\/accreditation\/programs\/apply$/);
    await page.getByLabel("Program title *").fill(PROGRAM);
    await page.getByLabel("Program category *").selectOption("Christian ministry and theological certificate programs");
    await page.getByLabel("Delivery mode *").selectOption("Blended");
    await page.getByLabel("Duration or learning hours *").fill("90 learning hours over four months");
    await page.getByLabel("Intended learners *").fill("Pastors and chaplains in active ministry.");
    await page.getByLabel("Program description and objectives *").fill("Pastoral care foundations, assessed through supervised practice and a reflective portfolio.");
    await page.getByLabel("Education provider (legal name) *").fill("E2E Ministry Training Centre");
    await page.getByLabel("Country *").fill("Uganda");
    await page.getByLabel("Provider type *").selectOption("Training organization");
    await page.getByLabel("Website *").fill("https://e2e-ministry.example.org");
    await page.getByLabel("Full name *").fill("E2E Program Director");
    await page.getByLabel("Position *").fill("Director of Studies");
    await page.getByLabel("Official email *").fill("e2e.programs@example.org");
    await page.getByLabel("Telephone number *").fill("+256 700 000 000");
    await page.getByLabel("Supporting documents (optional)").setInputFiles(path.join(__dirname, "../fixtures/sample.pdf"));
    await page.getByLabel(/I declare that the information submitted is accurate/).check();
    await page.getByLabel(/I understand that ACCPHE program accreditation or recognition applies only/).check();
    await page.getByLabel(/I acknowledge that the information provided/).check();
    await page.getByRole("button", { name: "Submit Program Application" }).click();
    await expect(page.getByRole("heading", { name: "Thank you for applying for program accreditation." })).toBeVisible();
    await expect(page.getByText(/^PRG-\d{4}-\d{4}$/)).toBeVisible();
  });

  test("2. staff find it under Programs and work its first step", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/applications");
    await page.getByRole("navigation", { name: "Application type" }).getByRole("link", { name: /Programs/ }).click();
    await page.getByRole("link", { name: PROGRAM }).click();
    await expect(page.getByRole("heading", { name: PROGRAM })).toBeVisible();
    await expect(page.getByText("Stage 1 of 6 · Application")).toBeVisible();
    await expect(page.getByText("E2E Ministry Training Centre · Uganda")).toBeVisible();
    await expect(page.getByText("Program self-evaluation against the eight standards")).toBeVisible();
    await expect(page.getByRole("link", { name: "sample.pdf" })).toBeVisible();
    await page.getByLabel("Application acknowledged and reference issued").check();
    await page.getByRole("button", { name: "Advance to Documentation & self-evaluation →" }).click();
    await expect(page.getByText("Stage 2 of 6 · Documentation & self-evaluation")).toBeVisible();
    await page.getByPlaceholder("Write an internal note or a message to the provider…").fill("Please upload the curriculum and your self-evaluation.");
    await page.getByRole("button", { name: "Send to provider" }).click();
    await toast(page, "Message sent to the provider");
  });

  test("3. a reviewer rates a program against the eight program standards", async ({ page }) => {
    await signIn(page, ACCOUNTS.reviewer);
    await page.getByRole("link", { name: /Sample Diploma in Digital Transformation \(demo\)/ }).click();
    await expect(page.getByText("2 of 8 rated")).toBeVisible();
    await expect(page.getByRole("radiogroup")).toHaveCount(8);
    await expect(page.getByText("Program Purpose and Relevance")).toBeVisible();
  });

  test("4. a Commission member votes with the program options", async ({ page }) => {
    await signIn(page, ACCOUNTS.c1);
    await page.getByRole("link", { name: new RegExp(DEMO.replace(/[()]/g, "\\$&")) }).click();
    await expect(page.getByRole("radio", { name: "Award accreditation", exact: true })).toHaveCount(0);
    await page.getByRole("radio", { name: "Award program accreditation" }).click();
    await page.getByLabel(/I have no conflict of interest/).check();
    await page.getByRole("button", { name: "Record vote" }).click();
    await toast(page, "Vote recorded");
  });

  test("5. staff record the decision and publish the verified program record", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/applications?kind=program");
    await page.getByRole("link", { name: DEMO }).click();
    await expect(page.getByText("Stage 4 of 6 · Accreditation decision")).toBeVisible();
    await page.getByRole("button", { name: "Award program accreditation" }).click();
    await toast(page, "draft program record created");
    await expect(page.getByText("Stage 5 of 6 · Certification & public verification")).toBeVisible();

    await page.getByRole("link", { name: "Open the program record" }).click();
    await expect(page.getByRole("heading", { name: "Edit program record" })).toBeVisible();
    verification = ((await page.getByText(/^Verification no\. ACCPHE-P-\d{4}-\d{4}$/).textContent()) ?? "").replace("Verification no. ", "");
    expect(verification).toMatch(/^ACCPHE-P-\d{4}-\d{4}$/);
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(alertBox(page)).toContainText("Confirm the formal decision has been verified");
    await page.getByLabel("Formal decision verified").check();
    await page.getByRole("button", { name: "Save and publish" }).click();
    await toast(page, "Published to the directory of approved programs");
  });

  test("6. the program is public, verifiable by number, and has its own record page", async ({ page }) => {
    await page.goto("/directory");
    await page.getByRole("navigation", { name: "Directory" }).getByRole("link", { name: "Approved programs" }).click();
    await expect(page).toHaveURL(/\/directory\/programs$/);
    await expect(page.getByRole("table").getByRole("link", { name: DEMO })).toBeVisible();
    // The draft demo record is not public.
    await expect(page.getByText("Sample Short Course (demo record)")).toHaveCount(0);

    await page.goto(`/directory/programs?q=${encodeURIComponent(verification.toLowerCase())}`);
    await expect(page.getByRole("heading", { level: 1, name: DEMO })).toBeVisible();
    await expect(page.getByText(`Verification number ${verification}`)).toBeVisible();
    await expect(page.getByText("Accredited Program — published in the directory")).toBeVisible();
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(" ");
    expect(ld).toContain('"Course"');
    expect(ld).toContain(verification);

    await page.goto("/directory/programs?q=ACCPHE-P-1999-9999");
    await expect(page.getByText("No approved program has this verification number")).toBeVisible();

    const sitemap = await (await page.request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/directory/programs/");
  });

  test("7. staff move the program into ongoing quality assurance; exports include it", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/applications?kind=program");
    await page.getByRole("link", { name: DEMO }).click();
    await page.getByLabel("Program record verified and published").check();
    await page.getByRole("button", { name: "Advance to Ongoing quality assurance →" }).click();
    await expect(page.getByText("Stage 6 of 6 · Ongoing quality assurance")).toBeVisible();

    const csv = await (await page.request.get("/portal/export/programs")).text();
    expect(csv).toContain(verification);
    expect(csv).toContain(DEMO);
  });
});
