import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { ConfigProvider, theme } from "antd";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { queryClient } from "./api/client";
import { router } from "./router";

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
					components:{
						Modal:{
							
						}
					}
					// components: { Select: { colorBgContainer: "#7e52a0", colorText } }
				}}
			>
				<NuqsAdapter>
					<RouterProvider router={router} />
				</NuqsAdapter>
			</ConfigProvider>
		</QueryClientProvider>
	);
}

export default App;
