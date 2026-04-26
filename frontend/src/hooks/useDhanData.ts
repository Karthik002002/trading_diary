import { useQuery } from "@tanstack/react-query";
import {
	fetchDhanHoldings,
	fetchDhanInstruments,
	fetchDhanOrders,
	fetchDhanPositions,
} from "../api/client";

export const useDhanHoldings = () => {
	return useQuery({
		queryKey: ["dhan", "holdings"],
		queryFn: fetchDhanHoldings,
	});
};

export const useDhanPositions = () => {
	return useQuery({
		queryKey: ["dhan", "positions"],
		queryFn: fetchDhanPositions,
	});
};

export const useDhanOrders = () => {
	return useQuery({
		queryKey: ["dhan", "orders"],
		queryFn: fetchDhanOrders,
	});
};

export const useDhanInstruments = (search?: string) => {
	return useQuery({
		queryKey: ["dhan", "instruments", search],
		queryFn: () => fetchDhanInstruments(search),
		enabled: !!search && search.length >= 2,
	});
};
