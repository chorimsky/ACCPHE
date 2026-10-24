import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { generate } from "otplib";
import { ACCOUNTS, alertBox, autoConfirm, PASSWORD, signIn, toast } from "./helpers";

/**
 * The remaining forms and workflows: accounts and sign-in (invitation, password links, profile, password change,
 * two-step verification, role change, suspension, forgotten password), complaints and appeals, website messages,
 * staff application tools (logging, documents, reviewers, returning, declining), reviewer conflict and Commission
 * recusal, a program provider's portal, news, and manual directory records.
 */

const SUFFIX = Date.now().toString().slice(-5);
const fixture = (f: string) => path.join(__dirname, "../fixtures", f);

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/portal\/sign-in/);
}

/** Copy the one-time password link an administrator generates for a user (email delivery is off in tests). */
async function passwordLinkFor(page: Page, email: string) {
  await page.goto("/portal/users?status=active");
  const row = page.getByRole("row").filter({ hasText: email });
  await row.getByRole("button", { name: "Password link" }).click();
  const link = row.getByRole("textbox", { name: /One-time password link/ });
  await expect(link).toHaveValue(/\/portal\/reset\//);
  return new URL(await link.inputValue()).pathname;
}

async function choosePassword(page: Page, resetPath: string, password: string) {
  await page.context().clearCookies();
  await page.goto(resetPath);
  await page.getByLabel("New password", { exact: true }).fill(password);
  await page.getByLabel("Confirm new password").fill(password);
  await page.getByRole("button", { name: "Save password" }).click();
  await page.waitForURL(/\/portal\/sign-in\?reset=1/);
}

test.describe.serial("accounts and sign-in", () => {
  const EMAIL = `e2e.staff.${SUFFIX}@accphe.test`;
  const NAME = `E2E Staff ${SUFFIX}`;
  const PW1 = "Staff-Member-2026-a";
  const PW2 = "Staff-Member-2026-b";
  let totpSecret = "";

  test("an administrator invites a staff member, who chooses a password and signs in", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.admin);
    await page.goto("/portal/users");
    await page.getByLabel("Full name *").fill(NAME);
    await page.getByLabel("Email *").fill(EMAIL);
    await page.getByLabel("Role").first().selectOption("editor");
    await page.getByLabel("Position").fill("Communications Assistant");
    await page.getByRole("button", { name: "Create account and send invitation" }).click();
    await toast(page, `Account created — ${NAME}`);
    const reset = await passwordLinkFor(page, EMAIL);

    await choosePassword(page, reset, PW1);
    await expect(page.getByText("Your password has been changed. Sign in with your new password.")).toBeVisible();
    await signIn(page, EMAIL, PW1);
    await expect(page).toHaveURL(/\/portal\/overview$/);
    await expect(page.getByRole("link", { name: /News & articles/ }).first()).toBeVisible();
    // A used link cannot be used again.
    await page.context().clearCookies();
    await page.goto(reset);
    await expect(page.getByText(/expired|already used/i)).toBeVisible();
  });

  test("the staff member updates their profile and password", async ({ page }) => {
    await signIn(page, EMAIL, PW1);
    await page.goto("/portal/account");
    await page.getByLabel("Display name").fill(`${NAME} (edited)`);
    await page.getByRole("button", { name: "Save changes" }).click();
    await toast(page, /saved|updated/i);
    await page.reload();
    await expect(page.getByLabel("Display name")).toHaveValue(`${NAME} (edited)`);

    await page.getByLabel("Current password", { exact: true }).fill("wrong-password-123");
    await page.getByLabel("New password", { exact: true }).fill(PW2);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(alertBox(page).or(page.locator(".toast"))).toContainText(/password/i);
    await page.getByLabel("Current password", { exact: true }).fill(PW1);
    await page.getByLabel("New password", { exact: true }).fill(PW2);
    await page.getByRole("button", { name: "Change password" }).click();
    await toast(page, /password (changed|updated)/i);

    await signOut(page);
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(PW1);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(alertBox(page)).toBeVisible();
    await signIn(page, EMAIL, PW2);
    await expect(page).toHaveURL(/\/portal\/overview$/);
  });

  test("two-step verification: set up, required at sign-in, and reset by an administrator", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, EMAIL, PW2);
    await page.goto("/portal/account");
    await page.getByRole("button", { name: "Set up two-step verification" }).click();
    totpSecret = ((await page.locator("code, .font-mono, [data-secret]").first().textContent()) ?? "").replace(/\s/g, "");
    expect(totpSecret).toMatch(/^[A-Z2-7]{16,}$/);
    await page.getByLabel("Enter the 6-digit code shown in the app").fill("000000");
    await page.getByRole("button", { name: "Confirm and turn on" }).click();
    await expect(page.locator(".toast")).toContainText(/code|incorrect|invalid/i);
    await page.getByLabel("Enter the 6-digit code shown in the app").fill(await generate({ secret: totpSecret }));
    await page.getByRole("button", { name: "Confirm and turn on" }).click();
    await expect(page.getByText("Two-step verification is on").first()).toBeVisible();

    await signOut(page);
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(PW2);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/portal\/verify/);
    await page.getByLabel("Verification code").fill("123456");
    await page.getByRole("button", { name: "Verify and continue" }).click();
    await expect(alertBox(page)).toBeVisible();
    await page.getByLabel("Verification code").fill(await generate({ secret: totpSecret }));
    await page.getByRole("button", { name: "Verify and continue" }).click();
    await expect(page).toHaveURL(/\/portal\/overview$/);

    await signIn(page, ACCOUNTS.admin);
    await page.goto("/portal/users?status=active");
    await page.getByRole("row").filter({ hasText: EMAIL }).getByRole("button", { name: "Reset two-step" }).click();
    await toast(page, "Two-step verification reset");
    await signIn(page, EMAIL, PW2);
    await expect(page).toHaveURL(/\/portal\/overview$/);
  });

  test("a role change takes effect, and a suspended account cannot sign in", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.admin);
    await page.goto("/portal/users?status=active");
    await page.getByLabel(new RegExp(`^Role of ${NAME}`)).selectOption("officer");
    await toast(page, /is now Accreditation Officer/);
    await signIn(page, EMAIL, PW2);
    await expect(page.getByRole("link", { name: /Applications/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /News & articles/ })).toHaveCount(0);

    await signIn(page, ACCOUNTS.admin);
    await page.goto("/portal/users?status=active");
    await page.getByRole("row").filter({ hasText: EMAIL }).getByRole("button", { name: "Suspend" }).click();
    await toast(page, /suspended/i);
    await page.context().clearCookies();
    await page.goto("/portal/sign-in");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(PW2);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(alertBox(page)).toBeVisible();
    await expect(page).toHaveURL(/\/portal\/sign-in/);

    await signIn(page, ACCOUNTS.admin);
    await page.goto("/portal/users?status=suspended");
    await page.getByRole("row").filter({ hasText: EMAIL }).getByRole("button", { name: "Reactivate" }).click();
    await toast(page, /reactivated|active/i);
    await signIn(page, EMAIL, PW2);
    await expect(page).toHaveURL(/\/portal\/overview$/);
  });

  test("forgotten password gives the same answer whether or not the account exists", async ({ page }) => {
    for (const email of [EMAIL, `nobody.${SUFFIX}@example.org`]) {
      await page.context().clearCookies();
      await page.goto("/portal/forgot");
      await page.getByLabel("Email").fill(email);
      await page.getByRole("button", { name: /Send/ }).click();
      await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
      await expect(page.getByText(`If an active account exists for ${email}`)).toBeVisible();
    }
  });
});

