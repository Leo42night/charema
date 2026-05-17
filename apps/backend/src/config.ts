import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({ region: "us-east-1" });

const SSM_PARAMS = [
  "/remaku/DATABASE_URL",
  "/remaku/JWT_SECRET",
  "/remaku/API_KEY",
  "/remaku/FRONTEND_URL",
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