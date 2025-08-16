import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App';
import 'antd/dist/reset.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f0f2f5'
        }
      }}
    >
      <App />
    </ConfigProvider>
  );
}
