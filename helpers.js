const { urlDatabase, users, } = require('./data');


function getUserByEmail(email, users) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return user;
    }
  }
  return undefined;
}

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
      userUrls[shortUrl] = urlDatabase[shortUrl];
    }
  }
  return userUrls;
}

function checkAuthorization(user, url, res) {
  if (!user) {
    res.status(400).send("You must be logged in to perform this action. Please log in or register.");
    return false;
  } else if (!url) {
    res.status(400).send("URL not found.");
    return false;
  } else if (url.userID !== user.id) {
    res.status(400).send("You do not have permission to perform this action.");
    return false;
  }
  return true;
}



module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
  checkAuthorization,
}