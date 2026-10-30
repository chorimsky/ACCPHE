import path from "node:path";
import { expect, test } from "@playwright/test";
import { ACCOUNTS, alertBox, autoConfirm, signIn, toast } from "./helpers";

/**
 * College of Fellows & Professional Distinctions, end to end:
 * public page → nomination through the public form → staff work the steps → Commission vote with the College options →
 * distinction conferred → draft register entry with a verification number → verified and published → public College of
 * Fellows Directory, verification-number lookup and record page.
 */
test.describe.serial("college of fellows", () => {
  const NOMINEE = `E2E Professor Grace Fellow ${Date.now().toString().slice(-5)}`;
  let verification = "";

  test("1. the College page presents the three pathways and eight distinctions", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "College of Fellows & Distinctions" }).click();
    await expect(page).toHaveURL(/\/fellows$/);
    await expect(page.getByRole("heading", { level: 1, name: "ACCPHE International College of Fellows & Professional Distinctions" })).toBeVisible();
    for (const g of ["Council Fellowship", "Professional Certification", "Distinguished Council Recognition"]) await expect(page.getByRole("heading", { level: 3, name: g })).toBeVisible();
    for (const t of ["Fellow of ACCPHE", "Senior Fellow of ACCPHE", "Distinguished Fellow of ACCPHE", "Certified Christian Higher Education Professional", "Distinguished Christian Ministry Educator"])
      await expect(page.getByRole("heading", { level: 4, name: t, exact: true })).toBeVisible();
    await expect(page.getByText("They do not constitute academic degrees, professional licenses")).toBeVisible();
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(" ");
    expect(ld).toContain("DCS-ACCPHE");
  });

  test("2. someone nominates a distinguished scholar through the public form", async ({ page }) => {
    await page.goto("/fellows");
    await page.getByRole("link", { name: "Nominate a Distinguished Leader" }).first().click();
    await expect(page).toHaveURL(/\/fellows\/apply\?route=nomination$/);
    await expect(page.getByRole("radio", { name: "I am nominating someone" })).toBeChecked();
    await page.getByLabel("Fellowship, certification or distinction sought *").selectOption("DCS-ACCPHE");
    await page.getByLabel("Nominee’s full name *").fill(NOMINEE);
    await page.getByLabel("Current position or title *").fill("Professor of Systematic Theology");
    await page.getByLabel("Institution or organization").fill("E2E Theological Seminary");
    await page.getByLabel("Country *").fill("Ghana");
    await page.getByLabel("Summary of qualifications and contributions *").fill("Author of six books on Christian ethics; supervised forty doctoral theses.");
    await page.getByLabel("Your full name *").fill("E2E Nominator");
    await page.getByLabel("Your email *").fill("e2e.nominator@example.org");
    await page.getByLabel("Your telephone number *").fill("+233 20 000 0000");
    await page.getByLabel("Curriculum vitae and supporting documents (optional now)").setInputFiles(path.join(__dirname, "../fixtures/sample.pdf"));
    await page.getByLabel(/I declare that the information submitted is accurate/).check();
    await page.getByLabel(/the nominee is of good professional and ethical standing/).check();
    await page.getByLabel(/I understand that recognition is not automatic/).check();
    await page.getByLabel(/I acknowledge that the information provided/).check();
    await page.getByRole("button", { name: "Submit Nomination" }).click();
    await expect(page.getByRole("heading", { name: "Thank you for your nomination." })).toBeVisible();
    await expect(page.getByText(/^FEL-\d{4}-\d{4}$/)).toBeVisible();
  });

  test("3. an application without the applicant's email is refused", async ({ page }) => {
    await page.goto("/fellows/apply?distinction=CCHEP");
    await expect(page.getByLabel("Fellowship, certification or distinction sought *")).toHaveValue("CCHEP");
    await page.getByLabel("Full name *").fill("E2E Lecturer");
    await page.getByLabel("Current position or title *").fill("Senior Lecturer");
    await page.getByLabel("Country *").fill("Kenya");
    await page.getByLabel("Email *").evaluate((el) => el.removeAttribute("required"));
    await page.getByLabel("Telephone number *").fill("+254 1");
    await page.getByLabel("Summary of qualifications and contributions *").fill("Fifteen years of teaching.");
    for (const l of [/I declare that the information/, /I am of good professional and ethical standing/, /I understand that recognition is not automatic/, /I acknowledge that the information provided/])
      await page.getByLabel(l).check();
    await page.getByRole("button", { name: "Submit Application" }).click();
    await expect(alertBox(page)).toContainText("Your email is required.");
  });

  test("4. staff find the nomination under College of Fellows and take it to decision", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/applications");
    await page.getByRole("navigation", { name: "Application type" }).getByRole("link", { name: /College of Fellows/ }).click();
    await page.getByRole("link", { name: NOMINEE }).click();
    await expect(page.getByRole("heading", { name: NOMINEE })).toBeVisible();
    await expect(page.getByText("Stage 1 of 6 · Application or nomination")).toBeVisible();
    await expect(page.getByText("Nomination by E2E Nominator")).toBeVisible();
    await expect(page.getByText("Distinguished Christian Scholar (DCS-ACCPHE)").first()).toBeVisible();
    await expect(page.getByText("Professional references", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "sample.pdf" })).toBeVisible();
    for (const next of ["Eligibility & documentation review", "Professional & ethical assessment", "Review & decision"]) {
      await page.getByRole("button", { name: `Advance to ${next} →` }).click();
      await expect(page.getByText(new RegExp(`Stage \\d of 6 · ${next.replace("&", "&")}`))).toBeVisible();
    }
  });

  test("5. a Commission member votes with the College options", async ({ page }) => {
    await signIn(page, ACCOUNTS.c1);
    await page.getByRole("link", { name: new RegExp(NOMINEE) }).click();
    await expect(page.getByRole("radio", { name: "Award accreditation", exact: true })).toHaveCount(0);
    await page.getByRole("radio", { name: "Confer the distinction sought" }).click();
    await page.getByLabel(/I have no conflict of interest/).check();
    await page.getByRole("button", { name: "Record vote" }).click();
    await toast(page, "Vote recorded");
  });

  test("6. staff confer the distinction and publish the verified register entry", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/applications?kind=fellow");
    await page.getByRole("link", { name: NOMINEE }).click();
    await page.getByRole("button", { name: "Confer DCS-ACCPHE" }).click();
    await toast(page, "draft register entry created");
    await expect(page.getByText("Stage 5 of 6 · Formal recognition & registration")).toBeVisible();

    await page.getByRole("link", { name: "Open the register entry" }).click();
    await expect(page.getByRole("heading", { name: "Edit register entry" })).toBeVisible();
    await expect(page.getByLabel("Institution or organization")).toHaveValue("E2E Theological Seminary");
    verification = ((await page.getByText(/^Verification no\. ACCPHE-F-\d{4}-\d{4}$/).textContent()) ?? "").replace("Verification no. ", "");
    expect(verification).toMatch(/^ACCPHE-F-\d{4}-\d{4}$/);
    await page.getByLabel("Title").fill("Prof.");
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(alertBox(page)).toContainText("Confirm the formal decision has been verified");
    await page.getByLabel("Formal decision verified").check();
    await page.getByRole("button", { name: "Save and publish" }).click();
    await toast(page, "Published to the College of Fellows Directory");
  });

  test("7. the recipient is in the public register, verifiable by number", async ({ page }) => {
    await page.goto("/directory");
    await page.getByRole("navigation", { name: "Directory" }).getByRole("link", { name: "College of Fellows" }).click();
    await expect(page).toHaveURL(/\/directory\/fellows$/);
    await expect(page.getByRole("table").getByRole("link", { name: `Prof. ${NOMINEE}` })).toBeVisible();

    await page.goto(`/directory/fellows?q=${encodeURIComponent(verification.toLowerCase())}`);
    await expect(page.getByRole("heading", { level: 1, name: `Prof. ${NOMINEE}, DCS-ACCPHE` })).toBeVisible();
    await expect(page.getByText(`Verification number ${verification}`)).toBeVisible();
    await expect(page.getByText("DCS-ACCPHE — entered in the register")).toBeVisible();
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(" ");
    expect(ld).toContain('"Person"');
    expect(ld).toContain(verification);

    await page.goto("/directory/fellows?q=ACCPHE-F-1999-9999");
    await expect(page.getByText("No register entry has this verification number")).toBeVisible();

    const sitemap = await (await page.request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/directory/fellows/");
  });

  test("8. the register export includes the entry", async ({ page }) => {
    await signIn(page, ACCOUNTS.officer);
    const csv = await (await page.request.get("/portal/export/fellows")).text();
    expect(csv).toContain(verification);
    expect(csv).toContain(NOMINEE);
  });
});
