"use strict";

var React = require('react');
var ReactDOM = require('react-dom');

var animateScroll = require('./animate-scroll');
var scrollSpy = require('./scroll-spy');
var defaultScroller = require('./scroller');

var Helpers = {

  Scroll: function (Component, customScroller) {

    var scroller = customScroller || defaultScroller;

    return React.createClass({

      propTypes: {
        to: React.PropTypes.string.isRequired,
        offset: React.PropTypes.number,
        delay: React.PropTypes.number,
        onClick: React.PropTypes.func,
        duration: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.func])
      },
      
      getDefaultProps: function() {
        return {offset: 0};
      },

      scrollTo : function(to, props) {
          scroller.scrollTo(to, props);
      },

      handleClick: function(event) {

        /*
         * give the posibility to override onClick
         */

        if(this.props.onClick) {
          this.props.onClick(event);
        }

        /*
         * dont bubble the navigation
         */

        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();

        /*
         * do the magic!
         */

        this.scrollTo(this.props.to, this.props);

      },

      componentWillReceiveProps: function(nextProps) {
        var active = nextProps.active;
        if (active !== undefined) {
          this.setState({
            active: active
          });
        }
      },

      componentDidMount: function() {

        scrollSpy.mount();

        if(this.props.spy) {
          var to = this.props.to;
          var element = null;

          scrollSpy.addStateHandler((function() {
            if(scroller.getActiveLink() !== to) {
              this.setState({ active : false });
              return;
            }

            this.setState({ active : true });

            if(this.props.onSetActive) {
              this.props.onSetActive(to);
            }
          }).bind(this));

          scrollSpy.addSpyHandler((function(y) {

            if(!element) {
                element = scroller.get(to);
            }

            var cords = element.getBoundingClientRect();
            var elemTopBound = Math.floor(cords.top + y);
            var elemBottomBound = Math.floor(elemTopBound + cords.height);
            var offsetY = y - this.props.offset;
            var isInside = (offsetY >= elemTopBound && offsetY < elemBottomBound);
            var isOutside = (offsetY < elemTopBound || offsetY >= elemBottomBound);
            var activeLink = scroller.getActiveLink();

            if (isOutside && activeLink === to) {
              scroller.setActiveLink(void 0);
              this.setState({ active : false });
            } else if (isInside && activeLink != to) {
              scroller.setActiveLink(to);
              scrollSpy.updateStates();
            }
          }).bind(this));
        }
      },
      componentWillUnmount: function() {
        scrollSpy.unmount();
      },
      render: function() {
        var className = "";
        if(this.state && this.state.active) {
          className = ((this.props.className || "") + " " + (this.props.activeClass || "active")).trim();
        } else {
          className = this.props.className
        }

        var props = {};
        for(var prop in this.props) {
          props[prop] = this.props[prop];
        }

        props.className = className;
        props.onClick = this.handleClick;

        return React.createElement(Component, props);
      }
    });
  },


  Element: function(Component) {
    return React.createClass({
      propTypes: {
        name: React.PropTypes.string.isRequired
      },
      componentDidMount: function() {
        var domNode = ReactDOM.findDOMNode(this);
        defaultScroller.register(this.props.name, domNode);
      },
      componentWillUnmount: function() {
        defaultScroller.unregister(this.props.name);
      },
      render: function() {
        return React.createElement(Component, this.props);
      }
    });
  }
};

module.exports = Helpers;
