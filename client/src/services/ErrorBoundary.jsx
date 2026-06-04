import React from 'react';

/**
 * Catches uncaught render errors so a single broken container does not
 * blank out the whole app. Renders a friendly fallback.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // eslint-disable-next-line no-console
        console.error('ErrorBoundary caught an error:', error, info);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="container py-5">
                    <div className="alert alert-danger">
                        <h4 className="alert-heading">Something went wrong.</h4>
                        <p>{this.state.error?.message || 'Unexpected error'}</p>
                        <button className="btn btn-primary" onClick={this.handleReload}>
                            Try again
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
