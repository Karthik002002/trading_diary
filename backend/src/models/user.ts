import mongoose, { type Document, Schema } from "mongoose";

export interface IUser extends Document {
	user_id: string;
	name: string;
	weekly_session_target: number;
	accountability_destination: "in_app" | "telegram" | "twitter";
	accountability_destination_config: {
		token?: string;
		chat_id?: string;
		channel_id?: string;
	};
	witness_user_id: string | null;
	witness_name: string | null;
	witness_token: string | null;
	onboarding_complete: boolean;
	created_at: Date;
}

const UserSchema: Schema = new Schema(
	{
		user_id: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		weekly_session_target: { type: Number, min: 1, max: 7, default: 5 },
		accountability_destination: {
			type: String,
			enum: ["in_app", "telegram", "twitter"],
			default: "in_app",
		},
		accountability_destination_config: {
			type: Schema.Types.Mixed,
			default: {},
		},
		witness_user_id: { type: String, default: null },
		witness_name: { type: String, default: null },
		witness_token: { type: String, default: null },
		onboarding_complete: { type: Boolean, default: false },
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
	},
);

UserSchema.pre("save", async function () {
	const user = this as unknown as IUser;

	if (user.isNew) {
		const lastUser = await mongoose
			.model<IUser>("User")
			.findOne()
			.sort({ user_id: -1 });
		user.user_id =
			lastUser && lastUser.user_id
				? `user_${parseInt(lastUser.user_id.split("_")[1]) + 1}`
				: "user_1";
	}
});

export default mongoose.model<IUser>("User", UserSchema);
