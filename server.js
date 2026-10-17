import express from "express";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { validateOrder, saveOrder } from "./orders.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const menuFile = path.join(root, "data", "menu.json");
const ordersFile = path.join(root, "data", "orders.json");
const port = Number(process.env.PORT) || 3000;

const loadMenu = async () => JSON.parse(await readFile(menuFile, "utf8"));

const app = express();
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(root, "public")));
app.use("/historia", express.static(path.join(root, "historia")));

app.get("/api/menu", async (req, res, next) => {
  try {
    res.json(await loadMenu());
  } catch (err) {
    next(err);
  }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const { order, errors } = validateOrder(req.body, await loadMenu());
    if (errors) return res.status(400).json({ errors });
    await saveOrder(ordersFile, order);
    res.status(201).json({ id: order.id, total: order.total });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ errors: ["Błąd serwera, spróbuj później"] });
});

app.listen(port, () => console.log(`Astana Kebab: http://localhost:${port}`));
