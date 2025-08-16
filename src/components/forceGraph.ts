import * as d3 from 'd3';

export interface Node {
  id: string;
  label: string;
  type?: string;
  x?: number;
  y?: number;
  group?: string;
  importance?: number;
  lines?: number;
}

export interface Link {
  source: string;
  target: string;
  value?: number;
}


function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) return ext;
  if (['css', 'scss', 'sass'].includes(ext)) return 'css';
  if (['json'].includes(ext)) return 'json';
  if (['md', 'txt', 'readme'].includes(ext)) return 'md';
  return ext || 'other';
}


function calculateImportance(node: Node, links: Link[]): number {
  const connections = links.filter(l => l.source === node.id || l.target === node.id).length;
  const ext = getFileExtension(node.label);
  
  
  const typeImportance: { [key: string]: number } = {
    'package': 10, 'json': 8, 'js': 7, 'ts': 7, 'tsx': 7, 'jsx': 7,
    'md': 6, 'html': 6, 'css': 5, 'scss': 5, 'py': 7, 'java': 7,
    'go': 7, 'rs': 7, 'cpp': 7, 'c': 7, 'h': 6
  };
  
  const baseImportance = typeImportance[ext] || 3;
  return baseImportance + Math.min(connections * 0.5, 5);
}


function groupFilesByDirectory(nodes: Node[]): { [key: string]: Node[] } {
  const groups: { [key: string]: Node[] } = {};
  
  nodes.forEach(node => {
    const pathParts = node.id.split('/');
    let groupKey = 'root';
    
    if (pathParts.length > 1) {
      groupKey = pathParts[0];
      if (groupKey === 'src') {
        groupKey = pathParts.length > 2 ? `src/${pathParts[1]}` : 'src';
      } else if (['node_modules', '.git', 'dist', 'build'].includes(groupKey)) {
        groupKey = 'system';
      }
    }
    
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(node);
    node.group = groupKey;
  });
  
  return groups;
}

