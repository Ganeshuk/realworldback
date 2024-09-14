const express = require('express');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// PostgreSQL (CockroachDB) client setup
const client = new Client({
  host: "late-grivet-9239.7tc.aws-eu-central-1.cockroachlabs.cloud",
  port: 26257,
  user: "ganesh",
  password: "g7BqbmETmOyk2nRZ9t9tWA",
  database: "movies",
  ssl:{
    rejectUnauthorized: false // Set this to true in production and add a certificate if required
  }
});

// Start the server and connect to the database
app.listen(3000, () => {
  client.connect()
    .then(() => {
      console.log('Connected to CockroachDB!');
      console.log('Server running on http://localhost:3000');
    })
    .catch(err => console.error('Connection error', err.stack));
});

// POST route to insert a movie into the database
app.post('/movie', async (request, response) => {
  try {
    const { movieName, movieType, movieCategory, movieLink, moviePoster, movieDescription, movieCast, publisher } = request.body;
    
    // Validate that required fields are present
    if (!movieName) {
      return response.status(400).json({ error: 'movieName is required' });
    }

    // SQL query to insert a movie into the 'list' table
    const query = `
      INSERT INTO list (movieName, movieType, movieCategory, movieLink, moviePoster, movieDescription, movieCast, publisher)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    
    const values = [movieName, movieType, movieCategory, movieLink, moviePoster, movieDescription, movieCast, publisher];

    // Execute the query
    const result = await client.query(query, values);

    // Respond with the newly inserted movie
    response.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error inserting movie:', error);
    response.status(500).json({ error: 'An error occurred while inserting the movie' });
  }
});

app.put('/movie/:id', async (req, res) => {
    const movieId = req.params.id
    const { movieName, movieType, movieCategory, movieLink, moviePoster, movieDescription, movieCast, publisher } = req.body;
    const query=` UPDATE list
      SET movieName = $1,
          movieType = $2,
          movieCategory = $3,
          movieLink = $4,
          moviePoster = $5,
          movieDescription = $6,
          movieCast = $7,
          publisher = $8
      WHERE id = $9`
      const values = [movieName, movieType, movieCategory, movieLink, moviePoster, movieDescription, movieCast, publisher, movieId];
       const result=await client.query(query,values)
       if (result.rowCount===0){
        res.json('Movie not found')
       }
       else{
        res.json('updated Movie')
       }
      
  });
app.get('/',async(req,res)=>{
    const qurey=`SELECT DISTINCT movieName, moviePoster,id FROM list ORDER BY id DESC`
    const result=await client.query(qurey)
    res.json(result.rows)
})
app.get('/movie/:id', async (req, res) => {
    const movieId = req.params.id; // Ensure the ID is parsed as an integer
  
    if (isNaN(movieId)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }
  
    try {
      const query = 'SELECT * FROM list WHERE movieName= $1';
      const values = [movieId];
      const result = await client.query(query, values);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Movie not found' });
      }
  
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching movie:', error);
      res.status(500).json({ error: 'An error occurred while fetching the movie' });
    }
  });
  
  app.get('/movies/type/:type', async (req, res) => {
    const movieType = req.params.type; // Capture the movieType from the URL

    if (!movieType) {
        return res.status(400).json({ error: 'Movie type is required' });
    }

    try {
        const query = 'SELECT * FROM list WHERE movieType = $1 ORDER BY id DESC';
        const values = [movieType];
        const result = await client.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No movies found for this type' });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching movies by type:', error);
        res.status(500).json({ error: 'An error occurred while fetching the movies' });
    }
});
