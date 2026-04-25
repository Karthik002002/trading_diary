import mongoose, { type Document, Schema } from "mongoose";

export interface IAccountabilityPost extends Document {
	post_id: string;
	user_id: string;
	session_id: string | null;
	commitment_id: string | null;
	post_type: "session" | "weekly_summary";
	generated_content: string;
	destination: "in_app" | "telegram" | "twitter";
	published_at: Date;
}

const AccountabilityPostSchema: Schema = new Schema(
	{
		post_id: { type: String, required: true, unique: true },
		user_id: { type: String, required: true },
		session_id: { type: String, default: null },
		commitment_id: { type: String, default: null },
		post_type: {
			type: String,
			enum: ["session", "weekly_summary"],
			required: true,
		},
		generated_content: { type: String, required: true },
		destination: {
			type: String,
			enum: ["in_app", "telegram", "twitter"],
			default: "in_app",
		},
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
	},
);

AccountabilityPostSchema.pre("save", async function () {
	const post = this as unknown as IAccountabilityPost;

	if (post.isNew) {
		const lastPost = await mongoose
			.model<IAccountabilityPost>("AccountabilityPost")
			.findOne()
			.sort({ post_id: -1 });
		post.post_id =
			lastPost && lastPost.post_id
				? `post_${parseInt(lastPost.post_id.split("_")[1]) + 1}`
				: "post_1";
	}
});

export default mongoose.model<IAccountabilityPost>(
	"AccountabilityPost",
	AccountabilityPostSchema,
);
