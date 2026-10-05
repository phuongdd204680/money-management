import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lỗi giao diện bị bắt bởi ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card text-center py-12 my-6 mx-auto" style={{ maxWidth: 600 }}>
          <div className="flex-center justify-center mb-3">
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: 12, borderRadius: '50%' }}>
              <AlertTriangle size={36} color="var(--danger)" />
            </div>
          </div>
          <h3 className="text-lg font-bold mb-2">Đã xảy ra sự cố khi hiển thị mục này</h3>
          <p className="text-muted text-xs mb-4">
            {this.state.error?.message || 'Có lỗi phát sinh trong cây render.'}
          </p>
          <div className="flex-center justify-center gap-2">
            <button className="btn btn-secondary btn-sm" onClick={this.handleReset}>
              <Home size={15} />
              <span>Về màn hình chính</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={this.handleReload}>
              <RefreshCw size={15} />
              <span>Tải lại trang</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
