import path from "node:path";
import { expect, test } from "@playwright/test";
import { ACCOUNTS, alertBox, autoConfirm, signIn, toast } from "./helpers";

/**
 * The README's end-to-end flow, against the real server:
 * inquiry → staff pathway → reviewer report → Commission votes → decision → verified directory record →
 * public directory; plus the institution's own view, articles, site content and account approval.
 */
test.describe.serial("accreditation flow", () => {
  const INSTITUTION = `E2E Covenant University ${Date.now().toString().slice(-5)}`;
  let ref = "";
  let appUrl = "";

  test("1. an institution submits the public inquiry form with a document", async ({ page }) => {
    await page.goto("/apply");
    await page.getByLabel("Legal institution name *").fill(INSTITUTION);
    await page.getByLabel("Country of establishment *").fill("Rwanda");
    await page.getByLabel("Year of establishment *").fill("1999");
    await page.getByLabel("Official website *").fill("https://e2e.example.edu");
    await page.getByLabel("Facebook page").fill("https://www.facebook.com/e2e-university");
    await page.getByLabel("LinkedIn page").fill("https://www.linkedin.com/school/e2e-university");
    await page.getByLabel("Institution type *").selectOption("University");
    await page.getByLabel("Government authorization or registration reference *").fill("HEC-RW-2041");
    await page.getByLabel("Full name *").fill("E2E Registrar");
    await page.getByLabel("Position *").fill("Registrar");
    await page.getByLabel("Official institutional email *").fill("e2e.registrar@example.edu");
    await page.getByLabel("Telephone number *").fill("+250 700 000 000");
    await page.getByRole("radio", { name: "Accreditation", exact: true }).check();
    await page.getByLabel("Brief institutional profile *").fill("A private Christian university offering programs in education and business.");
    await page.getByLabel("Supporting documents (if required)").setInputFiles(path.join(__dirname, "../fixtures/sample.pdf"));
    await page.getByLabel(/I declare that the information submitted is accurate/).check();
    await page.getByLabel(/I acknowledge that the information provided/).check();
    await page.getByRole("button", { name: "Submit Institutional Inquiry" }).click();
    await expect(page.getByRole("heading", { name: "Thank you for contacting ACCPHE." })).toBeVisible();
    ref = (await page.getByText(/^ACC-\d{4}-\d{4}$/).textContent()) ?? "";
    expect(ref).toMatch(/^ACC-\d{4}-\d{4}$/);
  });

  test("2. a forged file is refused and the form keeps what was typed", async ({ page }) => {
    await page.goto("/apply");
    await page.getByLabel("Legal institution name *").fill("Forged Upload College");
    await page.getByLabel("Country of establishment *").fill("Kenya");
    await page.getByLabel("Year of establishment *").fill("2001");
    await page.getByLabel("Official website *").fill("https://forged.example.edu");
    await page.getByLabel("Institution type *").selectOption("College");
    await page.getByLabel("Government authorization or registration reference *").fill("X-1");
    await page.getByLabel("Full name *").fill("Someone");
    await page.getByLabel("Position *").fill("Clerk");
    await page.getByLabel("Official institutional email *").fill("someone@example.edu");
    await page.getByLabel("Telephone number *").fill("+254 1");
    await page.getByRole("radio", { name: "Accreditation", exact: true }).check();
    await page.getByLabel("Brief institutional profile *").fill("Testing upload validation.");
    await page.getByLabel("Supporting documents (if required)").setInputFiles(path.join(__dirname, "../fixtures/fake.pdf"));
    await page.getByLabel(/I declare that the information submitted is accurate/).check();
    await page.getByLabel(/I acknowledge that the information provided/).check();
    await page.getByRole("button", { name: "Submit Institutional Inquiry" }).click();
    await expect(alertBox(page)).toContainText("doesn’t look like a valid .pdf file");
    await expect(page.getByLabel("Legal institution name *")).toHaveValue("Forged Upload College");
  });

  test("3. staff work the application through the pathway and appoint a reviewer", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.officer);
    await page.goto(`/portal/applications?q=${encodeURIComponent(ref)}`);
    await page.getByRole("link", { name: INSTITUTION }).click();
    await page.waitForURL(/\/portal\/applications\/[0-9a-f-]{36}$/);
    appUrl = page.url();
    await expect(page.getByRole("heading", { name: INSTITUTION })).toBeVisible();
    await expect(page.getByRole("link", { name: "sample.pdf" })).toBeVisible();

    await page.getByLabel("Assigned officer").selectOption({ label: "Demo Accreditation Officer — Deputy Director, Accreditation" });
    await toast(page, "Officer assigned");

    // Stage 1 checklist, then advance through stages 2–4 (incomplete checklists are confirmed).
    await page.getByLabel("Inquiry acknowledged and reference issued").check();
    for (const next of ["Eligibility review", "Formal application", "Self-study", "Independent evaluation"]) {
      await page.getByRole("button", { name: `Advance to ${next} →` }).click();
      await expect(page.getByText(`Stage ${["Eligibility review", "Formal application", "Self-study", "Independent evaluation"].indexOf(next) + 2} of 8 · ${next}`)).toBeVisible();
    }
    await page.getByLabel("Appoint a reviewer…").selectOption({ label: "Sample Reviewer — Curriculum and assessment" });
    await page.getByRole("button", { name: "Appoint" }).click();
    await toast(page, "Reviewer appointed");
    await expect(page.getByText("Awaiting conflict-of-interest declaration")).toBeVisible();

    await page.getByPlaceholder("Write an internal note or a message to the institution…").fill("Please make your faculty available for interviews.");
    await page.getByRole("button", { name: "Send to institution" }).click();
    await toast(page, "Message sent to the institution");
  });

  test("4. the reviewer declares no conflict, rates all twelve standards and submits", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.reviewer);
    await expect(page).toHaveURL(/\/portal\/reviews$/);
    await page.getByRole("link", { name: new RegExp(INSTITUTION) }).click();
    await page.getByLabel(/I confirm that I have no actual, potential, or perceived conflict/).check();
    await page.getByRole("button", { name: "Confirm and open evaluation" }).click();
    await toast(page, "Declaration recorded");
    const groups = page.getByRole("radiogroup");
    await expect(groups).toHaveCount(12);
    for (let i = 0; i < 12; i++) await groups.nth(i).getByRole("radio", { name: i === 4 ? "Partially met" : "Met", exact: true }).click();
    await page.getByLabel("Summary and recommendation").fill("Substantially meets the standards. Recommend accreditation.");
    await expect(page.getByText(/12 of 12 standards rated/)).toBeVisible();
    await page.getByRole("button", { name: "Submit review report" }).click();
    await expect(page.getByText(/^Submitted \d/)).toBeVisible();
  });

  test("5. staff move the application to the Commission", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.officer);
    await page.goto(appUrl);
    await expect(page.getByText("1 of 1 reports submitted")).toBeVisible();
    await page.getByRole("button", { name: "Advance to Findings & response →" }).click();
    await page.getByRole("button", { name: "Advance to Decision →" }).click();
    await expect(page.getByText("Record the decision of the authorized body")).toBeVisible();
  });

  test("6. three Commission members vote (each as themselves)", async ({ page }) => {
    for (const who of [ACCOUNTS.c1, ACCOUNTS.c2, ACCOUNTS.c3]) {
      await signIn(page, who);
      await page.getByRole("link", { name: new RegExp(INSTITUTION) }).click();
      await page.getByRole("radio", { name: "Award accreditation" }).click();
      await page.getByLabel("I have no conflict of interest with this institution.").check();
      await page.getByRole("button", { name: "Record vote" }).click();
      await toast(page, "Vote recorded");
      await expect(page.getByText("Recorded", { exact: true })).toBeVisible();
    }
    await expect(page.getByText(/Award accreditation: 3/)).toBeVisible();
  });

  test("7. staff record the award and publish the verified directory record", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/overview");
    await expect(page.getByText("Commission quorum reached")).toBeVisible();
    await page.goto(appUrl);
    await page.getByRole("button", { name: "Award accreditation" }).click();
    await toast(page, "draft directory record created");
    // The application links straight to the draft record it created.
    await page.getByRole("link", { name: "Open the directory record" }).click();
    await expect(page.getByRole("heading", { name: "Edit directory record" })).toBeVisible();
    // The website given on the inquiry is carried onto the record.
    await expect(page.getByLabel("Official website")).toHaveValue("https://e2e.example.edu");
    // Publishing without verification is refused.
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(alertBox(page)).toContainText("Confirm the formal decision has been verified");
    await page.getByLabel("Formal decision verified").check();
    await page.getByRole("button", { name: "Save and publish" }).click();
    await toast(page, "Published to the public directory");
  });

  test("8. the institution appears in the public directory with its own record page", async ({ page }) => {
    await page.goto(`/directory?q=${encodeURIComponent(INSTITUTION)}`);
    await expect(page.getByRole("status")).toHaveText("1 record");
    // Newly published records also appear under "Membership developments".
    await expect(page.getByRole("region", { name: "Membership developments" }).getByRole("link", { name: INSTITUTION })).toBeVisible();
    await expect(page.getByRole("table").getByRole("link", { name: /e2e\.example\.edu/ })).toHaveAttribute("href", "https://e2e.example.edu");
    await page.getByRole("table").getByRole("link", { name: INSTITUTION }).click();
    await expect(page.getByRole("heading", { level: 1, name: INSTITUTION })).toBeVisible();
    const site = page.getByRole("link", { name: /e2e\.example\.edu/ });
    await expect(site).toHaveAttribute("href", "https://e2e.example.edu");
    await expect(site).toHaveAttribute("target", "_blank");
    await expect(page.getByText("Institutional accreditation")).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.join(" ")).toContain("EducationalOrganization");
    expect(ld.join(" ")).toContain('"url":"https://e2e.example.edu"');
    await expect(page.getByRole("heading", { name: "Status history" })).toBeVisible();
    await expect(page.getByText("Accredited Institution — published in the directory")).toBeVisible();
  });

  test("8b. a status change is published with its reason", async ({ page }) => {
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/directory?status=Published");
    await page.getByRole("link", { name: INSTITUTION, exact: true }).click();
    await page.getByLabel("Status").selectOption("Suspended");
    await page.getByLabel("Public note on this change (optional)").fill("Suspended pending review of governance concerns.");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await toast(page, "Record saved");
    await page.goto(`/directory?q=${encodeURIComponent(INSTITUTION)}`);
    await expect(page.getByText("Status: Suspended")).toBeVisible();
    await page.getByRole("table").getByRole("link", { name: INSTITUTION }).click();
    await expect(page.getByText("Suspended pending review of governance concerns.")).toBeVisible();
    // Restore for the following steps.
    await page.goto("/portal/directory?status=Suspended");
    await page.getByRole("link", { name: INSTITUTION, exact: true }).click();
    await page.getByLabel("Status").selectOption("Published");
    await page.getByRole("button", { name: "Save and publish" }).click();
    await toast(page, "Published to the public directory");
  });

  test("9. an institution representative requests access, is approved, and follows the application", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`/portal/register?ref=${encodeURIComponent(ref)}`);
    await page.getByLabel("Full name *").fill("E2E Registrar");
    await page.getByLabel("Position *").fill("Registrar");
    await page.getByLabel("Institution *").fill(INSTITUTION);
    await page.getByLabel("Official email *").fill("e2e.registrar@example.edu");
    await page.getByLabel("Password *", { exact: true }).fill("Registrar-2026-ok");
    await page.getByLabel("Confirm password *").fill("Registrar-2026-ok");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit account request" }).click();
    await expect(page.getByRole("heading", { name: "Account request received" })).toBeVisible();
    await expect(page.getByText(`linked to ${ref}`)).toBeVisible();

    // Pending accounts cannot sign in.
    await page.goto("/portal/sign-in");
    await page.getByLabel("Email").fill("e2e.registrar@example.edu");
    await page.getByLabel("Password", { exact: true }).fill("Registrar-2026-ok");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(alertBox(page)).toContainText("awaiting verification");

    await signIn(page, ACCOUNTS.admin);
    await page.goto("/portal/users");
    const row = page.getByRole("row", { name: /E2E Registrar/ });
    await row.getByRole("combobox").selectOption({ label: `${ref} — ${INSTITUTION}` });
    await row.getByRole("button", { name: "Approve" }).click();
    await toast(page, "Account approved");

    await signIn(page, "e2e.registrar@example.edu", "Registrar-2026-ok");
    await expect(page).toHaveURL(/\/portal\/my-application$/);
    await expect(page.getByRole("heading", { name: INSTITUTION })).toBeVisible();
    await expect(page.getByText("Please make your faculty available for interviews.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Maintaining accreditation" })).toBeVisible();
    await page.getByPlaceholder("Write to the Secretariat…").fill("Thank you. Our annual report will follow.");
    await page.getByRole("button", { name: "Send message" }).click();
    await toast(page, "Message sent to the Secretariat");
    await page.getByLabel("Summary").fill("Annual report: all conditions on track.");
    await page.getByRole("button", { name: "Submit to the Secretariat" }).click();
    await toast(page, "Annual report submitted");
  });

  test("10. the editor publishes an article and a banner that appear on the website", async ({ page }) => {
    await signIn(page, ACCOUNTS.editor);
    await page.goto("/portal/news/new");
    await page.getByLabel("Title").fill("E2E consultation on reviewer guidance");
    await page.getByLabel("Summary *").fill("The Council invites comments on draft guidance for institutional reviewers.");
    await page.getByLabel("Article body").fill("First paragraph.\n\nSecond paragraph.");
    await page.getByRole("button", { name: "Publish" }).click();
    await toast(page, "Published to News & Insights");

    await page.goto("/portal/content");
    await page.getByLabel("Show on website").check();
    await page.getByLabel("Banner text").fill("E2E banner: consultation open until 30 November.");
    await page.getByRole("button", { name: "Save and publish" }).click();
    await toast(page, "changes are live on the website");

    await page.goto("/");
    await expect(page.getByRole("region", { name: "Announcement" })).toContainText("E2E banner");
    await page.goto("/news/e2e-consultation-on-reviewer-guidance");
    await expect(page.getByRole("heading", { level: 1, name: "E2E consultation on reviewer guidance" })).toBeVisible();
    await expect(page.getByText("Second paragraph.")).toBeVisible();
  });

  test("11. the audit log records the whole flow", async ({ page }) => {
    await signIn(page, ACCOUNTS.admin);
    await page.goto(`/portal/reports?q=${encodeURIComponent(INSTITUTION)}`);
    await expect(page.getByRole("cell", { name: `New inquiry received from ${INSTITUTION}` })).toBeVisible();
    await expect(page.getByRole("cell", { name: new RegExp(`${INSTITUTION} — decision recorded: Accredited Institution`) })).toBeVisible();
    const csv = await page.request.get(`/portal/export/audit?q=${encodeURIComponent(INSTITUTION)}`);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(await csv.text()).toContain("Review report submitted");
  });
});
