const path = require("node:path");
const { test, expect } = require("@playwright/test");
const { installPokeApiMocks } = require("./mock-pokeapi");

const evidenceDirectory = path.resolve(__dirname, "../../evidencias");

test.beforeEach(async ({ page }) => {
  await installPokeApiMocks(page);
  await page.goto("/");
  await expect(page.locator("#pokemon-grid")).toHaveAttribute("aria-busy", "false");
});

test("carga la colección inicial y su paginación", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Pokédex completa" })).toBeVisible();
  await expect(page.locator("#results-count")).toHaveText("151 Pokémon");
  await expect(page.locator(".pokemon-card")).toHaveCount(24);
  await expect(page.getByRole("button", { name: "Página 1" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.screenshot({
    path: path.join(evidenceDirectory, "01-coleccion-inicial.png"),
    fullPage: true,
  });
});

test("navega desde el menú a otro rango de la colección", async ({ page }) => {
  await page.getByRole("button", { name: "Colección" }).click();
  await page.getByRole("button", { name: "N.º 051–100" }).click();

  await expect(page.getByRole("heading", { name: "N.º 051–100" })).toBeVisible();
  await expect(page.locator("#results-count")).toHaveText("50 Pokémon");
  await expect(page.locator(".pokemon-card").first()).toContainText("#051");
  await page.screenshot({
    path: path.join(evidenceDirectory, "02-navegacion-rango.png"),
    fullPage: true,
  });
});

test("busca un Pokémon, abre su ficha y lo agrega a favoritos", async ({ page }) => {
  await page.locator("#pokemon-search").fill("pikachu");
  await expect(page.locator("#results-count")).toHaveText("1 Pokémon");
  await page.getByRole("button", { name: "Ver ficha de pikachu, número 25" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Pikachu" })).toBeVisible();
  await expect(dialog).toContainText("Un Pokémon eléctrico.");
  await page.getByRole("button", { name: "Cerrar ficha" }).click();

  await page.locator(".favorite-button").click();
  await page.locator('[data-view-id="favorites"]').click();
  await expect(page.getByRole("heading", { name: "Mis favoritos" })).toBeVisible();
  await expect(page.locator("#results-count")).toHaveText("1 Pokémon");
  await expect(page.locator(".pokemon-card")).toContainText("pikachu");
});

test("filtra la colección mediante el submenú de tipos", async ({ page }) => {
  await page.getByRole("button", { name: "Tipos" }).click();
  await page.getByRole("button", { name: "Fuego", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Fuego", exact: true })).toBeVisible();
  await expect(page.locator("#results-count")).toHaveText("2 Pokémon");
  await expect(page.locator(".pokemon-card").first()).toContainText("charmander");
});
