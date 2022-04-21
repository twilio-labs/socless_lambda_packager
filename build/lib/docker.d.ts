/// <reference types="node" />
import { ChildProcessWithoutNullStreams } from 'child_process';
export declare function spawnDockerCmd(args: string[]): Promise<ChildProcessWithoutNullStreams>;
/**
 * Build the custom Docker image if user provides a dockerfile
 * @param {string} dockerFile
 * @param {string[]} extraArgs
 * @return {string} The name of the built docker image.
 */
export declare function buildImage(dockerFilePath: string, dockerExtraArgs?: string[]): Promise<ChildProcessWithoutNullStreams>;
