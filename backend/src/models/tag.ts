import mongoose, { type Document, Schema } from "mongoose";

export interface ITag extends Document {
	name: string;
}

const TagSchema: Schema = new Schema(
	{
		name: { type: String, required: true, unique: true, trim: true },
	},
	{
		timestamps: true,
	},
);

export default mongoose.model<ITag>("Tag", TagSchema);
