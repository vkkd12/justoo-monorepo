/** @type {import('next').NextConfig} */
const nextConfig = {
    // Set workspace root to silence monorepo warning
    turbo: {
        root: '../../..'
    }
};

export default nextConfig;