export function createForceGraph(
  svg: SVGSVGElement,
  nodes: Node[],
  links: Link[],
  width: number = 1200,
  height: number = 800,
  searchTerm: string = ""
) {
  
  d3.select(svg).selectAll("*").remove();

  console.log(`Initial nodes: ${nodes.length}, links: ${links.length}`);

  
  const MAX_NODES = 300; // Conservative limit for browser performance
  const MIN_IMPORTANCE = 1; // Filter threshold
  
  
  const processedNodes = nodes
    .map(node => ({
      ...node,
      importance: node.importance || calculateImportance(node, links)
    }))
    .filter(node => {
      // Filter system files and low-importance files
      const isSystemFile = node.label.startsWith('.') || 
                          node.label.includes('node_modules') ||
                          node.label.includes('.git') ||
                          node.label.endsWith('.min.js') ||
                          node.label.endsWith('.map') ||
                          node.label.includes('coverage') ||
                          node.label.includes('dist/') ||
                          node.label.includes('build/') ||
                          node.label.includes('temp/');
      return !isSystemFile && (node.importance || 0) >= MIN_IMPORTANCE;
    })
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .slice(0, MAX_NODES);

  console.log(`Filtered to ${processedNodes.length} high-importance nodes`);

  
  const searchedNodes = new Set<string>();
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    processedNodes.forEach(node => {
      if (node.label.toLowerCase().includes(searchLower) || 
          node.id.toLowerCase().includes(searchLower)) {
        searchedNodes.add(node.id);
      }
    });
    console.log(`Search found ${searchedNodes.size} matches`);
  }

  // Group nodes by directory
  const groups = groupFilesByDirectory(processedNodes);

  // PERFORMANCE OPTIMIZATION: Filter links efficiently and ensure proper connections
  const nodeIds = new Set(processedNodes.map(n => n.id));
  const filteredLinks = links.filter(link => {
    const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
    const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
    return nodeIds.has(sourceId) && nodeIds.has(targetId);
  }).map(link => ({
    ...link,
    source: typeof link.source === 'string' ? link.source : (link.source as any).id,
    target: typeof link.target === 'string' ? link.target : (link.target as any).id
  }));

  console.log(`Using ${filteredLinks.length} links between filtered nodes`);
  
  // Ensure we have meaningful connections - if too few, relax filtering
  if (filteredLinks.length < processedNodes.length * 0.1) {
    console.warn('Very few connections detected, checking link data...');
    console.log('Sample links:', filteredLinks.slice(0, 5));
    console.log('Sample nodes:', processedNodes.slice(0, 5).map(n => n.id));
  }

  
  const svgElement = d3.select(svg);
  const g = svgElement.append("g");

  
  let zoomTimeout: NodeJS.Timeout;
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 5])
    .on("zoom", (event) => {
      clearTimeout(zoomTimeout);
      zoomTimeout = setTimeout(() => {
        g.attr("transform", event.transform);
      }, 16); // 60fps throttling
    });

  svgElement.call(zoom);

  // Color scales
  const fileTypeColorScale = d3.scaleOrdinal()
    .domain(['js', 'ts', 'tsx', 'jsx', 'json', 'css', 'scss', 'html', 'md', 'py', 'java', 'go', 'other'])
    .range(['#f7df1e', '#3178c6', '#61dafb', '#61dafb', '#fcdc00', '#1572b6', '#cf649a', '#e34c26', '#083fa1', '#3776ab', '#ed8b00', '#00add8', '#888']);

  
  const simulation = d3.forceSimulation(processedNodes as any)
    .force("link", d3.forceLink(filteredLinks)
      .id((d: any) => d.id)
      .distance(80) 
      .strength(0.6) 
    )
    .force("charge", d3.forceManyBody()
      .strength(-250) 
      .distanceMax(300) 
    )
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide()
      .radius(d => {
        const importance = (d as any).importance || 1;
        return Math.max(12, 8 + importance * 1.5); 
      })
      .strength(0.8) 
    )
    .alphaDecay(0.05) 
    .velocityDecay(0.6); 


  const link = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(filteredLinks)
    .join("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.8) 
    .attr("stroke-width", d => {
     
      const value = d.value || 1;
      return Math.max(1, Math.min(3, value));
    })
    .style("pointer-events", "none"); 

  console.log(`Rendered ${filteredLinks.length} visible links`);


  const node = g.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(processedNodes)
    .join("g")
    .style("cursor", "pointer");


  node.append("circle")
    .attr("r", d => {
      const importance = d.importance || 1;
      const baseSize = Math.max(6, 4 + importance * 1.2);
      return searchedNodes.has(d.id) ? baseSize + 3 : baseSize;
    })
    .attr("fill", d => {
      if (searchedNodes.has(d.id)) {
        return "#ff6b35"; 
      }
      const ext = getFileExtension(d.label);
      return fileTypeColorScale(ext) as string;
    })
    .attr("stroke", d => searchedNodes.has(d.id) ? "#ff6b35" : "#fff")
    .attr("stroke-width", d => searchedNodes.has(d.id) ? 3 : 1.5)
    .style("filter", d => searchedNodes.has(d.id) ? "drop-shadow(0 0 8px #ff6b35)" : "none");

 
  node.append("text")
    .text(d => d.label.length > 15 ? d.label.substring(0, 12) + "..." : d.label)
    .attr("x", 0)
    .attr("y", d => {
      const importance = d.importance || 1;
      const baseSize = Math.max(6, 4 + importance * 1.2);
      const searchBonus = searchedNodes.has(d.id) ? 3 : 0;
      return baseSize + searchBonus + 12;
    })
    .attr("text-anchor", "middle")
    .style("font-size", "9px")
    .style("font-family", "Arial, sans-serif")
    .style("fill", d => searchedNodes.has(d.id) ? "#ff6b35" : "#333")
    .style("font-weight", d => searchedNodes.has(d.id) ? "bold" : "normal")
    .style("pointer-events", "none");


  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("z-index", "1000");


  let hoverTimeout: NodeJS.Timeout;
  
  node
    .on("mouseover", function(event, d) {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        const connections = filteredLinks.filter(link => {
          const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
          const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
          return sourceId === d.id || targetId === d.id;
        }).length;

        tooltip.style("visibility", "visible")
          .html(`
            <strong>${d.label}</strong><br/>
            Path: ${d.id}<br/>
            Type: ${d.type || 'unknown'}<br/>
            Importance: ${(d.importance || 0).toFixed(1)}<br/>
            Connections: ${connections}
          `);
      }, 100); // 100ms delay
    })
    .on("mousemove", function(event) {
      tooltip
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function() {
      clearTimeout(hoverTimeout);
      tooltip.style("visibility", "hidden");
    })
    .on("click", function(event, d) {
      event.stopPropagation();
      
    
      const connectedNodeIds = new Set<string>();
      filteredLinks.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
        
        if (sourceId === d.id) connectedNodeIds.add(targetId);
        if (targetId === d.id) connectedNodeIds.add(sourceId);
      });

    
      node.select("circle")
        .attr("stroke", nodeD => {
          if (nodeD.id === d.id) return "#ff6b35";
          if (connectedNodeIds.has(nodeD.id)) return "#4CAF50";
          return searchedNodes.has(nodeD.id) ? "#ff6b35" : "#fff";
        })
        .attr("stroke-width", nodeD => {
          if (nodeD.id === d.id || connectedNodeIds.has(nodeD.id)) return 3;
          return searchedNodes.has(nodeD.id) ? 3 : 1.5;
        });

  
      link
        .attr("stroke", linkD => {
          const sourceId = typeof linkD.source === 'string' ? linkD.source : (linkD.source as any).id;
          const targetId = typeof linkD.target === 'string' ? linkD.target : (linkD.target as any).id;
          
          if (sourceId === d.id || targetId === d.id) return "#ff6b35";
          return "#999";
        })
        .attr("stroke-width", linkD => {
          const sourceId = typeof linkD.source === 'string' ? linkD.source : (linkD.source as any).id;
          const targetId = typeof linkD.target === 'string' ? linkD.target : (linkD.target as any).id;
          
          if (sourceId === d.id || targetId === d.id) return 3;
          return 1;
        });
    });

  // Drag behavior
  const drag = d3.drag<SVGGElement, Node>()
    .on("start", function(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      (d as any).fx = (d as any).x;
      (d as any).fy = (d as any).y;
    })
    .on("drag", function(event, d) {
      (d as any).fx = event.x;
      (d as any).fy = event.y;
    })
    .on("end", function(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      (d as any).fx = null;
      (d as any).fy = null;
    });

  node.call(drag as any);

 
  let tickCount = 0;
  simulation.on("tick", () => {
    tickCount++;
   
    const updateFrequency = tickCount < 100 ? 1 : 2;
    
    if (tickCount % updateFrequency === 0) {
    
      link
        .attr("x1", (d: any) => {
          const source = typeof d.source === 'object' ? d.source : processedNodes.find(n => n.id === d.source);
          return source ? (source as any).x : 0;
        })
        .attr("y1", (d: any) => {
          const source = typeof d.source === 'object' ? d.source : processedNodes.find(n => n.id === d.source);
          return source ? (source as any).y : 0;
        })
        .attr("x2", (d: any) => {
          const target = typeof d.target === 'object' ? d.target : processedNodes.find(n => n.id === d.target);
          return target ? (target as any).x : 0;
        })
        .attr("y2", (d: any) => {
          const target = typeof d.target === 'object' ? d.target : processedNodes.find(n => n.id === d.target);
          return target ? (target as any).y : 0;
        });

      node.attr("transform", (d: any) => `translate(${d.x || 0},${d.y || 0})`);
    }
    
  
    if (tickCount % 50 === 0) {
      console.log(`Simulation tick ${tickCount}, alpha: ${simulation.alpha().toFixed(3)}`);
    }
  });


  function resetVisualization() {
    if (searchTerm.trim()) return;
    
    node.select("circle")
      .attr("stroke", d => searchedNodes.has(d.id) ? "#ff6b35" : "#fff")
      .attr("stroke-width", d => searchedNodes.has(d.id) ? 3 : 1.5);

    link
      .attr("stroke", "#999")
      .attr("stroke-width", 1);
  }


  svgElement.on("click", function(event) {
    if (event.target === svg) {
      resetVisualization();
    }
  });

  console.log(`Optimized graph rendered: ${processedNodes.length} nodes, ${filteredLinks.length} links`);
  
  return simulation;
}
