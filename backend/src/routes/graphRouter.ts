import express, { type Request, type Response } from "express";
import ForexTrade from "../models/forexTrade";
import Trade from "../models/trade";

const graphRouter = express.Router();


const buildFilterQuery = (filters: any) => {
    const { strategy_id, outcome, search, symbol, portfolio_id, status, tags, from, to, trade_type } =
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
    if (trade_type) {
        mongoQuery.trade_type = trade_type;
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


graphRouter.post("/timeseries", async (req: Request, res: Response) => {
    try {
        const { filters } = req.body ?? {};
        const query = filters ? buildFilterQuery(filters) : {};
        const Model = filters?.trade_type === "forex" ? ForexTrade : Trade;

        const trades = await Model.aggregate([
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


graphRouter.post("/heatmap", async (req: Request, res: Response) => {
    try {
        const { filters } = req.body ?? {};
        const query = filters ? buildFilterQuery(filters) : {};
        const Model = filters?.trade_type === "forex" ? ForexTrade : Trade;

        const heatmapData = await Model.aggregate([
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

graphRouter.post("/treemap", async (req: Request, res: Response) => {
    try {
        const { filters } = req.body ?? {};
        const query = filters ? buildFilterQuery(filters) : {};
        const Model = filters?.trade_type === "forex" ? ForexTrade : Trade;

        const treemapData = await Model.aggregate([
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

graphRouter.post("/winlosspiechart", async (req: Request, res: Response) => {
    try {
        const { filters } = req.body ?? {};
        const query = filters ? buildFilterQuery(filters) : {};
        const Model = filters?.trade_type === "forex" ? ForexTrade : Trade;

        const winLossData = await Model.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$outcome",
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    name: "$_id",
                    value: "$count",
                    _id: 0,
                },
            },
        ]);

        res.status(200).json(winLossData);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
});

graphRouter.post("/outcome-tag-combination", async (req: Request, res: Response) => {
    try {
        const { filters } = req.body ?? {};
        const query = filters ? buildFilterQuery(filters) : {};
        const Model = filters?.trade_type === "forex" ? ForexTrade : Trade;

        const outcomeTagCombination = await Model.aggregate([
            { $match: query },
            {
                $project: {
                    outcome: 1,
                    tags: {
                        $sortArray: {
                            input: "$tags",
                            sortBy: 1
                        }
                    }
                }
            },
            {
                $group: {
                    _id: {
                        outcome: "$outcome",
                        tags: "$tags"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    outcome: "$_id.outcome",
                    tags: "$_id.tags",
                    count: 1
                }
            },
            { $sort: { count: -1 } }
        ])

        res.status(200).json(outcomeTagCombination);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
})


export default graphRouter;