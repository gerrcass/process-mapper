import { expect, test, type Page } from "@playwright/test";

const SUPPORT_MAP = "Customer support escalation";
let consoleErrors: string[] = [];

async function resetWorkspace(page: Page) {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: /Frame the process/ })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await resetWorkspace(page);
});

test.afterEach(() => {
  expect(consoleErrors).toEqual([]);
});

test("primary journey keeps SIPOC and flow in sync across a reload", async ({ page }) => {
  await page.getByRole("link", { name: `Open ${SUPPORT_MAP}`, exact: true }).click();
  await expect(page).toHaveURL(/\/maps\/?\?map=map-support-escalation$/);
  await expect(page.getByRole("heading", { name: "Suppliers" })).toBeVisible();

  await page.getByRole("button", { name: "Add supplier" }).click();
  await page.getByLabel("New supplier label").fill("Procurement desk");
  await page.getByLabel("New supplier detail").fill("Owns vendor checks");
  await page.getByRole("button", { name: "Add supplier" }).click();
  await expect(page.getByRole("textbox", { name: "Suppliers entry 5 label" })).toHaveValue(
    "Procurement desk",
  );

  await page
    .getByRole("navigation", { name: "Map views" })
    .getByRole("link", { name: "Flow" })
    .click();
  await expect(page.getByRole("toolbar", { name: "Flow tools" })).toBeVisible();
  await page.getByRole("button", { name: "Add step node" }).click();

  const title = page.getByRole("textbox", { name: "Title", exact: true });
  await expect(title).toHaveValue("New step");
  await title.fill("Verify the fix");
  await title.press("Enter");

  const owner = page.getByRole("textbox", { name: "Owner" });
  await owner.fill("Support engineer");
  await owner.press("Enter");

  const system = page.getByRole("textbox", { name: "System" });
  await system.fill("Jira");
  await system.press("Enter");

  await expect(
    page.locator(".react-flow__node").filter({ hasText: "Verify the fix" }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByRole("toolbar", { name: "Flow tools" })).toBeVisible();
  await expect(
    page.locator(".react-flow__node").filter({ hasText: "Verify the fix" }),
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "Map views" })
    .getByRole("link", { name: "SIPOC" })
    .click();
  const process = page.getByRole("region", { name: "Process" });
  await expect(page.getByRole("textbox", { name: "Step 5 title" })).toHaveValue("Verify the fix");
  await expect(process.getByText("Support engineer")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Suppliers entry 5 label" })).toHaveValue(
    "Procurement desk",
  );
});

