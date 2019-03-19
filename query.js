const { GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLList
} = require('graphql');

const {movieType} = require('./types.js');


const express = require('express');
const app = express();
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const CONNECTION_URL = "mongodb+srv://user:example@example-gljju.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "workshop";

var database, collection;

const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';


app.listen(5000, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("movies");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});


//Define the Query
const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        random: {
          type: movieType,
          resolve: async function() {
            var res = await collection.aggregate([{$match: {metascore: {$gt: 70}}}, {$sample: {size:1}}]).toArray();
            return res[0];
          }
        },
        fetchMovie: {
          type: movieType,
          args: { id: { type: GraphQLString } },
          resolve: async function(source, args) {
            var query = {id: args.id};
            var res = await collection.find(query).toArray();
            return res[0];
          }
        },
        searchDenzelMovie: {
          type: new GraphQLList(movieType),
          args: { limit: { type: GraphQLInt }, metascore: { type: GraphQLInt}},
          resolve: async function(source, args) {
            var limitParam = args.limit;
            /*if(limit = undefined){
              limit = 5;
            }*/
            var metascoreParam = args.metascore;
            /*if(metascoreParam = undefined){
              metascoreParam = 0;
            }*/
            var res = await collection.aggregate([{$match: { metascore: {$gt: metascoreParam} }}, {$sort: {metascore: -1}}, {$limit: limitParam }]).toArray();
            return res;
          }
        }
    }
});

exports.queryType = queryType;
