import { expect, test } from "@playwright/test";

test("unauthenticated user is redirected from / to /login", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL("/login");
});

test("shows error on wrong credentials", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel(/username/i).fill("wrong");
  await page.getByLabel(/password/i).fill("wrong");
  await page.getByRole("button", { name: /log in/i }).click();

  await expect(
    page.getByText(/invalid username or password/i)
  ).toBeVisible();
});

test("logs in with correct credentials and shows kanban board", async ({
  page,
}) => {
  await page.goto("/login");

  await page.getByLabel(/username/i).fill("user");
  await page.getByLabel(/password/i).fill("password");
  await page.getByRole("button", { name: /log in/i }).click();

  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { name: "Kanban Studio" })
  ).toBeVisible();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(5);
});

test("authenticated user is redirected from /login to /", async ({ page }) => {
  // Set up auth session
  await page.goto("/login");
  await page.evaluate(() =>
    localStorage.setItem("pm_auth_session", "true")
  );

  // Navigate to login
  await page.goto("/login");

  // Should be redirected to /
  await expect(page).toHaveURL("/");
});

test("logs out from kanban board and redirects to /login", async ({
  page,
}) => {
  // Set up auth and navigate to board
  await page.goto("/login");
  await page.evaluate(() =>
    localStorage.setItem("pm_auth_session", "true")
  );
  await page.goto("/");

  // Click logout button
  await page.getByRole("button", { name: /log out/i }).click();

  // Should be redirected to /login
  await expect(page).toHaveURL("/login");
});

test("cannot access / after logout without logging in again", async ({
  page,
}) => {
  // Set up auth and navigate to board
  await page.goto("/login");
  await page.evaluate(() =>
    localStorage.setItem("pm_auth_session", "true")
  );
  await page.goto("/");

  // Click logout button
  await page.getByRole("button", { name: /log out/i }).click();

  // Wait for redirect
  await expect(page).toHaveURL("/login");

  // Try to access / directly
  await page.goto("/");

  // Should still be on /login
  await expect(page).toHaveURL("/login");
});
