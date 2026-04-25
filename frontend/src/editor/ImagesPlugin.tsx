import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect } from "react";
import {
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from "lexical";
import { $createImageNode } from "./ImageNode";

export type InsertImagePayload = {
  src: string;
  altText?: string;
};

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND");

export default function ImagesPlugin() {
  const [editor] = useLexicalComposerContext();

  const insertImage = useCallback(
    (payload: InsertImagePayload) => {
      const { src, altText } = payload;
      if (!src) return;
      editor.update(() => {
        const imageNode = $createImageNode(src, altText);
        $insertNodes([imageNode]);
      });
    },
    [editor],
  );

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload: InsertImagePayload) => {
        insertImage(payload);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, insertImage]);

  return null;
}

