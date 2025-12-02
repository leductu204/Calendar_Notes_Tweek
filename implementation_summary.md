# Implementation Summary: UI Optimization

## 1. Someday Section Position
- **Goal**: Move the "Someday" section up to be closer to the calendar grid ("vào đuôi dưới của Monday").
- **Action**: Updated `fe/src/styles/index.css` to remove the top margin of `.someday-section`.
- **Result**: The Someday section now sits directly below the calendar grid, reducing visual separation.

## 2. Note Editor Optimization
- **Goal**: Optimize the `NoteEditor` modal to match the provided design (cleaner look, specific icons, color picker popup).
- **Actions**:
    - **Refactored `fe/src/components/notes/NoteEditor.jsx`**:
        - Replaced the entire component structure.
        - Implemented a new Header with Date, Delete, Refresh, Color, Bell, and More icons.
        - Implemented a new Toolbar with Heading, Bold, List, Align, and Link icons.
        - Implemented a new Footer with Subtask input and Paperclip icon.
        - Added a custom Color Picker popup with "Premium" label and circular swatches.
        - Used inline SVGs for all icons to ensure a premium look without external dependencies.
    - **Updated `fe/src/styles/notes.css`**:
        - Added comprehensive styles for the new `NoteEditor` structure (`.note-editor-optimized`).
        - Styled the new color picker popup, swatches, and preview circle.
        - Styled the toolbar, inputs, and footer to match the design.
        - Fixed previous CSS corruption issues in the file.

## Files Modified
- `fe/src/styles/index.css`
- `fe/src/components/notes/NoteEditor.jsx`
- `fe/src/styles/notes.css`
