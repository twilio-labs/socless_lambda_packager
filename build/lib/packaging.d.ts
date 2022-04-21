export declare type useDockerOption = 'no-linux' | 'true' | 'false';
export declare type languageOption = 'python' | 'ts' | 'js';
export interface PackagingArgs {
    functionsDir: string;
    commonDir?: string;
    outputDir?: string;
    useDocker: useDockerOption;
    language: languageOption;
}
export declare const defaultPackagingArgs: PackagingArgs;
export declare function makePackages(args: PackagingArgs): Promise<void>;
