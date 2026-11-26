const { test, expect } = require("@playwright/test");

const API_BASE = "https://pokeapi.co/api/v2";

test("PokéAPI responde 200 con datos JSON de un Pokémon", async ({ request }) => {
  const response = await request.get(`${API_BASE}/pokemon/pikachu`);

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");

  const pokemon = await response.json();
  expect(pokemon).toMatchObject({ id: 25, name: "pikachu" });
  expect(pokemon.types.length).toBeGreaterThan(0);
});

test("PokéAPI responde 404 con un error JSON para un Pokémon inexistente", async ({
  request,
}) => {
  const response = await request.get(`${API_BASE}/pokemon/0`);

  expect(response.status()).toBe(404);
  expect(response.headers()["content-type"]).toContain("application/json");
  await expect(response.json()).resolves.toMatchObject({
    status: 404,
    message: "Not Found",
  });
});
