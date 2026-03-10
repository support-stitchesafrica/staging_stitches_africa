"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	resetError = () => {
		this.setState({ hasError: false, error: undefined });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				const FallbackComponent = this.props.fallback;
				return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
			}

			return (
				<div className="min-h-screen bg-white flex items-center justify-center">
					<div className="text-center p-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
						<p className="text-gray-600 mb-6">
							{this.state.error?.message || "An unexpected error occurred"}
						</p>
						<div className="space-x-4">
							<Button onClick={this.resetError}>Try again</Button>
							<Button variant="outline" onClick={() => window.location.reload()}>
								Reload page
							</Button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;