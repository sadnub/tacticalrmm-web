import { test, expect } from "@playwright/test";

test("add client", async ({ page }) => {
  await page.goto("http://localhost:9000");
  await page.getByRole("button", { name: "File" }).click();
  await page.getByText("Addkeyboard_arrow_right").click();
  await page
    .getByRole("listitem")
    .filter({ hasText: /^Client$/ })
    .click();
  await page.getByRole("textbox", { name: "Name" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("Default");
  await page.getByRole("textbox", { name: "Name" }).press("Tab");
  await page.getByRole("textbox", { name: "Default first site" }).fill("Default");
  await page.getByRole("textbox", { name: "Name" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("tree")).toContainText("play_arrowbusinessDefault");
  await page.getByText("play_arrow").nth(1).click();
  await expect(page.getByRole("group")).toContainText("apartmentDefault");
});
