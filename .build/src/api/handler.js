'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletAlertFollow = exports.saveAlert = exports.deleteFollowing = exports.saveFollowing = exports.deleteUser = exports.getUser = exports.getUsers = exports.saveUser = exports.getComments = exports.saveReplies = exports.saveComments = exports.deleteFeed = exports.deleteMessage = exports.saveMessage = exports.getMessage = void 0;
const fs = require('fs');
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
const getMessage = async (event) => {
    const { username } = event.pathParameters;
    const database = await connectToDatabase();
    const collection = await database.collection(`user-${username}`);
    const user = await collection.find({}).toArray();
    return {
        statusCode: 201,
        body: JSON.stringify(user)
    };
};
exports.getMessage = getMessage;
const saveMessage = async (event) => {
    const { image, post, username } = await extractBody(event);
    const newMessage = {
        post: post,
        image: image,
        username: username
    };
    const database = await connectToDatabase();
    const collection = await database.collection(`user-${username}`);
    const collectionUsers = await database.collection('users');
    const user = await collectionUsers.findOne({ username });
    if ((user.followers?.length ?? 0) > 0) {
        user.followers?.map(async (follow) => {
            await collectionUsers.updateOne({ username: follow.username }, { $push: { feeds: newMessage } });
        });
    }
    await collection.insertOne(newMessage);
    return {
        statusCode: 201,
        body: JSON.stringify(newMessage)
    };
};
exports.saveMessage = saveMessage;
const deleteMessage = async (event) => {
    const { username, postId } = event.pathParameters ?? {};
    const database = await connectToDatabase();
    const collection = await database.collection(`user-${username}`);
    await collection.deleteOne({ _id: ObjectId.createFromHexString(postId) });
    const user = await collection.find().toArray();
    return {
        statusCode: 201,
        body: JSON.stringify(user)
    };
};
exports.deleteMessage = deleteMessage;
const deleteFeed = async (event) => {
    const { userId, feedId } = event.pathParameters ?? {};
    const database = await connectToDatabase();
    const collection = await database.collection(`users`);
    await collection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $pull: { feeds: { _id: ObjectId.createFromHexString(feedId) } } });
    const user = await collection.find({}).toArray();
    return {
        statusCode: 201,
        body: JSON.stringify(user)
    };
};
exports.deleteFeed = deleteFeed;
const saveComments = async (event) => {
    const { messageId, ownerUser, comments } = await extractBody(event);
    comments._id = new ObjectId();
    comments.createAt = new Date().toLocaleDateString("pt-BR");
    const database = await connectToDatabase();
    const collection = await database.collection(`user-${ownerUser}`);
    await collection.updateOne({ _id: ObjectId.createFromHexString(messageId) }, { $push: { comments: comments } });
    const user = await collection.find({ username: `${ownerUser}` }).toArray();
    return {
        statusCode: 201,
        body: JSON.stringify(user)
    };
};
exports.saveComments = saveComments;
const saveReplies = async (event) => {
    const { messageId, commentId, ownerUser, replies } = await extractBody(event);
    replies.createAt = new Date().toLocaleDateString('pt-BR');
    const database = await connectToDatabase();
    const collection = await database.collection(`user-${ownerUser}`);
    const newReplie = await collection.updateOne({ _id: ObjectId.createFromHexString(messageId) }, { $push: { "comments.$[comment].replies": replies } }, {
        arrayFilters: [
            { "comment._id": ObjectId.createFromHexString(commentId) }
        ]
    });
    const user = await collection.find({ username: `${ownerUser}` }).toArray();
    return {
        statusCode: 201,
        body: JSON.stringify(user)
    };
};
exports.saveReplies = saveReplies;
const getComments = async (event) => {
    const response = await JSON.parse(fs.readFileSync(model, 'utf-8'));
    return {
        statusCode: 201,
        body: JSON.stringify({
            response
        }),
        headers: {
            'Content-type': 'application/json'
        }
    };
};
exports.getComments = getComments;
const saveUser = async (event) => {
    const { name, username, image } = await extractBody(event);
    const newUser = {
        name: name,
        username: username,
        image: image
    };
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
    };
};
exports.saveUser = saveUser;
const getUsers = async (event) => {
    const database = await connectToDatabase();
    const collection = await database.collection('users');
    const users = await collection.find({}).toArray();
    return {
        statusCode: 201,
        body: JSON.stringify(users),
        headers: {
            'Content-type': 'application/json'
        }
    };
};
exports.getUsers = getUsers;
const getUser = async (event) => {
    const _id = event.pathParameters?.id;
    const database = await connectToDatabase();
    const collection = await database.collection('users');
    const users = await collection.find({ _id: ObjectId.createFromHexString(_id) }).toArray();
    return {
        statusCode: 201,
        body: JSON.stringify(users),
        headers: {
            'Content-type': 'application/json'
        }
    };
};
exports.getUser = getUser;
const deleteUser = async (event) => {
    const _id = event.pathParameters?.id;
    const database = await connectToDatabase();
    const collection = await database.collection('users');
    await collection.deleteOne({ _id: ObjectId.createFromHexString(_id) });
    const users = await collection.find({}).toArray();
    return {
        statusCode: 201,
        body: JSON.stringify(users),
        headers: {
            'Content-type': 'application/json'
        }
    };
};
exports.deleteUser = deleteUser;
const saveFollowing = async (event) => {
    const { followUsername, userId } = (event.pathParameters ?? {});
    const database = await connectToDatabase();
    const collection = await database.collection('users');
    const user = await collection.find({ _id: ObjectId.createFromHexString(userId) }).toArray();
    const userFollow = await collection.find({ username: followUsername }).toArray();
    await collection.updateOne({ _id: ObjectId.createFromHexString(userId) }, {
        $push: {
            following: {
                username: userFollow[0].username,
                name: userFollow[0].name,
                image: userFollow[0].image,
            }
        }
    });
    await collection.updateOne({ username: userFollow[0].username }, {
        $push: {
            followers: {
                username: user[0].username,
                name: user[0].name,
                image: user[0].image,
            }
        }
    });
    const users = await collection.find({}).toArray();
    return {
        statusCode: 201,
        body: JSON.stringify(users),
        headers: {
            'Content-type': 'application/json'
        }
    };
};
exports.saveFollowing = saveFollowing;
const deleteFollowing = async (event) => {
    const { userId, followUsername } = (event.pathParameters ?? {});
    const database = await connectToDatabase();
    const collection = await database.collection('users');
    const userFollow = await collection.find({ username: followUsername }).toArray();
    const user = await collection.find({ _id: ObjectId.createFromHexString(userId) }).toArray();
    await collection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $pull: { following: { username: followUsername } } });
    await collection.updateOne({ username: followUsername }, { $pull: { followers: { username: user[0].username } } });
    const users = await collection.find({}).toArray();
    return {
        statusCode: 201,
        body: JSON.stringify(users),
        headers: {
            'Content-type': 'application/json'
        }
    };
};
exports.deleteFollowing = deleteFollowing;
const saveAlert = async (event) => {
    const userId = event.pathParameters?.userId;
    const alert = extractBody(event);
    const database = await connectToDatabase();
    const collection = await database.collection('users');
    const user = await collection.find({ _id: ObjectId.createFromHexString(userId) });
    collection.updateOne({ _id: ObjectId.createFromHexString(userId) }, {
        $push: {
            alert: {
                _id: new ObjectId(),
                ...alert
            }
        }
    });
    const users = await collection.find({}).toArray();
    return {
        statusCode: 201,
        body: JSON.stringify(users),
        headers: {
            'Content-type': 'application/json'
        }
    };
};
exports.saveAlert = saveAlert;
const deletAlertFollow = async (event) => {
    const { userId, username, alertId } = event.pathParameters ?? {};
    const database = await connectToDatabase();
    const collection = await database.collection('users');
    const user = await collection.find({ _id: ObjectId.createFromHexString(userId) });
    if (alertId === 'undefined' || alertId === undefined) {
        await collection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $pull: { alert: { followAlert: username } } });
    }
    else {
        await collection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $pull: { alert: { _id: ObjectId.createFromHexString(alertId) } } });
    }
    const users = await collection.find({}).toArray();
    return {
        statusCode: 201,
        body: JSON.stringify(users),
        headers: {
            'Content-type': 'application/json'
        }
    };
};
exports.deletAlertFollow = deletAlertFollow;
//# sourceMappingURL=handler.js.map