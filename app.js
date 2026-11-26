const STORAGE_KEY = "menu-dinamico-json";

const navigationList = document.querySelector("#navigation-list");
const menuToggle = document.querySelector("#menu-toggle");
const primaryNavigation = document.querySelector("#primary-navigation");
const form = document.querySelector("#menu-form");
const formTitle = document.querySelector("#form-title");
const editId = document.querySelector("#edit-id");
const nameInput = document.querySelector("#menu-name");
const linkInput = document.querySelector("#menu-link");
const iconInput = document.querySelector("#menu-icon");
const parentInput = document.querySelector("#menu-parent");
const formError = document.querySelector("#form-error");
const cancelEdit = document.querySelector("#cancel-edit");
const resetMenu = document.querySelector("#reset-menu");
const menuTree = document.querySelector("#menu-tree");
const statusMessage = document.querySelector("#status-message");

let menuItems = [];

function setStatus(message, kind = "") {
  statusMessage.className = `status-message${kind ? ` status-${kind}` : ""}`;
  statusMessage.textContent = message;
}

function flattenItems(items = menuItems, result = []) {
  items.forEach((item) => {
    result.push(item);
    flattenItems(item.hijos ?? [], result);
  });
  return result;
}

function sanitizeText(value) {
  return value.replace(/[<>]/g, "").trim();
}

function isValidLink(value) {
  if (!value) return false;
  if (/^\/(?!\/)/.test(value) || /^#/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function findItem(id, items = menuItems) {
  for (const item of items) {
    if (item.id === id) return item;
    const found = findItem(id, item.hijos ?? []);
    if (found) return found;
  }
  return null;
}

function removeItem(id, items = menuItems) {
  const index = items.findIndex((item) => item.id === id);
  if (index >= 0) {
    items.splice(index, 1);
    return true;
  }
  for (const item of items) {
    if (removeItem(id, item.hijos ?? [])) return true;
  }
  return false;
}

function saveMenu() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ menu: menuItems }));
}

function closeSubmenus() {
  navigationList.querySelectorAll(".submenu-trigger").forEach((trigger) => {
    trigger.setAttribute("aria-expanded", "false");
    trigger.closest(".has-submenu")?.classList.remove("submenu-open");
  });
}

function closeMobileNavigation() {
  if (!window.matchMedia("(max-width: 760px)").matches) return;
  primaryNavigation.classList.remove("navigation-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menú");
}

function navigateToLink(link) {
  if (/^https?:\/\//.test(link)) {
    window.open(link, "_blank", "noopener,noreferrer");
  } else {
    window.location.hash = link.replace(/^\/?/, "");
  }
  closeMobileNavigation();
  closeSubmenus();
}

function createNavigationButton(item, nested = false) {
  const button = document.createElement("button");
  button.className = nested ? "submenu-link" : "navigation-link";
  button.type = "button";

  if (item.icono) {
    const icon = document.createElement("span");
    icon.className = "navigation-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = item.icono;
    button.append(icon);
  }

  button.append(document.createTextNode(item.nombre));
  button.addEventListener("click", () => navigateToLink(item.enlace));
  return button;
}

function createNavigationGroup(item) {
  const listItem = document.createElement("li");
  listItem.className = "has-submenu";

  const trigger = document.createElement("button");
  trigger.className = "navigation-link submenu-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-expanded", "false");

  const triggerLabel = document.createElement("span");
  if (item.icono) {
    const icon = document.createElement("span");
    icon.className = "navigation-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = item.icono;
    triggerLabel.append(icon);
  }
  triggerLabel.append(document.createTextNode(item.nombre));

  const chevron = document.createElement("span");
  chevron.className = "chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "⌄";
  trigger.append(triggerLabel, chevron);

  const submenu = document.createElement("ul");
  submenu.className = "submenu";
  submenu.setAttribute("aria-label", item.nombre);
  item.hijos.forEach((child) => {
    const childItem = document.createElement("li");
    childItem.append(createNavigationButton(child, true));
    submenu.append(childItem);
  });

  trigger.addEventListener("click", () => {
    const expanded = trigger.getAttribute("aria-expanded") === "true";
    closeSubmenus();
    trigger.setAttribute("aria-expanded", String(!expanded));
    listItem.classList.toggle("submenu-open", !expanded);
  });

  listItem.append(trigger, submenu);
  return listItem;
}

function renderNavigation() {
  navigationList.replaceChildren();
  menuItems.forEach((item) => {
    const listItem = (item.hijos ?? []).length
      ? createNavigationGroup(item)
      : document.createElement("li");
    if (!(item.hijos ?? []).length) listItem.append(createNavigationButton(item));
    navigationList.append(listItem);
  });
  closeSubmenus();
}

function updateParentOptions() {
  const editingId = Number(editId.value);
  parentInput.replaceChildren();
  parentInput.append(new Option("Ninguna (nivel principal)", ""));
  flattenItems().forEach((item) => {
    if (item.id === editingId) return;
    const descendants = flattenItems(item.hijos ?? []);
    if (editingId && descendants.some((descendant) => descendant.id === editingId)) return;
    parentInput.append(new Option(item.nombre, String(item.id)));
  });
}

