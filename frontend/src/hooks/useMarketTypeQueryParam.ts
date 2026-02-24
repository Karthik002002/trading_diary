import { parseAsStringEnum, useQueryState } from "nuqs";
import type { MarketType } from "../types/api";

const marketTypeParser = parseAsStringEnum(["equity", "forex"]).withDefault(
	"equity",
);

export const useMarketTypeQueryParam = () => {
	const [marketType, setMarketType] = useQueryState("trade_type", marketTypeParser);

	return {
		marketType: marketType as MarketType,
		setMarketType: (next: MarketType) => setMarketType(next),
	};
};