test("lifecycle journey creates from a template, searches, deletes, and imports JSON", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New map" }).click();
  await page.getByRole("dialog").getByText("New hire onboarding", { exact: true }).click();
  const title = page.getByLabel("Title");
  await title.fill("Onboarding v2");
  await page.getByRole("button", { name: "Create map" }).click();

  await expect(page).toHaveURL(/\/maps\/?\?map=map-/);
  await expect(page.getByRole("textbox", { name: "Map title" })).toHaveValue("Onboarding v2");

  await page.getByRole("link", { name: "Back to workspace" }).click();
  await page.getByRole("searchbox", { name: "Search maps" }).fill("Onboarding v2");
  await expect(page.getByRole("link", { name: "Open Onboarding v2" })).toBeVisible();

  await page.getByRole("button", { name: "Actions for Onboarding v2" }).click();
  await page.getByRole("menuitem", { name: "Delete map" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete map" }).click();
  await expect(page.getByRole("link", { name: "Open Onboarding v2" })).toHaveCount(0);
  await page.getByRole("button", { name: "Show all maps" }).click();
  await expect(page.getByRole("link", { name: `Open ${SUPPORT_MAP}`, exact: true })).toBeVisible();

  const invalidChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import a map from a JSON file" }).click();
  const invalidChooser = await invalidChooserPromise;
  await invalidChooser.setFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"title":"broken"}'),
  });
  await expect(page.getByText(/Could not import this file/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open Customer support escalation (imported)" }),
  ).toHaveCount(0);

  await page.getByRole("link", { name: `Open ${SUPPORT_MAP}`, exact: true }).click();
  await page.getByRole("button", { name: "Export or import map data" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Map JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("customer-support-escalation.process-atlas.json");
  const downloadPath = test.info().outputPath("support-map.json");
  await download.saveAs(downloadPath);

  await page.getByRole("link", { name: "Back to workspace" }).click();
  await expect(page.getByRole("searchbox", { name: "Search maps" })).toBeVisible();
  const importChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import a map from a JSON file" }).click();
  const importChooser = await importChooserPromise;
  await importChooser.setFiles(downloadPath);
  await expect(
    page.getByRole("link", { name: "Open Customer support escalation (imported)" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: `Open ${SUPPORT_MAP}`, exact: true })).toBeVisible();
});

test("resilience states cover corrupt storage, a missing map, and an empty flow", async ({
  browser,
  page,
}) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.setItem(
      "process-atlas.workspace",
      JSON.stringify({ state: { maps: [{ broken: true }] }, version: 1 }),
    );
  });
  const corruptPage = await context.newPage();
  await corruptPage.goto("/");
  await expect(corruptPage.getByText(/Saved workspace could not be read/)).toBeVisible();
  await expect(corruptPage.getByRole("link", { name: `Open ${SUPPORT_MAP}` })).toBeVisible();
  await context.close();

  await page.goto("/maps?map=does-not-exist");
  await expect(
    page.getByRole("heading", { name: "This map is not in this workspace." }),
  ).toBeVisible();

  await page.goto("/");
  await page.getByRole("button", { name: "New map" }).click();
  await page.getByLabel("Title").fill("Empty process");
  await page.getByRole("button", { name: "Create map" }).click();
  await page
    .getByRole("navigation", { name: "Map views" })
    .getByRole("link", { name: "Flow" })
    .click();
  await expect(page.getByRole("heading", { name: "Start with the first step." })).toBeVisible();
  await page.getByRole("button", { name: "Add first step" }).click();
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveValue("New step");
});

