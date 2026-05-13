
export interface DbClient {
  recomTarget: { // camelCase
    findMany: () => Promise<any[]>;
    create: (args: { data: any }) => Promise<any>;
    count: (args?: any) => Promise<number>;
  };
  score: { // camelCase
    create: (args: { data: any }) => Promise<any>;
  };
  scorePrompt: { // camelCase
    create: (args: { data: any }) => Promise<any>;
    update: (args: { where: any; data: any }) => Promise<any>;
  };
  // Menggunakan 'any' pada query untuk bypass validasi strict Prisma internal
  $queryRaw: <T = any>(query: any, ...values: any[]) => Promise<T>;
}

export type NimToUser = {
  [key: string]: number;
};