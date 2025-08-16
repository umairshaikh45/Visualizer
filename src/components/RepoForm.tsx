import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import type { DependencyGraph } from '../types/index';

interface RepoFormProps {
  onAnalyze: (data: DependencyGraph) => void;
  onError?: (error: string) => void;
}

export function RepoForm({ onAnalyze, onError }: RepoFormProps) {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async ({ repoUrl }: { repoUrl: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending request to analyze repository:', repoUrl);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze repository');
      }

      if (!data.nodes || !data.edges) {
        throw new Error('Invalid response from server');
      }

      if (data.nodes.length === 0) {
        throw new Error('No relevant files found in the repository');
      }

      console.log('Analysis complete:', {
        nodes: data.nodes.length,
        edges: data.edges.length
      });
      
      onAnalyze(data);
      form.resetFields();
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? `Error: ${err.message}. Please check the repository URL and try again.`
        : 'An unexpected error occurred';
      
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      layout="horizontal"
      className="repo-form"
      style={{ width: '100%' }}
    >
      <div className="repo-form-container" style={{ 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'flex-start',
        flexWrap: 'wrap'
      }}>
        <Form.Item
          name="repoUrl"
          className="repo-form-input"
          style={{ 
            flex: 1, 
            minWidth: '300px',
            marginBottom: '8px'
          }}
          rules={[
            { required: true, message: 'Please enter a GitHub repository URL' },
            { 
              pattern: /^https:\/\/github\.com\/[^/]+\/[^/]+/,
              message: 'Please enter a valid GitHub repository URL'
            }
          ]}
          validateTrigger="onBlur"
        >
          <Input
            prefix={<GithubOutlined />}
            placeholder="https://github.com/username/repository"
            size="large"
            disabled={isLoading}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: '8px' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            size="large"
            icon={<GithubOutlined />}
          >
            Analyze Repository
          </Button>
        </Form.Item>
      </div>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: '8px' }}
          closable
          onClose={() => setError(null)}
        />
      )}
    </Form>
  );
}
