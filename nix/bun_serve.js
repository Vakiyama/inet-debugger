#!@bun@/bin/bun

const PORT = 8080;

const serve = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;

    if (path === "/") {
      path = "/index.html";
    }

    try {
      const filePath = `./static${path}`;
      const file = Bun.file(filePath);
      const exists = await file.exists();
      
      if (!exists) {
        return new Response(Bun.file("./static/index.html"));
      }
      
      return new Response(file);
    } catch (e) {
      return new Response(Bun.file("./static/index.html"));
    }
  }
});

console.log(`Server running at http://localhost:${serve.port}`);
