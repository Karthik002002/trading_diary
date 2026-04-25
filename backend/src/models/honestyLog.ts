import mongoose, { type Document, Schema } from "mongoose";

export interface IHonestyLog extends Document {
	log_id: string;
	user_id: string;
	session_id: string;
	compliance_percent: number;
	self_reported: boolean;
	delta: number;
	created_at: Date;
}

const HonestyLogSchema: Schema = new Schema(
	{
		log_id: { type: String, required: true, unique: true },
		user_id: { type: String, required: true },
		session_id: { type: String, required: true },
		compliance_percent: { type: Number, required: true },
		self_reported: { type: Boolean, required: true },
		delta: { type: Number, required: true },
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
	},
);

HonestyLogSchema.pre("save", async function () {
	const log = this as unknown as IHonestyLog;

	if (log.isNew) {
		const lastLog = await mongoose
			.model<IHonestyLog>("HonestyLog")
			.findOne()
			.sort({ log_id: -1 });
		log.log_id =
			lastLog && lastLog.log_id
				? `log_${parseInt(lastLog.log_id.split("_")[1]) + 1}`
				: "log_1";
	}
});

export default mongoose.model<IHonestyLog>("HonestyLog", HonestyLogSchema);
