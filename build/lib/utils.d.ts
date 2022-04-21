import { Result } from 'neverthrow';
export declare function ensureDirSync(directory: any): void;
export declare function customCopyDirSync(directory: any, destination: any): void;
export declare function getUTF8File(filePath: string): Result<string, string>;
export declare function checkDirExists(dir: string): Result<string, string>;
export declare function removeUndefinedValues<T>(obj: T): T;
export declare const quote: (xs: any) => any;
