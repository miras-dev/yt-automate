// Font files imported from packages are bundled by Remotion's webpack config and import as a URL.
declare module '*.woff2' {
  const url: string;
  export default url;
}
