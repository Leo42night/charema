import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import type { APIGatewayProxyHandler } from "aws-lambda";

const ddb = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log("FULL EVENT:", JSON.stringify(event, null, 2));

    const connectionId = event.requestContext?.connectionId;
    if (!connectionId) {
        console.error("connectionId tidak ditemukan di requestContext");
        return { statusCode: 500, body: "Missing connectionId" };
    }

    await ddb.send(new PutItemCommand({
        TableName: "ws-connections",
        Item: { connectionId: { S: connectionId } },
    }));

    return { statusCode: 200, body: "Connected" };
};