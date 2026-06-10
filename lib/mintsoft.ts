import axios, {
	type AxiosError,
	type InternalAxiosRequestConfig,
} from "axios";

const BASE_URL = process.env.MINTSOFT_BASE_URL?.replace(/\/$/, "") ?? "";

const USER_AGENT = "StitchesAfrica-Mintsoft/1.0";

let cachedCredentialKey: string | null = null;

function parseAuthResponseKey(data: unknown): string {
	if (typeof data === "string") {
		return data.trim();
	}
	if (data && typeof data === "object") {
		const record = data as Record<string, unknown>;
		for (const field of ["APIKey", "ApiKey", "apiKey", "key", "Token"]) {
			const value = record[field];
			if (typeof value === "string" && value.trim()) {
				return value.trim();
			}
		}
	}
	return "";
}

/** POST /api/Auth — Mintsoft's current auth flow (replaces deprecated Basic + URL apikey). */
export async function fetchMintsoftApiKeyFromCredentials(): Promise<string> {
	const username = process.env.MINTSOFT_USERNAME?.trim();
	const password = process.env.MINTSOFT_PASSWORD?.trim();
	if (!username || !password) {
		throw new Error(
			"MINTSOFT_USERNAME and MINTSOFT_PASSWORD are required to obtain an API key.",
		);
	}
	if (!BASE_URL) {
		throw new Error("MINTSOFT_BASE_URL is not set.");
	}

	const { data } = await axios.post(
		`${BASE_URL}/api/Auth`,
		{ Username: username, Password: password },
		{
			headers: {
				"Content-Type": "application/json",
				"User-Agent": USER_AGENT,
			},
		},
	);

	const key = parseAuthResponseKey(data);
	if (!key) {
		throw new Error("Mintsoft /api/Auth did not return an API key.");
	}
	cachedCredentialKey = key;
	return key;
}

/**
 * API key for Mintsoft requests: `MINTSOFT_API_KEY` if set, else cached/fresh key from /api/Auth.
 * Pass `forceRefresh` after a 401 to obtain a new key from credentials.
 */
export async function getMintsoftApiKey(forceRefresh = false): Promise<string> {
	if (forceRefresh) {
		return fetchMintsoftApiKeyFromCredentials();
	}
	const envKey = process.env.MINTSOFT_API_KEY?.trim();
	if (envKey) {
		return envKey;
	}
	if (cachedCredentialKey) {
		return cachedCredentialKey;
	}
	return fetchMintsoftApiKeyFromCredentials();
}

export const mintsoftClient = axios.create({
	baseURL: BASE_URL,
	headers: {
		"Content-Type": "application/json",
		"User-Agent": USER_AGENT,
	},
});

mintsoftClient.interceptors.request.use(async (config) => {
	const key = await getMintsoftApiKey();
	config.headers.set("ms-apikey", key);
	return config;
});

mintsoftClient.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const config = error.config as
			| (InternalAxiosRequestConfig & { _mintsoftAuthRetried?: boolean })
			| undefined;

		if (
			error.response?.status === 401 &&
			config &&
			!config._mintsoftAuthRetried
		) {
			config._mintsoftAuthRetried = true;
			try {
				const key = await getMintsoftApiKey(true);
				config.headers.set("ms-apikey", key);
				return mintsoftClient.request(config);
			} catch (refreshErr) {
				console.error("[Mintsoft] API key refresh failed:", refreshErr);
			}
		}
		throw error;
	},
);
