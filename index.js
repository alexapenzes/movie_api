const express = require('express');
    morgan = require('morgan');

const app = express();

app.use(morgan('common'));

let topMovies = [
    {
        title: 'Harry Potter and the Prisoner of Azkaban',
        director: 'Alfonso Cuaron',
        genre: 'Fantasy'
    },
    {
        title: 'The Godfather',
        director: 'Francis Ford Coppola',
        genre: 'Crime'
    },
    {
        title: 'Twilight',
        director: 'Catherine Hardwicke',
        genre: 'Romance'
    },
    {
        title: 'Inception',
        director: 'Christopher Nolan',
        genre: 'Action'
    },
    {
        title: 'The Devil Wears Prada',
        director: 'David Frankel',
        genre: 'Comedy'
    },
    {
        title: 'Avatar',
        director: 'James Cameron',
        genre: 'Action'
    },
    {
        title: 'Fight Club',
        director: 'David Fincher',
        genre: 'Thriller'
    },
    {
        title: 'Schindler\'s List',
        director: 'Steven Spielberg',
        genre: 'Historical Drama'
    },
    {
        title: 'The Pianist',
        director: 'Roman Polanski',
        genre: 'War Drama'
    },
    {
        title: 'Snatch',
        director: 'Guy Ritchie',
        genre: 'Comedy'
    }
  ];
  
  // GET requests
  app.get('/', (req, res) => {
    res.send('Welcome to the Top 10 Movies!');
  });
  
  app.get('/movies', (req, res) => {
    res.json(topMovies);
  });

  app.use('/documentation.html', express.static('public'));

  // error handling
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });
  
  // listen for requests
  app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
  });