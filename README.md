# 🔗 CodeGraph - Repository Dependency Visualizer

A modern, interactive visualization tool that analyzes and displays file dependencies in GitHub repositories. This powerful application helps developers understand project structure and file relationships through beautiful, intuitive graphs and comprehensive insights.

## Motivation 
- Just wanted to work on opensources projects and this helps me identify file assocition easily.

## ✨ Features

- **🔍 Smart Repository Analysis**
  - Input any GitHub repository URL
  - Automatic repository cloning and analysis
  - Support for 15+ programming languages
  - Intelligent dependency detection and mapping
  - Advanced file importance scoring

- **🎨 Interactive Visualization**
  - Force-directed graph layout using D3.js
  - Smooth zoom and pan capabilities
  - Rich node hover information with tooltips
  - File relationship highlighting and filtering
  - Real-time graph updates and animations
  - Professional color-coded file types

- **📊 Comprehensive File Management**
  - Advanced search and filtering capabilities
  - Sort by importance, connections, or file size
  - Directory-based organization
  - File statistics and metrics
  - Interactive file list with detailed metadata

- **💻 Language Support**
  - JavaScript/TypeScript (ES6 imports, require)
  - Python (import, from...import)
  - Java (import statements)
  - JSON configuration files
  - CSS/SCSS stylesheets
  - And more!

## 🛠️ Technology Stack

- **React.js** with TypeScript for type safety and component architecture
- **D3.js** for interactive graph visualization and force simulations
- **Ant Design** for modern UI components and design system
- **Vite** for fast development and optimized builds
- **Node.js** for repository cloning and file analysis
- **simple-git** for Git repository management

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

## 🚀 Getting Started

1. **Clone the Repository**
   ```bash
   git clone <your-repo-url>
   cd Visualizer
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:5173

## 🎯 Usage Guide

1. **Accessing the Application**
   - Open your browser and navigate to `http://localhost:5173`
   - You'll see the main interface with an input field for the repository URL

2. **Analyzing a Repository**
   - Enter a valid GitHub repository URL (e.g., `https://github.com/username/repository`)
   - Click the "Generate Graph" button
   - Wait for the analysis to complete (time varies based on repository size)

3. **Interacting with the Graph**
   - **Zoom**: Use mouse wheel to zoom in/out
   - **Pan**: Click and drag to move around the graph
   - **View Details**: Hover over nodes to see file information
   - **Select Node**: Click on a node to highlight its direct dependencies

## 🏗️ Project Structure

```
Visualizer/
├── src/
│   ├── components/         # React components
│   │   ├── DependencyGraph.tsx    # Main graph visualization component
│   │   ├── FileList.tsx           # File list and statistics component
│   │   ├── RepoForm.tsx           # Repository URL input form
│   │   └── forceGraph.ts          # D3.js force graph implementation
│   ├── services/
│   │   └── repoAnalyzer.ts        # Repository analysis and cloning logic
│   ├── styles/            # CSS stylesheets
│   │   ├── graph.css              # Graph visualization styles
│   │   ├── layout.css             # Application layout styles
│   │   ├── fileList.css           # File list component styles
│   │   └── modern-search.css      # Search interface styles
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.tsx          # React DOM rendering
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── tsconfig.node.json     # Node.js TypeScript configuration
├── vite.config.ts         # Vite build configuration
└── README.md
```

## ⚙️ Configuration

### Development Configuration
- **Development server**: Port 5173 (configurable via Vite)
- **TypeScript configuration**: `tsconfig.json` and `tsconfig.node.json`
- **Build configuration**: `vite.config.ts`
- **Hot module replacement**: Enabled for fast development

## 🔧 Development

### Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm run preview`: Preview production build


## 🐛 Known Issues and Limitations

- Large repositories may take longer to analyze
- Some complex import patterns might not be detected
- Binary files are excluded from analysis
- Repository must be public or have proper access configured

## 🔜 Future Enhancements

- [ ] Support for more programming languages
- [ ] Improved dependency detection algorithms
- [ ] File type filtering options
- [ ] Export functionality (PNG, JSON)
- [ ] Repository caching for faster repeated analysis
- [ ] Dark/Light theme support
- [ ] Customizable graph layouts
- [ ] Detailed file statistics

## Maintainer

Module is maintained by [Umair Shaikh](https://github.com/umairshaikh45/).

## License: Apache 2.0

Apache 2 Licensed. See [LICENSE](https://github.com/umairshaikh45/Visualizer/LICENSE) for full details.

## 👥 Authors

- Umair - Initial work

## gitAcknowledgments

- D3.js community for the visualization library
- Open source community for various dependencies