test.describe.serial("complaints, appeals and website messages", () => {
  const SUBJECT = `E2E complaint about misleading claims ${SUFFIX}`;
  const MSG = `E2E message about a program ${SUFFIX}`;

  test("the ethics officer works a complaint from receipt to determination", async ({ page }) => {
    await signIn(page, ACCOUNTS.ethics);
    await page.goto("/portal/cases/new");
    await page.getByLabel("Type").selectOption("Complaint");
    await page.getByLabel("Submitted by").fill("E2E Complainant, former student");
    await page.getByLabel("Email for acknowledgement and determination").fill("complainant@example.org");
    await page.getByLabel("Subject *").fill(SUBJECT);
    await page.getByLabel("Institution or matter concerned").fill("Sample Business College (demo)");
    await page.getByLabel("Details of the alleged breach or grounds for appeal *").fill("The institution advertises itself as accredited by ACCPHE.");
    await page.getByRole("button", { name: "Log case" }).click();
    await toast(page, /Complaint logged as CMP-\d{4}-\d{3}/);
    await expect(page.getByRole("heading", { name: SUBJECT })).toBeVisible();

    for (const next of ["Jurisdiction review", "Response requested", "Under review"]) {
      await page.getByRole("button", { name: `Move to ${next} →` }).click();
      await toast(page, "Case updated");
    }
    await page.getByPlaceholder("Add a note to the case record…").fill("Institution's response received.");
    await page.getByRole("button", { name: "Add note" }).click();
    await toast(page, "Note added");
    await page.getByPlaceholder("Outcome, reasons, and any corrective measures…").fill("Complaint upheld. The institution must correct its published claims within 30 days.");
    await page.getByRole("button", { name: "Record determination and close" }).click();
    await toast(page, "Determination recorded");
    await expect(page.getByText("Complaint upheld. The institution must correct its published claims within 30 days.").first()).toBeVisible();
    await expect(page.getByText(/Determination sent to complainant@example\.org/)).toBeVisible();

    await page.goto("/portal/cases");
    await expect(page.getByRole("link", { name: SUBJECT })).toBeVisible();
  });

  test("an appeal can be linked to a program application", async ({ page }) => {
    await signIn(page, ACCOUNTS.ethics);
    await page.goto("/portal/cases/new");
    await page.getByLabel("Type").selectOption("Appeal");
    const option = page.getByLabel("Application concerned (appeals)").locator("option", { hasText: "Sample CPD Course in Ministry Practice (demo)" });
    await expect(option).toHaveCount(1);
    await page.getByLabel("Application concerned (appeals)").selectOption({ label: (await option.textContent()) ?? "" });
    await page.getByLabel("Subject *").fill(`E2E appeal ${SUFFIX}`);
    await page.getByLabel("Details of the alleged breach or grounds for appeal *").fill("Appeal against a condition attached to the decision.");
    await page.getByRole("button", { name: "Log case" }).click();
    await toast(page, /Appeal logged as APL-\d{4}-\d{3}/);
  });

  test("a website message reaches the inbox, can be logged as a complaint, and archived", async ({ page }) => {
    autoConfirm(page);
    await page.goto("/contact?topic=programs");
    await expect(page.getByLabel("Nature of inquiry *")).toHaveValue("Program accreditation");
    await page.getByLabel("Full name *").fill("E2E Program Enquirer");
    await page.getByLabel("Email *").fill("enquirer@example.org");
    await page.getByLabel("Message *").fill(MSG);
    await page.getByRole("button", { name: "Send Message" }).click();
    await expect(page.getByRole("heading", { name: "Message received" })).toBeVisible();

    await signIn(page, ACCOUNTS.admin);
    await page.goto("/portal/messages");
    const inbox = page.getByRole("navigation", { name: "Inbox" });
    await inbox.getByRole("link", { name: /E2E Program Enquirer/ }).click();
    await expect(page.getByText(MSG)).toBeVisible();
    await expect(page.getByText("Program accreditation").first()).toBeVisible();
    await page.getByRole("button", { name: "Mark unread" }).click();
    await toast(page, "Marked as unread");

    await page.getByRole("link", { name: "Log as complaint" }).click();
    await expect(page.getByLabel("Details of the alleged breach or grounds for appeal *")).toHaveValue(MSG);
    await expect(page.getByLabel("Email for acknowledgement and determination")).toHaveValue("enquirer@example.org");

    await page.goto("/portal/messages");
    await inbox.getByRole("link", { name: /E2E Program Enquirer/ }).click();
    await page.getByRole("button", { name: "Archive" }).click();
    await toast(page, /archived/i);
    await page.goto("/portal/messages");
    await expect(inbox.getByRole("link", { name: /E2E Program Enquirer/ })).toHaveCount(0);
  });
});

