import mongoose, { type Document, Schema } from "mongoose";

export interface ISession extends Document {
	session_id: string;
	user_id: string;
	date: Date;
	time_of_day: "morning" | "post-work" | "post-gym";
	energy_level: number;
	mental_state_tags: (
		| "Focused"
		| "Distracted"
		| "Tired"
		| "Sharp"
		| "Anxious"
	)[];
	trades: mongoose.Types.ObjectId[];
	is_active: boolean;
	compliance_score: number | null;
	week_start: Date;
	plan_followed_self_report: boolean | null;
	honesty_delta: number | null;
	published: boolean;
	published_at: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

const SessionSchema: Schema = new Schema(
	{
		session_id: { type: String, required: true, unique: true },
		user_id: { type: String, required: true },
		date: { type: Date, required: true, default: Date.now },
		time_of_day: {
			type: String,
			enum: ["morning", "post-work", "post-gym"],
			required: true,
		},
		energy_level: {
			type: Number,
			min: 1,
			max: 10,
			required: true,
		},
		mental_state_tags: [
			{
				type: String,
				enum: ["Focused", "Distracted", "Tired", "Sharp", "Anxious"],
			},
		],
		trades: [{ type: Schema.Types.ObjectId, ref: "DisciplineTrade" }],
		is_active: { type: Boolean, default: true },
		compliance_score: { type: Number, default: null },
		week_start: { type: Date, required: true },
		plan_followed_self_report: { type: Boolean, default: null },
		honesty_delta: { type: Number, default: null },
		published: { type: Boolean, default: false },
		published_at: { type: Date, default: null },
	},
	{
		timestamps: true,
	},
);

export default mongoose.model<ISession>("Session", SessionSchema);
