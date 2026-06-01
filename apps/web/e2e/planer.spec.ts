import { expect, test } from "@playwright/test";

// Walking-skeleton smoke test: address -> geocode -> footprint on a map,
// persisted in IndexedDB so it survives a reload. The geo API is mocked so
// the test needs neither the backend nor external services.
test("planer_addressToFootprint_persistsAcrossReload", async ({ page }) => {
  await page.route("**/api/v1/geo/geocode", (route) =>
    route.fulfill({
      json: {
        results: [
          {
            label: "Teststraße 1, 10117 Berlin",
            lat: 52.52,
            lng: 13.405,
            city: "Berlin",
            postcode: "10117",
            country: "Deutschland",
          },
        ],
      },
    }),
  );
  await page.route("**/api/v1/geo/footprint*", (route) =>
    route.fulfill({
      json: {
        footprint: {
          points: [
            { lat: 52.52, lng: 13.405 },
            { lat: 52.5201, lng: 13.405 },
            { lat: 52.5201, lng: 13.4051 },
            { lat: 52.52, lng: 13.4051 },
          ],
          source: "osm",
        },
      },
    }),
  );

  await page.goto("/de/planer");

  await page.getByLabel("Adresse").fill("Teststraße 1");
  await page.getByRole("button", { name: "Suchen" }).click();
  await page.getByRole("button", { name: /Teststraße 1, 10117 Berlin/ }).click();

  await expect(page.getByTestId("planer-result")).toBeVisible();
  await expect(page.getByTestId("footprint-map")).toBeVisible();
  await expect(page.getByText("Gebäudeumriss gefunden.")).toBeVisible();

  // Persisted in IndexedDB → still there after a full reload.
  await page.reload();
  await expect(page.getByTestId("planer-result")).toBeVisible();
  await expect(page.getByText("Gebäudeumriss gefunden.")).toBeVisible();
});
