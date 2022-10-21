require('./base-css.js');
require('../css/divider.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

var util = require('./util');

var HIDE = { display: 'none' };

util.addDragEvent('.w-divider', function (target, x, y) {
  target = target.parent();
  var con = target.parent();
  var isVertical = !con.hasClass('box');
  var isRight = target.hasClass('w-divider-right');
  var size = isVertical
    ? target[0].offsetHeight - (isRight ? y : -y)
    : target[0].offsetWidth - (isRight ? x : -x);
  var conSize = con[0][isVertical ? 'offsetHeight' : 'offsetWidth'];
  target[isVertical ? 'height' : 'width'](
    Math.min(conSize - 5, Math.max(5, size))
  );
});

var Divider = React.createClass({
  componentDidMount: function () {
    this.reset();
  },
  triggerDOMReady: function () {
    if (this.__inited) {
      return;
    }
    this.__inited = true;
    this.props.onDOMReady && this.props.onDOMReady();
  },
  reset: function () {
    var self = this;
    var divider = ReactDOM.findDOMNode(self.refs.divider);
    var vertical = util.getBoolean(self.props.vertical);
    var prop = vertical ? 'height' : 'width';
    var con = $(divider);
    var leftElem = con.children('.w-divider-left');
    var rightElem = con.children('.w-divider-right');
    leftElem.add(rightElem).css({
      height: 'auto',
      width: 'auto'
    });
    if (self._leftWidth > 0) {
      leftElem[prop](self._leftWidth);
      self.triggerDOMReady();
      return;
    }

    var rightWidth = parseInt(self.props.rightWidth, 10);
    if (!(rightWidth > 0)) {
      setTimeout(function () {
        rightWidth =
          (vertical ? divider.offsetHeight : divider.offsetWidth) / 2;
        rightElem[prop](Math.max(rightWidth, 5));
        self.triggerDOMReady();
      }, 10);
      return;
    }

    rightElem[prop](Math.max(rightWidth, 5));
    self.triggerDOMReady();
  },
  render: function () {
    var vertical = util.getBoolean(this.props.vertical);
    let size = this.props.size || '0px';
    let color = this.props.color || '';
    var divider = <div className="w-divider" style={{minHeight:size, minWidth:size, background:color}}></div>;
    var hideLeft = this.props.hideLeft;
    var hideRight = this.props.hideRight;
    var leftWidth = parseInt(this.props.leftWidth, 10);
    if (leftWidth > 0) {
      this._leftWidth = leftWidth;
    } else {
      leftWidth = 0;
    }
    var noLeft = leftWidth || hideLeft;

    return (
      <div
        ref="divider"
        className={
          (vertical ? 'orient-vertical-box' : 'box') +
          ' fill w-divider-con ' +
          (this.props.className || '') +
          (util.getBoolean(this.props.hide) ? ' hide' : '')
        }
      >
        <div
          style={hideLeft ? HIDE : undefined}
          className={
            (leftWidth ? '' : 'fill ') +
            'w-divider-left orient-vertical-box ' +
            (this.props.leftClassName || '')
          }
        >
          {leftWidth && !hideRight ? divider : null}
          {this.props.children[0]}
        </div>
        <div
          style={hideRight ? HIDE : undefined}
          className={
            (noLeft ? 'fill ' : '') +
            'w-divider-right orient-vertical-box ' +
            (this.props.rightClassName || '')
          }
        >
          {noLeft ? null : divider}
          {this.props.children[1]}
        </div>
      </div>
    );
  }
});

module.exports = Divider;
