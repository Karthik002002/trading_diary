import { Modal } from "antd";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { BACKEND_URL } from "../api/client";
import type { Trade } from "../hooks/useTrades";

interface ImageViewerModalProps {
	isOpen: boolean;
	onClose: () => void;
	imageUrl: string;
	instance: Trade;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
	isOpen,
	onClose,
	imageUrl,
	instance,
}) => {
	const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

	const handleImageClick = (imagePath: string) => {
		setFullscreenImage(imagePath);
	};

	const closeFullscreen = useCallback(() => {
		setFullscreenImage(null);
	}, []);

	// Handle ESC key to close fullscreen
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && fullscreenImage) {
				e.stopPropagation();
				closeFullscreen();
			}
		};

		if (fullscreenImage) {
			document.addEventListener("keydown", handleKeyDown, true);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown, true);
		};
	}, [fullscreenImage, closeFullscreen]);

	// Handle browser back button
	useEffect(() => {
		if (fullscreenImage) {
			window.history.pushState({ fullscreen: true }, "");

			const handlePopState = () => {
				closeFullscreen();
			};

			window.addEventListener("popstate", handlePopState);
			return () => {
				window.removeEventListener("popstate", handlePopState);
			};
		}
	}, [fullscreenImage, closeFullscreen]);

	const timeframePhotos = instance?.timeframe_photos || [];

	return (
		<>
			<Modal
				onCancel={onClose}
				open={isOpen}
				closable
				width={900}
				title="Trade Screenshots"
				footer={null}
				styles={{ body: { maxHeight: "75vh", overflowY: "auto" } }}
			>
				<div className="space-y-6 pt-4">
					{/* Main Photo Section */}
					{imageUrl && (
						<div className="space-y-2">
							<h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
								Main Screenshot
							</h3>
							<div className="flex justify-center items-center bg-gray-800/50 rounded-lg p-4">
								<img
									src={`${BACKEND_URL}/${imageUrl}`}
									alt="Main trade screenshot"
									className="max-w-full max-h-[400px] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
									onClick={() => handleImageClick(imageUrl)}
									title="Click to view fullscreen"
								/>
							</div>
						</div>
					)}

					{/* Timeframe Photos Section */}
					{timeframePhotos.length > 0 && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
								Timeframe Screenshots
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{timeframePhotos.map((tf, index) => (
									<div key={index} className="space-y-2">
										<h4 className="text-sm font-medium text-blue-400 uppercase tracking-wide">
											{tf.type} Timeframe
										</h4>
										<div className="bg-gray-800/50 rounded-lg p-3">
											<img
												src={`${BACKEND_URL}/${tf.photo}`}
												alt={`${tf.type} timeframe screenshot`}
												className="w-full max-h-[250px] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
												onClick={() => handleImageClick(tf.photo)}
												title="Click to view fullscreen"
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* No photos message */}
					{!imageUrl && timeframePhotos.length === 0 && (
						<div className="text-center text-gray-400 py-8">
							No screenshots available for this trade.
						</div>
					)}
				</div>
			</Modal>

			{/* Fullscreen Image Overlay */}
			{fullscreenImage && (
				<div
					className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
					onClick={closeFullscreen}
				>
					<button
						className="absolute top-4 right-4 text-white bg-gray-800/80 hover:bg-gray-700 rounded-full p-2 transition-colors z-10"
						onClick={closeFullscreen}
						title="Close (ESC)"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-8 w-8"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
					<img
						src={`${BACKEND_URL}/${fullscreenImage}`}
						alt="Fullscreen view"
						className="max-w-[95vw] max-h-[95vh] object-contain"
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			)}
		</>
	);
};

export default ImageViewerModal;
