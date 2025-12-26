import express from "express";
import Tag from "../models/tag";

const router = express.Router();

router.get("/", async (req, res) => {
	try {
		const { search } = req.query;
		const query: any = {};

		if (search) {
			query.name = { $regex: search, $options: "i" };
		}

		const tags = await Tag.find(query).sort({ name: 1 });
		res.json(tags);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

export default router;
