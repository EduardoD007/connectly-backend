'use strict'
const fs = require('fs');
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

export const getMessage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { username }: any = event.pathParameters;


  const database = await connectToDatabase();
  const collection = await database.collection(`user-${username}`);
  const user = await collection.find({}).toArray();


  return {
    statusCode: 201,
    body: JSON.stringify(user)
  }

}

export const saveMessage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { image, post, username }: TypeMessage = await extractBody(event)

  const newMessage = {
    post: post,
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

  return {
    statusCode: 201,
    body: JSON.stringify(newMessage)
  }
}

export const deleteMessage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { username, postId } = event.pathParameters ?? {}

  const database = await connectToDatabase()
  const collection = await database.collection(`user-${username}`)
  await collection.deleteOne({ _id: ObjectId.createFromHexString(postId) })

  const user = await collection.find().toArray();

  return {
    statusCode: 201,
    body: JSON.stringify(user)
  }
}

export const deleteFeed = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { userId,feedId } = event.pathParameters ?? {}

  const database = await connectToDatabase()
  const collection = await database.collection(`users`)
  await collection.updateOne(
    { _id: ObjectId.createFromHexString(userId) },
    {$pull: {feeds: {_id: ObjectId.createFromHexString(feedId)}}}
  )

  const user = await collection.find({}).toArray();

  return {
    statusCode: 201,
    body: JSON.stringify(user)
  }
}

export const saveComments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { messageId, ownerUser, comments }: TypeComments = await extractBody(event)


  comments._id = new ObjectId();
  comments.createAt = new Date().toLocaleDateString("pt-BR");

  const database = await connectToDatabase();
  const collection = await database.collection(`user-${ownerUser}`);

  await collection.updateOne(
    { _id: ObjectId.createFromHexString(messageId) },
    { $push: { comments: comments } }
  )

  const user = await collection.find({ username: `${ownerUser}` }).toArray();

  return {
    statusCode: 201,
    body: JSON.stringify(user)
  }

}

export const saveReplies = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { messageId, commentId, ownerUser, replies }: TypeReplies = await extractBody(event);

  replies.createAt = new Date().toLocaleDateString('pt-BR');

  const database = await connectToDatabase();
  const collection = await database.collection(`user-${ownerUser}`)
  const newReplie = await collection.updateOne(
    { _id: ObjectId.createFromHexString(messageId) },
    { $push: { "comments.$[comment].replies": replies } },
    {
      arrayFilters: [
        { "comment._id": ObjectId.createFromHexString(commentId) }
      ]
    },

  )

  const user = await collection.find({ username: `${ownerUser}` }).toArray()

  return {
    statusCode: 201,
    body: JSON.stringify(user)
  }

}

export const getComments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const response: TypeComments = await JSON.parse(fs.readFileSync(model, 'utf-8'));

  return {
    statusCode: 201,
    body: JSON.stringify(
      {
        response
      }
    ),
    headers: {
      'Content-type': 'application/json'
    }

  }
}

export const saveUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { name, username, image }: InterfaceUser = await extractBody(event);

  const newUser = {
    name: name,
    username: username,
    image: image
  }

  const database = await connectToDatabase();
  const collection = await database.collection('users');
  await collection.insertOne(newUser);

  const users = await collection.find({}).toArray();

  return {
    statusCode: 201,
    body: JSON.stringify(users),
    headers: {
      'Content-type': 'application/json'
    }
  }
}

export const getUsers = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  const database = await connectToDatabase();
  const collection = await database.collection('users');

  const users: InterfaceUser[] = await collection.find({}).toArray();

  return {
    statusCode: 201,
    body: JSON.stringify(users),
    headers: {
      'Content-type': 'application/json'
    }
  }
}

export const getUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const _id = event.pathParameters?.id;

  const database = await connectToDatabase();
  const collection = await database.collection('users');
  

  const users: InterfaceUser[] = await collection.find({ _id: ObjectId.createFromHexString(_id) }).toArray();

  return {
    statusCode: 201,
    body: JSON.stringify(users),
    headers: {
      'Content-type': 'application/json'
    }
  }
}

export const deleteUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const _id = event.pathParameters?.id;

  const database = await connectToDatabase();
  const collection = await database.collection('users')
  await collection.deleteOne({ _id: ObjectId.createFromHexString(_id) })

  const users = await collection.find({}).toArray();

  return {
    statusCode: 201,
    body: JSON.stringify(users),
    headers: {
      'Content-type': 'application/json'
    }
  }
}

export const saveFollowing = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { followUsername, userId }: TypeFollowing = (event.pathParameters ?? {}) as TypeFollowing

  const database = await connectToDatabase()
  const collection = await database.collection('users')
  const user = await collection.find({ _id: ObjectId.createFromHexString(userId) }).toArray()
  const userFollow = await collection.find({ username: followUsername }).toArray()
  await collection.updateOne(
    { _id: ObjectId.createFromHexString(userId) },
    {
      $push: {
        following: {
          username: userFollow[0].username,
          name: userFollow[0].name,
          image: userFollow[0].image,
        }
      }
    }
  )
  await collection.updateOne(
    { username: userFollow[0].username },
    {
      $push: {
        followers: {
          username: user[0].username,
          name: user[0].name,
          image: user[0].image,
        }
      }
    }
  )

  const users = await collection.find({}).toArray();

  return {
    statusCode: 201,
    body: JSON.stringify(users),
    headers: {
      'Content-type': 'application/json'
    }
  }
}

export const deleteFollowing = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { userId, followUsername }: TypeFollowing = (event.pathParameters ?? {}) as TypeFollowing

  const database = await connectToDatabase();
  const collection = await database.collection('users');
  const userFollow = await collection.find({ username: followUsername }).toArray()
  const user = await collection.find({ _id: ObjectId.createFromHexString(userId) }).toArray()

  await collection.updateOne(
    { _id: ObjectId.createFromHexString(userId) },
    { $pull: { following: { username: followUsername } } }
  )

  await collection.updateOne(
    { username: followUsername },
    { $pull: { followers: { username: user[0].username } } }
  )

  const users = await collection.find({}).toArray();

  return {
    statusCode: 201,
    body: JSON.stringify(users),
    headers: {
      'Content-type': 'application/json'
    }
  }
}

export const saveAlert = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = event.pathParameters?.userId;
  const alert = extractBody(event);
  const database = await connectToDatabase();

  const collection = await database.collection('users');
  const user = await collection.find({ _id: ObjectId.createFromHexString(userId) })
  collection.updateOne(
    { _id: ObjectId.createFromHexString(userId) },
    {
      $push: {
        alert:
        {
          _id: new ObjectId(),
          ...alert
        }
      }
    }
  )

  const users = await collection.find({}).toArray();

  return {
    statusCode: 201,
    body: JSON.stringify(users),
    headers: {
      'Content-type': 'application/json'
    }
  }
}

export const deletAlertFollow = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { userId, username, alertId } = event.pathParameters ?? {}

  const database = await connectToDatabase();

  const collection = await database.collection('users');
  const user = await collection.find({ _id: ObjectId.createFromHexString(userId) })
  if (alertId === 'undefined' || alertId === undefined) {
    await collection.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $pull: { alert: { followAlert: username } } }
    )
  } else {
    await collection.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $pull: { alert: { _id: ObjectId.createFromHexString(alertId) } } },
    )
  }


  const users = await collection.find({}).toArray();

  return {
    statusCode: 201,
    body: JSON.stringify(users),
    headers: {
      'Content-type': 'application/json'
    }
  }
}
