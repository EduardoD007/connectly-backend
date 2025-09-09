"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { ApolloServer, gql } = require('apollo-server-lambda');
const { MongoClient, ObjectId } = require('mongodb');
const model = './src/database/data.json';
async function connectToDatabase() {
    const client = new MongoClient(process.env.MONGODB_CONNECTIONSTRING);
    const connection = await client.connect();
    return connection.db(process.env.MONGODB_DB_NAME);
}
function extractBody(event) {
    // No AWS usa-se event.body no lugar de req.body
    // !event? - Significa: event não exite ?
    if (!event?.body) {
        return {
            statusCode: 422,
            body: JSON.stringify({ error: 'Missing body' })
        };
    }
    // Usar o JSON.parse porque recebe o body como string e precisa passar para o formato JSON
    return JSON.parse(event.body);
}
const typeDefs = gql `

  type User {
    _id: ID
    username: String!
    image: Image!
    following: [Following]
    followers: [Followers]
    alert:[Alert]
    feeds: [TypeMessage]
  }

  type Image {
    png: String!
    webp: String!
  }

  type Following {
    username: String!
    name: String!
    image: Image!
  }

   type Followers {
    username: String!
    name: String!
    image: Image!
  }

  type Alert {
    _id: ID
    username: String!
    name: String!
    image: Image!
    followAlert: String!
    message: String!
  }

  type Post {
    _id:ID
    message: typePostMessage
  }

  type typePostMessage {
    text: String
    image: String
  }

  type TypeComments {
    _id: ID
    content: String
    createAt: String!
    score: Int
    image: Image!
    username: String!
    likes:Int
  }

  type TypeReplies {
    _id: ID
    content: String!
    createAt: String!
    score: Int
    replyingTo: String!
    image: Image! 
    username: String!
  }

  type TypeMessage {
    _id:ID
    username: String!
    image: Image!
    post: typePostMessage
    comments: [TypeComments!]
    replies: [TypeReplies]
    likes: Int
  }

  type Mutation {
    newPost(image:String, username: String, post:String): TypeMessage
  }
`;
const resolvers = {
    Mutation: {
        newPost: async (_, image, username, post) => {
            const newMessage = {
                post: post,
                image: image,
                username: username
            };
            const database = await connectToDatabase();
            const collection = await database.collection(`user-${username}`);
            const collectionUsers = await database.collection('users');
            const user = await collectionUsers.find({ username: username }).toArray();
            if ((user.followers?.length ?? 0) > 0) {
                user.followers?.map(async (follow) => {
                    collectionUsers.updateOne({ username: follow.username }, { $push: { feeds: newMessage } });
                });
            }
            await collection.insertOne(newMessage);
            return {
                statusCode: 201,
                body: JSON.stringify(newMessage)
            };
        }
    }
};
const server = new ApolloServer({
    typeDefs,
    resolvers,
    playground: true, // Desabilitando o playground
    introspection: true, // Habilitando introspecção
});
// Handler para a função Lambda
exports.handerGraphql = server.createHandler();
//# sourceMappingURL=handler.js.map