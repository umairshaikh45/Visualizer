import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App';
import 'antd/dist/reset.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f5f5f5',
          colorTextHeading: '#262626'
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
