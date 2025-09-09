import { ObjectId } from "mongodb";
type TypeComments = {
    ownerUser: string;
    messageId: string;
    comments: {
        _id?: ObjectId;
        content: string;
        createAt: string;
        score: number;
        image: {
            png: string;
            webp: string;
        };
        username: string;
    };
};
export default TypeComments;
//# sourceMappingURL=TypeComments.d.ts.map