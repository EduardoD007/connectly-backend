const { ApolloServer, gql } = require('apollo-server-lambda');
import { LambdaResponse } from '../Types/TypeLambdaResponse';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import TypeComments from '../Types/TypeComments';
import TypeMessage from "../Types/TypeMessage";
import TypeReplies from "../Types/TypeReplies";
import InterfaceUser from "../interfaces/InterfaceUser";
import TypeFollowing from '../Types/TypeFollowing';
const { MongoClient, ObjectId } = require('mongodb')

const model = './src/database/data.json';

async function connectToDatabase() {
  const client = new MongoClient(process.env.MONGODB_CONNECTIONSTRING)
  const connection = await client.connect()
  return connection.db(process.env.MONGODB_DB_NAME)
}

function extractBody(event: any) {
  // No AWS usa-se event.body no lugar de req.body
  // !event? - Significa: event não exite ?
  if (!event?.body) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'Missing body' })
    }
  }
  // Usar o JSON.parse porque recebe o body como string e precisa passar para o formato JSON
  return JSON.parse(event.body)
}

const typeDefs = gql`

  type LambdaResponse {
    statusCode: Int!
    body: String
  }

  type TypeUser {
    _id: ID
    name:String
    username: String!
    image: Image!
    following: [Following]
    followers: [Followers]
    alert:[Alert]
    feeds: [TypeMessage]
  }

  input ImageInput {
    png: String!
    webp: String!
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

  input PostInput {
    _id:ID
    message: typePostMessageInput
  }

   type Post {
    _id:ID
    message: typePostMessage
  }

  input typePostMessageInput {
    text: String
    image: String
  }

  type typePostMessage {
       text: String
       image: String
  }

  type message {
    message: typePostMessage
  }

  input inputPostMessage {
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
    post: message
    comments: [TypeComments!]
    replies: [TypeReplies]
    likes: Int
  }


  type Mutation {
    newPost(image:ImageInput, username: String!, post:PostInput): TypeMessage
    deleteFeed(userId:String!, feedId:String!):TypeUser
  }

  type Query {
     getUser(username:String): TypeUser
  }
`;

const resolvers = {
  Query: {
    getUser: async (_: any, args: { username: String }): Promise<InterfaceUser> => {
      const { username } = args;

      const database = await connectToDatabase();
      const collection = await database.collection('users');
      const user = collection.findOne({ username })

      return user
    }
  },


  Mutation: {
    newPost: async (_: any, args: { image: any, username: String, post: any }): Promise<TypeMessage> => {
      const { image, username, post } = args

      const newMessage = {
        _id: new ObjectId(),
        post: [post],
        image: image,
        username: username
      }

      const database = await connectToDatabase()
      const collection = await database.collection(`user-${username}`)
      const collectionUsers = await database.collection('users')
      const user = await collectionUsers.findOne({ username });

      if ((user.followers?.length ?? 0) > 0) {
        user.followers?.map(async (follow: InterfaceUser) => {
          await collectionUsers.updateOne(
            { username: follow.username },
            { $push: { feeds: newMessage } }
          )
        })
      }

      await collection.insertOne(newMessage)

      return newMessage
    },

    deleteFeed: async (_: any, args: { userId: String, feedId: String }): Promise<InterfaceUser> => {
      const { userId, feedId } = args

      const database = await connectToDatabase()
      const collection = await database.collection(`users`)
      await collection.updateOne(
        { _id: ObjectId.createFromHexString(userId) },
        { $pull: { feeds: { _id: ObjectId.createFromHexString(feedId) } } }
      )

      const user = await collection.findOne({ _id : ObjectId.createFromHexString(userId) });

      return user
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  playground: true, // Desabilitando o playground
  introspection: true, // Habilitando introspecção
})

// Handler para a função Lambda
exports.handerGraphql = server.createHandler();