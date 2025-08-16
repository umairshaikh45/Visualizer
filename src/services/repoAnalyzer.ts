import { simpleGit } from 'simple-git';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface DependencyNode {
  id: string;
  label: string;
  type?: string;
  size?: number;
  importance?: number;
  directory?: string;
  lines?: number;
}

export interface DependencyEdge {
  source: string;
  target: string;
  value?: number;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}


const IMPORT_PATTERNS = [
  /import\s+.*?from\s+['"]([^'"]+)['"]/g, // ES6 imports
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // CommonJS require
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // Dynamic imports
  /from\s+['"]([^'"]+)['"]/g, // Python-style imports
  /import\s+(['"]([^'"]+)['"])/g, // Go imports
  /import\s+([^;]+);/g, // Java imports
  /#include\s*["<]([^">]+)[">]/g, // C/C++ includes
  /using\s+([^;]+);/g, // C# using statements
  /load\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // Script loading
  /@import\s*['"]([^'"]+)['"]/g // CSS imports
];

function extractImports(content: string): string[] {
  const imports = new Set<string>();
  
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0; 
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let importPath = match[1] || match[2]; 
      if (importPath && !importPath.includes('node_modules') && !importPath.startsWith('http')) {
        importPath = importPath.replace(/['"]/g, '').trim();
        if (importPath) {
          imports.add(importPath);
        }
      }
    }
  }
  
  return Array.from(imports);
}


async function fastResolveImport(
  sourceFile: string,
  importPath: string,
  tempDir: string,
  fileMap: Map<string, string>,
  filesByDirectory: Map<string, Set<string>>
): Promise<string | null> {
  const sourceDir = path.dirname(sourceFile);
  const resolvedPath = path.resolve(sourceDir, importPath);
  const relativePath = path.relative(tempDir, resolvedPath);
  
  
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.go', '.py', '.java', '.php', '.rb', '.cs', '.cpp', '.h'];
  
  
  for (const ext of extensions) {
    const pathWithExt = relativePath + ext;
    const normalizedPath = pathWithExt.toLowerCase().replace(/\\/g, '/');
    if (fileMap.has(normalizedPath)) {
      return fileMap.get(normalizedPath)!;
    }
  }
  
  
  const targetDir = path.dirname(relativePath);
  const dirFiles = filesByDirectory.get(targetDir);
  if (dirFiles) {
    for (const ext of extensions) {
      const indexFile = path.join(targetDir, `index${ext}`);
      if (dirFiles.has(indexFile)) {
        return indexFile;
      }
    }
  }
  
  
  const basename = path.basename(importPath);
  for (const ext of extensions) {
    const filename = basename + ext;
    const normalizedFilename = filename.toLowerCase();
    
    
    const mapKeys = Array.from(fileMap.keys());
    for (const mapPath of mapKeys) {
      if (path.basename(mapPath) === normalizedFilename) {
        return fileMap.get(mapPath)!;
      }
    }
  }
  
  return null;
}