function createTreeItem(item, level = 0) {
  const row = document.createElement("div");
  row.className = "menu-tree-item";
  row.style.setProperty("--level", String(level));

  const icon = document.createElement("span");
  icon.className = "tree-icon";
  icon.textContent = item.icono || "•";

  const copy = document.createElement("div");
  copy.className = "tree-copy";
  const name = document.createElement("strong");
  name.textContent = item.nombre;
  const link = document.createElement("span");
  link.textContent = item.enlace;
  copy.append(name, link);

  const actions = document.createElement("div");
  actions.className = "tree-actions";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.textContent = "Editar";
  edit.addEventListener("click", () => beginEdit(item));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "delete-button";
  remove.textContent = "Eliminar";
  remove.addEventListener("click", () => deleteItem(item));
  actions.append(edit, remove);

  row.append(icon, copy, actions);

  if (item.hijos?.length) {
    item.hijos.forEach((child) => row.append(createTreeItem(child, level + 1)));
  }
  return row;
}

function renderMenuTree() {
  menuTree.replaceChildren();
  menuItems.forEach((item) => menuTree.append(createTreeItem(item)));
  updateParentOptions();
}

function resetForm() {
  form.reset();
  editId.value = "";
  formTitle.textContent = "Agregar opción";
  cancelEdit.hidden = true;
  formError.textContent = "";
  updateParentOptions();
}

function beginEdit(item) {
  editId.value = String(item.id);
  nameInput.value = item.nombre;
  linkInput.value = item.enlace;
  iconInput.value = item.icono ?? "";
  formTitle.textContent = "Modificar opción";
  cancelEdit.hidden = false;
  formError.textContent = "";
  updateParentOptions();

  let parentId = null;
  flattenItems().forEach((candidate) => {
    if ((candidate.hijos ?? []).some((child) => child.id === item.id)) parentId = candidate.id;
  });
  parentInput.value = parentId ? String(parentId) : "";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  nameInput.focus();
}

function deleteItem(item) {
  if (!window.confirm(`¿Eliminar "${item.nombre}"${item.hijos?.length ? " y sus subopciones" : ""}?`)) return;
  removeItem(item.id);
  saveMenu();
  renderAll();
  resetForm();
  setStatus(`Se eliminó "${item.nombre}".`);
}

function renderAll() {
  renderNavigation();
  renderMenuTree();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";

  const name = sanitizeText(nameInput.value);
  const link = linkInput.value.trim();
  const icon = sanitizeText(iconInput.value);

  if (!name) {
    formError.textContent = "El nombre es obligatorio.";
    nameInput.focus();
    return;
  }
  if (!isValidLink(link)) {
    formError.textContent = "Ingresa un enlace válido: ruta (/servicios), ancla (#inicio) o URL (https://...).";
    linkInput.focus();
    return;
  }

  const editingId = Number(editId.value);
  const parentId = Number(parentInput.value) || null;
  const existing = editingId ? findItem(editingId) : null;

  if (parentId) {
    const parent = findItem(parentId);
    if (!parent) {
      formError.textContent = "La opción padre seleccionada no existe.";
      return;
    }
  }

  if (existing) {
    removeItem(editingId);
    existing.nombre = name;
    existing.enlace = link;
    existing.icono = icon;
    existing.hijos ??= [];

    if (parentId) {
      const parent = findItem(parentId);
      parent.hijos ??= [];
      parent.hijos.push(existing);
    } else {
      menuItems.push(existing);
    }
    setStatus(`Se modificó "${name}".`);
  } else {
    const nextId = flattenItems().reduce((highest, item) => Math.max(highest, item.id), 0) + 1;
    const newItem = { id: nextId, nombre: name, enlace: link, icono: icon, hijos: [] };

    if (parentId) {
      const parent = findItem(parentId);
      parent.hijos ??= [];
      parent.hijos.push(newItem);
    } else {
      menuItems.push(newItem);
    }
    setStatus(`Se agregó "${name}".`);
  }

  saveMenu();
  renderAll();
  resetForm();
});

cancelEdit.addEventListener("click", resetForm);

resetMenu.addEventListener("click", async () => {
  if (!window.confirm("¿Restaurar las opciones originales de menu.json?")) return;
  localStorage.removeItem(STORAGE_KEY);
  await loadMenu();
  resetForm();
  setStatus("Se restauró el menú original.");
});

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Abrir menú" : "Cerrar menú");
  primaryNavigation.classList.toggle("navigation-open", !isExpanded);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".has-submenu")) closeSubmenus();
});

async function loadMenu() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.menu)) {
        menuItems = parsed.menu;
        renderAll();
        setStatus("Menú cargado desde los datos guardados.");
        return;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  try {
    const response = await fetch("menu.json");
    if (!response.ok) throw new Error(`No se pudo cargar menu.json (${response.status}).`);
    const data = await response.json();
    if (!Array.isArray(data.menu)) throw new Error("menu.json no contiene una lista válida.");
    menuItems = data.menu;
    renderAll();
    setStatus("Menú cargado desde menu.json.");
  } catch (error) {
    menuItems = [];
    renderAll();
    setStatus(error.message, "error");
  }
}

loadMenu();
