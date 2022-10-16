var React = require('react');
var ReactDOM = require('react-dom');

var MonacoLoader = require('./components/editor/MonacoLoader.js').default;
var MonacoUtil = require('./components/editor/MonacoUtil.js').default;

var TextView = React.createClass({
  componentDidMount: async function () {

    this.props_value = this.props.value;
    this.updateValue();

    let monaco = await MonacoLoader.load();
    let monacoUtil = new MonacoUtil(monaco);
    monacoUtil.addLogTheme();
    monacoUtil.enableTimeFormatProvider();

    var container = ReactDOM.findDOMNode(this.refs.container);
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

    var textarea = ReactDOM.findDOMNode(this.refs.textarea);
    textarea.style.display = 'none';

    this.props_value = this.props.value;
    editor.setValue(this.props_value);
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
    return (
      <div ref="container"
        style={{ display: '-webkit-box' }}
        className={this.props.className || ''}
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
