import React, { useEffect, useRef, useState } from 'react';
import { Spin, Alert, Button, Space, Typography, Input } from 'antd';
import { SearchOutlined, ClearOutlined, ZoomInOutlined, ZoomOutOutlined, ReloadOutlined, AimOutlined } from '@ant-design/icons';
import * as d3 from 'd3';
import type { DependencyGraph as GraphData } from '../services/repoAnalyzer';
import { createForceGraph } from './forceGraph';
import '../styles/graph.css';
import '../styles/modern-search.css';

const { Text } = Typography;

interface DependencyGraphProps {
  data: GraphData;
}

export function DependencyGraph({ data }: DependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [graphInstance, setGraphInstance] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const createVisualization = async () => {
    if (!svgRef.current || !data.nodes.length) {
      console.log('Missing required elements:', { 
        hasSvgRef: !!svgRef.current, 
        nodesLength: data.nodes.length 
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Initializing graph with:', { 
        nodes: data.nodes.length, 
        edges: data.edges.length,
        containerSize: containerRef.current ? {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        } : 'No container'
      });

    
      const containerWidth = containerRef.current?.clientWidth || 1200;
      const containerHeight = Math.max(containerRef.current?.clientHeight || 800, 600);

    
      if (graphInstance?.cleanup) {
        graphInstance.cleanup();
      }

    
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      svg.attr('width', containerWidth).attr('height', containerHeight);

   
      const loading = svg.append('g')
        .attr('class', 'loading-indicator');
      
      loading.append('rect')
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .attr('fill', 'rgba(255, 255, 255, 0.9)');
      
      loading.append('text')
        .attr('x', containerWidth / 2)
        .attr('y', containerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('font-family', 'system-ui, -apple-system, sans-serif')
        .attr('fill', '#1890ff')
        .text('Building dependency graph...');

    
      setTimeout(async () => {
        try {
          console.log('Creating visualization...');
          setIsLoading(true);
          setError(null);

          if (!containerRef.current || !svgRef.current) {
            console.error('Missing required DOM elements');
            return;
          }

      
          d3.select(svgRef.current).selectAll('*').remove();

          const containerRect = containerRef.current.getBoundingClientRect();
          const width = containerRect.width || 1200;
          const height = containerRect.height || 800;

          console.log(`Container dimensions: ${width}x${height}`);

        
          const simulationInstance = createForceGraph(
            svgRef.current,
            data.nodes,
            data.edges,
            width,
            height,
            searchTerm
          );

  
          const svgElement = d3.select(svgRef.current);
          const zoom = d3.zoom()
            .scaleExtent([0.1, 5])
            .on("zoom", (event) => {
              svgElement.select("g").attr("transform", event.transform);
            });

          svgElement.call(zoom as any);

      
          setGraphInstance({ 
            simulation: simulationInstance,
            zoom: zoom,
            svg: svgElement
          });
          setNodeCount(data.nodes.length);
          setIsLoading(false);

          console.log('Visualization created successfully');
        } catch (error) {
          console.error('Error creating graph:', error);
          setError(`Failed to create visualization: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      }, 300);    } catch (error) {
      console.error('Error in createVisualization:', error);
      setError(`Visualization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    createVisualization();

  
    return () => {
      if (graphInstance?.cleanup) {
        graphInstance.cleanup();
      }
    };
  }, [data, searchTerm]);


  useEffect(() => {
    const handleResize = () => {
      if (data.nodes.length > 0) {
        setTimeout(createVisualization, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);

  const handleRestart = () => {
    console.log('Restarting simulation...');
    if (graphInstance?.simulation) {
      graphInstance.simulation.alpha(0.3).restart();
      console.log('Simulation restarted');
    } else {
      console.warn('No simulation instance available');
    }
  };

  const handleReset = () => {
    console.log('Resetting visualization...');
    createVisualization();
  };

  const handleZoomIn = () => {
    if (graphInstance?.zoom && graphInstance?.svg) {
      graphInstance.svg.transition().duration(300).call(
        graphInstance.zoom.scaleBy, 1.5
      );
    }
  };

  const handleZoomOut = () => {
    if (graphInstance?.zoom && graphInstance?.svg) {
      graphInstance.svg.transition().duration(300).call(
        graphInstance.zoom.scaleBy, 0.67
      );
    }
  };

  const handleZoomFit = () => {
    if (graphInstance?.zoom && graphInstance?.svg && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const transform = d3.zoomIdentity.translate(containerRect.width / 2, containerRect.height / 2).scale(0.8);
      graphInstance.svg.transition().duration(500).call(
        graphInstance.zoom.transform, transform
      );
    }
  };

  if (error) {
    return React.createElement('div', { style: { padding: '24px' } },
      React.createElement(Alert, {
        message: "Visualization Error",
        description: error,
        type: "error",
        showIcon: true,
        action: React.createElement(Button, {
          size: "small",
          onClick: handleReset,
          children: "Retry"
        })
      })
    );
  }

  return React.createElement('div', {
    className: 'dependency-graph-container graph-card',
    style: { 
      width: '100%', 
      height: 'calc(100vh - 200px)',
      position: 'relative',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(102, 126, 234, 0.15), 0 4px 15px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(102, 126, 234, 0.1)'
    }
  }, [
   
    React.createElement('div', {
      key: 'header',
      className: 'dependency-graph-header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 36px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderBottom: 'none',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)',
        backdropFilter: 'blur(10px)'
      }
    }, [
      React.createElement(Space, { key: 'left', size: 20 }, [
        React.createElement(Text, { 
          key: 'title', 
          strong: true, 
          style: { 
            fontSize: '20px', 
            color: 'white', 
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            fontWeight: 600
          } 
        }, 'Dependency Graph'),
        nodeCount > 0 && React.createElement(Text, { 
          key: 'stats', 
          style: { 
            fontSize: '14px', 
            color: 'rgba(255,255,255,0.85)',
            background: 'rgba(255,255,255,0.1)',
            padding: '4px 12px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)'
          }
        }, `${nodeCount} files • ${data.edges.length} dependencies`)
      ]),
      
      React.createElement(Space, { key: 'center', size: 16 }, [
        React.createElement(Input, {
          key: 'search',
          placeholder: "Search nodes...",
          prefix: React.createElement(SearchOutlined, { style: { color: '#667eea' } }),
          suffix: searchTerm ? React.createElement(ClearOutlined, { 
            onClick: () => {
              console.log('Clearing search term');
              setSearchTerm('');
            },
            style: { cursor: 'pointer', color: '#999' }
          }) : null,
          value: searchTerm,
          onChange: (e: any) => {
            const newSearchTerm = e.target.value;
            console.log('Search term changed to:', newSearchTerm);
            setSearchTerm(newSearchTerm);
          },
          style: { 
            width: 320,
            borderRadius: '12px',
            backgroundColor: '#fff',
            border: 'none',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          },
          size: 'large'
        })
      ]),
      
      React.createElement(Space, { key: 'right', size: 12 }, [
        React.createElement(Space.Compact, { key: 'zoom-controls' }, [
          React.createElement(Button, {
            key: 'zoom-in',
            type: "default",
            icon: React.createElement(ZoomInOutlined),
            onClick: handleZoomIn,
            disabled: isLoading,
            style: {
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white'
            },
            title: "Zoom In"
          }),
          React.createElement(Button, {
            key: 'zoom-out',
            type: "default",
            icon: React.createElement(ZoomOutOutlined),
            onClick: handleZoomOut,
            disabled: isLoading,
            style: {
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white'
            },
            title: "Zoom Out"
          }),
          React.createElement(Button, {
            key: 'zoom-fit',
            type: "default",
            icon: React.createElement(AimOutlined),
            onClick: handleZoomFit,
            disabled: isLoading,
            style: {
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white'
            },
            title: "Fit to Screen"
          })
        ]),
        React.createElement(Button, {
          key: 'restart',
          type: "default",
          icon: React.createElement(ReloadOutlined),
          onClick: handleRestart,
          disabled: isLoading,
          style: {
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderColor: 'rgba(255,255,255,0.3)',
            color: 'white'
          },
          children: "Restart"
        }),
        React.createElement(Button, {
          key: 'reset',
          type: "primary",
          onClick: handleReset,
          disabled: isLoading,
          style: {
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderColor: 'rgba(255,255,255,0.9)',
            color: '#667eea',
            fontWeight: 600
          },
          children: "Reset View"
        })
      ])
    ]),

    React.createElement('div', {
      key: 'container',
      ref: containerRef,
      style: { 
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        minHeight: '600px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '0 0 20px 20px'
      }
    }, [
      isLoading && React.createElement('div', {
        key: 'loading',
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(8px)',
          zIndex: 10
        }
      }, React.createElement(Spin, { 
        size: "large", 
        tip: React.createElement('div', {
          style: { 
            marginTop: '16px', 
            color: '#667eea', 
            fontSize: '16px',
            fontWeight: 500
          }
        }, "Loading dependency graph...") 
      })),
      
      !data.nodes.length && !isLoading ? React.createElement('div', {
        key: 'empty',
        style: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flexDirection: 'column',
          color: '#64748b',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }
      }, [
        React.createElement('div', {
          key: 'icon',
          style: {
            fontSize: '48px',
            marginBottom: '16px',
            opacity: 0.6
          }
        }, '📊'),
        React.createElement(Text, { 
          key: 'msg1',
          style: { 
            fontSize: '18px', 
            fontWeight: 500,
            color: '#475569'
          } 
        }, 'No repository data available'),
        React.createElement(Text, { 
          key: 'msg2',
          style: { 
            marginTop: '8px',
            fontSize: '14px',
            color: '#64748b'
          } 
        }, 'Please analyze a repository to view its dependency graph')
      ]) : React.createElement('svg', {
        key: 'svg',
        ref: svgRef,
        width: "100%",
        height: "100%",
        style: { 
          background: 'transparent',
          cursor: 'grab'
        },
        onMouseDown: (e: any) => {
          e.currentTarget.style.cursor = 'grabbing';
        },
        onMouseUp: (e: any) => {
          e.currentTarget.style.cursor = 'grab';
        },
        onMouseLeave: (e: any) => {
          e.currentTarget.style.cursor = 'grab';
        }
      })
    ]),

   
    !isLoading && data.nodes.length > 0 && React.createElement('div', {
      key: 'instructions',
      style: {
        padding: '20px 36px',
        background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(226, 232, 240, 0.95))',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        fontSize: '14px',
        color: '#334155',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, [
      React.createElement('div', {
        key: 'tips',
        style: { display: 'flex', alignItems: 'center', gap: '24px' }
      }, [
        React.createElement('span', {
          key: 'tip1',
          style: { 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#475569',
            fontWeight: '500'
          }
        }, ['🎯', ' Drag nodes']),
        React.createElement('span', {
          key: 'tip2',
          style: { 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#475569',
            fontWeight: '500'
          }
        }, ['🔍', ' Scroll to zoom']),
        React.createElement('span', {
          key: 'tip3',
          style: { 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#475569',
            fontWeight: '500'
          }
        }, ['✨', ' Click to highlight'])
      ]),
      searchTerm && React.createElement('div', {
        key: 'search-info',
        style: { 
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 107, 53, 0.1)',
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 107, 53, 0.2)'
        }
      }, [
        React.createElement('span', {
          key: 'search-icon',
          style: { fontSize: '16px' }
        }, '🔍'),
        React.createElement(Text, {
          key: 'search-text',
          style: { 
            color: '#334155',
            fontWeight: '600'
          }
        }, `"${searchTerm}"`),
        React.createElement('span', {
          key: 'search-count',
          style: {
            background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
          }
        }, `${data.nodes.filter(n => 
          n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.id.toLowerCase().includes(searchTerm.toLowerCase())
        ).length} matches`)
      ])
    ])
  ]);
}
