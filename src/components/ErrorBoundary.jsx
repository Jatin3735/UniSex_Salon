import { Component } from "react";

/**
 * Stops a single bad render from white-screening the whole app.
 *
 * React has no hook equivalent for componentDidCatch, so this stays a class.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info?.componentStack);
  }

  handleReload = () => {
    window.location.assign("/");
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6">
        <div className="w-full max-w-lg rounded-2xl border border-ivory/10 bg-ink-800 p-8 text-center shadow-sm shadow-black/40">
          <div className="mb-4 text-5xl" aria-hidden="true">
            &#128148;
          </div>

          <h1 className="text-xl font-bold text-ivory">This page hit an error</h1>
          <p className="mt-2 text-sm text-ash">
            Sorry about that. Going back to the home page usually clears it.
          </p>

          <pre className="mt-5 max-h-40 overflow-auto rounded-lg bg-ink p-4 text-left text-xs text-ivory-dim">
            {String(error?.message ?? error)}
          </pre>

          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 rounded-lg bg-champagne px-6 py-3 text-sm font-semibold text-ink transition hover:bg-champagne-soft"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }
}
