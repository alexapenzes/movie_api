const express = require("express"),
  morgan = require("morgan"),
  bodyParser = require("body-parser"),
  uuid = require("uuid"),
  mongoose = require("mongoose"),
  Models = require("./models.js");
cors = require("cors");
bcrypt = require("bcrypt");

const Movies = Models.Movie;
const Users = Models.User;

const { check, validationResult } = require("express-validator");

// Mongoose connection to database for CRUD operations
/* mongoose.connect('mongodb://localhost:27017/myFlixDB', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
}); */
mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

let allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:1234",
  "https://ap-myflix.herokuapp.com",
  "http://localhost:3000",
  "https://myflix-ap.herokuapp.com",
  "http://localhost:4200",
  "https://myflix-api.netlify.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // If a specific origin isn’t found on the list of allowed origins
        let message =
          "The CORS policy for this application doesn’t allow access from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

//Middleware to...
app.use(express.static("public")); // serve static files
app.use(morgan("common")); // log requests to terminal
app.use(bodyParser.json()); // use body-parser
app.use(bodyParser.urlencoded({ extended: true })); // use body-parser encoded
let auth = require("./auth")(app); //auth.js file use express

const passport = require("passport");
const { authenticate } = require("passport/lib");
require("./passport");

//Add a user
/**
 * POST new user. Username, password, and Email are required fields.
 * Request body: Bearer token, JSON with user information in this format:
 * {
 *  ID: Integer,
 *  Username: String,
 *  Password: String,
 *  Email: String,
 *  Birthday: Date
 * }
 * @name createUser
 * @kind function
 * @returns user object
 */

app.post(
  "/users",
  [
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + " already exists");
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Get all users
app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get a user by username
/**
 * GET user data on a single user
 * Request body: Bearer token
 * @name getUser
 * @kind function
 * @param Username
 * @returns user object
 * @requires passport
 */

app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Update a user's info, by username
/**
 * PUT new user info
 * Request body: Bearer token, updated user info in the following format:
 * {
 *  Username: String, (required)
 *  Password: String, (required)
 *  Email: String, (required)
 *  Birthday: Date
 * }
 * @name updateUser
 * @kind function
 * @param Username
 * @returns user object
 * @requires passport
 */

app.put(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true }, // This line makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

// Add a movie to a user's list of favorites
/**
 * POST a movie to a user's list of favorites
 * Request body: Bearer token
 * @name createFavorite
 * @kind function
 * @param Username
 * @param MovieID
 * @returns user object
 * @requires passport
 */

app.post(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $push: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }, // This line makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

// Allows user to delete movie from favorites
/**
 * DELETE a movie from a user's list of favorites
 * Request body: Bearer token
 * @name deleteFavorite
 * @kind function
 * @param Username
 * @param MovieID
 * @returns user object
 * @requires passport
 */

app.delete(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $pull: { FavoriteMovies: req.params.MovieID },
      },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

// Delete a user by username
/**
 * DELETE a user by username
 * Request body: Bearer token
 * @name deleteUser
 * @kind function
 * @param Username
 * @returns Success message
 * @requires passport
 */

app.delete(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.status(200).send(req.params.Username + " was deleted.");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// GET requests
// Get home page
/**
 * GET welcome message from '/' endpoint
 * @name welcomeMessage
 * @kind function
 * @returns Welcome message
 */

app.get("/", (req, res) => {
  res.send("Welcome to the Top 10 Movies!");
});

// Get documentation page
app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", {
    root: __dirname,
  });
});

// READ all movies
/*app.get("/movies", passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find()
  .then((movies) => {
    res.status(201).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});*/
/**
 * GET a list of all movies
 * Request body: Bearer Token
 * @name getAllMovies
 * @kind function
 * @returns array of movie objects
 * @requires passport
 */

app.get("/movies", function (req, res) {
  Movies.find()
    .then(function (movies) {
      res.status(201).json(movies);
    })
    .catch(function (error) {
      console.error(error);
      res.status(500).send("Error: " + error);
    });
});

// GET one movie by title
/**
 * GET data about a single movie by title
 * Request body: Bearer token
 * @name getMovie
 * @kind function
 * @param Title
 * @returns movie object
 * @requires passport
 */

app.get(
  "/movies/:Title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.Title })
      .then((movie) => {
        res.json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get genre by name
/**
 * GET data about a genre by genre name
 * Request body: Bearer token
 * @name getGenre
 * @kind function
 * @param genreName
 * @returns genre object
 * @requires passport
 */

app.get(
  "/movies/genre/:name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.name })
      .then((genre) => {
        res.status(201).json(genre);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get director by name
/**
 * GET data about a director by name
 * Request body: Bearer token
 * @name getDirector
 * @kind function
 * @param directorName
 * @returns director object
 * @requires passport
 */

app.get(
  "/movies/directors/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ "Director.Name": req.params.Name })
      .then((director) => {
        res.status(201).json(director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// error handling
/**
 * Error handler
 * @name errorHandler
 * @kind function
 */

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// listen for requests
/**
 * Request listener
 */

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
