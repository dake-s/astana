import { test } from "node:test";
import assert from "node:assert/strict";
import { validateOrder } from "../orders.js";

const menu = [
  { id: "a", name: "A", price: 10 },
  { id: "b", name: "B", price: 25 }
];
const base = { name: "Jan", phone: "+48 600 100 200", type: "pickup", items: [{ id: "a", qty: 2 }, { id: "b", qty: 1 }] };

test("liczy sumę po cenach z menu", () => {
  const { order, errors } = validateOrder({ ...base, items: [{ id: "a", qty: 2, price: 1 }, { id: "b", qty: 1 }] }, menu);
  assert.equal(errors, undefined);
  assert.equal(order.total, 45);
  assert.equal(order.status, "new");
});

test("wymaga adresu przy dostawie", () => {
  const { errors } = validateOrder({ ...base, type: "delivery" }, menu);
  assert.deepEqual(errors, ["Podaj adres dostawy"]);
});

test("odrzuca nieznane danie i złą ilość", () => {
  assert.ok(validateOrder({ ...base, items: [{ id: "x", qty: 1 }] }, menu).errors);
  assert.ok(validateOrder({ ...base, items: [{ id: "a", qty: 0 }] }, menu).errors);
  assert.ok(validateOrder({ ...base, items: [{ id: "a", qty: 1.5 }] }, menu).errors);
});

test("odrzuca pusty koszyk i brak danych", () => {
  const { errors } = validateOrder({ items: [] }, menu);
  assert.equal(errors.length, 4);
});
