const API_BASE = "https://pokeapi.co/api/v2";

const knownPokemon = {
  1: "bulbasaur",
  2: "ivysaur",
  3: "venusaur",
  4: "charmander",
  5: "charmeleon",
  6: "charizard",
  25: "pikachu",
};

function pokemonUrl(id) {
  return `${API_BASE}/pokemon/${id}/`;
}

async function installPokeApiMocks(page) {
  await page.route(`${API_BASE}/**`, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/v2", "");
    let data;

    if (path === "/pokemon" && url.searchParams.get("limit") === "151") {
      data = {
        count: 151,
        results: Array.from({ length: 151 }, (_, index) => {
          const id = index + 1;
          return {
            name: knownPokemon[id] ?? `pokemon-${id}`,
            url: pokemonUrl(id),
          };
        }),
      };
    } else if (path === "/type") {
      data = {
        results: [
          { name: "fire", url: `${API_BASE}/type/10/` },
          { name: "electric", url: `${API_BASE}/type/13/` },
        ],
      };
    } else if (path === "/type/fire") {
      data = {
        pokemon: [4, 6].map((id) => ({
          pokemon: {
            name: knownPokemon[id],
            url: pokemonUrl(id),
          },
        })),
      };
    } else if (path === "/pokemon/25") {
      data = {
        height: 4,
        weight: 60,
        sprites: {
          other: { "official-artwork": { front_default: null } },
          front_default: null,
        },
        types: [{ type: { name: "electric" } }],
        stats: [{ base_stat: 35, stat: { name: "hp" } }],
      };
    } else if (path === "/pokemon-species/25") {
      data = {
        names: [{ language: { name: "es" }, name: "Pikachu" }],
        flavor_text_entries: [
          { language: { name: "es" }, flavor_text: "Un Pokémon eléctrico." },
        ],
      };
    } else {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ status: 404, message: "Not Found" }),
      });
      return;
    }

    await route.fulfill({ json: data });
  });

  await page.route("https://raw.githubusercontent.com/**", (route) => route.abort());
}

module.exports = { installPokeApiMocks };