test.describe.serial("staff application tools, reviewer conflict and Commission recusal", () => {
  const INSTITUTION = `E2E Staff-Logged College ${SUFFIX}`;
  const PROGRAM = `E2E Declined Short Course ${SUFFIX}`;
  let appUrl = "";

  test("an officer logs an inquiry and manages its documents, reviewers and stages", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/applications/new");
    await page.getByLabel("Legal institution name *").fill(INSTITUTION);
    await page.getByLabel("Country *").fill("Zambia");
    await page.getByLabel("Representative").fill("E2E Principal");
    await page.getByLabel("Official email").fill("principal@example.edu");
    await page.getByRole("button", { name: "Create record" }).click();
    await page.waitForURL(/\/portal\/applications\/[0-9a-f-]{36}/);
    appUrl = page.url().split("?")[0];
    await toast(page, /Inquiry logged as ACC-\d{4}-\d{4}/);
    await expect(page.getByText("Logged by the Secretariat").first()).toBeVisible();

    // The first document in the list is "Legal establishment and authorization".
    await page.getByLabel("File a document").first().setInputFiles(fixture("sample.pdf"));
    await toast(page, "Document filed and marked received");
    await page.getByRole("button", { name: "Mark outstanding" }).first().click();
    await toast(page, "Document status updated");

    await page.getByRole("button", { name: "Advance to Eligibility review →" }).click();
    await expect(page.getByText("Stage 2 of 8 · Eligibility review")).toBeVisible();
    await page.getByRole("button", { name: "Return to previous stage" }).click();
    await expect(page.getByText("Stage 1 of 8 · Inquiry & orientation")).toBeVisible();
    for (const next of ["Eligibility review", "Formal application", "Self-study"]) await page.getByRole("button", { name: `Advance to ${next} →` }).click();
    await expect(page.getByText("Stage 4 of 8 · Self-study")).toBeVisible();

    for (const reviewer of ["Sample Reviewer — Curriculum and assessment", "Sample Reviewer B — Academic governance"]) {
      await page.getByLabel("Appoint a reviewer…").selectOption({ label: reviewer });
      await page.getByRole("button", { name: "Appoint" }).click();
      await toast(page, "Reviewer appointed");
    }
    await page.getByRole("button", { name: "Remove" }).first().click();
    await toast(page, "Reviewer removed");
    await expect(page.getByText("Sample Reviewer B").first()).toBeVisible();
  });

  test("a reviewer with a conflict withdraws, and the officer is told to reassign", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, "reviewer2@accphe.test", PASSWORD);
    await page.getByRole("link", { name: new RegExp(INSTITUTION) }).click();
    await page.getByRole("button", { name: "I have a conflict" }).click();
    await toast(page, "Conflict declared");
    await signIn(page, ACCOUNTS.officer);
    await page.goto(appUrl);
    await expect(page.getByText("Conflict declared — reassign")).toBeVisible();
  });

  test("a Commission member recuses from a deliberation", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.c2);
    await page.getByRole("link", { name: /Sample Business College \(demo\)/ }).click();
    await page.getByRole("button", { name: /Recuse/ }).click();
    await toast(page, "Recusal recorded");
    await expect(page.getByText("Recused").first()).toBeVisible();
  });

  test("a staff-logged program application can be declined at the decision step", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/applications/new?kind=program");
    await page.getByLabel("Program title *").fill(PROGRAM);
    await page.getByLabel("Education provider (legal name) *").fill("E2E Short Course Provider");
    await page.getByLabel("Country *").fill("Kenya");
    await page.getByRole("button", { name: "Create record" }).click();
    await toast(page, /Program application logged as PRG-\d{4}-\d{4}/);
    for (const next of ["Documentation & self-evaluation", "Independent program review", "Accreditation decision"]) await page.getByRole("button", { name: `Advance to ${next} →` }).click();
    await expect(page.getByText("Stage 4 of 6 · Accreditation decision")).toBeVisible();
    await page.getByRole("button", { name: "Decline" }).click();
    await toast(page, "Decision recorded");
    await expect(page.getByText("This application was declined by the authorized body.")).toBeVisible();
    await expect(page.getByText("Declined", { exact: true }).first()).toBeVisible();
  });
});

