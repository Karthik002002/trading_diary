import express from "express";
import Goal, { type IGoal } from "../models/goal";
import Trade from "../models/trade";

const router = express.Router();

// GET all goals with progress
router.get("/", async (req, res) => {
    try {
        const { type } = req.query;
        const filter: any = {};
        if (type) {
            filter.goal_type = type;
        }

        // Automatic Status Update: Check for expired goals
        const now = new Date();
        await Goal.updateMany(
            {
                end_date: { $lt: now },
                is_status_edited: { $ne: true },
                status: { $ne: "COMPLETED" }
            },
            {
                $set: { status: "COMPLETED" }
            }
        );

        const goals = await Goal.find(filter).sort({ createdAt: -1 });

        const goalsWithProgress = await Promise.all(
            goals.map(async (goal) => {
                const trades = await Trade.find({
                    portfolio_id: { $in: goal.portfolio_ids },
                    trade_date: { $gte: goal.start_date, $lte: goal.end_date },
                    // Only count trades that have a P&L (closed trades)
                    pl: { $ne: null }
                });

                const current_amount = trades.reduce((sum, trade) => sum + (trade.pl || 0), 0);

                // Calculate percentage, handling division by zero
                let progress_percentage = 0;
                if (goal.target_amount !== 0) {
                    progress_percentage = (current_amount / goal.target_amount) * 100;
                }

                return {
                    ...goal.toObject(),
                    current_amount,
                    progress_percentage,
                };
            }),
        );

        res.json(goalsWithProgress);
    } catch (error) {
        res.status(500).json({ message: "Error fetching goals", error });
    }
});

// POST create a new goal
router.post("/", async (req, res) => {
    try {
        const newGoal = new Goal(req.body);
        const savedGoal = await newGoal.save();
        res.status(201).json(savedGoal);
    } catch (error) {
        res.status(400).json({ message: "Error creating goal", error });
    }
});

// PUT update a goal
router.put("/:id", async (req, res) => {
    try {
        const goalId = Number(req.params.id);

        const updateData = { ...req.body };
        const existingGoal = await Goal.findOne({ id: goalId });
        if (!existingGoal) {
            return res.status(404).json({ message: "Goal not found" });
        }
        // If status is being updated manually, flag it as edited
        if (updateData.status !== existingGoal.status) {
            updateData.is_status_edited = true;
        }

        const updatedGoal = await Goal.findOneAndUpdate(
            { id: goalId },
            updateData,
            { new: true },
        );
        if (!updatedGoal) {
            return res.status(404).json({ message: "Goal not found" });
        }
        res.json(updatedGoal);
    } catch (error) {
        res.status(400).json({ message: "Error updating goal", error });
    }
});

// DELETE a goal
router.delete("/:id", async (req, res) => {
    try {
        const goalId = Number(req.params.id);
        const deletedGoal = await Goal.findOneAndDelete({ id: goalId });
        if (!deletedGoal) {
            return res.status(404).json({ message: "Goal not found" });
        }
        res.json({ message: "Goal deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting goal", error });
    }
});

export default router;
