import { DecoratorNode, type EditorConfig, type LexicalNode, type NodeKey, type SerializedLexicalNode } from "lexical";
import React from "react";

export type SerializedImageNode = {
  type: "image";
  version: 1;
  src: string;
  altText?: string;
} & SerializedLexicalNode;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key);
  }

  constructor(src: string, altText = "", key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        className="editor-image"
      />
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const node = new ImageNode(
      serializedNode.src,
      serializedNode.altText ?? "",
    );
    return node;
  }

  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
    };
  }
}

export function $createImageNode(src: string, altText = ""): ImageNode {
  return new ImageNode(src, altText);
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}

