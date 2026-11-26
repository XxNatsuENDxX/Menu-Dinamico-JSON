const API_BASE = "https://pokeapi.co/api/v2";
const PAGE_SIZE = 24;
const FIRST_GENERATION_SIZE = 151;

const navigationList = document.querySelector("#navigation-list");
const pokemonGrid = document.querySelector("#pokemon-grid");
const resultsOverline = document.querySelector("#results-overline");
const resultsTitle = document.querySelector("#results-title");
const resultsCount = document.querySelector("#results-count");
const pagination = document.querySelector("#pagination");
const searchInput = document.querySelector("#pokemon-search");
const statusMessage = document.querySelector("#status-message");
const menuToggle = document.querySelector("#menu-toggle");
const primaryNavigation = document.querySelector("#primary-navigation");
const pokemonDialog = document.querySelector("#pokemon-dialog");
const pokemonDetail = document.querySelector("#pokemon-detail");

const state = {
  pokemon: [],
  types: [],
  typePokemon: [],
  typeCache: new Map(),
  favorites: new Set(),
  currentView: { kind: "collection", start: 1, end: FIRST_GENERATION_SIZE },
  currentPage: 1,
  searchTerm: "",
  requestId: 0,
};

const typeLabels = {
  bug: "Bicho",
  dark: "Siniestro",
  dragon: "Dragón",
  electric: "Eléctrico",
  fairy: "Hada",
  fighting: "Lucha",
  fire: "Fuego",
  flying: "Volador",
  ghost: "Fantasma",
  grass: "Planta",
  ground: "Tierra",
  ice: "Hielo",
  normal: "Normal",
  poison: "Veneno",
  psychic: "Psíquico",
  rock: "Roca",
  steel: "Acero",
  water: "Agua",
};

const statLabels = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. especial",
  "special-defense": "Def. especial",
  speed: "Velocidad",
};

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getTypeLabel(type) {
  return typeLabels[type] ?? capitalize(type);
}

function setStatus(message, kind = "") {
  statusMessage.replaceChildren();
  statusMessage.className = `status-message${kind ? ` status-${kind}` : ""}`;
  if (message) statusMessage.textContent = message;
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`La API respondió con el estado ${response.status}.`);
  }
  return response.json();
}

function createNavigationButton(item, nested = false) {
  const button = document.createElement("button");
  button.className = nested ? "submenu-link" : "navigation-link";
  button.type = "button";
  button.dataset.viewId = item.id;
  button.textContent = item.label;
  button.addEventListener("click", () => openView(item.view));
  return button;
}

function createNavigationGroup(label, id, children) {
  const listItem = document.createElement("li");
  listItem.className = "has-submenu";
  const trigger = document.createElement("button");
  trigger.className = "navigation-link submenu-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-expanded", "false");

  const triggerLabel = document.createElement("span");
  triggerLabel.textContent = label;
  const chevron = document.createElement("span");
  chevron.className = "chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "⌄";
  trigger.append(triggerLabel, chevron);

  const submenu = document.createElement("ul");
  submenu.className = "submenu";
  submenu.setAttribute("aria-label", label);
  for (const child of children) {
    const childItem = document.createElement("li");
    childItem.append(createNavigationButton(child, true));
    submenu.append(childItem);
  }

  trigger.addEventListener("click", () => {
    const expanded = trigger.getAttribute("aria-expanded") === "true";
    closeSubmenus();
    trigger.setAttribute("aria-expanded", String(!expanded));
    listItem.classList.toggle("submenu-open", !expanded);
  });

  listItem.dataset.groupId = id;
  listItem.append(trigger, submenu);
  return listItem;
}

