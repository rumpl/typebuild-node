interface Command {
  type: string;
  args: any;
}

export interface CopyFlags {
  followSymlinks: boolean; //true,
  copyDirContentsOnly: boolean; //true,
  attemptUnpack: boolean; //false,
  createDestPath: boolean; //true,
  allowWildcard: boolean; //true,
  allowEmptyWildcard: boolean; //true,
}

export interface CopyOptions {
  from?: Stage;
  source: string;
  destination: string;
  opts?: CopyFlags;
}

export interface Mount {
  type: string;
}

interface CacheRunMountOptions {
  id?: string;
  from?: string;
  target: string;
  uid?: number;
  gid?: number;
  source?: string;
  sharing?: "shared" | "private" | "locked";
  readOnly?: boolean;
  mode?: number;
}

export class CacheRunMount implements Mount {
  type = "cache";
  public options: CacheRunMountOptions;

  constructor(options: CacheRunMountOptions) {
    this.options = options;
  }
}

interface BindMountOptions {
  target?: string;
  source?: string;
  from?: string | Stage;
  rw?: boolean;
}

export class BindMount implements Mount {
  type = "bind";
  public options: BindMountOptions;

  constructor(options: BindMountOptions) {
    this.options = options;
  }
}

interface TmpfsRunMountOptions {
  target: string;
  size?: number;
}

export class TmpfsRunMount implements Mount {
  type = "tmpfs";
  public options: TmpfsRunMountOptions;

  constructor(options: TmpfsRunMountOptions) {
    this.options = options;
  }
}

interface SecretRunMountOptions {
  id?: string;
  target?: string;
  required: boolean;
  mode?: number;
  uid?: number;
  gid?: number;
}

export class SecretRunMount implements Mount {
  type = "secret";
  public options: SecretRunMountOptions;

  constructor(options: SecretRunMountOptions) {
    this.options = { ...{ required: false }, ...options };
  }
}

interface SSHRunMountOptions {
  id?: string;
  required?: boolean;
  target?: string;
  mode?: number;
  uid?: string;
  gid?: string;
}

export class SSHRunMount implements Mount {
  type = "ssh";
  public options: SSHRunMountOptions;

  constructor(options: SSHRunMountOptions) {
    this.options = { ...{ required: false }, ...options };
  }
}

export type RunMount =
  | BindMount
  | CacheRunMount
  | TmpfsRunMount
  | SecretRunMount
  | SSHRunMount;

export class Stage {
  protected base: Command;
  protected commands: Command[];

  protected constructor(base: Command) {
    this.base = base;
    this.commands = [];
  }

  run(command: string | string[], opts?: Mount[]): this {
    this.commands.push({
      type: "run",
      args: {
        command,
        mounts: opts,
      },
    });
    return this;
  }

  shell(command: string[]): this {
    this.commands.push({ type: "shell", args: command });
    return this;
  }

  env(key: string, value: string): this {
    this.commands.push({ type: "env", args: { key, value } });
    return this;
  }

  copy(opts: CopyOptions): this {
    this.commands.push({ type: "copy", args: opts });
    return this;
  }

  merge(stages: Stage[]): this {
    this.commands.push({ type: "merge", args: stages });
    return this;
  }

  entrypoint(command: string[]): this {
    this.commands.push({ type: "entrypoint", args: command });
    return this;
  }

  cmd(command: string[]): this {
    this.commands.push({ type: "cmd", args: command });
    return this;
  }

  label(key: string, value: string): this {
    this.commands.push({ type: "label", args: { key, value } });
    return this;
  }

  volume(dir: string): this {
    this.commands.push({ type: "volume", args: dir });
    return this;
  }

  /**
   * Sets the working directory for any `cmd`, `run`, `entrypoint` and `copy` instructions
   * that follow it. If the workdir doesn't exist it will be created.
   *
   * If a relative path is provided, it will be relative to the path of the previous working directory.
   *
   * @param dir The new working directory
   * @returns The stage with the new working directory as defautl
   */
  workdir(dir: string): this {
    this.commands.push({ type: "workdir", args: dir });
    return this;
  }

  chdir(dir: string): this {
    this.commands.push({ type: "chdir", args: dir });
    return this;
  }

  user(user: string): this {
    this.commands.push({ type: "user", args: user });
    return this;
  }

  build(): any {
    return {
      base: JSON.parse(JSON.stringify(this.base)),
      commands: JSON.parse(JSON.stringify(this.commands)),
    };
  }
}

export class Scratch extends Stage {
  constructor() {
    super({ type: "scratch", args: null });
  }
}

export class Image extends Stage {
  constructor(image: string, platform?: string) {
    super({ type: "image", args: { image, platform } });
  }
}

declare global {
  interface SolveResponse {
    readFile: (file: string) => string;
  }

  const solve: (s: Stage) => SolveResponse;

  type deafultBuildArgs =
    | "BUILDPLATFORM"
    | "BUILDOS"
    | "BUILDARCH"
    | "BUILDVARIANT"
    | "TARGETPLATFORM"
    | "TARGETOS"
    | "TARGETARCH"
    | "TARGETVARIANT";
  function buildArg(key: string, defaultValue?: string): string;
  function buildArg(key: deafultBuildArgs, defaultValue?: string): string;
}
