import { Injectable } from '@angular/core';
import { defaults, has, get, defaultsDeep } from 'lodash';
import { timeout } from 'q';

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
  private variation: string[];
  private options: TooltipOptions;
  private classNames: string[];
  private animationStart: number;
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


  constructor(options: TooltipOptions) {
    this.options = defaultsDeep({}, options, Tooltip._defaults);
    this.body = document.body;
    this.tooltip = document.createElement('div');
    this.classNames = [];
    this.tooltip.className = this.className;
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

  private _calcTooltipPosition() {

  }

  private _setClassName() {
    this.tooltip.className = this.className;
  }

  show() {
    const { options, options: { animation } } = this;

    if (this._waitUntilAnimationEnd(() => this.show(), 100)) {
      return;
    }
    
    this.tooltip.innerHTML = this._tooltipBody();
    this.body.appendChild(this.tooltip);

    this._addClass(animation.states.enter);
    this._addClass(animation.states.animate);
    setTimeout(() => {
      this._addClass(animation.states.enter + '-active');
    });
    setTimeout(() => {
      this._removeClass(animation.states.animate);
      this._removeClass(animation.states.enter);
      this._removeClass(animation.states.enter + '-active');
    }, this.options.animation.duration);
    this.animationStart = Date.now();
  }

  hide() {
    const { options, options: { animation } } = this;

    if (this._waitUntilAnimationEnd(() => this.hide(), 100)) {
      return;
    }
    this._addClass(animation.states.leave);
    setTimeout(() => {
      this._addClass(animation.states.animate);
      this._addClass(animation.states.leave + '-active');
    });
    setTimeout(() => {
      this._removeClass(animation.states.animate);
      this._removeClass(animation.states.leave);
      this._removeClass(animation.states.leave + '-active');
      this.body.removeChild(this.tooltip);
    }, this.options.animation.duration);
  }

  _waitUntilAnimationEnd(fun: () => void, interval: number) {
    if (this.classNames.indexOf(this.options.animation.states.animate) !== -1) {
      setTimeout(fun(), Math.max(interval));
      return true;
    }
    return false;
  }

}

@Injectable({
  providedIn: 'root'
})
export class TooltipService {
  private _tooltip: Tooltip;
  constructor() {
    this._tooltip = new Tooltip({
      content: 'Init content',
      target: '.target',
      html: `<table>
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
      </table>`,
      animation: {
        duration: 500,
      }
    });
  }

  show() {
    this._tooltip.show();
  }

  hide() {
    this._tooltip.hide();
  }
}
