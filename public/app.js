const STORAGE_KEY = "astana-cart";
const money = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" });
const $ = (id) => document.getElementById(id);

let menu = [];
let cart = readCart();

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {}
}

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function renderMenu() {
  const groups = new Map();
  for (const item of menu) groups.set(item.category, [...(groups.get(item.category) || []), item]);
  const list = $("menu-list");
  list.replaceChildren();
  for (const [category, items] of groups) {
    const grid = el("div", { className: "dishes" });
    for (const item of items) {
      const add = el("button", { type: "button", className: "add", textContent: "Dodaj" });
      add.addEventListener("click", () => changeQty(item.id, 1));
      grid.append(
        el("article", { className: "dish" },
          el("h3", { textContent: item.name }),
          el("p", { textContent: item.description }),
          el("div", { className: "dish-foot" }, el("span", { className: "price", textContent: money.format(item.price) }), add)
        )
      );
    }
    list.append(el("section", { className: "category" }, el("h2", { textContent: category }), grid));
  }
}

function changeQty(id, delta) {
  const qty = (cart[id] || 0) + delta;
  if (qty > 0) cart[id] = Math.min(qty, 50);
  else delete cart[id];
  writeCart();
  renderCart();
}

function cartLines() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ item: menu.find((m) => m.id === id), qty }))
    .filter((line) => line.item);
}

function renderCart() {
  const lines = cartLines();
  const total = lines.reduce((sum, l) => sum + l.item.price * l.qty, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  $("cart-items").replaceChildren(
    ...lines.map(({ item, qty }) => {
      const minus = el("button", { type: "button", textContent: "−", ariaLabel: `Mniej: ${item.name}` });
      const plus = el("button", { type: "button", textContent: "+", ariaLabel: `Więcej: ${item.name}` });
      minus.addEventListener("click", () => changeQty(item.id, -1));
      plus.addEventListener("click", () => changeQty(item.id, 1));
      return el("li", {},
        el("span", { textContent: item.name }),
        el("span", { className: "line-price", textContent: money.format(item.price * qty) }),
        el("div", { className: "qty" }, minus, el("span", { textContent: qty }), plus)
      );
    })
  );
  $("cart-empty").hidden = lines.length > 0;
  $("cart-total").textContent = money.format(total);
  $("cart-bar-total").textContent = money.format(total);
  $("cart-count").textContent = count;
  $("cart-bar").hidden = count === 0;
  $("submit").disabled = count === 0;
}

function showErrors(errors) {
  $("form-errors").replaceChildren(...errors.map((e) => el("li", { textContent: e })));
}

async function submitOrder(event) {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  const items = cartLines().map(({ item, qty }) => ({ id: item.id, qty }));
  $("submit").disabled = true;
  showErrors([]);
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, items })
    });
    const body = await res.json();
    if (!res.ok) return showErrors(body.errors || ["Nie udało się złożyć zamówienia"]);
    cart = {};
    writeCart();
    form.reset();
    $("address-field").hidden = true;
    $("cart").classList.remove("open");
    $("done-id").textContent = `#${body.id}`;
    $("done-total").textContent = money.format(body.total);
    $("done").showModal();
  } catch {
    showErrors(["Brak połączenia z serwerem"]);
  } finally {
    renderCart();
  }
}

$("order-form").addEventListener("submit", submitOrder);
$("order-form").addEventListener("change", (e) => {
  if (e.target.name === "type") $("address-field").hidden = e.target.value !== "delivery";
});
$("cart-bar").addEventListener("click", () => $("cart").classList.add("open"));
$("cart-close").addEventListener("click", () => $("cart").classList.remove("open"));

try {
  const res = await fetch("/api/menu");
  menu = await res.json();
  renderMenu();
  renderCart();
} catch {
  $("menu-list").replaceChildren(el("p", { className: "muted", textContent: "Nie udało się załadować menu." }));
}
