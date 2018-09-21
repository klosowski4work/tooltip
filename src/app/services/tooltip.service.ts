import { Injectable } from '@angular/core';
import { has, defaultsDeep, delay } from 'lodash';

const ElementNotFoundException = {};
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
  private tooltipElement: HTMLElement;
  private targetElement: HTMLElement;
  private options: TooltipOptions;
  private classNames: string[];
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
    this.classNames = [];
    this._initElement();
    this.setTarget(options.target);
    this.isTooltipVisible = false;
  }

  get className() {
    const classNameBase = this.options.className;
    return `${classNameBase} ${this.classNames.join(' ')}`;
  }

  setTarget(target: string) {
    this.targetElement = document.querySelector(target);
  }

  private _addClass(className: string) {
    if (this.classNames.indexOf(className) === -1) {
      this.classNames.push(className);
    }
    this._setClassName();
  }

  private _initElement() {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = this.className;
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
    this.tooltipElement.className = this.className;
  }

  show() {
    if (!this.isTooltipVisible) {
      this.tooltipElement.innerHTML = this._tooltipBody();
      this._setClassName();
      this.body.appendChild(this.tooltipElement);
      this._updatePosition();
      this._setEnterClasses()
        .then(() => this._trackTooltip());
    }
  }

  hide() {
    if (this.isTooltipVisible) {
      this.isTooltipVisible = false;
      this._setLeaveClasses()
        .then(() => this.body.removeChild(this.tooltipElement))
        .catch((e) => { });
    } else {
      delay(() => this.hide(), 100);
    }
  }

  private _updatePosition() {
    const targetBB = this.targetElement.getBoundingClientRect();
    const tooltipBB = this.tooltipElement.getBoundingClientRect();
    // this.tooltipElement.style.transform = `translate(${targetBB.left}px, ${targetBB.top - (targetBB.height / 2 + tooltipBB.height / 2)}px)`;
    this.tooltipElement.style.top = `${targetBB.top - tooltipBB.height }px`;
    this.tooltipElement.style.left = `${targetBB.left}px`;
    console.log('targetBB',targetBB);
    console.log('tooltipBB',tooltipBB);
  }

  private _trackTooltip() {
    this.isTooltipVisible = true;
    const tick = () => {
      window.requestAnimationFrame(() => {
        if (!this.isTooltipVisible) {
          return;
        }
        tick();
        try {
          this._updatePosition();
        } catch (e) {
          if (e !== ElementNotFoundException) {
            throw e;
          }
        }
      });
    };
    tick();
  }

  private _setEnterClasses(): Promise<void> {
    const { options: { animation } } = this;
    return new Promise((resolve) => {
      this._addClass(animation.states.enter);
      this._addClass(animation.states.animate);
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
  private _setLeaveClasses(): Promise<void> {
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
    this.show = () => {
      this._tooltip = new Tooltip({
        content: 'Init content',
        target: '.target',
        // html: content,
        animation: {
          duration: 200,
        }
      });
      this._tooltip.show();
    }
    this.hide = () => this._tooltip.hide();
  }
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