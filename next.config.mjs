import path from "path";
import { fileURLToPath } from "url";
import withPWAInit from "next-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  reactCompiler: true,

  typescript: { ignoreBuildErrors: true },

  poweredByHeader: false,
  compress: true,

  images: {
    /** 🔥 FIXED — MUST BE TRUE */
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.appspot.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
    ],

    dangerouslyAllowSVG: true,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  serverExternalPackages: ["firebase-admin", "jsdom", "canvas", "google-auth-library"],

  experimental: {
    optimizePackageImports: [
      "firebase/app", 
      "firebase/auth", 
      "firebase/firestore",
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "recharts"
    ],
    optimizeCss: true,
    // Enable partial prerendering for better performance
    ppr: false, // Set to true when stable
  },

  turbopack: {
    resolveAlias: {
      "@": path.resolve(__dirname, "./"),
    },
  },

  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,

  transpilePackages: [
    "firebase",
    "@firebase/app",
    "@firebase/auth",
    "@firebase/firestore",
  ],

  webpack: (config, { dev }) => {
    // Performance optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            firebase: {
              test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
              name: 'firebase',
              chunks: 'all',
              priority: 10,
            },
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }

    // Add fallbacks for node modules that might cause issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      canvas: false, // Needed for npm canvas package
      jsdom: false, // Needed for jsdom package
      http: false,
      https: false,
      zlib: false,
      stream: false,
      util: false,
      url: false,
      assert: false,
      dns: false,
    };

    // Handle modules that might cause build issues
    config.module.rules.push({
      test: /\.m?js/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};

export default withPWA(nextConfig);