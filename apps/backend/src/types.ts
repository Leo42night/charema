export interface DbClient {
  recomTarget: { // camelCase
    findMany: (args?: any) => Promise<any[]>;
    upsert: (args?: any) => Promise<any>;
    findFirst: (args?: any) => Promise<any>;
    count: (args: { where: { user_key: number } }) => Promise<any>;
    update: (args: { where: any, data: any }) => Promise<any>;
    create: (args: { data: any }) => Promise<any>;
  };
  score: { // camelCase
    upsert: (args: {
      where: { user_key: number };
      update: { score_cf: number; score_chat: number, message?: string, created_at: Date };
      create: { user_key: number, score_cf: number; score_chat: number, message?: string };
    }) => Promise<any>;
    findMany: () => Promise<any[]>;
    aggregate: (args: any) => Promise<any>;
  };
  achievement: { // camelCase
    create: (args: { data: any }) => Promise<any>;
    findMany: () => Promise<any[]>;
    findUnique: (args: { where: any }) => Promise<any>;
    upsert: (args: {
      where: { user_key: number }; // Key unik untuk pencarian data
      update: { tags: any }; // time Update pakai score update created_at 
      create: { user_key: number, tags: any }
    }) => Promise<any>;
  };
  feedback: { // camelCase
    create: (args: { data: any }) => Promise<any>;
    update: (args: { where: any, data: any }) => Promise<any>;
    findFirst: (args: { where: any, orderBy: any }) => Promise<any>;
    findMany: () => Promise<any[]>;
    count: (args?: { where: any }) => Promise<number>;
  };
  // Menggunakan 'any' pada query untuk bypass validasi strict Prisma internal
  $queryRaw: <T = any>(query: any, ...values: any[]) => Promise<T>;
}

export type NimToUser = {
  [key: string]: number;
};