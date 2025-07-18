/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "export", // correct key is 'output'
  images: {
    unoptimized: true, // required for static export if using next/image
  },
};

module.exports = nextConfig;
