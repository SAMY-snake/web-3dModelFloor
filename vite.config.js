import { createVuePlugin } from "vite-plugin-vue2";
import libCss from "vite-plugin-libcss";
import { resolve } from "path";

export default {
  plugins: [createVuePlugin(), libCss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 8081,
    open: true,
    proxy: {
      // '/api': {
      //   target: 'http://jsonplaceholder.typicode.com',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '')
      // },
    },
  },
  build: {
    minify: "esbuild",
    // outDir: "lib",
    copyPublicDir: true,
    lib: {
      entry: resolve(__dirname, "./src/packages/index.js"),
      name: "jxudp-tree3d",
      fileName: (format) => `jxudp-tree3d.${format}.js`,
      // formats: ["es"],
    },
  },
};
