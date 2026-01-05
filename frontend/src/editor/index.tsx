import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EditorState } from 'lexical'
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table"
import { ListItemNode, ListNode } from "@lexical/list"
import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import ToolbarPlugin from './ToolbarPlugin'
import './editor.css'

const theme = {
    ltr: 'ltr',
    rtl: 'rtl',
    placeholder: 'editor-placeholder',
    paragraph: 'editor-paragraph',
    quote: 'editor-quote',
    heading: {
        h1: 'editor-heading-h1',
        h2: 'editor-heading-h2',
        h3: 'editor-heading-h3',
        h4: 'editor-heading-h4',
        h5: 'editor-heading-h5',
    },
    list: {
        nested: {
            listitem: 'editor-nested-listitem',
        },
        ol: 'editor-list-ol',
        ul: 'editor-list-ul',
        listitem: 'editor-listitem',
    },
    image: 'editor-image',
    link: 'editor-link',
    text: {
        bold: 'editor-bold',
        italic: 'editor-italic',
        overflowed: 'editor-text-overflowed',
        hashtag: 'editor-text-hashtag',
        underline: 'editor-underline',
        strikethrough: 'editor-strikethrough',
        underlinedesk: 'editor-underlinedesk',
        code: 'editor-code',
    },
    code: 'editor-code',
    codeHighlight: {
        atrule: 'editor-tokenAtrule',
        attr: 'editor-tokenAttr',
        boolean: 'editor-tokenBoolean',
        builtin: 'editor-tokenBuiltin',
        cdata: 'editor-tokenCdata',
        char: 'editor-tokenChar',
        class: 'editor-tokenClass',
        className: 'editor-tokenClassName',
        comment: 'editor-tokenComment',
        constant: 'editor-tokenConstant',
        deleted: 'editor-tokenDeleted',
        doctype: 'editor-tokenDoctype',
        entity: 'editor-tokenEntity',
        function: 'editor-tokenFunction',
        important: 'editor-tokenImportant',
        inserted: 'editor-tokenInserted',
        keyword: 'editor-tokenKeyword',
        namespace: 'editor-tokenNamespace',
        number: 'editor-tokenNumber',
        operator: 'editor-tokenOperator',
        prolog: 'editor-tokenProlog',
        property: 'editor-tokenProperty',
        punctuation: 'editor-tokenPunctuation',
        regex: 'editor-tokenRegex',
        selector: 'editor-tokenSelector',
        string: 'editor-tokenString',
        symbol: 'editor-tokenSymbol',
        tag: 'editor-tokenTag',
        url: 'editor-tokenUrl',
        variable: 'editor-tokenVariable',
    },
}

interface StrategyEditorProps {
    initialContent?: string;
    onSave?: (content: string) => void;
    readOnly?: boolean;
}

export default function StrategyEditor({ initialContent, onSave, readOnly = false }: StrategyEditorProps) {
    const [editable, setEditable] = useState(!readOnly)

    useEffect(() => {
        setEditable(!readOnly)
    }, [readOnly])

    const initialConfig = useMemo(() => ({
        namespace: 'strategy-editor',
        theme,
        editable,
        editorState: (initialContent && initialContent.startsWith('{')) ? initialContent : undefined,
        nodes: [
            HeadingNode,
            ListNode,
            ListItemNode,
            QuoteNode,
            CodeNode,
            CodeHighlightNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            AutoLinkNode,
            LinkNode,
        ],
        onError(error: Error) {
            console.error(error)
        },
    }), [editable, initialContent])

    const handleChange = useCallback((state: EditorState) => {
        if (onSave) {
            onSave(JSON.stringify(state))
        }
    }, [onSave])

    return (
        <div className="editor-container">
            <div className="editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: '#f8f9fa', borderBottom: '1px solid #e1e4e8' }}>
                <span style={{ fontWeight: 600, color: '#444' }}>Strategy Description</span>
                {!readOnly && (
                    <button
                        onClick={() => setEditable(e => !e)}
                        style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            border: '1px solid #d1d5db',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {editable ? 'Switch to View' : 'Edit Description'}
                    </button>
                )}
            </div>

            <LexicalComposer initialConfig={initialConfig}>
                <div className="editor-inner">
                    {editable && <ToolbarPlugin />}
                    <RichTextPlugin
                        ErrorBoundary={LexicalErrorBoundary}
                        contentEditable={
                            <ContentEditable
                                className={editable ? 'editor-input' : 'editor-view'}
                            />
                        }
                        placeholder={editable ? <div className="editor-placeholder">Describe your strategy in detail...</div> : null}
                    />
                    <HistoryPlugin />
                    <ListPlugin />
                    <LinkPlugin />
                    {editable && <OnChangePlugin onChange={handleChange} />}
                </div>
            </LexicalComposer>
        </div>
    )
}
