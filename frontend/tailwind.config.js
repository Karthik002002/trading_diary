/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				background: "#09090b", // Zinc 950
				surface: "#18181b", // Zinc 900
				"surface-highlight": "#27272a", // Zinc 800
				border: "#3f3f46", // Zinc 700
				primary: "#6366f1", // Indigo 500
				"primary-hover": "#4f46e5", // Indigo 600
				secondary: "#a1a1aa", // Zinc 400 (Text secondary)
			},
			backgroundImage: {
				"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
				"hero-glow":
					"conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)",
			},
		},
	},
	plugins: [],
};
