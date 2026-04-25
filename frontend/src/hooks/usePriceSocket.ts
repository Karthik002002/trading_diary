import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { BACKEND_URL } from "../api/client";

let socket: Socket | null = null;

function getSocket(): Socket {
	if (!socket) {
		socket = io(BACKEND_URL, {
			transports: ["websocket", "polling"],
		});
	}
	return socket;
}

export function usePriceSocket() {
	const [prices, setPrices] = useState<Record<string, number | null>>({});
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		const socket = getSocket();

		const onConnect = () => setConnected(true);
		const onDisconnect = () => setConnected(false);
		const onPriceUpdate = (priceMap: Record<string, number | null>) => {
			setPrices(priceMap);
		};

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("price-update", onPriceUpdate);

		if (socket.connected) {
			setConnected(true);
		}

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("price-update", onPriceUpdate);
		};
	}, []);
	console.log({prices})

	return { prices, connected };
}

export function getSocketInstance(): Socket {
	return getSocket();
}
