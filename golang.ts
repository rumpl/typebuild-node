import { BindMount, CacheRunMount, Image, Scratch } from "./index.ts";

class Golang extends Image {
  constructor(image: string, platform?: string) {
    super(image, platform);
  }

  build(binary: string): Image {
    const builder = this.run("apk add git")
      .workdir("/app")
      .env("CGO_ENABLED", "0")
      .run("go build -o /binary", [
        new BindMount({ target: "." }),
        new CacheRunMount({
          target: "/root/.cache",
        }),
        new CacheRunMount({
          target: "/go/pkg/mod",
        }),
      ]);

    return new Scratch()
      .copy({
        from: builder,
        source: "/binary",
        destination: binary,
      })
      .entrypoint([binary]);
  }
}

export default Golang;