function createNavigation() {
  navigationList.replaceChildren();
  const collections = [
    { id: "all", label: "N.º 001–151 · Todos", start: 1, end: 151 },
    { id: "range-1", label: "N.º 001–050", start: 1, end: 50 },
    { id: "range-2", label: "N.º 051–100", start: 51, end: 100 },
    { id: "range-3", label: "N.º 101–151", start: 101, end: 151 },
  ].map((range) => ({
    id: range.id,
    label: range.label,
    view: { kind: "collection", start: range.start, end: range.end, title: range.label },
  }));
  navigationList.append(createNavigationGroup("Colección", "collection", collections));

  if (state.types.length) {
    const typeOptions = state.types.map((type) => ({
      id: `type-${type.name}`,
      label: getTypeLabel(type.name),
      view: { kind: "type", type: type.name, title: getTypeLabel(type.name) },
    }));
    navigationList.append(createNavigationGroup("Tipos", "types", typeOptions));
  }

  const favoriteItem = document.createElement("li");
  favoriteItem.append(
    createNavigationButton({
      id: "favorites",
      label: "★ Favoritos",
      view: { kind: "favorites", title: "Mis favoritos" },
    }),
  );
  navigationList.append(favoriteItem);

  const allButton = navigationList.querySelector('[data-view-id="all"]');
  allButton?.classList.add("is-active");
  allButton?.setAttribute("aria-current", "page");
}

function closeSubmenus() {
  navigationList.querySelectorAll(".submenu-trigger").forEach((trigger) => {
    trigger.setAttribute("aria-expanded", "false");
    trigger.closest(".has-submenu")?.classList.remove("submenu-open");
  });
}

function getBasePokemon() {
  const view = state.currentView;
  if (view.kind === "type") return state.typePokemon;
  if (view.kind === "favorites") {
    return state.pokemon.filter((pokemon) => state.favorites.has(pokemon.id));
  }
  return state.pokemon.filter((pokemon) => pokemon.id >= view.start && pokemon.id <= view.end);
}

