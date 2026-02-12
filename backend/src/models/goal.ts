import mongoose, { type Document, Schema } from "mongoose";

export interface IGoal extends Document {
    id: number;
    name: string;
    goal_type: "REAL" | "TESTING";
    target_amount: number;

    start_date: Date;
    end_date: Date;
    portfolio_ids: number[]; // Array of Portfolio IDs (custom `id` field, not _id)
    status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
    is_status_edited: boolean;
}

const GoalSchema: Schema = new Schema(
    {
        id: { type: Number, unique: true },
        name: { type: String, required: true },
        goal_type: {
            type: String,
            enum: ["REAL", "TESTING"],
            required: true,
        },
        target_amount: { type: Number, required: true },
        start_date: { type: Date, required: true },
        end_date: { type: Date, required: true },
        portfolio_ids: { type: [Number], default: [] },
        status: {
            type: String,
            enum: ["ACTIVE", "COMPLETED", "ARCHIVED"],
            default: "ACTIVE",
        },
        is_status_edited: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    },
);

GoalSchema.pre("save", async function () {
    const goal = this as unknown as IGoal;

    if (goal.isNew) {
        const lastGoal = await mongoose
            .model<IGoal>("Goal")
            .findOne()
            .sort({ id: -1 });
        goal.id = lastGoal && lastGoal.id ? lastGoal.id + 1 : 1;
    }
});

export default mongoose.model<IGoal>("Goal", GoalSchema);
