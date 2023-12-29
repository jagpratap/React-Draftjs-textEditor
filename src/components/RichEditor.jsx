import {
  Editor,
  EditorState,
  Modifier,
  RichUtils,
  convertFromRaw,
  convertToRaw,
  getDefaultKeyBinding,
} from "draft-js";
import { useRef, useState } from "react";
import "./RichEditor.css";

import BlockStyleControls from "./BlockStyleControls";
import InlineStyleControls from "./InlineStyleControls";
import { useEffect } from "react";

// Custom overrides for "code" style.
const styleMap = {
  CODE: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
  RED: {
    color: "rgb(255, 0, 0)",
  },
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case "blockquote":
      return "RichEditor-blockquote";
    default:
      return null;
  }
}

function getModifiedText(newState, offset = 1) {
  const currentContent = newState.getCurrentContent();
  const currentSelection = newState.getSelection();
  const endOffset = currentSelection.getEndOffset();

  const newContent = Modifier.replaceText(
    currentContent,
    currentSelection.merge({
      anchorOffset: endOffset - offset,
      focusOffset: endOffset,
    }),
    ""
  );

  return EditorState.push(newState, newContent, "remove-range");
}

function RichEditorText() {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  const editorRef = useRef();

  function handleFocus() {
    editorRef.current.focus();
  }

  function handleEditorChange(newEditorState) {
    setEditorState(newEditorState);
  }

  useEffect(() => {
    const savedData = localStorage.getItem("editorData");
    if (savedData) {
      const contentState = convertFromRaw(JSON.parse(savedData));
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, []);

  function handleKeyCommand(command, newEditorState) {
    let newState = RichUtils.handleKeyCommand(newEditorState, command);

    if (command === "h1") {
      newState = getModifiedText(newEditorState);
      newState = RichUtils.toggleBlockType(newState, "header-one");
    }

    if (command === "boldText") {
      newState = getModifiedText(newEditorState);
      newState = RichUtils.toggleInlineStyle(newState, "BOLD");
    }

    if (command === "redText") {
      newState = getModifiedText(newEditorState, 2);
      newState = RichUtils.toggleInlineStyle(newState, "RED");
    }

    if (command === "underline") {
      newState = getModifiedText(newEditorState, 3);
      newState = RichUtils.toggleInlineStyle(newState, "UNDERLINE");
    }

    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  }

  function keyBindingFunction(e) {
    if (
      e.keyCode === 32 &&
      editorState.getCurrentContent().getPlainText().endsWith("#") &&
      editorState.getSelection().getStartOffset() === 1
    ) {
      return "h1";
    }

    if (
      e.keyCode === 32 &&
      editorState.getCurrentContent().getPlainText().endsWith("*") &&
      editorState.getSelection().getStartOffset() === 1
    ) {
      return "boldText";
    }

    if (
      e.keyCode === 32 &&
      editorState.getCurrentContent().getPlainText().endsWith("**") &&
      editorState.getSelection().getStartOffset() === 2
    ) {
      return "redText";
    }

    if (
      e.keyCode === 32 &&
      editorState.getCurrentContent().getPlainText().endsWith("***") &&
      editorState.getSelection().getStartOffset() === 3
    ) {
      return "underline";
    }

    return getDefaultKeyBinding(e);
  }

  function toggleBlockType(blockType) {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  }

  function toggleInlineStyle(inlineStyle) {
    setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  }

  function handleSaveEditorContent() {
    // Convert to raw js object
    const raw = convertToRaw(editorState.getCurrentContent());
    localStorage.setItem("editorData", JSON.stringify(raw));
    alert("Data successfully saved!!!");
  }

  let className = "RichEditor-editor";
  const contentState = editorState.getCurrentContent();
  if (!contentState.hasText()) {
    if (contentState.getBlockMap().first().getType() !== "unstyled") {
      className += " RichEditor-hidePlaceholder";
    }
  }

  return (
    <div>
      <div className="header">
        <div className="title">
          <h3>
            Draft.js Demo by <span>Jagpratap Singh</span>
          </h3>
        </div>
        <button onClick={handleSaveEditorContent}>Save</button>
      </div>
      <div className="RichEditor-root">
        <BlockStyleControls
          editorState={editorState}
          onToggle={toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={toggleInlineStyle}
        />
        <div className={className} onClick={handleFocus}>
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={handleKeyCommand}
            keyBindingFn={keyBindingFunction}
            onChange={handleEditorChange}
            placeholder="Tell a story..."
            ref={editorRef}
            spellCheck={true}
          />
        </div>
      </div>
    </div>
  );
}

export default RichEditorText;
