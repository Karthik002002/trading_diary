import { Router } from "express";
import { EnvManager } from "../utils/envManager";
import axios from "axios";
import { DHAN_ACCESS_TOKEN } from "../const";
import { dhanUrl } from "../dhan";

const router = Router();

// Endpoint to validate and connect (save) Dhan credentials
router.post("/dhan/connect", async (req, res) => {
	const { accessToken } = req.body;

	if (!accessToken) {
		return res.status(400).json({ message: "Access Token are required" });
	}

	try {
		// Validate credentials by making a lightweight call to Dhan API
		// We can check the funds limit or some basic profile info
		// Note: Dhan API base URL might differ based on environment, typically https://api.dhan.co
		const response = await axios.get(dhanUrl("profile"), {
			headers: {
				"access-token": accessToken,
				// "client-id": clientId,
				"Content-Type": "application/json",
			},
		});

		// If the request is successful (status 200), the credentials are valid
		if (response.status === 200) {
			await EnvManager.set(DHAN_ACCESS_TOKEN, accessToken);
			return res.status(200).json({
				message: "Connected to Dhan successfully",
				status: "connected",
			});
		} else {
			return res
				.status(401)
				.json({ message: "Invalid credentials from Dhan API" });
		}
	} catch (error: any) {
		console.error(
			"Dhan connection error:",
			error.response?.data || error.message,
		);
		const errorMessage =
			error.response?.data?.errorMessage || "Failed to connect to Dhan API";
		return res
			.status(error.response?.status || 500)
			.json({ message: errorMessage });
	}
});

// Endpoint to check current integration status
router.get("/dhan/status", async (_req, res) => {
	const accessToken = EnvManager.get(DHAN_ACCESS_TOKEN);

	if (!accessToken || accessToken === "") {
		return res
			.status(200)
			.json({ status: "disconnected", message: "Not configured" });
	}

	try {
		// Optional: Verify actively if the token is still valid
		const response = await axios.get(dhanUrl("fundlimit"), {
			headers: {
				"access-token": accessToken,
				"Content-Type": "application/json",
			},
		});

		if (response.status === 200) {
			return res.status(200).json({ status: "connected", enable: true }); // Don't return full token
		} else {
			// remove the env if its not valid token
			EnvManager.set(DHAN_ACCESS_TOKEN, "");
			// Token might be expired
			return res.status(200).json({
				status: "error",
				message: "Token expired or invalid. Kindly add new valid token",
			});
		}
	} catch (error) {
		// If verification fails, it might be partial service outage or invalid creds
		return res
			.status(200)
			.json({ status: "error", message: "Failed to verify connection" });
	}
});

export default router;
