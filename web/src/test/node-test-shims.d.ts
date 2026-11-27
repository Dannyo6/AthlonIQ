declare module "node:fs" {
  export interface Dirent {
    name: string;
    isDirectory(): boolean;
    isFile(): boolean;
  }

  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: "utf8"): string;
  export function readFileSync(path: string): Uint8Array;
  export function readdirSync(path: string): string[];
  export function readdirSync(
    path: string,
    options: { withFileTypes: true }
  ): Dirent[];
  export function statSync(path: string): { size: number };

  const fsDefault: {
    existsSync: typeof existsSync;
    readFileSync: typeof readFileSync;
    readdirSync: typeof readdirSync;
    statSync: typeof statSync;
  };
  export default fsDefault;
}

declare module "node:path" {
  export function resolve(...paths: string[]): string;
  export function join(...paths: string[]): string;
  export function relative(from: string, to: string): string;
  export function dirname(path: string): string;

  const pathDefault: {
    resolve: typeof resolve;
    join: typeof join;
    relative: typeof relative;
    dirname: typeof dirname;
  };
  export default pathDefault;
}

declare module "node:url" {
  export function fileURLToPath(url: string | URL): string;
}

declare module "node:zlib" {
  export function gzipSync(data: Uint8Array | string): { byteLength: number };
  const zlibDefault: {
    gzipSync: typeof gzipSync;
  };
  export default zlibDefault;
}
