import mongoose, { Schema } from "mongoose";

export interface IAccessToken {
	id: number;
	access_token: string;
	type: string;
}

interface ICounter {
	_id: string;
	seq: number;
}

const CounterSchema: Schema = new Schema(
	{
		_id: { type: String, required: true },
		seq: { type: Number, required: true, default: 0 },
	},
	{ versionKey: false },
);

const CounterModel = mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);

const AccessToken: Schema = new Schema(
	{
		id: { type: Number, unique: true, required: true },
		access_token: { type: String, unique: true },
		type: { type: String, unique: true },
	},
	{
		timestamps: true,
	},
);

AccessToken.pre("validate", async function () {
	const doc = this as unknown as { isNew: boolean; id?: number };

	// Only auto-assign on first insert.
	if (!doc.isNew || doc.id != null) {
		return;
	}

	const counter = await CounterModel.findByIdAndUpdate(
		"access_token_id",
		{ $inc: { seq: 1 } },
		{ new: true, upsert: true },
	);

	doc.id = counter.seq;
});

export default mongoose.model<IAccessToken>("AccessToken", AccessToken);
