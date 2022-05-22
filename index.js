const express = require("express"),
  morgan = require("morgan"),
  bodyParser = require("body-parser"),
  uuid = require("uuid"),
  mongoose = require('mongoose'),
  Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

// Mongoose connection to database for CRUD operations
mongoose.connect('mongodb://localhost:27017/myFlixDB', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

const app = express();

/*let users = [
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
]; */

/* let movies = [
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
]; */

//Middleware to...
app.use(express.static("public")); // serve static files
app.use(morgan("common")); // log requests to terminal
app.use(bodyParser.json()); // use body-parser
app.use(bodyParser.urlencoded({ extended: true })); // use body-parser encoded
let auth = require('./auth')(app); //auth.js file use express

const passport = require('passport');
const { authenticate } = require("passport/lib");
require('./passport');

//Add a user
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
app.post('/users', (req, res) => {
  Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) =>{res.status(201).json(user) })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// Get all users
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Update a user's info, by username
/* We’ll expect JSON in this format
{
  Username: String,
  (required)
  Password: String,
  (required)
  Email: String,
  (required)
  Birthday: Date
}*/
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
    {
      Username: req.body.Username,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
  { new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if(err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

// Add a movie to a user's list of favorites
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
     $push: { FavoriteMovies: req.params.MovieID }
   },
   { new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

// Allows user to delete movie from favorites
app.delete("/users/:Username/movies/:MovieID", passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
    $pull: { FavoriteMovies: req.params.MovieID }
  },
  { new: true }, 
  (err, updatedUser) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

// Delete a user by username
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// GET requests
// Get home page
app.get("/", (req, res) => {
  res.send("Welcome to the Top 10 Movies!");
});

// Get documentation page
app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", {
    root: __dirname,
  });
});

// READ
app.get("/movies", passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find()
  .then((movies) => {
    res.status(201).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});

// READ
app.get("/movies/:Title", passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ Title: req.params.Title })
  .then((movie) => {
    res.json(movie);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
});

// Get genre by name
app.get('/movies/genre/:name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ 'Genre.Name' : req.params.name })
    .then((genre) => {
      res.status(201).json(genre)
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get director by name
app.get('/movies/directors/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ 'Director.Name' : req.params.Name })
    .then((director) => {
      res.status(201).json(director)
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
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
