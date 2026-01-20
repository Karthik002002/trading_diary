import { Router } from "express";
import { EnvManager } from "../utils/envManager";
import axios from "axios";
import { DHAN_ACCESS_TOKEN } from "../const";
import { dhanUrl } from "../dhan";
import AccessToken from "../models/accessToken";
import logger from "../logger";

const router = Router();

// Endpoint to validate and connect (save) Dhan credentials
router.post("/:type/connect", async (req, res) => {
	const { accessToken } = req.body;
	const { type } = req.params;
	if (!accessToken) {
		return res.status(400).json({ message: "Access Token are required" });
	}

	try {
		const existingToken = await AccessToken.findOne({
			access_token: accessToken,
		});
		let checkingToken = accessToken;
		if (existingToken) {
			checkingToken = existingToken.toJSON().access_token;
		}
		// Validate credentials by making a lightweight call to Dhan API
		const response = await axios.get(dhanUrl("profile"), {
			headers: {
				"access-token": checkingToken,
				// "client-id": clientId,
				"Content-Type": "application/json",
			},
		});

		// If the request is successful (status 200), the credentials are valid
		if (response.status === 200) {
			await EnvManager.set(DHAN_ACCESS_TOKEN, accessToken);
			const postToken = new AccessToken({ access_token: accessToken, type });
			const savedToken = await postToken.save();
			return res.status(200).json({
				message: "Connected to Dhan successfully",
				status: "connected",
				token: savedToken.toJSON(),
			});
		} else {
			if (existingToken) {
				existingToken.deleteOne();
			}
			return res.status(500).json({
				message: "Invalid credentials OR token expired from Dhan API ",
			});
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
router.get("/:type/status", async (_req, res) => {
	const { type } = _req.params;

	try {
		const findAccessToken = await AccessToken.findOne({ type: type });
		if (!findAccessToken) {
			return res
				.status(200)
				.json({ enable: false, message: "No access token found " });
		}

		const token = findAccessToken.toJSON();
		logger.info(`${type} Fetched successfully`);
		// Optional: Verify actively if the token is still valid
		const response = await axios.get(dhanUrl("fundlimit"), {
			headers: {
				"access-token": token.access_token,
				"Content-Type": "application/json",
			},
		});

		if (response.status === 200) {
			return res.status(200).json({ status: "connected", enable: true, token }); // Don't return full token
		} else {
			// remove the token from db if its not valid token
			await findAccessToken.deleteOne();
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
