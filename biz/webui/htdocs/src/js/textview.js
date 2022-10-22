var React = require('react');
var ReactDOM = require('react-dom');

const storage = require('../js/storage.js');
var {load} = require('./components/editor/MonacoLoader.js');
var {MonacoUtil} = require('./components/editor/MonacoUtil.js');

// ReactClassComponent
var TextView = React.createClass({
  componentDidMount: async function () {

    this.props_value = this.props.value;
    this.updateValue();

    let monaco = await load();
    let monacoUtil = new MonacoUtil(monaco);
    monacoUtil.addLogTheme();
    monacoUtil.enableTimeFormatProvider();

    const KEY_CONFIG = '__textview_config__';
    this.config = {
      readOnly: false,
      fontSize: 16,
      language: 'json',
      wordWrap: 'on',
      showFoldingControls: 'mouseover',
      folding: true,
      minimap: true
    };
    try {
      this.config = JSON.parse(storage.get(KEY_CONFIG)) || this.config;
    } catch (ignore) { }

    const updateConfig = () => {
      storage.set(KEY_CONFIG, JSON.stringify(this.config));
    };

    /** @type{HTMLDivElement} */
    const container = ReactDOM.findDOMNode(this.refs.container);
    let editor = monaco.editor.create(container, {
      roundedSelection: false,
      scrollBeyondLastLine: false,
      renderWhitespace: true,
      dragAndDrop: true,
      automaticLayout: true,
      bracketPairColorization: {
        enabled: true
      }
    });
    this.editor = editor;
    monacoUtil.enableDragDrop(container, editor);
    monacoUtil.addActions(editor);
    monacoUtil.addAppActions(editor);

    monaco.editor.setModelLanguage(editor.getModel(), this.config.language);
    editor.updateOptions({
      readOnly: this.config.readOnly,
      fontSize: this.config.fontSize,
      wordWrap: this.config.wordWrap,
      showFoldingControls: this.config.showFoldingControls,
      folding: this.config.folding
    });
    const minimap = editor.getOption(monaco.editor.EditorOption.minimap);
    minimap.enabled = this.config.minimap;
    editor.updateOptions({ minimap: minimap });

    editor.onDidChangeModelLanguage(e => {
      this.config.language = e.newLanguage;
      updateConfig();
    });

    editor.onDidChangeConfiguration(() => {
      this.config.readOnly = editor.getOption(monaco.editor.EditorOption.readOnly);
      this.config.fontSize = editor.getOption(monaco.editor.EditorOption.fontSize);
      this.config.wordWrap = editor.getOption(monaco.editor.EditorOption.wordWrap);
      this.config.showFoldingControls = editor.getOption(monaco.editor.EditorOption.showFoldingControls);
      this.config.folding = editor.getOption(monaco.editor.EditorOption.folding);
      this.config.minimap = editor.getOption(monaco.editor.EditorOption.minimap).enabled;
      updateConfig();
    });

    var textarea = ReactDOM.findDOMNode(this.refs.textarea);
    textarea.style.display = 'none';

    this.props_value = this.props.value;
    editor.setValue(this.props_value);

    this.fullscreen = false;
    container.addEventListener('keydown', (ev) => {
      if (ev.key == 'F2') {
        ev.preventDefault();
        ev.stopPropagation();
        this.fullscreen = !this.fullscreen;
        this.forceUpdate();
      }
    });
  },
  componentDidUpdate: function () {
    this.updateValue();
  },
  shouldComponentUpdate: function (nextProps) {
    if (this.props_value !== nextProps.value) {
      this.props_value = nextProps.value;
      this.updateValue();
    }
    return this.props.className !== nextProps.className;
  },
  updateValue: function () {
    var self = this;
    var value = self.props_value || '';
    var textarea = ReactDOM.findDOMNode(self.refs.textarea);
    if (self.props.hide) {
      textarea.value = '';
      self.curValue = '';
      if (self.editor) {
        self.editor.setValue('');
      }
      clearTimeout(self._timeout);
      return;
    }
    if (value === self.curValue) {
      return;
    }
    clearTimeout(self._timeout);
    if (textarea.value === value) {
      return;
    }
    if (value.length < 10240) {
      textarea.value = value;
      self.curValue = value;
      if (self.editor) {
        self.editor.setValue(value);
      }
      return;
    }
    self.curValue = value;
    self._timeout = setTimeout(function () {
      textarea.value = value;
      if (self.editor) {
        self.editor.setValue(value);
      }
    }, 360);
  },
  render: function () {
    let fullscreen = this.fullscreen;
    return (
      <div ref="container"
        style={{ display: '-webkit-box' }}
        className={`${this.props.className || ''} ${fullscreen ? 'textview-fullscreen' : ''}`}
      >
        <textarea
          ref="textarea"
          style={{ display: 'block' }}
          // onKeyDown={util.preventDefault}
          // readOnly="readonly"
          className={this.props.className || ''}
        />
      </div>
    );
  }
});

module.exports = TextView;
