import { ObjectId } from "mongodb"

type TypeReplies = {
  ownerUser: string,
  commentId: string,
  messageId: string,
  replies: {
    _id?:ObjectId,
    content: string,
    createAt: string,
    score: number,
    replyingTo: string
    image: { png: string, webp: string },
    username: string
  }
}

export default TypeReplies