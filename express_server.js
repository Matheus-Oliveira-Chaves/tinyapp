const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');
const {
  generateRandomString,
  getUserByEmail,
  urlsForUser,
  urlDatabase,
  users,
} = require('./helpers');

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],

}));
app.set("view engine", "ejs");

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.status(400).send("You must be logged in to view your URLs. Please log in or register.");
  } else {
    const userUrls = urlsForUser(user.id);
    const templateVars = {
      urls: userUrls,
      user,
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
  } else {
    const templateVars = { user };
    res.render("urls_new", templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (!users[req.session.user_id]) {
    res.status(400).send("You must be logged in to shorten URLs.");
  } else {
    const longURL = req.body.longURL;
    const id = generateRandomString();
    urlDatabase[id]= {
      longURL:longURL,
      userID:req.session.user_id
    };
    res.redirect('/urls');
  }
});


app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longUrl = urlDatabase[id] ? urlDatabase[id].longUrl : null;
  if (!longUrl) {
    res.status(400).send("URL not found.");
  } else {
    res.redirect(longUrl);
  }
});

app.post("/urls/:id", (req, res) => {
  const idToUpdate = req.params.id;
  const newLongUrl = req.body.longURL;
  urlDatabase[idToUpdate].longURL = newLongUrl;
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  const shortUrl = req.params.id;
  const url = urlDatabase[shortUrl];

  if (!user) {
    res.status(400).send("You must be logged in to view this URL. Please log in or register.");
  } else if (!url) {
    res.status(400).send("URL not found.");
  } else if (url.userID !== user.id) {
    res.status(400).send("You do not have permission to view this URL.");
  } else {
    const templateVars = {
      id: shortUrl,
      longURL: url ? url.longUrl : '',
      user,
    };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  const shortUrl = req.params.id;
  const url = urlDatabase[shortUrl];

  if (!user) {
    res.status(400).send("You must be logged in to edit URLs. Please log in or register.");
  } else if (!url) {
    res.status(400).send("URL not found.");
  } else if (url.userID !== user.id) {
    res.status(400).send("You do not have permission to edit this URL.");
  } else {
    const newLongUrl = req.body.longUrl;
    urlDatabase[shortUrl].longUrl = newLongUrl;
    res.redirect("/urls");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.session.user_id];
  const shortUrl = req.params.id;
  const url = urlDatabase[shortUrl];

  if (!user) {
    res.status(400).send("You must be logged in to delete URLs. Please log in or register.");
  } else if (!url) {
    res.status(400).send("URL not found.");
  } else if (url.userID !== user.id) {
    res.status(400).send("You do not have permission to delete this URL.");
  } else {
    delete urlDatabase[shortUrl];
    res.redirect("/urls");
  }
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

app.get("/login", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
     const templateVars = {user: null}
    res.render("urls_login", templateVars);
  }
}); 

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty");
    return;
  }
  const user = getUserByEmail(email, users);
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(400).send("Invalid email or password");
  }
});


app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const { email, password } = req.body;

  if (!email || !password) {
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
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: userId,
    email,
    password: hashedPassword,
  };
  users[userId] = newUser;
  req.session.user_id = userId;;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    const templateVars = {user: null}
    res.render("urls_register", templateVars);
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});