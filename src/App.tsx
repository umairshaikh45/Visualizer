import { useState } from 'react';
import { Layout, Typography, Tabs, Empty, Alert } from 'antd';
import { RepoForm } from './components/RepoForm';
import { DependencyGraph } from './components/DependencyGraph';
import { FileList } from './components/FileList';
import type { DependencyGraph as DependencyGraphData } from './types/index';
import './styles/layout.css';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function App() {
  const [graphData, setGraphData] = useState<DependencyGraphData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = (data: DependencyGraphData) => {
    setGraphData(data);
    setError(null);
  };

  const handleError = (error: string) => {
    setError(error);
    setGraphData(null);
  };

  const items = [
    {
      key: 'graph',
      label: 'Dependency Graph',
      children: graphData ? (
        <DependencyGraph data={graphData} />
      ) : (
        <Empty 
          description={
            <>
              <Typography.Text>
                Enter a GitHub repository URL above to visualize its dependency graph
              </Typography.Text>
            </>
          }
        />
      )
    },
    {
      key: 'files',
      label: 'File List',
      children: graphData ? (
        <FileList data={graphData} />
      ) : (
        <Empty description="No files to display" />
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header style={{ 
        padding: '0 32px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
        height: 'auto',
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          minHeight: '80px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="brand-icon" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              transform: 'scale(1)',
              transition: 'transform 0.2s ease'
            }}>
              <span style={{ 
                fontSize: '24px', 
                color: 'white',
                fontWeight: 'bold'
              }}>🔗</span>
            </div>
            <div>
              <Title level={2} className="app-title" style={{ 
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '800',
                letterSpacing: '-1px',
                fontSize: '32px'
              }}>
                CodeGraph
              </Title>
              <div style={{ 
                fontSize: '14px',
                color: '#64748b',
                fontWeight: '600',
                marginTop: '-4px',
                letterSpacing: '0.5px'
              }}>
                Repository Dependency Visualizer
              </div>
            </div>
          </div>
        </div>
        <div className="app-header-content">
          <RepoForm onAnalyze={handleAnalyze} onError={handleError} />
        </div>
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            style={{ 
              marginBottom: 16,
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 16px rgba(255, 77, 79, 0.2)'
            }}
            onClose={() => setError(null)}
          />
        )}
      </Header>
      <Content style={{ 
        padding: 32,
        background: '#f8fafc',
        flex: 1
      }}>
        <Tabs
          items={items}
          defaultActiveKey="graph"
          style={{
            padding: 0,
            backgroundColor: 'transparent',
            borderRadius: 16,
            height: '100%'
          }}
          tabBarStyle={{ 
            paddingLeft: 32,
            paddingRight: 32,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            marginBottom: 0,
            borderRadius: '16px 16px 0 0',
            border: 'none',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
          }}
        />
      </Content>
    </Layout>
  );
}
