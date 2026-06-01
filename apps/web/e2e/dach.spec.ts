import { expect, test } from "@playwright/test";

// M1.0: picking a roof template builds geometry and shows the surface summary,
// and the choice persists across reload (Dexie). WebGL output is not asserted
// (the summary is computed independently of the canvas).
test("dach_selectTemplate_buildsGeometryAndPersists", async ({ page }) => {
  await page.goto("/de/planer/dach");

  await page.getByRole("button", { name: "Satteldach" }).click();

  // Gable has two roof faces.
  await expect(page.getByText(/2 Dachflächen/)).toBeVisible();

  // Module auto-layout produced a positive count + kWp.
  await expect(page.getByText("Module", { exact: true })).toBeVisible();
  await expect(page.getByText(/kWp/)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/2 Dachflächen/)).toBeVisible();
  await expect(page.getByText("Module", { exact: true })).toBeVisible();
});