test.describe.serial("program provider portal", () => {
  const EMAIL = `e2e.provider.${SUFFIX}@example.org`;
  const PW = "Provider-2026-portal";

  test("a provider requests an account quoting the program reference and follows the review", async ({ page }) => {
    await page.context().clearCookies();
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/applications?kind=program");
    const ref = ((await page.getByRole("row").filter({ hasText: "Sample Diploma in Digital Transformation (demo)" }).locator("td").first().textContent()) ?? "").trim();
    expect(ref).toMatch(/^PRG-\d{4}-\d{4}$/);

    await page.context().clearCookies();
    await page.goto(`/portal/register?ref=${encodeURIComponent(ref)}`);
    await page.getByLabel("Full name *").fill("E2E Provider Lead");
    await page.getByLabel("Position *").fill("Head of Programs");
    await page.getByLabel("Institution *").fill("Sample Training Institute (demo)");
    await page.getByLabel("Official email *").fill(EMAIL);
    await page.getByLabel("Password *", { exact: true }).fill(PW);
    await page.getByLabel("Confirm password *").fill(PW);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit account request" }).click();
    await expect(page.getByText(`linked to ${ref}`)).toBeVisible();

    await signIn(page, ACCOUNTS.admin);
    await page.goto("/portal/users");
    const row = page.getByRole("row", { name: /E2E Provider Lead/ });
    await row.getByRole("combobox").selectOption({ label: `${ref} — Sample Diploma in Digital Transformation (demo) (Sample Training Institute (demo))` });
    await row.getByRole("button", { name: "Approve" }).click();
    await toast(page, "Account approved");

    await signIn(page, EMAIL, PW);
    await expect(page).toHaveURL(/\/portal\/my-application$/);
    await expect(page.getByRole("heading", { name: "Sample Diploma in Digital Transformation (demo)" })).toBeVisible();
    await expect(page.getByText("Stage 3 of 6")).toBeVisible();
    await expect(page.getByText("Independent program review").first()).toBeVisible();
    await page.getByPlaceholder("Write to the Secretariat…").fill("Our instructors are available for interviews next week.");
    await page.getByRole("button", { name: "Send message" }).click();
    await toast(page, "Message sent to the Secretariat");
  });
});

