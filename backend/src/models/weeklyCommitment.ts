import mongoose, { type Document, Schema } from "mongoose";

export interface IWeeklyCommitment extends Document {
	commitment_id: string;
	user_id: string;
	week_start_date: Date;
	declared_session_count: number;
	actual_session_count: number;
	published: boolean;
	created_at: Date;
}

const WeeklyCommitmentSchema: Schema = new Schema(
	{
		commitment_id: { type: String, required: true, unique: true },
		user_id: { type: String, required: true },
		week_start_date: { type: Date, required: true },
		declared_session_count: { type: Number, min: 1, max: 7, required: true },
		actual_session_count: { type: Number, default: 0 },
		published: { type: Boolean, default: false },
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
	},
);

WeeklyCommitmentSchema.pre("save", async function () {
	const commitment = this as unknown as IWeeklyCommitment;

	if (commitment.isNew) {
		const lastCommitment = await mongoose
			.model<IWeeklyCommitment>("WeeklyCommitment")
			.findOne()
			.sort({ commitment_id: -1 });
		commitment.commitment_id =
			lastCommitment && lastCommitment.commitment_id
				? `commit_${parseInt(lastCommitment.commitment_id.split("_")[1]) + 1}`
				: "commit_1";
	}
});

export default mongoose.model<IWeeklyCommitment>(
	"WeeklyCommitment",
	WeeklyCommitmentSchema,
);
