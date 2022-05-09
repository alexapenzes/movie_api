const express = require("express"),
  morgan = require("morgan"),
  bodyParser = require("body-parser"),
  uuid = require("uuid");

const app = express();

let users = [
  {
    id: 1,
    name: "Alexa",
    favoriteMovies: ["Inception"],
  },
  {
    id: 2,
    name: "James",
    favoriteMovies: ["The Godfather"],
  },
];

let movies = [
  {
    Title: "Harry Potter and the Prisoner of Azkaban",
    director: { "name": "Alfonso Cuaron" },
    genre: { "name": "Fantasy" },
  },
  {
    Title: "The Godfather",
    director: { "name": "Francis Ford Coppola" },
    genre: { "name": "Crime" },
  },
  {
    Title: "Twilight",
    director: { "name": "Catherine Hardwicke" },
    genre: { "name": "Romance" },
  },
  {
    Title: "Inception",
    director: { "name": "Christopher Nolan"},
    genre: { "name": "Action" },
  },
  {
    Title: "The Devil Wears Prada",
    director: { "name": "David Frankel" },
    genre: { "name": "Comedy" },
  },
  {
    Title: "Avatar",
    director: { "name": "James Cameron" },
    genre: { "name": "Action" },
  },
  {
    Title: "Fight Club",
    director: { "name": "David Fincher" },
    genre: { "name": "Thriller" },
  },
  {
    Title: "Schindler's List",
    director: { "name": "Steven Spielberg" },
    genre: { "name": "Historical Drama" },
  },
  {
    Title: "The Pianist",
    director: { "name": "Roman Polanski" },
    genre: { "name": "War Drama" },
  },
  {
    Title: "Snatch",
    director: { "name": "Guy Ritchie" },
    genre: { "name": "Comedy" },
  },
];

//Middleware to...
app.use(express.static("public")); // serve static files
app.use(morgan("common")); // log requests to terminal
app.use(bodyParser.json()); // use body-parser

//CREATE
app.post("/users", (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).send("users need names");
  }
});

//UPDATE
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send("no such user");
  }
});

// CREATE
app.post("/users/:id/:movieTitle", (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(`${movieTitle} has been added to user ${id}'s array`);
  } else {
    res.status(400).send("no such user");
  }
});

//DELETE
app.delete("/users/:id/:movieTitle", (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter(
      (title) => title !== movieTitle
    );
    res
      .status(200)
      .send(`${movieTitle} has been removed from user ${id}'s array`);
  } else {
    res.status(400).send("no such user");
  }
});

//DELETE
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    users = users.filter((user) => user.id != id);
    res.status(200).send(`user ${id} has been deleted`);
  } else {
    res.status(400).send("no such user");
  }
});

// GET requests
app.get("/", (req, res) => {
  res.send("Welcome to the Top 10 Movies!");
});

app.use("/documentation.html", express.static("public"));

// READ
app.get("/movies", (req, res) => {
  res.status(200).json(movies);
});

// READ
app.get("/movies/:title", (req, res) => {
  console.log(req.params);
  const { title } = req.params;
  const movie = movies.find((movie) => movie.Title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send("no such movie");
  }
});

// READ
app.get("/movies/genre/:genreName", (req, res) => {
  const { genreName } = req.params;
  const genre = movies.find((movie) => movie.genre.name === genreName).genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send("no such genre");
  }
});

// READ
app.get("/movies/directors/:directorName", (req, res) => {
  const { directorName } = req.params;
  const director = movies.find(
    (movie) => movie.director.name === directorName
  ).director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send("no such director");
  }
});

// error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// listen for requests
app.listen(8080, () => {
  console.log("Your app is listening on port 8080.");
});
