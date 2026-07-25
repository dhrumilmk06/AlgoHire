import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        // Ideally, we might want to reload the page or reset specific state,
        // but clearing the error state allows a re-mount attempt if the parent causes a re-render
        // or if the user navigates away (though navigation is outside this boundary usually).
        // For a cleaner reset, we can reload the window:
        // window.location.reload(); 
        // But let's try just resetting state first for a softer recovery.
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 border border-red-500/30 rounded-lg p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            Visualization Error
                        </h2>
                        <p className="text-gray-300 mb-4 text-sm">
                            Something went wrong while rendering the 3D scene.
                        </p>
                        {this.state.error && (
                            <div className="bg-black/50 rounded p-3 mb-4 overflow-auto max-h-32 text-xs font-mono text-red-300 border border-red-900/20">
                                {this.state.error.toString()}
                            </div>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors"
                        >
                            Reset Visualization
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
