const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')

function generateRandomString() {
  const length = 6;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    randomString += charset[randomIndex];
  }
  return randomString;
}

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};


app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,  
    user: users[req.cookies.user_id]
   };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const username = {user: users[req.cookies.user_id]};
  res.render("urls_new", username);
 });

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const id = generateRandomString();
  urlDatabase[id] = longURL;
  res.redirect('/urls');
});


app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  res.redirect(longURL);
});

app.post("/urls/:id", (req, res) => {
  const idToUpdate = req.params.id;
  const newLongURL = req.body.longURL;
  urlDatabase[idToUpdate] = newLongURL;
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies.user_id],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  const idToDelete = req.params.id;
  delete urlDatabase[idToDelete];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const idToUpdate = req.params.id;
  const newLongURL = req.body.longURL;
  urlDatabase[idToUpdate] = newLongURL;
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email && user.password === password) {
      res.cookie('user_id', userId); 
      res.redirect("/urls");
      return;
    }
  }
  res.status(403).send("Invalid email or password");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});
  

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const { email, password } = req.body;

  if(!email || !password) {
    res.status(400).send('Email and password cannot be empty');
    return;
  }

  for (const existingUserId in users) {
    const user = users[existingUserId];
    if (user.email === email) {
      res.status(400).send("Email already registered");
      return;
    }
  }
  const newUser = {
    id: userId,
    email,
    password
  };
  users[userId] = newUser;
  res.cookie('user_id', userId);
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});