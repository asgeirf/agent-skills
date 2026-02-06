function Toolbar({ title, description }) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-title">{title || 'Graphilizer'}</div>
        {description && <div className="toolbar-description">{description}</div>}
      </div>
    </div>
  );
}

export default Toolbar;
