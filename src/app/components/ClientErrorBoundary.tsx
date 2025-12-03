"use client";

import React from "react";

type State = { hasError: boolean; error?: Error };

export default class ClientErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log error details to the console so we can inspect the stack trace
    // Replace this with a remote logging endpoint if desired
    // eslint-disable-next-line no-console
    console.error("ClientErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-[450px] p-4 bg-red-50 text-red-800 rounded-lg shadow">
          <strong>Something went wrong loading the offer banner.</strong>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
