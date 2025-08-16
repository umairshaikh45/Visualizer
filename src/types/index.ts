export interface DependencyNode {
  id: string;
  label: string;
  size?: number;
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

export interface AnalyzeResponse {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  error?: string;
}
