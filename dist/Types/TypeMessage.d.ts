type TypeMessage = {
    username: string;
    image: {
        png: string;
        webp: string;
    };
    post: {
        message: {
            text: string;
            image: string;
        };
        comments: {
            id: number;
            content: string;
            createAt: string;
            score: number;
            image: {
                png: string;
                webp: string;
            };
            username: string;
        }[] | [];
        replies: {
            id: number;
            content: string;
            createAt: string;
            score: number;
            replyingTo: string;
            image: {
                png: string;
                webp: string;
            };
            username: string;
        }[] | [];
        likes?: number;
    }[];
};
export default TypeMessage;
//# sourceMappingURL=TypeMessage.d.ts.map