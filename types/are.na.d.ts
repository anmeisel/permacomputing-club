// types/are.na.d.ts
declare module "are.na" {
  export default class Arena {
    constructor(options?: { accessToken?: string });
    channel(slug: string): {
      get(): Promise<{
        title: string;
        contents: Array<{
          title?: string;
          content?: string;
          [key: string]: any;
        }>;
        [key: string]: any;
      }>;
    };
    // Add other methods as needed
  }
}
