import dayjs from "dayjs";
import { dhanUrl } from "../../dhan";
import accessToken from "../../models/accessToken";
import axios from "axios";

const killSwitchIntradayFunc = () => {
	const now = dayjs();

	// Today at 3:00 PM (15:00)
	const threePM = dayjs().hour(8).minute(0).second(0);

	const isAfterThreePM = now.isAfter(threePM);
	if (isAfterThreePM) {
		updatePositions();
	}
	console.log(`Is it after 3:00 PM? ${isAfterThreePM}`);
};
const KillSwitchIntraday = () => {
	setInterval(() => {
		killSwitchIntradayFunc();
	}, 1000 * 30);
	killSwitchIntradayFunc();
};

export default KillSwitchIntraday;

const updatePositions = async () => {
	const positionURL = dhanUrl("positions");

	const tokenDoc = await accessToken.findOne({ type: "dhan" });
	if (!tokenDoc) return;

	const access_token = tokenDoc.toJSON().access_token;

	try {
		const positionData = await axios.get(positionURL, {
			headers: {
				"access-token": access_token,
				"Content-Type": "application/json",
			},
		});

		console.log("Positions:", positionData.data);
	} catch (err: any) {
		console.error("❌ Position API failed");
		console.error("Status:", err.status);
		console.error("URL:", positionURL);
		console.error("Response:", err.text || err.message || err);
	}
};
