import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({ region: "us-east-1" });

const SSM_PARAMS = [
  "/monorepo/DATABASE_URL",
  "/monorepo/DB_AUTH_TOKEN",
  "/monorepo/GOOGLE_CLIENT_ID",
  "/monorepo/GOOGLE_CLIENT_SECRET",
  "/monorepo/GOOGLE_REDIRECT_URI",
  "/monorepo/JWT_SECRET",
  "/monorepo/API_KEY",
  "/monorepo/FRONTEND_URL",
];

let isLoaded = false;

export const loadConfig = async () => {
  if (isLoaded) return;

  const command = new GetParametersCommand({
    Names: SSM_PARAMS,
    WithDecryption: true,
  });

  const response = await ssm.send(command);

  response.Parameters?.forEach((param) => {
    if (!param.Name || !param.Value) return;
    const key = param.Name.split("/").pop()!;
    process.env[key] = param.Value;
  });

  isLoaded = true;
};