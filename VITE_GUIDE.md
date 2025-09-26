# ⚡ Vite Development Guide - WatchParty

**Complete guide to Vite development, configuration, and optimization for the WatchParty platform.**

> **💡 What is Vite?** Vite is a modern, ultra-fast build tool and development server that provides instant hot module replacement (HMR) and optimized builds for production. It's the backbone of our frontend development experience.

## 🚀 Vite Features in WatchParty

### ⚡ Core Features
- **Ultra-fast HMR** - Instant hot module replacement during development
- **Fast builds** - Optimized for development speed
- **Code splitting** - Automatic chunk optimization for better performance
- **TypeScript support** - Full TypeScript integration with type checking
- **Proxy configuration** - API and WebSocket proxying for development
- **CSS processing** - Tailwind CSS integration with PostCSS
- **Mobile development** - Optimized for mobile-first development

### 🎯 Development Experience
- **Instant feedback** - Changes reflect immediately in browser
- **Fast startup** - Development server starts in seconds
- **Optimized builds** - Production builds are highly optimized
- **Source maps** - Full debugging support with source maps
- **Type checking** - Real-time TypeScript error checking

## 📁 Vite Configuration

### Configuration File: `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          socket: ['socket.io-client'],
          ui: ['lucide-react', 'framer-motion'],
        },
      },
    },
  },
});
```

### Configuration Breakdown

#### 🔧 Plugins
- **React Plugin** - Enables React support with JSX transformation
- **TypeScript** - Built-in TypeScript support
- **PostCSS** - CSS processing with Tailwind CSS

#### 🎯 Path Aliases
- **`@/`** - Points to `frontend/src/` directory
- **`@shared/`** - Points to `shared/src/` directory
- **Benefits** - Cleaner imports and better IDE support

#### 🌐 Development Server
- **Port 3000** - Frontend development server
- **Host: true** - Accessible from network
- **API Proxy** - `/api` requests → backend (localhost:8080)
- **WebSocket Proxy** - `/socket.io` requests → backend

#### 📦 Build Configuration
- **Output Directory** - `dist/` for production builds
- **Source Maps** - Full source map support for debugging
- **Code Splitting** - Automatic chunk optimization
- **Manual Chunks** - Optimized vendor library splitting

## 🛠️ Development Commands

### Available Scripts

```bash
# Development server with HMR
npm run dev          # Starts Vite dev server on http://localhost:3000

# Production build
npm run build        # Builds optimized production bundle

# Preview production build
npm run preview      # Serves production build locally

# Type checking
npm run type-check   # Runs TypeScript type checking

# Linting
npm run lint         # Runs ESLint for code quality
```

### Development Workflow

#### 1. Start Development Server
```bash
# Navigate to frontend directory
cd frontend

# Start Vite dev server
npm run dev

# Server will start on http://localhost:3000
# Hot reload is enabled automatically
```

#### 2. Development Features
- **Hot Module Replacement** - Changes reflect instantly
- **TypeScript checking** - Real-time type error checking
- **ESLint integration** - Code quality checking
- **Proxy configuration** - API calls automatically proxied to backend

#### 3. Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Build output will be in dist/ directory
```

## 🔧 Vite Configuration Details

### Server Configuration

```typescript
server: {
  port: 3000,           // Development server port
  host: true,           // Accessible from network
  proxy: {
    '/api': {           // API requests
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
    '/socket.io': {     // WebSocket requests
      target: 'http://localhost:8080',
      changeOrigin: true,
      ws: true,         // WebSocket support
    },
  },
}
```

### Build Configuration

```typescript
build: {
  outDir: 'dist',       // Output directory
  sourcemap: true,      // Source maps for debugging
  rollupOptions: {
    output: {
      manualChunks: {  // Code splitting strategy
        vendor: ['react', 'react-dom'],
        router: ['react-router-dom'],
        socket: ['socket.io-client'],
        ui: ['lucide-react', 'framer-motion'],
      },
    },
  },
}
```

### Path Aliases

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@shared': path.resolve(__dirname, '../shared/src'),
  },
}
```

**Usage in code:**
```typescript
// Instead of: import { Button } from '../../../components/ui/Button'
import { Button } from '@/components/ui/Button'

