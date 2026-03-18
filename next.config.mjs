/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com'],
    },
    async rewrites() {
        return [
            {
                source: '/api-proxy/:path*',
                destination: `${process.env.BACKEND_URL}:path*`,
            },
        ];
    },
};

export default nextConfig;
