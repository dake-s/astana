import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

export function validateOrder(body, menu) {
  const errors = [];
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const type = body?.type === "delivery" ? "delivery" : body?.type === "pickup" ? "pickup" : null;
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : "";

  if (name.length < 2) errors.push("Podaj imię");
  if (!PHONE_RE.test(phone)) errors.push("Podaj poprawny numer telefonu");
  if (!type) errors.push("Wybierz dostawę lub odbiór osobisty");
  if (type === "delivery" && address.length < 5) errors.push("Podaj adres dostawy");

  const byId = new Map(menu.map((item) => [item.id, item]));
  const items = [];
  if (!Array.isArray(body?.items) || body.items.length === 0) {
    errors.push("Koszyk jest pusty");
  } else {
    for (const entry of body.items) {
      const item = byId.get(entry?.id);
      const qty = Number(entry?.qty);
      if (!item || !Number.isInteger(qty) || qty < 1 || qty > 50) {
        errors.push("Nieprawidłowa pozycja w koszyku");
        break;
      }
      items.push({ id: item.id, name: item.name, price: item.price, qty });
    }
  }

  if (errors.length) return { errors };

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return {
    order: {
      id: randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
      status: "new",
      name,
      phone,
      type,
      address: type === "delivery" ? address : "",
      note,
      items,
      total
    }
  };
}

export async function loadOrders(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

let queue = Promise.resolve();

export function saveOrder(file, order) {
  queue = queue.then(async () => {
    const orders = await loadOrders(file);
    orders.push(order);
    await writeFile(file, JSON.stringify(orders, null, 2));
  });
  return queue;
}
