import clipboardy from "clipboardy";
import { Clipboard } from "@napi-rs/clipboard";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

export type ClipboardItem = {
  type: "number" | "image";
  value: string | string; // string for number, file path for image
  timestamp: number;
  timeframe?: string; // Only for images: "1h", "4h", etc.
};

export type ClipboardHistory = {
  numbers: string[]; // Last 3 numbers
  images: Array<{ timeframe: string; imagePath: string }>; // Last 4 images
  rawHistory: ClipboardItem[]; // Complete history
};

// Initialize
const imageClipBoardHandler = new Clipboard();
let clipboardHistory: ClipboardItem[] = [];
let lastContent = "";
let lastImageSize = 0;

// Timeframe patterns to extract from image names
const TIMEFRAME_PATTERNS = [
  { pattern: /1[_-]?hour|1[_-]?h|60[_-]?min/i, value: "1h" },
  { pattern: /4[_-]?hour|4[_-]?h|240[_-]?min/i, value: "4h" },
  { pattern: /15[_-]?min|15[_-]?m/i, value: "15m" },
  { pattern: /daily|d1|1[_-]?day/i, value: "Daily" },
  { pattern: /weekly|w1|1[_-]?week/i, value: "Weekly" },
  { pattern: /monthly|m1|1[_-]?month/i, value: "Monthly" },
  { pattern: /5[_-]?min|5[_-]?m/i, value: "5m" },
  { pattern: /30[_-]?min|30[_-]?m/i, value: "30m" },
];

// Create directory for storing images
const IMAGE_DIR = "./clipboard_images";
if (!existsSync(IMAGE_DIR)) {
  mkdirSync(IMAGE_DIR, { recursive: true });
}

/**
 * Extract timeframe from image filename or content
 */
const extractTimeframe = (fileName: string): string => {
  // Check for timeframe patterns in the filename
  for (const { pattern, value } of TIMEFRAME_PATTERNS) {
    if (pattern.test(fileName)) {
      return value;
    }
  }
  
  // Default fallback
  return "Chart";
};

/**
 * Check if string is a valid number (including decimals)
 */
const isNumber = (text: string): boolean => {
  return /^-?\d*\.?\d+$/.test(text.trim());
};

/**
 * Save image to file and return path
 */
const saveImage = async (imageBuffer: any): Promise<string> => {
  const timestamp = Date.now();
  const fileName = `clipboard_image_${timestamp}.png`;
  const filePath = join(IMAGE_DIR, fileName);
  
  writeFileSync(filePath, Buffer.from(imageBuffer.buffer));
  return filePath;
};

/**
 * Start monitoring clipboard
 */
export const startClipboardMonitor = (interval = 500) => {
  console.log("Starting clipboard monitor...");
  
  // Read initial clipboard content
  try {
    lastContent = clipboardy.readSync();
    const initialImage = imageClipBoardHandler.getImage();
    lastImageSize = initialImage ? initialImage.buffer.byteLength : 0;
  } catch (err) {
    console.warn("Could not read initial clipboard:", err);
  }

  setInterval(async () => {
    try {
      let newItem: ClipboardItem | null = null;
      
      // 1. Check for text content first
      try {
        const currentText = await clipboardy.read();
        
        if (currentText && currentText !== lastContent) {
          // Check if it's a number
          if (isNumber(currentText)) {
            newItem = {
              type: "number",
              value: currentText.trim(),
              timestamp: Date.now(),
            };
            lastContent = currentText;
          } else {
            // It's text but not a number - extract timeframe if it's an image filename/link
            const timeframe = extractTimeframe(currentText);
            if (timeframe !== "Chart" || currentText.includes("http")) {
              // Treat as image URL or path
              newItem = {
                type: "image",
                value: currentText,
                timestamp: Date.now(),
                timeframe: timeframe,
              };
              lastContent = currentText;
            }
          }
        }
      } catch (textErr) {
        // Text read failed, try image
        console.debug("No text in clipboard, checking for image...");
      }

      // 2. Check for image content (binary)
      if (!newItem) {
        try {
          const imageBuffer = imageClipBoardHandler.getImage();
          if (imageBuffer && imageBuffer.buffer.byteLength !== lastImageSize) {
            lastImageSize = imageBuffer.buffer.byteLength;
            
            const fileName = `chart_${Date.now()}.png`;
            const filePath = await saveImage(imageBuffer);
            
            newItem = {
              type: "image",
              value: filePath,
              timestamp: Date.now(),
              timeframe: extractTimeframe(fileName),
            };
          }
        } catch (imageErr) {
          console.debug("No image in clipboard");
        }
      }

      // 3. Add new item to history if found
      if (newItem) {
        // Remove oldest item if we have 7 items
        if (clipboardHistory.length >= 7) {
          clipboardHistory.shift();
        }
        
        // Add new item
        clipboardHistory.push(newItem);
        console.log(`New clipboard item added: ${newItem.type} (${newItem.timeframe || 'number'})`);
      }
      
    } catch (err) {
      console.error("Error monitoring clipboard:", err);
    }
  }, interval);
};

/**
 * Get the clipboard history formatted as requested
 */
export const getClipboardHistory = (): ClipboardHistory => {
  // Separate numbers and images
  const numbers: string[] = [];
  const images: Array<{ timeframe: string; imagePath: string }> = [];
  
  // Process history in chronological order
  for (const item of clipboardHistory) {
    if (item.type === "number") {
      numbers.push(item.value as string);
    } else if (item.type === "image") {
      images.push({
        timeframe: item.timeframe || "Chart",
        imagePath: item.value as string,
      });
    }
  }
  
  // Get only last 3 numbers (most recent first)
  const lastNumbers = numbers.slice(-3).reverse();
  
  // Get only last 4 images (most recent first)
  const lastImages = images.slice(-4).reverse();
  
  return {
    numbers: lastNumbers,
    images: lastImages,
    rawHistory: [...clipboardHistory].reverse(), // Most recent first
  };
};

/**
 * Clear clipboard history
 */
export const clearClipboardHistory = (): void => {
  clipboardHistory = [];
  lastContent = "";
  lastImageSize = 0;
  console.log("Clipboard history cleared");
};

/**
 * Get specific clipboard data for trading
 */
export const getTradingData = () => {
  const history = getClipboardHistory();
  
  // Assuming last 3 numbers are: Entry, Target, StopLoss (in that order)
  const entry = history.numbers[0] || null;
  const target = history.numbers[1] || null;
  const stoploss = history.numbers[2] || null;
  
  // Get timeframe-specific images
  const oneHourImage = history.images.find(img => img.timeframe === "1h");
  const fourHourImage = history.images.find(img => img.timeframe === "4h");
  
  return {
    entry,
    target,
    stoploss,
    images: {
      oneHour: oneHourImage || null,
      fourHour: fourHourImage || null,
      allImages: history.images,
    },
    rawHistory: history.rawHistory,
  };
};

// Helper function to manually add an item (for testing)
export const addToClipboardHistory = (item: Omit<ClipboardItem, 'timestamp'>): void => {
  const newItem: ClipboardItem = {
    ...item,
    timestamp: Date.now(),
  };
  
  if (clipboardHistory.length >= 7) {
    clipboardHistory.shift();
  }
  
  clipboardHistory.push(newItem);
};

// Example usage:
// startClipboardMonitor(1000); // Monitor every second

// To get history:
// const history = getClipboardHistory();
// console.log("Numbers:", history.numbers); // Last 3 numbers
// console.log("Images:", history.images); // Last 4 images with timeframes