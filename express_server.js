const express = require("express"); // Express library
const app = express();
const PORT = 8080; // The port which server will listen on. Default port 8080

app.set("view engine", "ejs") // This tells the Express app to use EJS as its templating engine.

/*The body-parser library will convert the request body from a Buffer
 into string that we can read. This needs to come before all of routes. */
app.use(express.urlencoded({ extended: true }));

// Cookie-parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());


// URL database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userId: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userId: "aJ49lW",
  },
};

// USERS database
const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  aJ49lW: {
    id: "aJ49lW",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Function generates a random short URL id by return a string of 6 random alphanumeric characters:
const generateRandomString = function() {
  const alphanum = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let output = '';
  for (let i = 0; i < 6; i++) {
    output += alphanum.charAt(Math.floor(Math.random() * alphanum.length));
  }
  return output;
};

// Function checks if user email exist in database
const getUserByEmail = (email, users) => {
  for (let i in users) {
    if (users[i].email === email) {
      return users[i];
    }
  } return null;
}

// Function checks if user password exist in database
const getUserByPassword = (password, users) => {
  for (let i in users) {
    if (users[i].password === password) {
      return users[i].password;
    }
  } return null;
}

// Function finds and returns urls owned by the exact user  
const getUrlByUserId = (userId, urlDatabase) => {
  let urlsByUser = {};
  for (let i in urlDatabase) {
    if (urlDatabase[i].userId === userId ) {
      urlsByUser[i] = urlDatabase[i];
    }
  } return urlsByUser;
}


// POST route to handle the form submission.This needs to come before all of other routes.
app.post("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  if (userId){
    const shortURL = generateRandomString(); //add Short URL ID to the urlDatabase
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.body.user_id
    } // add longURl to the urlDatabase
    console.log(urlDatabase) // Log the updated Database to the console
    res.redirect(`/u/${shortURL}`);
  } else {
    return res.status(401).send("You must be logged in for shortening URLs.");
  }
});

// POST route to EDIT URL.
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});


// POST route to DELETE URL from urlDatabase.
app.post("/urls/:shortURL/delete", (req, res) => {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
});


// POST route to LOG IN user
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  const userPassword = getUserByPassword(password, users);
  if (email === user.email && password === userPassword) {
    const newUserId = user.id;
    res.cookie ('user_id', newUserId);
    res.redirect('/urls');
  } else {
    res.status(403).send("Error code 403: Wrong email or password!");
  }
});


// POST route to LOG OUT user
app.post('/logout', (req, res) => {
  const newUserId = generateRandomString();
  res.clearCookie('user_id', newUserId);
  res.redirect('/login');
});


// POST route to REGISTRATION for a new user. 
app.post('/register', (req, res) => {
  const newUserId = generateRandomString(); // generate a random user id
  const email = req.body.email;
  const password = req.body.password;
  const userObj = {
    id: newUserId,
    email: email,
    password: password
  }
  if (userObj.email === "" || userObj.password === "") {
    return res.status(400).send("Error code 400! Please write your email and password");
  }
  if (getUserByEmail(email, users)) {
    return res.status(400).send("Error code 400! Please write your email and password");
  }
  res.cookie ('user_id', newUserId);
  users[newUserId] = userObj;  
  res.redirect('/urls');
  console.log(users);
});



// MAIN PAGE
app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];

  const urlsUser = getUrlByUserId(userId, urlDatabase); 
  const templateVars = { urls: urlsUser, user: user};
  res.render("urls_index", templateVars);
});


/* GET route to render the urls_new.ejs template. 
The GET /urls/new route needs to be defined before the 
GET /urls/:id route. Routes defined earlier will take precedence */
app.get('/urls/new',(req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = {user: user};
  if (!userId) {
    return res.redirect("/login");
  }
  return res.render("urls_new", templateVars);
});


// GET route to display a single URL and its shortened form.
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = { 
    id: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL,
    userID: urlDatabase[req.params.shortURL].userID, 
    user: user};
  res.render("urls_show", templateVars);
});


// GET route to REDIRECTION to longURL when given shortURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  console.log("longURL : ", longURL);
  res.redirect(longURL);
  } else {
    res.status(400).send("You try to access the shorten URLs that does not exist in database.");
  }
});


// GET route to REGISTRATION form
app.get("/register", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = { user: user};
  if (userId) {
   return res.redirect('/urls')
  }
  return res.render("urls_registration", templateVars);
});


// GET route to LOG IN form
app.get("/login", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  console.log(user);
  const templateVars = { user: user};
  if (userId) { 
    return res.redirect('/urls');
  }
  return res.render("urls_login", templateVars);
});


// Additional endpoints - a JSON string representing the entire urlDatabase object.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// // The response can contain HTML code, which would be rendered in the client browser.
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// app.get("/login", (req, res) => {   
//  const templateVars = { urls: urlDatabase };   
// if (req.cookies.userid) { res.redirect(/urls);  
//  } else { templateVars["user"] = null;}   
//  res.render("login", templateVars); })


app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});