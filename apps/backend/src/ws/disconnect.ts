// src/ws/disconnect.ts
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import type { APIGatewayProxyHandler } from "aws-lambda";

const ddb = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
    const connectionId = event.requestContext.connectionId!;

    await ddb.send(new DeleteItemCommand({
        TableName: "ws-connections",
        Key: { connectionId: { S: connectionId } },
    }));

    return { statusCode: 200, body: "Disconnected" };
};