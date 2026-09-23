import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('project_planner_tasks');
      localStorage.removeItem('project_planner_resources');
      localStorage.removeItem('project_planner_project');
      localStorage.removeItem('project_planner_language');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Clear storage error:', e);
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-white">
                ພົບຂໍ້ຜິດພາດໃນການໂຫຼດໜ້າຕ່າງ
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                An unexpected error occurred while loading the application.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950/60 rounded-lg text-left border border-slate-700/50">
                <p className="text-[11px] font-mono text-rose-300 break-words line-clamp-3">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ໂຫຼດຄືນໃໝ່ (Reload)</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ຣີເຊັດຂໍ້ມູນ & ເຂົ້າໃໝ່</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
