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

function urlsForUser(id) {
  const userUrls = {};
  for (const shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].userID === id) {
      userUrls[shortUrl] = urlDatabase[shortUrl].longUrl;
    }
  }
  return userUrls;
}

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user1",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2",
  },
};

const users = {};


app.get("/urls", (req, res) => {
  const user = users[req.cookies.user_id];
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
  const user = users[req.cookies.user_id];
  if (!user) {
    res.redirect("/login");
  } else {
    const templateVars = { user };
    res.render("urls_new", templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (!users[req.cookies.user_id]) {
    res.status(400).send("You must be logged in to shorten URLs.");
  } else {
    const longURL = req.body.longURL;
    const id = generateRandomString();
    console.log("🚀 ~ file: express_server.js:77 ~ app.post ~ urlDatabase[id].longUrl:", urlDatabase[id].longUrl)
    urlDatabase[id].longUrl = longURL;
    res.redirect('/urls');
  }
});


app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longUrl = urlDatabase[id].longUrl;
  if (!longUrl) {
    res.status(400).send("URL not found.");
  } else {
    res.redirect(longUrl);
  }
});

app.post("/urls/:id", (req, res) => {
  const idToUpdate = req.params.id;
  const newLongUrl = req.body.longUrl;
  urlDatabase[id].longUrl = newLongUrl;
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies.user_id];
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
      longUrl: url ? url.longURL : '', 
      user,
    };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  const user = users[req.cookies.user_id];
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
  const user = users[req.cookies.user_id];
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
  res.status(400).send("Invalid email or password");
});

app.get("/login", (req, res) => {
  if (users[req.cookies.user_id]) {
    res.redirect("/urls");
  } else {
  res.render("urls_login");
  }
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
  if (users[req.cookies.user_id]) {
    res.redirect("/urls");
  } else {
  res.render("urls_register");
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});