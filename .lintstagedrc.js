module.exports = {
  // Type check TypeScript files
  "**/*.(ts|tsx)": () => "npx tsc --noEmit",

  // Lint & Prettify TS and JS files
  "**/*.(ts|tsx|js)": filenames => [
    `npx eslint --fix ${filenames.map(f => `"${f}"`).join(" ")}`,
    `npx prettier --write ${filenames.map(f => `"${f}"`).join(" ")}`,
  ],

  // Prettify only Markdown and JSON files
  "**/*.(md|json)": filenames =>
    `npx prettier --write ${filenames.map(f => `"${f}"`).join(" ")}`,
};