function getFilteredPokemon() {
  const query = state.searchTerm.trim().toLocaleLowerCase();
  return getBasePokemon().filter((pokemon) => {
    return (
      !query ||
      pokemon.name.includes(query) ||
      String(pokemon.id).padStart(3, "0").includes(query.replace(/^#/, ""))
    );
  });
}

function createPokemonCard(pokemon) {
  const card = document.createElement("article");
  card.className = "pokemon-card";
  card.style.setProperty("--card-accent", getCardAccent(pokemon.id));

  const openButton = document.createElement("button");
  openButton.className = "pokemon-card-main";
  openButton.type = "button";
  openButton.setAttribute("aria-label", `Ver ficha de ${pokemon.name}, número ${pokemon.id}`);

  const number = document.createElement("span");
  number.className = "pokemon-number";
  number.textContent = `#${String(pokemon.id).padStart(3, "0")}`;

  const imageFrame = document.createElement("span");
  imageFrame.className = "pokemon-image-frame";
  const image = document.createElement("img");
  image.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
  image.alt = "";
  image.loading = "lazy";
  image.addEventListener("error", () => image.remove(), { once: true });
  imageFrame.append(image);

  const name = document.createElement("span");
  name.className = "pokemon-name";
  name.textContent = pokemon.name;
  const prompt = document.createElement("span");
  prompt.className = "card-prompt";
  prompt.textContent = "Ver ficha  ↗";
  openButton.append(number, imageFrame, name, prompt);
  openButton.addEventListener("click", () => showPokemonDetails(pokemon));

  const favoriteButton = document.createElement("button");
  favoriteButton.className = "favorite-button";
  favoriteButton.type = "button";
  favoriteButton.setAttribute(
    "aria-label",
    state.favorites.has(pokemon.id) ? `Quitar ${pokemon.name} de favoritos` : `Agregar ${pokemon.name} a favoritos`,
  );
  favoriteButton.setAttribute("aria-pressed", String(state.favorites.has(pokemon.id)));
  favoriteButton.textContent = state.favorites.has(pokemon.id) ? "★" : "☆";
  favoriteButton.addEventListener("click", () => toggleFavorite(pokemon));
  card.append(openButton, favoriteButton);
  return card;
}

function getCardAccent(id) {
  const accents = ["#d9edeb", "#f7e6bd", "#e7e1f4", "#e8ead5", "#f3dfe0", "#dce8f4"];
  return accents[id % accents.length];
}

function renderPagination(pageCount) {
  pagination.replaceChildren();
  if (pageCount <= 1) return;

  const previous = createPageButton("←", state.currentPage - 1, "Página anterior");
  previous.disabled = state.currentPage === 1;
  pagination.append(previous);

  for (let page = 1; page <= pageCount; page += 1) {
    const button = createPageButton(String(page), page, `Página ${page}`);
    if (page === state.currentPage) {
      button.classList.add("is-current");
      button.setAttribute("aria-current", "page");
    }
    pagination.append(button);
  }

  const next = createPageButton("→", state.currentPage + 1, "Página siguiente");
  next.disabled = state.currentPage === pageCount;
  pagination.append(next);
}

function createPageButton(label, page, accessibleName) {
  const button = document.createElement("button");
  button.className = "page-button";
  button.type = "button";
  button.textContent = label;
  button.setAttribute("aria-label", accessibleName);
  button.addEventListener("click", () => {
    state.currentPage = page;
    renderPokemon();
    document.querySelector("#pokedex").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  return button;
}

function renderPokemon() {
  const filtered = getFilteredPokemon();
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  state.currentPage = Math.max(1, Math.min(state.currentPage, pageCount || 1));
  const start = (state.currentPage - 1) * PAGE_SIZE;
  const currentPagePokemon = filtered.slice(start, start + PAGE_SIZE);

  pokemonGrid.replaceChildren();
  pokemonGrid.setAttribute("aria-busy", "false");
  if (currentPagePokemon.length) {
    currentPagePokemon.forEach((pokemon) => pokemonGrid.append(createPokemonCard(pokemon)));
  } else {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    const title = document.createElement("h4");
    title.textContent = state.currentView.kind === "favorites" ? "Aún no tienes favoritos" : "No encontramos Pokémon";
    const copy = document.createElement("p");
    copy.textContent =
      state.currentView.kind === "favorites"
        ? "Marca una estrella en cualquier ficha y aparecerá aquí."
        : "Prueba con otro nombre, número o filtro.";
    emptyState.append(title, copy);
    pokemonGrid.append(emptyState);
  }

  resultsTitle.textContent = state.currentView.title ?? "Pokédex completa";
  resultsOverline.textContent =
    state.currentView.kind === "type"
      ? "FILTRO POR TIPO"
      : state.currentView.kind === "favorites"
        ? "MI COLECCIÓN"
        : "COLECCIÓN KANTO";
  resultsCount.textContent = `${filtered.length} Pokémon`;
  renderPagination(pageCount);
}

async function openView(view) {
  state.currentView = view;
  state.currentPage = 1;
  state.searchTerm = "";
  searchInput.value = "";
  closeSubmenus();
  navigationList.querySelectorAll("[data-view-id]").forEach((button) => {
    const isActive = button.dataset.viewId === getViewId(view);
    button.classList.toggle("is-active", isActive);
    if (isActive) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });

  if (view.kind === "type") {
    const requestId = ++state.requestId;
    const cached = state.typeCache.get(view.type);
    if (cached) {
      state.typePokemon = cached;
    } else {
      state.typePokemon = [];
      resultsTitle.textContent = `Tipo ${view.title}`;
      pokemonGrid.replaceChildren(createLoadingState());
      pokemonGrid.setAttribute("aria-busy", "true");
      setStatus(`Consultando Pokémon de tipo ${view.title} en PokéAPI...`);
      try {
        const typeData = await fetchJSON(`${API_BASE}/type/${encodeURIComponent(view.type)}`);
        const availableIds = new Set(state.pokemon.map((pokemon) => pokemon.id));
        state.typePokemon = typeData.pokemon
          .map(({ pokemon }) => {
            const id = extractId(pokemon.url);
            return state.pokemon.find((entry) => entry.id === id);
          })
          .filter((pokemon) => pokemon && availableIds.has(pokemon.id))
          .sort((a, b) => a.id - b.id);
        state.typeCache.set(view.type, state.typePokemon);
      } catch (error) {
        if (requestId !== state.requestId) return;
        pokemonGrid.setAttribute("aria-busy", "false");
        setStatus(`No se pudo cargar el filtro de tipo ${view.title}: ${error.message}`, "error");
        renderPokemon();
        return;
      }
      if (requestId !== state.requestId) return;
    }
  }

  state.requestId += 1;
  setStatus("");
  renderPokemon();
  closeMobileNavigation();
}

function getViewId(view) {
  if (view.kind === "type") return `type-${view.type}`;
  if (view.kind === "favorites") return "favorites";
  if (view.start === 1 && view.end === 151) return "all";
  if (view.start === 1) return "range-1";
  if (view.start === 51) return "range-2";
  return "range-3";
}

function extractId(url) {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
}

function createLoadingState() {
  const loading = document.createElement("div");
  loading.className = "loading-state";
  const spinner = document.createElement("span");
  spinner.className = "loading-spinner";
  spinner.setAttribute("aria-hidden", "true");
  loading.append(spinner);
  return loading;
}

function closeMobileNavigation() {
  if (!window.matchMedia("(max-width: 760px)").matches) return;
  primaryNavigation.classList.remove("navigation-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menú");
}

function toggleFavorite(pokemon) {
  if (state.favorites.has(pokemon.id)) state.favorites.delete(pokemon.id);
  else state.favorites.add(pokemon.id);
  try {
    localStorage.setItem("pokeatlas-favorites", JSON.stringify([...state.favorites]));
  } catch (error) {
    setStatus(`No se pudieron guardar los favoritos en este navegador: ${error.message}`, "error");
  }
  renderPokemon();
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem("pokeatlas-favorites") ?? "[]");
    if (!Array.isArray(saved) || saved.some((id) => !Number.isInteger(id))) {
      throw new Error("El formato guardado no es válido.");
    }
    state.favorites = new Set(saved);
    return "";
  } catch (error) {
    state.favorites = new Set();
    return `No se pudieron recuperar los favoritos guardados: ${error.message}`;
  }
}

function createDetailStat(stat) {
  const row = document.createElement("div");
  row.className = "stat-row";
  const label = document.createElement("span");
  label.className = "stat-label";
  label.textContent = statLabels[stat.stat.name] ?? capitalize(stat.stat.name);
  const value = document.createElement("span");
  value.className = "stat-value";
  value.textContent = String(stat.base_stat);
  const track = document.createElement("span");
  track.className = "stat-track";
  const bar = document.createElement("span");
  bar.className = "stat-bar";
  bar.style.width = `${Math.min(100, (stat.base_stat / 180) * 100)}%`;
  track.append(bar);
  row.append(label, value, track);
  return row;
}

function createMeasurement(label, value) {
  const field = document.createElement("span");
  const name = document.createElement("b");
  name.textContent = label;
  field.append(name, document.createTextNode(value));
  return field;
}

async function showPokemonDetails(pokemon) {
  pokemonDialog.showModal();
  pokemonDetail.setAttribute("aria-busy", "true");
  pokemonDetail.replaceChildren(createLoadingState());

  try {
    const [details, species] = await Promise.all([
      fetchJSON(`${API_BASE}/pokemon/${pokemon.id}`),
      fetchJSON(`${API_BASE}/pokemon-species/${pokemon.id}`),
    ]);
    const spanishName = species.names.find((entry) => entry.language.name === "es")?.name;
    const spanishDescription = species.flavor_text_entries.find(
      (entry) => entry.language.name === "es",
    )?.flavor_text;
    const imageUrl =
      details.sprites.other["official-artwork"].front_default ??
      details.sprites.front_default ??
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;

    pokemonDetail.replaceChildren();
    pokemonDetail.setAttribute("aria-busy", "false");

    const art = document.createElement("div");
    art.className = "detail-art";
    art.style.setProperty("--card-accent", getCardAccent(pokemon.id));
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = spanishName ?? pokemon.name;
    art.append(image);

    const copy = document.createElement("div");
    copy.className = "detail-copy";
    const number = document.createElement("p");
    number.className = "pokemon-number";
    number.textContent = `N.º ${String(pokemon.id).padStart(3, "0")}`;
    const title = document.createElement("h2");
    title.id = "detail-name";
    title.textContent = spanishName ?? capitalize(pokemon.name);
    const english = document.createElement("p");
    english.className = "detail-english";
    english.textContent = capitalize(pokemon.name);
    const description = document.createElement("p");
    description.className = "detail-description";
    description.textContent = spanishDescription?.replace(/[\f\n\r]+/g, " ") ?? "Ficha de Pokémon consultada en PokéAPI.";

    const types = document.createElement("div");
    types.className = "detail-types";
    for (const { type } of details.types) {
      const badge = document.createElement("span");
      badge.className = `type-badge type-${type.name}`;
      badge.textContent = getTypeLabel(type.name);
      types.append(badge);
    }

    const measurements = document.createElement("div");
    measurements.className = "measurements";
    measurements.append(
      createMeasurement("Altura", `${(details.height / 10).toFixed(1)} m`),
      createMeasurement("Peso", `${(details.weight / 10).toFixed(1)} kg`),
    );

    const statsHeading = document.createElement("h3");
    statsHeading.className = "stats-heading";
    statsHeading.textContent = "Estadísticas base";
    const stats = document.createElement("div");
    stats.className = "stats-list";
    details.stats.forEach((stat) => stats.append(createDetailStat(stat)));

    copy.append(number, title, english, description, types, measurements, statsHeading, stats);
    pokemonDetail.append(art, copy);
  } catch (error) {
    pokemonDetail.setAttribute("aria-busy", "false");
    pokemonDetail.replaceChildren();
    const errorState = document.createElement("div");
    errorState.className = "detail-error";
    const heading = document.createElement("h2");
    heading.textContent = "No se pudo cargar la ficha";
    const message = document.createElement("p");
    message.textContent = error.message;
    errorState.append(heading, message);
    pokemonDetail.append(errorState);
  }
}

function showInitialError(error) {
  pokemonGrid.setAttribute("aria-busy", "false");
  pokemonGrid.replaceChildren();
  setStatus(`No se pudo conectar con PokéAPI: ${error.message}`, "error");

  const retry = document.createElement("button");
  retry.className = "retry-button";
  retry.type = "button";
  retry.textContent = "Volver a intentar";
  retry.addEventListener("click", loadInitialData);
  pokemonGrid.append(retry);
  resultsTitle.textContent = "No se pudo cargar la Pokédex";
}

async function loadInitialData() {
  pokemonGrid.replaceChildren(createLoadingState());
  pokemonGrid.setAttribute("aria-busy", "true");
  setStatus("Conectando con PokéAPI...");

  try {
    const [pokemonData, typeResult] = await Promise.allSettled([
      fetchJSON(`${API_BASE}/pokemon?limit=${FIRST_GENERATION_SIZE}`),
      fetchJSON(`${API_BASE}/type`),
    ]);
    if (pokemonData.status === "rejected") throw pokemonData.reason;
    if (!Array.isArray(pokemonData.value.results)) {
      throw new Error("La respuesta de Pokémon no tiene el formato esperado.");
    }
    state.pokemon = pokemonData.value.results
      .map((entry) => ({ name: entry.name, id: extractId(entry.url) }))
      .filter((pokemon) => pokemon.id > 0 && pokemon.id <= FIRST_GENERATION_SIZE)
      .sort((a, b) => a.id - b.id);

    if (typeResult.status === "fulfilled" && Array.isArray(typeResult.value.results)) {
      state.types = typeResult.value.results.filter(
        (type) => type.name !== "unknown" && type.name !== "shadow",
      );
    } else if (typeResult.status === "rejected") {
      setStatus(`La colección se cargó, pero no se pudieron obtener los tipos: ${typeResult.reason.message}`, "error");
    }

    const favoritesWarning = loadFavorites();
    createNavigation();
    state.currentView = { kind: "collection", start: 1, end: FIRST_GENERATION_SIZE, title: "Pokédex completa" };
    renderPokemon();
    if (typeResult.status === "rejected") {
      setStatus(`La colección se cargó, pero no se pudieron obtener los tipos: ${typeResult.reason.message}`, "error");
    } else if (favoritesWarning) {
      setStatus(favoritesWarning, "error");
    } else {
      setStatus("");
    }
  } catch (error) {
    showInitialError(error);
  }
}

searchInput.addEventListener("input", () => {
  state.searchTerm = searchInput.value;
  state.currentPage = 1;
  renderPokemon();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Abrir menú" : "Cerrar menú");
  primaryNavigation.classList.toggle("navigation-open", !isExpanded);
});

document.querySelector("#dialog-close").addEventListener("click", () => pokemonDialog.close());
pokemonDialog.addEventListener("click", (event) => {
  if (event.target === pokemonDialog) pokemonDialog.close();
});

loadInitialData();
