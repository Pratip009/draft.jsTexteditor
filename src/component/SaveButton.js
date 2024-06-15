import React from 'react';

const SaveButton = ({ onSave }) => (
  <button onClick={onSave} style={{ marginBottom: '20px' }}>
    Save
  </button>
);

export default SaveButton;