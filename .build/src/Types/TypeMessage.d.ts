import { ObjectId } from "mongodb";
type TypeMessage = {
    _id: ObjectId;
    username: String;
    image: {
        png: String;
        webp: String;
    };
    post: {
        message: {
            text: String;
            image: String;
        };
        comments?: {
            id: number;
            content: String;
            createAt: String;
            score: number;
            image: {
                png: String;
                webp: String;
            };
            username: String;
        }[] | [];
        replies?: {
            id: number;
            content: String;
            createAt: String;
            score: number;
            replyingTo: String;
            image: {
                png: String;
                webp: String;
            };
            username: String;
        }[] | [];
        likes?: number;
    }[];
};
export default TypeMessage;
//# sourceMappingURL=TypeMessage.d.ts.map