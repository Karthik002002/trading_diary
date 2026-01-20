import dayjs from "dayjs";
import accessToken from "../../models/accessToken";
import axios from "axios";
import { dhanUrl, type TDhanProfile } from "../../dhan";

const dhanTokenRenew = async () => {
	const access_token = await getDhanToken();
	if (!access_token) {
		return;
	}

	try {
		const isValid = dayjs(access_token._id.getTimestamp()).isAfter(
			dayjs().subtract(22, "hour"),
		);

		// if (!isValid) {
			const { data } = await axios.get<TDhanProfile>(dhanUrl("profile"), {
				headers: {
					"access-token": access_token.access_token,
					"Content-Type": "application/json",
				},
			});
			if (data) {
				// const new_token = await axios.get(dhanUrl("renewToken"), {
				// 	"access-token": access_token.access_token,
				// 	dhanClientId: data.dhanClientId,
				// });
				// console.log(new_token.data);
			}
		// }
	} catch (error) {
		console.log(error);
	}
};

const checkTokenValidity = () => {
	setInterval(() => {
		dhanTokenRenew();
	}, 1000 * 60);
	dhanTokenRenew();
};

export default checkTokenValidity;

export const getDhanToken = async () => {
	return await accessToken.findOne({ type: "dhan" });
};
