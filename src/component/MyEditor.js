import React, { useState, useEffect, useRef } from 'react';
import {
  Editor,
  EditorState,
  RichUtils,
  convertToRaw,
  convertFromRaw,
  Modifier,
  SelectionState
} from 'draft-js';
import 'draft-js/dist/Draft.css';
import '../styles.css';
import customStyleMap from './CustomStyleMap';
import Title from './Title';
import SaveButton from './SaveButton';

const MyEditor = () => {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const editor = useRef(null);

  useEffect(() => {
    const savedData = localStorage.getItem('editorContent');
    if (savedData) {
      const contentState = convertFromRaw(JSON.parse(savedData));
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, []);

  const handleKeyCommand = (command, editorState) => {
    if (command === "split-block") {
      const currentContent = editorState.getCurrentContent();
      const selection = editorState.getSelection();
      const startKey = selection.getStartKey();
      const block = currentContent.getBlockForKey(startKey);
      const blockText = block.getText();

      let styleLength = 0;
      if (blockText.endsWith("# ")) {
        styleLength = 2;
      } else if (blockText.endsWith("* ")) {
        styleLength = 2;
      } else if (blockText.endsWith("** ")) {
        styleLength = 3;
      } else if (blockText.endsWith("*** ")) {
        styleLength = 4;
      } else if (blockText.endsWith("``` ")) {
        styleLength = 4;
      }

      if (styleLength > 0) {
        const newContentState = Modifier.removeInlineStyle(
          currentContent,
          selection.merge({
            focusOffset: blockText.length - styleLength,
          }),
          "BOLD",
          "color-red",
          "UNDERLINE",
          "header-one",
          "code-block"
        );
        const newState = EditorState.push(
          editorState,
          newContentState,
          "change-inline-style"
        );
        setEditorState(newState);
        return "handled";
      }
    }

    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  const handleBeforeInput = (chars, editorState) => {
    const currentContent = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const blockKey = selection.getStartKey();
    const block = currentContent.getBlockForKey(blockKey);
    const blockLength = block.getLength();

    if (chars === "\n") {
      const nextBlockKey = currentContent.getKeyAfter(blockKey);
      const nextBlock = currentContent.getBlockForKey(nextBlockKey);

      if (nextBlock.getLength() === 0) {
        const newContentState = Modifier.setBlockType(
          currentContent,
          SelectionState.createEmpty(nextBlockKey),
          "unstyled"
        );

        const newStateWithUnstyled = Modifier.removeAllInlineStyles(
          newContentState,
          SelectionState.createEmpty(nextBlockKey)
        );

        const newState = EditorState.push(
          editorState,
          newStateWithUnstyled,
          "change-block-type"
        );
        setEditorState(newState);
        return "handled";
      }
    }

    if (chars === " ") {
      const blockText = block.getText();

      if (blockText.startsWith("#") && blockLength === 1) {
        const newContentState = Modifier.removeRange(
          currentContent,
          selection.merge({
            anchorOffset: 0,
            focusOffset: 1,
          }),
          "backward"
        );
        const newState = EditorState.push(
          editorState,
          newContentState,
          "remove-range"
        );
        setEditorState(RichUtils.toggleBlockType(newState, "header-one"));
        return "handled";
      } else if (blockText.startsWith("*") && blockLength === 1) {
        const newContentState = Modifier.removeRange(
          currentContent,
          selection.merge({
            anchorOffset: 0,
            focusOffset: 1,
          }),
          "backward"
        );
        const newState = EditorState.push(
          editorState,
          newContentState,
          "remove-range"
        );
        setEditorState(RichUtils.toggleInlineStyle(newState, "BOLD"));
        return "handled";
      } else if (blockText.startsWith("**") && blockLength === 2) {
        const newContentState = Modifier.removeRange(
          currentContent,
          selection.merge({
            anchorOffset: 0,
            focusOffset: 2,
          }),
          "backward"
        );
        const newState = EditorState.push(
          editorState,
          newContentState,
          "remove-range"
        );
        setEditorState(RichUtils.toggleInlineStyle(newState, "color-red"));
        return "handled";
      } else if (blockText.startsWith("***") && blockLength === 3) {
        const newContentState = Modifier.removeRange(
          currentContent,
          selection.merge({
            anchorOffset: 0,
            focusOffset: 3,
          }),
          "backward"
        );
        const newState = EditorState.push(
          editorState,
          newContentState,
          "remove-range"
        );

        let nextState = RichUtils.toggleInlineStyle(newState, "UNDERLINE");

        const currentStyle = editorState.getCurrentInlineStyle();
        if (currentStyle.has("BOLD")) {
          nextState = RichUtils.toggleInlineStyle(nextState, "BOLD");
        }
        if (currentStyle.has("color-red")) {
          nextState = RichUtils.toggleInlineStyle(nextState, "color-red");
        }

        setEditorState(nextState);
        return "handled";
      } else if (blockText.startsWith("```") && blockLength === 3) {
        const newContentState = Modifier.removeRange(
          currentContent,
          selection.merge({
            anchorOffset: 0,
            focusOffset: 5,
          }),
          "backward"
        );
        const newState = EditorState.push(
          editorState,
          newContentState,
          "remove-range"
        );

        const withoutUnderline = Modifier.removeInlineStyle(
          newState.getCurrentContent(),
          newState.getSelection(),
          "UNDERLINE"
        );
        const finalState = EditorState.push(
          newState,
          withoutUnderline,
          "change-inline-style"
        );

        setEditorState(RichUtils.toggleBlockType(finalState, "code-block"));
        return "handled";
      }
    }

    return "not-handled";
  };

  const handleChange = (editorState) => {
    setEditorState(editorState);
  };

  const saveContent = () => {
    const contentState = editorState.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    localStorage.setItem('editorContent', JSON.stringify(rawContent));
    alert('Content saved!');
  };

  return (
    <div className="editor-container">
      <Title />
      <SaveButton onSave={saveContent} />
      <div className="editor" onClick={() => editor.current.focus()}>
        <Editor
          editorState={editorState}
          handleKeyCommand={handleKeyCommand}
          handleBeforeInput={handleBeforeInput}
          onChange={handleChange}
          customStyleMap={customStyleMap}
          ref={editor}
        />
      </div>
    </div>
  );
};

export default MyEditor;
