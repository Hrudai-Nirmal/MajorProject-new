/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Default views are prebuilt; bookmarked selections use the same catalog.
    const selections = [["library", "source"], ["compare", "us"], ["compare", "india"]];
    return {
      beforeFiles: selections.map(([route, key]) => ({
        source: "/" + route, has: [{type: "query", key}], destination: "/" + route + "/selection",
      })), afterFiles: [], fallback: [],
    };
  },
};

module.exports = nextConfig;
