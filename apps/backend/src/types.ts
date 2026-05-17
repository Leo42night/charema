export interface DbClient {
  recomTarget: { // camelCase
    findMany: () => Promise<any[]>;
    create: (args: { data: any }) => Promise<any>;
    findFirst: (args: { where: any, orderBy: any }) => Promise<any>;
    groupBy: (args: { by: any }) => Promise<any>;
  };
  score: { // camelCase
    upsert: (args: {
      where: { user_key: number };
      update: { score_cf: number; score_chat: number };
      create: { user_key: number, score_cf: number; score_chat: number };
    }) => Promise<any>;
    findMany: () => Promise<any[]>;
    count: () => Promise<number>;
    aggregate: (args: any) => Promise<any>;
  };
  achievement: { // camelCase
    create: (args: { data: any }) => Promise<any>;
    findMany: () => Promise<any[]>;
    upsert: (args: {
      where: { user_key: number }; // Key unik untuk pencarian data
      update: { tags: any; updatedAt?: Date }; // Data yang diubah jika data ADA
      create: { user_key: number, tags: any; updatedAt?: Date }
    }) => Promise<any>;
  };
  feedback: { // camelCase
    create: (args: { data: any }) => Promise<any>;
    findMany: () => Promise<any[]>;
    count: (args?: { where: { user_key: number } }) => Promise<number>;
  };
  // Menggunakan 'any' pada query untuk bypass validasi strict Prisma internal
  $queryRaw: <T = any>(query: any, ...values: any[]) => Promise<T>;
}

export type NimToUser = {
  [key: string]: number;
};