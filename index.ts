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
  uid?: string;
  gid?: string;
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
  target: string;
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

export type RunMount = BindMount | CacheRunMount | TmpfsRunMount;

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

  label(key: string, value: string): this {
    this.commands.push({ type: "label", args: { key, value } });
    return this;
  }

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
  constructor(image: string) {
    super({ type: "image", args: image });
  }
}

/**
 * Helper class to create a Ubuntu stage
 */
export class Ubuntu extends Image {
  private aptUpdate = false;

  /**
   *
   * @param name The name of the stage
   * @param tag The tag to use for this stage
   */
  constructor(tag = "latest") {
    super(`ubuntu:${tag}`);
  }

  /**
   * Install one or more packages
   *
   * Note: if a package should be installed this automatically runs `apt update --fix-missing` for you
   *
   * @param packages packages to install
   * @returns
   */
  install(...packages: string[]): this {
    if (!this.aptUpdate) {
      this.run("apt update --fix-missing");
      this.aptUpdate = true;
    }
    this.run(`apt install -y ${packages.join(" ")}`);

    return this;
  }
}

declare global {
  interface SolveResponse {
    readFile: (file: string) => string;
  }

  const solve: (s: Stage) => SolveResponse;
  const buildArg: (key: string) => string;
}
