import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useState } from "react";
import {
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    REDO_COMMAND,
    UNDO_COMMAND,
    SELECTION_CHANGE_COMMAND,
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    $getSelection,
    $isRangeSelection,
    type LexicalEditor,
} from "lexical";
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { mergeRegister } from "@lexical/utils";
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Undo,
    Redo,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
} from "lucide-react";

const LowPriority = 1;

export default function ToolbarPlugin() {
    const [editor] = useLexicalComposerContext();
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isCode, setIsCode] = useState(false);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            // Update text format
            setIsBold(selection.hasFormat("bold"));
            setIsItalic(selection.hasFormat("italic"));
            setIsUnderline(selection.hasFormat("underline"));
            setIsStrikethrough(selection.hasFormat("strikethrough"));
            setIsCode(selection.hasFormat("code"));
        }
    }, []);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_payload: unknown, _newEditor: LexicalEditor) => {
                    updateToolbar();
                    return false;
                },
                LowPriority
            ),
            editor.registerCommand(
                CAN_UNDO_COMMAND,
                (payload: boolean) => {
                    setCanUndo(payload);
                    return false;
                },
                LowPriority
            ),
            editor.registerCommand(
                CAN_REDO_COMMAND,
                (payload: boolean) => {
                    setCanRedo(payload);
                    return false;
                },
                LowPriority
            )
        );
    }, [editor, updateToolbar]);

    return (
        <div className="toolbar">
            <button
                disabled={!canUndo}
                onClick={() => {
                    editor.dispatchCommand(UNDO_COMMAND, undefined);
                }}
                className="toolbar-item spaced"
                aria-label="Undo"
            >
                <Undo size={18} />
            </button>
            <button
                disabled={!canRedo}
                onClick={() => {
                    editor.dispatchCommand(REDO_COMMAND, undefined);
                }}
                className="toolbar-item"
                aria-label="Redo"
            >
                <Redo size={18} />
            </button>
            <div className="divider" style={{ width: '1px', background: '#eee', margin: '0 4px' }} />
            <button
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
                }}
                className={"toolbar-item spaced " + (isBold ? "active" : "")}
                aria-label="Format Bold"
            >
                <Bold size={18} />
            </button>
            <button
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
                }}
                className={"toolbar-item spaced " + (isItalic ? "active" : "")}
                aria-label="Format Italics"
            >
                <Italic size={18} />
            </button>
            <button
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
                }}
                className={"toolbar-item spaced " + (isUnderline ? "active" : "")}
                aria-label="Format Underline"
            >
                <Underline size={18} />
            </button>
            <button
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
                }}
                className={"toolbar-item spaced " + (isStrikethrough ? "active" : "")}
                aria-label="Format Strikethrough"
            >
                <Strikethrough size={18} />
            </button>
            <button
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
                }}
                className={"toolbar-item spaced " + (isCode ? "active" : "")}
                aria-label="Insert Code"
            >
                <Code size={18} />
            </button>
            <div className="divider" style={{ width: '1px', background: '#eee', margin: '0 4px' }} />
            <button
                onClick={() => {
                    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
                }}
                className="toolbar-item spaced"
                aria-label="Unordered List"
            >
                <List size={18} />
            </button>
            <button
                onClick={() => {
                    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
                }}
                className="toolbar-item spaced"
                aria-label="Ordered List"
            >
                <ListOrdered size={18} />
            </button>
            <div className="divider" style={{ width: '1px', background: '#eee', margin: '0 4px' }} />
            <button
                onClick={() => {
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
                }}
                className="toolbar-item spaced"
                aria-label="Left Align"
            >
                <AlignLeft size={18} />
            </button>
            <button
                onClick={() => {
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
                }}
                className="toolbar-item spaced"
                aria-label="Center Align"
            >
                <AlignCenter size={18} />
            </button>
            <button
                onClick={() => {
                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
                }}
                className="toolbar-item spaced"
                aria-label="Right Align"
            >
                <AlignRight size={18} />
            </button>
        </div>
    );
}
