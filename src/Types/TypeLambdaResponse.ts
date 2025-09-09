export type LambdaResponse<T> = {
    statusCode: number;
    body: string; // JSON.stringify(T)
 }