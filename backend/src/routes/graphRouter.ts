import express from "express";
import Trade from "../models/trade";

const graphRouter = express.Router();


const buildFilterQuery = (filters: any) => {
    const { strategy_id, outcome, search, symbol, portfolio_id, status, tags, from, to } =
        filters;

    const mongoQuery: any = {};

    if (strategy_id) {
        mongoQuery.strategy_id = Number(strategy_id);
    }
    if (symbol) {
        mongoQuery.symbol_id = Number(symbol);
    }
    if (portfolio_id) {
        mongoQuery.portfolio_id = Number(portfolio_id);
    }
    if (outcome) {
        mongoQuery.outcome = outcome;
    }
    if (status) {
        mongoQuery.status = status;
    }
    if (tags) {
        // If tags are provided as comma separated string or array
        const tagIds = Array.isArray(tags) ? tags : String(tags).split(",");
        // If user sends IDs (which they should for filtering), use them directly
        if (tagIds.length > 0) {
            mongoQuery.tags = { $in: tagIds };
        }
    }
    if (search) {
        const searchRegex = { $regex: search, $options: "i" };
        mongoQuery.$or = [
            { entry_reason: searchRegex },
            { exit_reason: searchRegex },
            { notes: searchRegex },
        ];
    }
    // Add date range filtering
    if (from || to) {
        mongoQuery.trade_date = {};
        if (from) {
            mongoQuery.trade_date.$gte = new Date(from);
        }
        if (to) {
            mongoQuery.trade_date.$lte = new Date(to);
        }
    }
    return mongoQuery;
}


graphRouter.post("/timeseries", async (req, res) => {
    try {
        const { filters } = req.body ?? {};
        const query = filters ? buildFilterQuery(filters) : {};

        // want timeseries data of the trades 
        const trades = await Trade.aggregate([
            { $match: query },
            {
                $facet: {
                    timeseries: [
                        {
                            $group: {
                                _id: "$trade_date",
                                pl: { $sum: "$pl" },
                                returns: { $sum: "$returns" },
                                actual_rr: { $sum: "$actual_rr" },
                                confidence_level: { $sum: "$confidence_level" },
                                total_trades: { $sum: 1 },
                            },
                        },
                    ],
                },
            },
        ]);

        res.status(200).json(trades);

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error", error })
    }
})


graphRouter.post("/heatmap", async (req, res) => {
    try {
        const { filters } = req.body ?? {};
        const query = filters ? buildFilterQuery(filters) : {};

        const heatmapData = await Trade.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$trade_date" } },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    date: "$_id",
                    count: 1,
                    _id: 0,
                },
            },
            { $sort: { date: 1 } },
        ]);

        res.status(200).json(heatmapData);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
});

graphRouter.post("/treemap", async (req, res) => {
    try {
        const { filters } = req.body ?? {};
        const query = filters ? buildFilterQuery(filters) : {};

        const treemapData = await Trade.aggregate([
            { $match: query },
            { $unwind: "$emotional_state" },
            {
                $group: {
                    _id: { outcome: "$outcome", emotion: "$emotional_state" },
                    value: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: "$_id.outcome",
                    children: {
                        $push: {
                            name: "$_id.emotion",
                            value: "$value",
                        },
                    },
                    total: { $sum: "$value" },
                },
            },
            {
                $project: {
                    name: "$_id",
                    value: "$total",
                    children: 1,
                    _id: 0,
                },
            },
        ]);

        res.status(200).json(treemapData);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
});


export default graphRouter;