// Instead of: import { User } from '../../shared/src/types/User'
import { User } from '@shared/types/User'
```

## 🚀 Performance Optimization

### Development Performance

#### Hot Module Replacement (HMR)
- **Instant updates** - Changes reflect immediately
- **State preservation** - React state is preserved during updates
- **Fast rebuilds** - Only changed modules are rebuilt
- **CSS updates** - Styles update without page refresh

#### Build Performance
- **Fast startup** - Development server starts in seconds
- **Optimized dependencies** - Only necessary dependencies are loaded
- **Tree shaking** - Unused code is automatically removed
- **Code splitting** - Automatic chunk optimization

### Production Performance

#### Bundle Optimization
- **Code splitting** - Automatic chunk optimization
- **Tree shaking** - Remove unused code
- **Minification** - Optimized bundle size
- **Asset optimization** - Image and CSS optimization

#### Chunk Strategy
```typescript
manualChunks: {
  vendor: ['react', 'react-dom'],           // React core
  router: ['react-router-dom'],              // Routing
  socket: ['socket.io-client'],             // Real-time communication
  ui: ['lucide-react', 'framer-motion'],   // UI components
}
```

## 🔍 Troubleshooting

### Common Issues & Solutions

#### Issue 1: Vite dev server not starting
```bash
# Check if port 3000 is available
sudo netstat -tulpn | grep :3000

# Kill process using port 3000
sudo fuser -k 3000/tcp

# Restart Vite dev server
npm run dev
```

#### Issue 2: Vite build failing
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Build with verbose output
npm run build -- --verbose
```

#### Issue 3: HMR not working
```bash
# Check Vite configuration
cat frontend/vite.config.ts

# Restart dev server
npm run dev

# Check browser console for errors
```

#### Issue 4: Proxy not working
```bash
# Check if backend is running on port 8080
curl http://localhost:8080/health

# Check Vite proxy configuration
grep -A 10 "proxy" frontend/vite.config.ts
```

#### Issue 5: TypeScript errors
```bash
# Check TypeScript configuration
cat frontend/tsconfig.json

# Run type checking
npm run type-check

# Check for missing types
npm install @types/package-name
```

### Debugging Tips

#### 1. Check Vite Configuration
```bash
# View current configuration
cat frontend/vite.config.ts

# Check for syntax errors
npx vite --config frontend/vite.config.ts
```

#### 2. Check Dependencies
```bash
# Check installed packages
npm list

# Check for version conflicts
npm audit

# Update dependencies
npm update
```

#### 3. Check Build Output
```bash
# Build with verbose output
npm run build -- --verbose

# Check build output
ls -la frontend/dist/

# Check bundle size
npx vite-bundle-analyzer frontend/dist/
```

## 📊 Performance Monitoring

### Bundle Analysis

```bash
# Install bundle analyzer
npm install -g vite-bundle-analyzer

# Analyze bundle
npx vite-bundle-analyzer frontend/dist/

# Check bundle size
du -sh frontend/dist/
```

### Development Metrics

```bash
# Check development server performance
npm run dev -- --debug

# Monitor file changes
npm run dev -- --watch

# Check build performance
npm run build -- --profile
```

## 🎯 Best Practices

### Development Best Practices

1. **Use path aliases** - Cleaner imports with `@/` and `@shared/`
2. **Enable HMR** - Keep development server running
3. **Use TypeScript** - Leverage type checking for better code quality
4. **Optimize imports** - Use tree shaking for smaller bundles
5. **Monitor performance** - Use bundle analyzer for optimization

### Production Best Practices

1. **Code splitting** - Automatic chunk optimization
2. **Tree shaking** - Remove unused code
3. **Asset optimization** - Optimize images and CSS
4. **Source maps** - Enable for debugging in production
5. **Bundle analysis** - Regular bundle size monitoring

## 🔧 Advanced Configuration

### Custom Vite Plugins

```typescript
// Example: Custom plugin for asset optimization
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    // Custom plugin for asset optimization
    {
      name: 'asset-optimizer',
      generateBundle(options, bundle) {
        // Custom asset optimization logic
      },
    },
  ],
});
```

### Environment Variables

```typescript
// Access environment variables in Vite
const config = defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});
```

### Custom Build Options

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
```

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [Vite Configuration Reference](https://vitejs.dev/config/)
- [Vite Plugins](https://vitejs.dev/plugins/)
- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [Vite Troubleshooting](https://vitejs.dev/guide/troubleshooting.html)

---

**Vite is the backbone of our development experience, providing ultra-fast builds and instant hot module replacement for the best developer experience possible! ⚡**
