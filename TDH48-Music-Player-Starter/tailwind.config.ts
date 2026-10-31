import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { plum: '#21152e', orchid: '#d9a8f5', lilac: '#f1e5fb' } } }, plugins: [] };
export default config;