test("a broken share link names the reason and leaves the workspace untouched", async ({
  page,
}) => {
  // A payload whose base64 is valid but whose content is not JSON.
  await page.goto("/maps#shared=u1.bm90IGpzb24");
  await expect(page.getByRole("heading", { name: "This link cannot be read." })).toBeVisible();
  await expect(page.getByText(/the payload is not valid JSON/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to workspace" })).toBeVisible();

  // A link with an empty payload explains that it carries no map.
  await page.goto("/maps#shared=");
  await expect(page.getByText("This share link carries no map.")).toBeVisible();

  // A link whose fragment was lost in transit gets the same explanation.
  await page.goto("/maps");
  await expect(page.getByText("This share link carries no map.")).toBeVisible();

  // The workspace is untouched: the seeded maps, and no partial write.
  await page.getByRole("link", { name: "Back to workspace" }).click();
  await expect(page.getByRole("heading", { name: /Frame the process/ })).toBeVisible();
  await expect(page.getByRole("link", { name: `Open ${SUPPORT_MAP}`, exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /\(imported\)/ })).toHaveCount(0);
});

test("a shared link reads in a fresh context, adopts, and the edit persists", async ({
  browser,
  page,
}) => {
  // The author copies the link from the editor's share dialog.
  await page.getByRole("link", { name: `Open ${SUPPORT_MAP}`, exact: true }).click();
  await expect(page.getByRole("region", { name: "Suppliers" })).toBeVisible();
  await page.getByRole("button", { name: "Share this map" }).click();
  const linkInput = page.getByLabel("Share link");
  await expect(linkInput).not.toHaveValue("");
  const shareLink = await linkInput.inputValue();

  // The recipient opens the link in a context with cleared storage.
  const context = await browser.newContext();
  const recipient = await context.newPage();
  recipient.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  recipient.on("pageerror", (error) => consoleErrors.push(error.message));
  await recipient.goto(shareLink);
  await expect(recipient.getByRole("heading", { level: 1, name: SUPPORT_MAP })).toBeVisible();
  await expect(recipient.getByRole("note")).toContainText("Read-only");
  await expect(recipient.getByRole("region", { name: "Process" })).toContainText(
    "Triage the ticket",
  );
  await expect(recipient.getByText("Ready to share")).toBeVisible();
  await expect(recipient.getByRole("button", { name: "Add supplier" })).toHaveCount(0);

  // Adopting lands in the editor on the adopted map: draft, renamed for the collision.
  await recipient.getByRole("button", { name: "Add to my workspace" }).click();
  await expect(recipient).toHaveURL(/\/maps\/?\?map=map-/);
  await expect(recipient.getByRole("textbox", { name: "Map title" })).toHaveValue(
    `${SUPPORT_MAP} (imported)`,
  );
  await expect(recipient.getByRole("button", { name: /Status: Draft/ })).toBeVisible();

  // Edit a SIPOC process step label on the adopted map.
  const stepTitle = recipient.getByRole("textbox", { name: "Step 1 title" });
  await expect(stepTitle).toHaveValue("Triage the ticket");
  await stepTitle.fill("Screen the ticket");
  await stepTitle.blur();
  await expect(recipient.getByRole("textbox", { name: "Step 1 title" })).toHaveValue(
    "Screen the ticket",
  );

  // The edit persists across a reload, and the dashboard shows the origin.
  await recipient.reload();
  await expect(recipient.getByRole("region", { name: "Process" })).toBeVisible();
  await expect(recipient.getByRole("textbox", { name: "Step 1 title" })).toHaveValue(
    "Screen the ticket",
  );
  await recipient.getByRole("link", { name: "Back to workspace" }).click();
  await expect(
    recipient.getByRole("link", { name: `Open ${SUPPORT_MAP} (imported)` }),
  ).toBeVisible();
  await expect(recipient.getByText("From a link")).toBeVisible();
  await context.close();
});

test("the dashboard and editor remain usable at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Frame the process/ })).toBeVisible();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);

  await page.getByRole("button", { name: "New map" }).click();
  const newMapDialog = page.getByRole("dialog");
  await expect(newMapDialog).toBeVisible();
  await expect(newMapDialog.getByRole("button", { name: "Create map" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(newMapDialog).toHaveCount(0);

  await page.getByRole("link", { name: `Open ${SUPPORT_MAP}`, exact: true }).click();
  await expect(page.getByRole("region", { name: "Suppliers" })).toBeVisible();
  await page.getByRole("button", { name: /Review map/ }).click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Ready to share" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation", { name: "Map views" })
    .getByRole("link", { name: "Flow" })
    .click();
  await page.getByRole("button", { name: "Add step node" }).click();
  await expect(page.getByRole("dialog", { name: "Flow inspector" })).toBeVisible();
  await page.getByRole("button", { name: "Close inspector" }).click();
  await expect(page.getByRole("dialog", { name: "Flow inspector" })).toHaveCount(0);
});

test("tablet width keeps the SIPOC board and inspector usable", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Frame the process/ })).toBeVisible();
  await page.getByRole("link", { name: `Open ${SUPPORT_MAP}`, exact: true }).click();
  await expect(page.getByRole("region", { name: "Suppliers" })).toBeVisible();
  const scrolls = await page.evaluate(() => {
    const scroller = document.querySelector(".lane-scroll");
    return scroller ? scroller.scrollWidth > scroller.clientWidth : false;
  });
  expect(scrolls).toBe(true);

  await page
    .getByRole("navigation", { name: "Map views" })
    .getByRole("link", { name: "Flow" })
    .click();
  await page.getByRole("button", { name: "Select a flow node" }).click();
  await page.getByRole("menuitem", { name: /Assign an incident owner/ }).click();
  const inspector = page.getByRole("dialog", { name: "Flow inspector" });
  await expect(inspector).toBeVisible();
  await expect(inspector.getByRole("textbox", { name: "Title" })).toHaveValue(
    "Assign an incident owner",
  );
  await inspector.getByRole("button", { name: "Close inspector" }).click();
  await expect(inspector).toHaveCount(0);
});

test("a deep-linked node does not hijack later inspector edits", async ({ page }) => {
  await page.goto("/maps?map=map-support-escalation&view=flow&node=support-node-triage");
  const title = page.getByRole("textbox", { name: "Title", exact: true });
  await expect(title).toHaveValue("Triage the ticket");

  await page.getByRole("button", { name: "Select a flow node" }).click();
  await page.getByRole("menuitem", { name: /Assign an incident owner/ }).click();
  await expect(title).toHaveValue("Assign an incident owner");

  await title.fill("Assign the incident owner");
  await title.press("Enter");
  await expect(title).toHaveValue("Assign the incident owner");
});