test.describe.serial("news and manual directory records", () => {
  const ARTICLE = `E2E Temporary Announcement ${SUFFIX}`;
  const RECORD = `E2E Manual Record Institute ${SUFFIX}`;
  const PROGRAM = `E2E Manual Program Record ${SUFFIX}`;

  test("an editor publishes, unpublishes and deletes an article", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.editor);
    await page.goto("/portal/news/new");
    await page.getByLabel("Title", { exact: true }).fill(ARTICLE);
    await page.getByLabel("Summary *").fill("A temporary announcement for testing.");
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await page.waitForURL(/\/portal\/news/);
    await page.goto("/news");
    await expect(page.getByRole("link", { name: ARTICLE }).first()).toBeVisible();

    await signIn(page, ACCOUNTS.editor);
    await page.goto("/portal/news");
    await page
      .locator("div")
      .filter({ has: page.getByRole("link", { name: ARTICLE, exact: true }) })
      .filter({ has: page.getByRole("button", { name: "Unpublish" }) })
      .last()
      .getByRole("button", { name: "Unpublish" })
      .click();
    await toast(page, /unpublished|draft/i);
    await page.goto("/news");
    await expect(page.getByRole("link", { name: ARTICLE })).toHaveCount(0);

    await signIn(page, ACCOUNTS.editor);
    await page.goto("/portal/news");
    await page.getByRole("link", { name: ARTICLE }).click();
    await page.getByRole("button", { name: "Delete article" }).click();
    await page.waitForURL(/\/portal\/news(\?|$)/);
    await expect(page.getByRole("link", { name: ARTICLE })).toHaveCount(0);
  });

  test("an officer creates and deletes a draft institution record (Enter saves, never publishes)", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/directory/new");
    await page.getByLabel("Legal institution name *").fill(RECORD);
    await page.getByLabel("Country *").fill("Malawi");
    // Pressing Enter saves; it must never publish (here publishing would be refused: the decision is not verified).
    await page.getByLabel("Country *").press("Enter");
    await toast(page, "Record saved");
    await page.getByRole("link", { name: RECORD }).click();
    await page.getByRole("button", { name: "Delete record" }).click();
    await toast(page, "Record deleted");
    await expect(page.getByRole("link", { name: RECORD })).toHaveCount(0);
  });

  test("an officer creates a program record by hand, publishes and unpublishes it", async ({ page }) => {
    autoConfirm(page);
    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/directory?kind=programs");
    await page.getByRole("link", { name: "+ New program record" }).click();
    await page.getByLabel("Approved program title *").fill(PROGRAM);
    await page.getByLabel("Education provider *").fill("E2E Manual Provider");
    await page.getByLabel("Country *").fill("Tanzania");
    await page.getByLabel("Effective date").fill("2026-01-15");
    await page.getByLabel("Valid until (renewal review)").fill("2029-01-15");
    await page.getByLabel("Formal decision verified").check();
    await page.getByRole("button", { name: "Save and publish" }).click();
    await toast(page, /Published to the directory of approved programs \(ACCPHE-P-\d{4}-\d{4}\)/);

    await page.goto("/directory/programs");
    await expect(page.getByRole("link", { name: PROGRAM })).toBeVisible();

    await signIn(page, ACCOUNTS.officer);
    await page.goto("/portal/directory?kind=programs");
    await page.getByRole("row").filter({ hasText: PROGRAM }).getByRole("button", { name: "Unpublish" }).click();
    await toast(page, "Removed from the public directory");
    await page.goto("/directory/programs");
    await expect(page.getByRole("link", { name: PROGRAM })).toHaveCount(0);
  });
});
