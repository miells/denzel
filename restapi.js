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
      response.json({ total: result.insertedCount});
  });
});



app.get("/movies", (request, response) => {
  collection.aggregate([{$match: {metascore: {$gt: 70}}}, {$sample: {size:1}}]).toArray( (error, result) => {
      if(error) {
          return response.status(500).send(error);
      }
      response.json(result);
  });
});


app.get("/movies/search", (request, response) => {
  var limitParam = +request.query.limit;
  /*if(limit = undefined){
    limit = 5;
  }*/
  var metascoreParam = +request.query.metascore;
  /*if(metascoreParam = undefined){
    metascoreParam = 0;
  }*/
  collection.aggregate([{$match: { metascore: {$gt: metascoreParam} }}, {$sort: {metascore: -1}}, {$limit: limitParam }]).toArray( (error, result) => {
    if(error) {
        return response.status(500).send(error);
    }
    response.json(result);
  })
});


app.get("/movies/:id", (request, response) => {
  var movieid = request.params.id;
  var query = {id: movieid};
  collection.find(query).toArray( (error, result) => {
    if(error) {
        return response.status(500).send(error);
    }
    response.json(result);
  })
});


app.post("/movies/:id", (request, response) => {
  var movieid = request.params.id;
  var date = request.body.date;
  var review = request.body.review;

  collection.updateOne({id: movieid}, {$set: {date: date, review: review}});
  response.json({id: movieid});
})
