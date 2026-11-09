import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // the dashboard reads ../data and ../shorts straight from the repository
  turbopack: {root: here},
  devIndicators: false,
  agentRules: false,
};

export default nextConfig;
