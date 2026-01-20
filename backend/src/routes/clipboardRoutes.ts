import express from "express";
import { getClipboardHistory, clearClipboardHistory } from "../clipboardStore";

const router = express.Router();

router.get("/latest", (req, res) => {
    const history = getClipboardHistory();
    // Return the data
    res.json({ data: history });

    // Clear after sending? Or allow explicit clear?
    // "clear the data on the backend after pasting the data"
    // If I clear it here, and the frontend fails to paste for some reason, data is lost.
    // typically safer to clear. The user said "clear the data on the backend *after* pasting".
    // I can assume this 'get' call IS the pasting action.
    clearClipboardHistory();
});

export default router;
