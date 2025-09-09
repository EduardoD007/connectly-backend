import { ObjectId } from "mongodb";
import TypeMessage from "../Types/TypeMessage";
interface InterfaceUser {
    name: string;
    username: string;
    image: {
        png: string;
        webp: string;
    };
    following?: [{
        username: string;
        name: string;
        image: {
            png: string;
            webp: string;
        };
    }];
    followers?: [{
        username: string;
        name: string;
        image: {
            png: string;
            webp: string;
        };
    }];
    alert?: [
        {
            _id: ObjectId;
            username: string;
            name: string;
            image: {
                png: string;
                webp: string;
            };
            followAlert: string;
            message: string;
        }
    ];
    feeds?: TypeMessage[];
}
export default InterfaceUser;
//# sourceMappingURL=InterfaceUser.d.ts.map