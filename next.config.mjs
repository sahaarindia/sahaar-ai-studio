/** @type {import('next').NextConfig} */
const nextConfig = {
  
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.output.webassemblyModuleFilename =
      isServer ? '../static/wasm/[modulehash].wasm' : 'static/wasm/[modulehash].wasm';

    config.externals = config.externals || [];
    config.externals.push({
      'sharp': 'commonjs sharp',
      'canvas': 'commonjs canvas',
    });

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
