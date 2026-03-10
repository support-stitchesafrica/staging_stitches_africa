"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { BlogAuthService } from "@/lib/blog-admin/auth-service";
import type {
	BlogUser,
	CreateBlogUser,
	BlogAuthContextType,
	BlogPermission,
} from "@/types/blog-admin";

const BlogAuthContext = createContext<BlogAuthContextType | undefined>(
	undefined
);

export const useBlogAuth = (): BlogAuthContextType => {
	const context = useContext(BlogAuthContext);
	if (!context) {
		throw new Error("useBlogAuth must be used within a BlogAuthProvider");
	}
	return context;
};

export const BlogAuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<BlogUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Set up auth state listener
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(
			auth,
			async (firebaseUser: User | null) => {
				try {
					setError(null);

					if (firebaseUser) {
						// Get blog user data
						const blogUser = await BlogAuthService.getBlogUser(
							firebaseUser.uid
						);
						setUser(blogUser);
					} else {
						setUser(null);
					}
				} catch (err) {
					console.error("Auth state change error:", err);
					setError("Failed to load user data");
					setUser(null);
				} finally {
					setLoading(false);
				}
			}
		);

		return () => unsubscribe();
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		setError(null);
		setLoading(true);

		try {
			const result = await BlogAuthService.login(email, password);

			if (result.success && result.user) {
				setUser(result.user);
				return { success: true };
			} else {
				setError(result.message || "Login failed");
				return { success: false, message: result.message };
			}
		} catch (err: any) {
			const message = err.message || "Login failed";
			setError(message);
			return { success: false, message };
		} finally {
			setLoading(false);
		}
	}, []);

	const register = useCallback(async (userData: CreateBlogUser) => {
		setError(null);
		setLoading(true);

		try {
			const result = await BlogAuthService.register(userData);

			if (result.success && result.user) {
				setUser(result.user);
				return { success: true };
			} else {
				setError(result.message || "Registration failed");
				return { success: false, message: result.message };
			}
		} catch (err: any) {
			const message = err.message || "Registration failed";
			setError(message);
			return { success: false, message };
		} finally {
			setLoading(false);
		}
	}, []);

	const logout = useCallback(async () => {
		setError(null);

		try {
			await BlogAuthService.logout();
			setUser(null);
		} catch (err: any) {
			console.error("Logout error:", err);
			setError("Logout failed");
		}
	}, []);

	const hasPermission = useCallback(
		(permission: BlogPermission): boolean => {
			if (!user) return false;
			return BlogAuthService.hasPermission(user.role, permission);
		},
		[user]
	);

	const canCreatePost = useCallback((): boolean => {
		if (!user) return false;
		return BlogAuthService.canCreatePost(user.role);
	}, [user]);

	const canEditPost = useCallback(
		(postAuthorId: string): boolean => {
			if (!user) return false;
			return BlogAuthService.canEditPost(user.role, postAuthorId, user.uid);
		},
		[user]
	);

	const canDeletePost = useCallback(
		(postAuthorId: string): boolean => {
			if (!user) return false;
			return BlogAuthService.canDeletePost(user.role, postAuthorId, user.uid);
		},
		[user]
	);

	const refreshUser = useCallback(async () => {
		if (!auth.currentUser) return;

		try {
			const blogUser = await BlogAuthService.getBlogUser(auth.currentUser.uid);
			setUser(blogUser);
		} catch (err) {
			console.error("Error refreshing user:", err);
		}
	}, []);

	const contextValue: BlogAuthContextType = {
		user,
		loading,
		error,
		login,
		register,
		logout,
		hasPermission,
		canCreatePost,
		canEditPost,
		canDeletePost,
		refreshUser,
	};

	return (
		<BlogAuthContext.Provider value={contextValue}>
			{children}
		</BlogAuthContext.Provider>
	);
};
