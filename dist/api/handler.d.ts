import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
export declare const getMessage: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const saveMessage: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const deleteMessage: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const deleteFeed: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const saveComments: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const saveReplies: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getComments: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const saveUser: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getUsers: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getUser: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const deleteUser: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const saveFollowing: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const deleteFollowing: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const saveAlert: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const deletAlertFollow: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=handler.d.ts.map