export async function analyzeRepository(repoUrl: string): Promise<DependencyGraph> {

  const cleanUrl = repoUrl.trim();
  if (!cleanUrl.match(/^https:\/\/github\.com\/[^/]+\/[^/]+/)) {
    throw new Error('Invalid GitHub repository URL');
  }

  
  const tempDir = path.join(os.tmpdir(), `repo-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    // Clone repository
    const git = simpleGit();
    await git.clone(cleanUrl, tempDir, ['--depth', '1']);

    // Get all relevant files and build file lookup maps
    const files = await getAllFiles(tempDir);
    console.log(`Found ${files.length} relevant files`);

    // Build efficient lookup maps - O(n) preprocessing
    const fileMap = new Map<string, string>(); // normalized path -> actual file path
    const filesByBasename = new Map<string, string[]>(); // basename -> file paths
    const filesByDirectory = new Map<string, Set<string>>(); // directory -> file paths

    files.forEach(file => {
      const relativePath = path.relative(tempDir, file);
      const normalizedPath = relativePath.toLowerCase().replace(/\\/g, '/');
      const basename = path.basename(file);
      const directory = path.dirname(relativePath);

      fileMap.set(normalizedPath, relativePath);
      
      
      if (!filesByBasename.has(basename)) {
        filesByBasename.set(basename, []);
      }
      filesByBasename.get(basename)!.push(relativePath);

      
      if (!filesByDirectory.has(directory)) {
        filesByDirectory.set(directory, new Set());
      }
      filesByDirectory.get(directory)!.add(relativePath);
    });

    console.log(`Built file lookup maps with ${fileMap.size} entries`);
    const fileContents = new Map<string, string>();
    const nodes: DependencyNode[] = await Promise.all(files.map(async file => {
      const relativePath = path.relative(tempDir, file);
      const content = await fs.readFile(file, 'utf-8').catch(() => '');
      fileContents.set(relativePath, content); // Cache for dependency analysis
      
      const lines = content.split('\n').length;
      const directory = path.dirname(relativePath);
      
      return {
        id: relativePath,
        label: path.basename(file),
        type: path.extname(file).slice(1) || 'other',
        size: Math.max(1, Math.floor(lines / 10)),
        lines,
        directory: directory === '.' ? 'root' : directory,
        importance: 1 // Will be calculated later based on connections
      };
    }));

    console.log(`Generated ${nodes.length} dependency nodes`);
    const edges: DependencyEdge[] = [];
    const connectionCounts = new Map<string, number>();

    console.log('Starting dependency extraction...');
    const batchSize = Math.min(100, Math.max(10, Math.floor(files.length / 10)));
    console.log(`Processing dependencies in batches of ${batchSize}...`);
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(files.length/batchSize)}`);
      
      await Promise.all(batch.map(async file => {
        const relativePath = path.relative(tempDir, file);
        const content = fileContents.get(relativePath) || '';
        
    
        const importMatches = extractImports(content);
        
        for (const importPath of importMatches) {
          if (importPath.startsWith('.') || importPath.startsWith('/')) {
          
            const resolvedTarget = await fastResolveImport(
              file, 
              importPath, 
              tempDir, 
              fileMap, 
              filesByDirectory
            );
            
            if (resolvedTarget && resolvedTarget !== relativePath) { 
              edges.push({
                source: relativePath,
                target: resolvedTarget,
                value: 1
              });
              
              
              connectionCounts.set(relativePath, (connectionCounts.get(relativePath) || 0) + 1);
              connectionCounts.set(resolvedTarget, (connectionCounts.get(resolvedTarget) || 0) + 1);
            }
          }
        }
      }));
    }

    
    console.log(`Generated ${edges.length} dependency edges from ${files.length} files`);
    
    
    if (edges.length > 0) {
      console.log('Sample edges:', edges.slice(0, 5));
    } else {
      console.warn('No edges found! Checking import detection...');
      
      for (let i = 0; i < Math.min(3, files.length); i++) {
        const file = files[i];
        const relativePath = path.relative(tempDir, file);
        const content = fileContents.get(relativePath) || '';
        const imports = extractImports(content);
        console.log(`File ${relativePath}: ${imports.length} imports found:`, imports.slice(0, 3));
      }
    }

    
    nodes.forEach(node => {
      const connections = connectionCounts.get(node.id) || 0;
      const typeImportance = getFileTypeImportance(node.type || 'other');
      node.importance = typeImportance + connections * 0.5;
    });

    console.log(`Generated ${edges.length} dependency edges from ${files.length} files`);
    return { nodes, edges };
  } finally {
    
    await fs.rm(tempDir, { recursive: true, force: true }).catch(console.error);
  }
}

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const skipDirs = new Set(['.git', 'node_modules', '.next', 'dist', 'build', '.vscode', '.idea', 'coverage']);
  const relevantExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.go', '.py', '.java', '.php', '.rb', '.cs', '.cpp', '.h', '.hpp', '.json', '.md', '.css', '.scss', '.html']);
  
  async function traverse(currentDir: string) {
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      return; 
    }
    
    
    const batchSize = 50;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (entry) => {
        if (entry.name.startsWith('.') && entry.name !== '.env') {
          return; 
        }
        
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          if (!skipDirs.has(entry.name)) {
            await traverse(fullPath);
          }
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (relevantExtensions.has(ext)) {
            files.push(fullPath);
          }
        }
      }));
    }
  }
  
  await traverse(dir);
  return files;
}

function isRelevantFile(filename: string): boolean {
  return /\.(ts|tsx|js|jsx|go|py|java|php|rb|cs|cpp|h|hpp|json|md|css|scss|html)$/i.test(filename);
}

function getFileTypeImportance(type: string): number {
  const importanceMap: { [key: string]: number } = {
    'json': 8, // Config files are important
    'js': 7, 'ts': 7, 'tsx': 7, 'jsx': 7, // Core application files
    'go': 7, 'py': 7, 'java': 7, 'cpp': 7, 'c': 7, 'rs': 7,
    'md': 6, 'html': 6, // Documentation and views
    'css': 5, 'scss': 5, // Styling
    'h': 6, 'hpp': 6, // Headers
    'php': 6, 'rb': 6, 'cs': 6,
    'other': 3
  };
  
  return importanceMap[type] || 3;
}
