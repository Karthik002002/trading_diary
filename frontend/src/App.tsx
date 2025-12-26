import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { queryClient } from "./api/client";
import { router } from "./router";
import { ConfigProvider, theme } from "antd";

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ConfigProvider
				theme={{
					// algorithm: theme.darkAlgorithm,
					algorithm: [theme.darkAlgorithm],

					token: {
						colorPrimary: "#7200abff",

						colorInfo: "#999999",
					},
					// components: { Select: { colorBgContainer: "#7e52a0", colorText } }
				}}
			>
				<RouterProvider router={router} />
			</ConfigProvider>
		</QueryClientProvider>
	);
}

export default App;
