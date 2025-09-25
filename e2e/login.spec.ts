import { test, expect } from "@playwright/test";

test("test login", async ({ page }) => {
  await page.goto("http://localhost:9000/login");
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("textbox", { name: "Username" }).click();
  await page.getByRole("textbox", { name: "Username" }).fill("tactical");
  await page.getByRole("textbox", { name: "Username" }).press("Tab");
  await page.getByRole("textbox", { name: "Password" }).fill("tactical");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByLabel("", { exact: true }).click();
  await page.getByLabel("", { exact: true }).fill("sekret");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Tactical RMMv")).toBeVisible();
});
