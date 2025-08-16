import { useMemo, useState } from 'react';
import { 
  List, 
  Card, 
  Badge, 
  Typography, 
  Input, 
  Select, 
  Row, 
  Col, 
  Tag, 
  Progress, 
  Statistic,
  Tooltip,
  Button
} from 'antd';
import { 
  SearchOutlined, 
  FileOutlined, 
  FolderOutlined, 
  CodeOutlined,
  LinkOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons';
import type { DependencyGraph } from '../services/repoAnalyzer';
import '../styles/fileList.css';

const { Text } = Typography;
const { Search } = Input;

interface FileListProps {
  data: DependencyGraph;
}

interface FileStats {
  totalFiles: number;
  totalConnections: number;
  averageConnections: number;
  extensionStats: { [key: string]: number };
  directoryStats: { [key: string]: number };
}

export function FileList({ data }: FileListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'connections' | 'size' | 'importance'>('importance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedExtension, setSelectedExtension] = useState<string>('all');
  const [selectedDirectory, setSelectedDirectory] = useState<string>('all');

  // Calculate file statistics
  const stats: FileStats = useMemo(() => {
    const extensionStats: { [key: string]: number } = {};
    const directoryStats: { [key: string]: number } = {};
    let totalConnections = 0;

    data.nodes.forEach(node => {
      const ext = node.type || 'other';
      const dir = node.directory || 'root';
      
      extensionStats[ext] = (extensionStats[ext] || 0) + 1;
      directoryStats[dir] = (directoryStats[dir] || 0) + 1;
      
      const nodeConnections = data.edges.filter(e => 
        e.source === node.id || e.target === node.id
      ).length;
      totalConnections += nodeConnections;
    });

    return {
      totalFiles: data.nodes.length,
      totalConnections: data.edges.length,
      averageConnections: totalConnections / data.nodes.length,
      extensionStats,
      directoryStats
    };
  }, [data]);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = data.nodes.filter(node => {
      const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           node.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesExtension = selectedExtension === 'all' || node.type === selectedExtension;
      const matchesDirectory = selectedDirectory === 'all' || node.directory === selectedDirectory;
      
      return matchesSearch && matchesExtension && matchesDirectory;
    });

    // Add connection count to each node for sorting
    const filesWithConnections = filtered.map(node => ({
      ...node,
      connectionCount: data.edges.filter(e => e.source === node.id || e.target === node.id).length
    }));

    // Sort files
    filesWithConnections.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.label.localeCompare(b.label);
          break;
        case 'connections':
          comparison = a.connectionCount - b.connectionCount;
          break;
        case 'size':
          comparison = (a.lines || 0) - (b.lines || 0);
          break;
        case 'importance':
          comparison = (a.importance || 0) - (b.importance || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filesWithConnections;
  }, [data, searchTerm, sortBy, sortOrder, selectedExtension, selectedDirectory]);

  // Get file type color
  const getFileTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'js': '#f7df1e', 'ts': '#3178c6', 'tsx': '#61dafb', 'jsx': '#61dafb',
      'go': '#00add8', 'py': '#3776ab', 'java': '#ed8b00', 'json': '#fcdc00',
      'css': '#1572b6', 'scss': '#cf649a', 'html': '#e34c26', 'md': '#083fa1',
      'other': '#888'
    };
    return colors[type] || colors.other;
  };

  // Get importance level
  const getImportanceLevel = (importance: number): { level: string; color: string } => {
    if (importance >= 10) return { level: 'Critical', color: '#f5222d' };
    if (importance >= 8) return { level: 'High', color: '#fa8c16' };
    if (importance >= 6) return { level: 'Medium', color: '#fadb14' };
    if (importance >= 4) return { level: 'Low', color: '#52c41a' };
    return { level: 'Minimal', color: '#d9d9d9' };
  };

  return (
    <div className="file-list-responsive" style={{ 
      padding: '24px', 
      height: 'calc(100vh - 200px)', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Statistics */}
      <Card className="file-stats-card" style={{ marginBottom: '16px' }}>
        <Row gutter={16} className="file-stats-row">
          <Col span={6}>
            <Statistic 
              title="Total Files" 
              value={stats.totalFiles} 
              prefix={<FileOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Total Dependencies" 
              value={stats.totalConnections} 
              prefix={<LinkOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Avg Connections" 
              value={stats.averageConnections} 
              precision={1}
              prefix={<CodeOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="File Types" 
              value={Object.keys(stats.extensionStats).length} 
              prefix={<FolderOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Filters and Search */}
      <Card className="search-filters" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Search
              placeholder="Search files..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              value={selectedExtension}
              onChange={setSelectedExtension}
              style={{ width: '100%' }}
              placeholder="File type"
            >
              <Select.Option value="all">All Types</Select.Option>
              {Object.keys(stats.extensionStats).map(ext => (
                <Select.Option key={ext} value={ext}>
                  .{ext} ({stats.extensionStats[ext]})
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              value={selectedDirectory}
              onChange={setSelectedDirectory}
              style={{ width: '100%' }}
              placeholder="Directory"
            >
              <Select.Option value="all">All Directories</Select.Option>
              {Object.keys(stats.directoryStats).map(dir => (
                <Select.Option key={dir} value={dir}>
                  {dir} ({stats.directoryStats[dir]})
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
            >
              <Select.Option value="importance">Importance</Select.Option>
              <Select.Option value="connections">Connections</Select.Option>
              <Select.Option value="size">File Size</Select.Option>
              <Select.Option value="name">Name</Select.Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button
              icon={sortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{ width: '100%' }}
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* File List */}
      <Card 
        title={`Files (${filteredAndSortedFiles.length} shown)`}
        style={{ flex: 1, overflow: 'hidden' }}
        bodyStyle={{ padding: 0, height: '100%' }}
      >
        <List
          style={{ height: '100%', overflow: 'auto' }}
          dataSource={filteredAndSortedFiles}
          renderItem={(file) => {
            const importance = getImportanceLevel(file.importance || 0);
            const connectionCount = file.connectionCount;
            
            return (
              <List.Item
                className="file-list-item"
                style={{ 
                  padding: '12px 24px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer'
                }}
              >
                <List.Item.Meta
                  avatar={
                    <div className="file-type-badge" style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: getFileTypeColor(file.type || 'other'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}>
                      {(file.type || 'other').toUpperCase()}
                    </div>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text strong style={{ fontSize: '14px' }}>{file.label}</Text>
                      <Tag color={importance.color}>
                        {importance.level}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                        {file.id}
                      </Text>
                      <div className="file-meta-info" style={{ marginTop: '4px' }}>
                        <Badge 
                          count={connectionCount} 
                          className="connection-badge"
                          style={{ backgroundColor: '#52c41a' }}
                        >
                          <Text type="secondary" style={{ fontSize: '11px' }}>Dependencies</Text>
                        </Badge>
                        {file.lines && (
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            📄 {file.lines} lines
                          </Text>
                        )}
                        <span className="directory-tag">
                          📁 {file.directory || 'root'}
                        </span>
                      </div>
                    </div>
                  }
                />
                <div style={{ textAlign: 'right' }}>
                  <Tooltip title={`Importance Score: ${(file.importance || 0).toFixed(1)}`}>
                    <Progress
                      className="importance-progress"
                      type="circle"
                      width={50}
                      percent={Math.min(100, ((file.importance || 0) / 15) * 100)}
                      strokeColor={importance.color}
                      format={() => (file.importance || 0).toFixed(1)}
                    />
                  </Tooltip>
                </div>
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}
