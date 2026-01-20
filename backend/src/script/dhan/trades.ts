import axios from "axios";
import { dhanUrl } from "../../dhan";
import { getDhanToken } from "./tokenRenew";
import dayjs from "dayjs";

export const getTrades = async () => {
	const token = await getDhanToken();
	if (!token) {
		return;
	}
	const from = dayjs().subtract(2, "month").format("YYYY-MM-DD");
	const to = dayjs().format("YYYY-MM-DD");
	const data = await axios.get(`${dhanUrl("trades")}/${from}/${to}/1`, {
		headers: {
			"access-token": token.access_token,
			"Content-Type": "application/json",
		},
	});
	console.log(data.data);
};
