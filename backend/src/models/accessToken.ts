import mongoose, { Schema } from "mongoose";

export interface IAccessToken {
	id: string;
	access_token: string;
	type: string;
}

const AccessToken: Schema = new Schema(
	{
		id: { type: Number, unique: true },
		access_token: { type: String, unique: true },
		type: { type: String, unique: true },
	},
	{
		timestamps: true,
	},
);

export default mongoose.model<IAccessToken>("AccessToken", AccessToken);
