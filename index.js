import express from "express";
import morgan from "morgan";
import pg from "pg";

const app = express();

const client = new pg.Client({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5432/acme_icecream",
});
const PORT = process.env.PORT || 3000;

// middleware
app.use(morgan("dev"));
app.use(express.json());

// routes
app.get("/api/flavors", async (req, res, next) => {
  try {
    const { rows } = await client.query("SELECT * FROM flavors");
    res.send(rows);
  } catch (err) {
    next(err);
  }
});

app.get("/api/flavors/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows } = await client.query("SELECT * FROM flavors WHERE id=$1", [
      id,
    ]);
    if (!rows.length) {
      res.sendStatus(404);
    } else {
      res.send(rows[0]);
    }
  } catch (err) {
    next(err);
  }
});

app.post("/api/flavors", async (req, res, next) => {
  try {
    const { name, isFavorite } = req.body;
    const { rows } = await client.query(
      `
      INSERT INTO flavors 
      (name, is_favorite)
      VALUES
      ($1, $2)
      RETURNING *;
    `,
      [name, isFavorite]
    );
    console.log(rows);
    res.send(rows[0]);
  } catch (err) {
    next(err);
  }
});

app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await client.query(
      `
      DELETE FROM flavors
      WHERE id = $1
    `,
      [id]
    );
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, isFavorite } = req.body;
    const { rows } = await client.query(
      `
      UPDATE flavors
      SET name=$1, is_favorite=$2, updated_at=$3
      WHERE id=$4
      RETURNING *;
    `,
      [name, isFavorite, new Date(), id]
    );
    res.send(rows[0]);
  } catch (err) {
    next(err);
  }
});

const init = async () => {
  await client.connect();

  await client.query(`
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50),
      is_favorite BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT  NOW(),
      updated_at TIMESTAMP
    );
  `);

  app.listen(PORT, () => {
    console.log(`Server now running on port ${PORT}`);
  });
};

init();
