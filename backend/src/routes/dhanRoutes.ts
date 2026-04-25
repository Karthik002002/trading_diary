import axios from "axios";
import { Router } from "express";
import { dhanUrl } from "../dhan";
import AccessToken from "../models/accessToken";

const router = Router();

const getAccessToken = async (type: string): Promise<string | null> => {
	const tokenDoc = await AccessToken.findOne({ type });
	return tokenDoc?.access_token || null;
};

router.get("/holdings", async (_req, res) => {
	try {
		const accessToken = await getAccessToken("dhan");
		if (!accessToken) {
			return res
				.status(401)
				.json({ error: "Dhan access token not configured" });
		}

		const response = await axios.get(dhanUrl("holdings"), {
			headers: {
				"access-token": accessToken,
				"Content-Type": "application/json",
			},
		});

		res.json(response.data);
	} catch (error: any) {
		console.error(
			"Dhan holdings error:",
			error.response?.data || error.message,
		);
		res.status(error.response?.status || 500).json({
			error: error.response?.data?.errorMessage || "Failed to fetch holdings",
		});
	}
});

router.get("/positions", async (_req, res) => {
	try {
		const accessToken = await getAccessToken("dhan");
		if (!accessToken) {
			return res
				.status(401)
				.json({ error: "Dhan access token not configured" });
		}

		const response = await axios.get(dhanUrl("positions"), {
			headers: {
				"access-token": accessToken,
				"Content-Type": "application/json",
			},
		});

		res.json(response.data);
	} catch (error: any) {
		console.error(
			"Dhan positions error:",
			error.response?.data || error.message,
		);
		res.status(error.response?.status || 500).json({
			error: error.response?.data?.errorMessage || "Failed to fetch positions",
		});
	}
});

router.get("/orders", async (_req, res) => {
	try {
		const accessToken = await getAccessToken("dhan");
		if (!accessToken) {
			return res
				.status(401)
				.json({ error: "Dhan access token not configured" });
		}

		const response = await axios.get(dhanUrl("orders"), {
			headers: {
				"access-token": accessToken,
				"Content-Type": "application/json",
			},
		});

		res.json(response.data);
	} catch (error: any) {
		console.error("Dhan orders error:", error.response?.data || error.message);
		res.status(error.response?.status || 500).json({
			error: error.response?.data?.errorMessage || "Failed to fetch orders",
		});
	}
});

export default router;
