import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: "qwerty",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM items ORDER BY id ASC;");
    const items = result.rows;
    
  res.render("index.ejs", {
    listTitle: "Today",
    listItems: items,
  });
  } catch (error) {
    console.log(error);
  }  
});

app.post("/add", async(req, res) => {
  try {    
  const item = req.body.newItem;
    const result = await db.query("INSERT into items (title) VALUES($1) RETURNING id;",
      [item]
    );
    console.log("Added new item: ", result.rows[0].id);
  res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.post("/edit", async(req, res) => {
  const id = req.body.updatedItemId;
  const title = req.body.updatedItemTitle;

  try {
    await db.query("UPDATE items SET title = $1 WHERE id = $2;",
      [title, id]
    );

    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.post("/delete", async(req, res) => {
  const id = req.body.deleteItemId;
  try {
    const result = await db.query("DELETE FROM items where id = $1;",
      [id]
    );
    console.log("Deleted record");
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
