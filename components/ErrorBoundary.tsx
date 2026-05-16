'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex items-center justify-center p-10">
            <div className="text-center">
              <p className="text-gray-500 mb-4">Sahifani yuklashda xato yuz berdi.</p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
              >
                Qayta urinish
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
