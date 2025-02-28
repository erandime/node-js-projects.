import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

//Enter Database credentials here.
const db = new pg.Client({
  user: "", 
  host: "",
  database: "",
  password: "",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function getUsers() {
  const result = await db.query("SELECT * FROM users");
  let users = [];
  result.rows.forEach((user) => {
    users.push({
      id: user.id,
      name: user.name,
      color: user.color
    });
  });
  return users;
}

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries WHERE user_id = $1",
    [currentUserId]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const users = await getUsers();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: users.length > 0 ? users[0].color : "#FFFFFF", //By default route to first users tab.
  });
});

app.post("/add", async (req, res) => {
  //Add a new country for user.
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;

    const color = req.body["color"]; 
    const users = await getUsers(); 
    const selectedUser = users.find(user => user.color === color);
  
    currentUserId = selectedUser.id;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
  //Add new user.
  if (req.body["add"]) {
    return res.render("new.ejs");
  };

  //Go to another users tab.
  const id = req.body["user"]; 
  const users = await getUsers(); 
  const selectedUser = users.find(user => user.id === parseInt(id));  
  currentUserId = selectedUser.id;
  const color = selectedUser.color; 

  const countries = await checkVisisted();
   
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: color,
  });
});

app.post("/new", async (req, res) => {
  //Add new user.
  const name = req.body["name"];
  const color = req.body["color"];
  const result = await db.query("INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id",
    [name, color] 
  );
  
  console.log(result.rows);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
