const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const CONNECTION_URL = "mongodb+srv://user:example@example-gljju.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "workshop";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;

const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';



app.listen(9292, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("movies");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});




async function getMovies(actor){
  try {
    return await imdb(actor);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}



app.get("/movies/populate", async (request, response) => {
  var movies = await getMovies(DENZEL_IMDB_ID);
  collection.insertMany(movies, (error, result) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.json({ total: movies.length});
  });
});

/*
app.get("/movies", (request, response) => {
  collection.findOne(movies, (error, result) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.json({ total: movies.length});
  });
});
*/
