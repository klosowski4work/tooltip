import { Injectable } from '@angular/core';
import { defaults, has, get, defaultsDeep } from 'lodash';
import { timeout } from 'q';
import _ = require('lodash');

interface TooltipOptions {
  content?: string,
  target?: string,
  container?: string,
  header?: string,
  html?: string,
  className?: string,
  animation?: {
    duration?: number,
    states?: {
      animate?: string,
      enter?: string,
      leave?: string,
    }
  },
}


export class BorderBox {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  width: number;
  height: number;
  cx: number; // c for center
  cy: number;
}

class Tooltip {
  private body;
  private tooltip;
  private options: TooltipOptions;
  private classNames: string[];
  private canShow: boolean;
  private canHide: boolean;
  private static _defaults = {
    className: 'tooltip',
    animation: {
      duration: 0,
      states: {
        animate: 'animate',
        enter: 'enter',
        leave: 'leave',
      }
    }
  }
  isTooltipVisible: boolean;

  constructor(options: TooltipOptions) {
    this.options = defaultsDeep({}, options, Tooltip._defaults);
    this.body = document.body;
    this.tooltip = document.createElement('div');
    this.classNames = [];
    this.tooltip.className = this.className;
    this.canShow = true;
    this.canHide = false;
  }

  get className() {
    const classNameBase = this.options.className;
    return `${classNameBase} ${this.classNames.join(' ')}`;
  }
  private _addClass(className: string) {
    if (this.classNames.indexOf(className) === -1) {
      this.classNames.push(className);
    }
    this._setClassName();
  }

  private _removeClass(className: string) {
    try {
      this.classNames.splice(this.classNames.indexOf(className), 1);
      this._setClassName();
    } catch (e) { }
  }

  private _tooltipBody() {
    const { options } = this;
    if (has(options, 'html')) {
      return options.html;
    } else {
      return options.content;
    }
  }

  private _setClassName() {
    this.tooltip.className = this.className;
  }

  show() {
    this.tooltip.innerHTML = this._tooltipBody();
    this.body.appendChild(this.tooltip);
    this._setEneterClasses()
  }

  hide() {
    this._setLeaveClasses()
      .then(() => this.body.removeChild(this.tooltip))
      .catch((e) => { });
  }

  _setEneterClasses(): Promise<void> {
    const { options: { animation } } = this;
    return new Promise((resolve) => {
      this._addClass(animation.states.animate);
      this._addClass(animation.states.enter);
      setTimeout(() => {
        this._addClass(animation.states.enter + '-active');
        setTimeout(() => {
          this._removeClass(animation.states.animate);
          this._removeClass(animation.states.enter);
          this._removeClass(animation.states.enter + '-active');
          resolve();
        }, animation.duration);
      });
    });
  }
  _setLeaveClasses(): Promise<void> {
    const { options: { animation } } = this;
    return new Promise((resolve) => {
      this._addClass(animation.states.leave);
      this._addClass(animation.states.animate);
      setTimeout(() => {
        this._addClass(animation.states.leave + '-active');
        setTimeout(() => {
          this._removeClass(animation.states.animate);
          this._removeClass(animation.states.leave);
          this._removeClass(animation.states.leave + '-active');
          resolve();
        }, animation.duration);
      });
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class TooltipService {
  private _tooltip: Tooltip;
  show: () => void;
  hide: () => void;
  constructor() {
    this._tooltip = new Tooltip({
      content: 'Init content',
      target: '.target',
      html: content,
      animation: {
        duration: 500,
      }
    });

    const show = () => this._tooltip.show();
    this.show = _.throttle(show, 1000);
    const hide = () => this._tooltip.hide();
    this.hide = _.debounce(hide, 1000);
  }
  // test = () => console.log('debounce');
  // deb = _.throttle(this.test, 1000);



}

const content = `<table>
<tbody>
  <tr>
    <td>qwe</td>
    <td>qwe1</td>
    <td>qwe2</td>
  </tr>
  <tr>
    <td>qwe</td>
    <td>qwe1</td>
    <td>qwe2</td>
  </tr>
</tbody>
</table>`;