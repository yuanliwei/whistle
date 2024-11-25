require('./base-css.js');
require('../css/context-menu.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var EditorDialog = require('./editor-dialog');

var ContextMenu = React.createClass({
  getInitialState: function () {
    return {};
  },
  componentDidMount: function () {
    var self = this;
    self.container = document.createElement('div');
    document.body.appendChild(self.container);
    self.componentDidUpdate();
    $(document)
      .on('mousedown click', function (e) {
        if ($(e.target).closest('.w-context-menu').length) {
          if (e.target.nodeName !== 'INPUT') {
            e.preventDefault();
          }
          return;
        }
        self.hide();
      })
      .on('keydown', function (e) {
        if (e.keyCode === 9) {
          self.hide();
        }
      });
    $(window).on('resize blur', function () {
      self.hide();
    });
  },
  componentDidUpdate: function () {
    ReactDOM.unstable_renderSubtreeIntoContainer(
      this,
      this.getDialogElement(),
      this.container
    );
  },
  preventDefault: function (e) {
    e.preventDefault();
  },
  isVisible: function () {
    return this.state.visible;
  },
  onClick: function (e) {
    var target = $(e.target).closest('li');
    e.preventDefault();
    if (
      target.hasClass('w-ctx-sub-menu-list') ||
      target.hasClass('w-ctx-item-disabled')
    ) {
      return;
    }
    var data = this.state;
    !target.hasClass('w-ctx-item-multi') && !data.radio && this.hide();
    var action = target.attr('data-menu-action');
    if (this.props.onClick) {
      this.props.onClick(
        action,
        e,
        target.attr('data-parent-action'),
        target.attr('data-name')
      );
    }
    if ((e.shiftKey || e.ctrlKey || e.metaKey) && target.attr('data-shift-to-edit')) {
      this.refs.editorDialog.show({
        value: target.attr('data-clipboard-text')
      });
    }
    if (data.radio) {
      data.list.forEach(item => {
        item.selected = item.action == action;
      });
      this.setState({});
    }
  },
  getDialogElement: function () {
    var self = this;
    var data = self.state;
    var list = data.list || [];
    var radio = data.radio;
    return (
      <div
        onClick={self.onClick}
        className={'w-context-menu ' + (data.className || '')}
        onContextMenu={self.onClick}
        style={{
          left: data.left,
          top: data.top,
          display: data.visible ? '' : 'none'
        }}
      >
        <ul className="w-ctx-menu-list">
          {list.map(function (item) {
            var subList = item.list;
            var shiftToEdit = item.shiftToEdit ? 1 : undefined;
            var multiple = !subList && item.multiple;
            return (
              <li
                data-menu-action={item.action || item.name}
                key={item.name}
                className={
                  'w-ctx-menu-item ' +
                  (item.sep ? 'w-ctx-item-sep' : '') +
                  (item.disabled ? ' w-ctx-item-disabled' : '') +
                  (subList ? ' w-ctx-sub-menu-list' : '') +
                  (item.copyText ? ' w-copy-text' : '')
                }
                data-clipboard-text={item.copyText}
                style={{ display: item.hide ? 'none' : undefined }}
                onClick={item.onClick}
              >
                <label className={'w-ctx-item-tt' + (item.selected ? ' w-ctx-selected' : '')}>
                  {radio ? <span className={'w-ctx-checked' + (item.selected ? ' visible' : '')}>✔️</span> : undefined}
                  {item.icon ? (
                    <span
                      style={{ marginRight: '5px' }}
                      className={'glyphicon glyphicon-' + item.icon}
                    />
                  ) : null}
                  {multiple ? (
                    <input type="checkbox" checked={item.checked} />
                  ) : null}
                  {item.name}
                </label>
                {subList ? (
                  <span className="glyphicon glyphicon-play" />
                ) : undefined}
                {subList ? <div className="w-ctx-menu-gap"></div> : undefined}
                {subList ? (
                  <ul
                    className="w-ctx-menu-list"
                    style={
                      item.top > 0
                        ? { top: -item.top * 30 - 1, maxHeight: item.maxHeight }
                        : undefined
                    }
                  >
                    {subList.map(function (subItem, i) {
                      return (
                        <li
                          title={subItem.title}
                          data-parent-action={item.action}
                          data-name={subItem.name}
                          data-menu-action={subItem.action || subItem.name}
                          key={i}
                          onClick={subItem.onClick}
                          className={
                            'w-ctx-menu-item ' +
                            (subItem.sep ? 'w-ctx-item-sep' : '') +
                            (subItem.disabled ? ' w-ctx-item-disabled' : '') +
                            (subItem.copyText ? ' w-copy-text' : '')
                          }
                          data-clipboard-text={subItem.copyText}
                          data-shift-to-edit={shiftToEdit}
                        >
                          <label className="w-ctx-item-tt">
                            {subItem.multiple ? (
                              <input
                                type="checkbox"
                                checked={subItem.checked}
                              />
                            ) : null}
                            {subItem.name}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                ) : undefined}
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
  show: function (data) {
    data.visible = true;
    this.setState(data);
  },
  hide: function () {
    if(!this.__isMounted){
      return;
    }
    this.setState({ visible: false });
  },
  update: function () {
    this.state.visible && this.setState({});
  },
  render: function () {
    return <EditorDialog ref="editorDialog" />;
  }
});

ContextMenu.util = util;
ContextMenu.$ = $;

module.exports = ContextMenu;
