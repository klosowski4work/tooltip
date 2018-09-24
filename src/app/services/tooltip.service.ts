import { Injectable } from '@angular/core';
import { has, defaultsDeep, delay } from 'lodash';

const ElementNotFoundException = {};

function half(value: number) {
  return Math.round(value / 2);
}
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
export class BoundingRect {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  width: number;
  height: number;
  cx: number; // c for center
  cy: number;
}

function getBoundingRect(element: HTMLElement): BoundingRect {
  const boundingRect = element.getBoundingClientRect();
  return {
    x1: boundingRect.left,
    x2: boundingRect.right,
    y1: boundingRect.top,
    y2: boundingRect.bottom,
    width: boundingRect.width,
    height: boundingRect.height,
    cx: boundingRect.left + half(boundingRect.width),
    cy: boundingRect.top + half(boundingRect.height)
  }
}

enum TooltipPositions {
  Top = 'top',
  Bottom = 'bottom',
  Right = 'right',
  Left = 'left',
  Auto = 'auto'
}

interface TooltipOptions {
  content?: string,
  target?: {
    selector?: string,
    margin?: number,
  },
  container?: {
    selector?: string,
    marginInner?: number,
  },
  tooltip?: {
    margin?: number,
  },
  arrow?: {
    size?: number,
    marginCorner?: number,
  }
  header?: string,
  html?: string,
  track?: boolean,
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

class Tooltip {
  private body;
  private tooltipElement: HTMLElement;
  private targetElement: HTMLElement;
  private tongueElement: HTMLElement;
  private tooltipBodyElement: HTMLElement;
  private containerElement: HTMLElement;
  private options: TooltipOptions;
  private tooltipPosition: TooltipPositions;
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
    },
    position: TooltipPositions,
    tooltip: {
      margin: 0,
    },
    arrow: {
      size: 10,
      marginCorner: 0,
    },
    container: {
      selector: 'body',
      marginInner: 0,
    },
    track: true,

  }
  isTooltipVisible: boolean;

  constructor(options: TooltipOptions) {
    this.options = defaultsDeep({}, options, Tooltip._defaults);
    this.tooltipPosition = TooltipPositions.Top;
    this.body = document.body;
    this.classNames = [];
    this._initElement();
    this.setTarget(options.target.selector);
    this.setContainer(options.container.selector);
    this.isTooltipVisible = false;
  }

  get className() {
    const classNameBase = this.options.className;
    return [
      classNameBase,
      `${classNameBase}--${this.tooltipPosition}`,
      `${this.isOutside() ? classNameBase + '--outside' : ''}`,
      ...this.classNames
    ].join(' ');
  }

  isOutside() {
    try {
      const containerBR = getBoundingRect(this.containerElement);
      const tooltipBR = getBoundingRect(this.targetElement);

      return (
        (containerBR && tooltipBR && containerBR.x1 > tooltipBR.x2)
        || containerBR.x2 < tooltipBR.x1
        || containerBR.y1 > tooltipBR.y2
        || containerBR.y2 < tooltipBR.y1
      );
    } catch (e) {
      return false;
    }
  }

  setTarget(target: string) {
    this.targetElement = document.querySelector(target);
  }

  setContainer(container: string) {
    this.containerElement = document.querySelector(container);
  }

  private _addClass(className: string) {
    if (this.classNames.indexOf(className) === -1) {
      this.classNames.push(className);
    }
    this._setClassName();
  }

  private _getTemplate() {
    return `<div class="${this.options.className}__body"
      ${this._getStyle()}>
    </div>
    <div class="${this.options.className}__tongue">
      ${this._getTongue()}
    </div>
    `
  }
  private _getTongue() {
    const { size } = this.options.arrow;
    const halfSize = half(size);
    return `
    <svg 
      width = "${size}"
      height = "${size}"
      viewBox = "0 0 ${size} ${size}" >
      <path d="M0 ${halfSize} L${halfSize} ${size} L${size} ${halfSize} Z" />
      <line stroke - linecap="round"
        x1 = "0"
        y1 = "${halfSize}"
        x2 = "${halfSize}"
        y2 = "${size}"
        stroke - width="1" />
      <line stroke - linecap="round"
        x1 = "${halfSize}"
        y1 = "${size}"
        x2 = "${size}"
        y2 = "${halfSize}"
        stroke - width="1" />
      </svg>`
  }

  private _getStyle() {
    const { options } = this;
    const margin = Math.max(options.tooltip.margin, options.arrow.size);
    return `style="${margin ? 'margin:' + margin + 'px' : ''}"`
  }

  private _initElement() {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.innerHTML = this._getTemplate();
    this.tooltipElement.className = this.className;
    this.tongueElement = this.tooltipElement.querySelector(`.${this.options.className}__tongue`);
    this.tooltipBodyElement = this.tooltipElement.querySelector(`.${this.options.className}__body`);
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
      this.tooltipBodyElement.innerHTML = this._tooltipBody();
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
    } else {
      delay(() => this.hide(), 100);
    }
  }

  private _updatePosition() {
    const newPos = this._calcPosition();
    this.tooltipElement.style.top = `${newPos.y}px`;
    this.tooltipElement.style.left = `${newPos.x}px`;
    const tonguePos = this._calcTonguePosition();
    this.tongueElement.style.top = `${tonguePos.top}px`;
    this.tongueElement.style.left = `${tonguePos.left}px`;
    this._setClassName();
  }

  private _calcTonguePosition() {
    const tooltipBR = getBoundingRect(this.tooltipElement);
    const targetBR = getBoundingRect(this.targetElement);
    const { margin: marginTooltip } = this.options.tooltip;
    const { marginCorner, size: tongueSize } = this.options.arrow;
    const marginTongue = marginCorner + marginTooltip + half(tongueSize);
    switch (this.tooltipPosition) {
      case TooltipPositions.Bottom:
        return {
          top: marginTooltip,
          left: clamp(tooltipBR.width - (tooltipBR.x2 - targetBR.cx), marginTongue, tooltipBR.width - marginTongue),
        }
      case TooltipPositions.Top:
        return {
          top: tooltipBR.height - marginTooltip,
          left: clamp(tooltipBR.width - (tooltipBR.x2 - targetBR.cx), marginTongue, tooltipBR.width - marginTongue),
        }
      case TooltipPositions.Left:
        return {
          top: clamp(tooltipBR.height - (tooltipBR.y2 - targetBR.cy), marginTongue, tooltipBR.height - marginTongue),
          left: tooltipBR.width - marginTooltip,
        }
      case TooltipPositions.Right:
        return {
          top: clamp(tooltipBR.height - (tooltipBR.y2 - targetBR.cy), marginTongue, tooltipBR.height - marginTongue),
          left: marginTooltip,
        }
    }
  }

  private _calcPosition() {
    const tooltipBR = getBoundingRect(this.tooltipElement);
    const targetBR = getBoundingRect(this.targetElement);
    const containerBR = this._getContainerBoundingRect();
    let newPos;

    if (this._hasSpace(TooltipPositions.Top)) {
      newPos = {
        x: targetBR.cx - half(tooltipBR.width),
        y: targetBR.y1 - tooltipBR.height,
        pos: TooltipPositions.Top,
      }
    } else if (this._hasSpace(TooltipPositions.Bottom)) {
      newPos = {
        x: targetBR.cx - half(tooltipBR.width),
        y: targetBR.y2,
        pos: TooltipPositions.Bottom
      }
    } else if (this._hasSpace(TooltipPositions.Right)) {
      newPos = {
        x: targetBR.x2,
        y: targetBR.cy - half(tooltipBR.height),
        pos: TooltipPositions.Right
      }
    } else if (this._hasSpace(TooltipPositions.Left)) {
      newPos = {
        x: targetBR.x1 - tooltipBR.width,
        y: targetBR.cy - half(tooltipBR.height),
        pos: TooltipPositions.Left
      }
    }
    this.tooltipPosition = newPos.pos;
    return {
      x: clamp(newPos.x, containerBR.x1, containerBR.x2 - tooltipBR.width),
      y: clamp(newPos.y, containerBR.y1, containerBR.y2 - tooltipBR.height),
    };
  }

  private _hasSpace(position: TooltipPositions) {
    const tooltipBR = getBoundingRect(this.tooltipElement);
    const targetBR = getBoundingRect(this.targetElement);
    const containerBR = this._getContainerBoundingRect();
    switch (position) {
      case TooltipPositions.Top:
        return targetBR.y1 - tooltipBR.height > containerBR.y1;
      case TooltipPositions.Bottom:
        return targetBR.y2 + tooltipBR.height < containerBR.y2;
      case TooltipPositions.Left:
        return targetBR.x1 - tooltipBR.width > containerBR.x1;
      case TooltipPositions.Right:
        return targetBR.x2 + tooltipBR.width < containerBR.x2;
    }
  }

  private _getContainerBoundingRect(): BoundingRect {
    const { container, tooltip, arrow } = this.options
    const containerBR = getBoundingRect(document.querySelector(container.selector));
    const marginInner = Math.max(arrow.size, container.marginInner) - tooltip.margin;

    return {
      ...containerBR,
      x1: containerBR.x1 + marginInner,
      x2: containerBR.x2 - marginInner,
      y1: containerBR.y1 + marginInner,
      y2: containerBR.y2 - marginInner,
    }
  }

  private _trackTooltip() {
    this.isTooltipVisible = true;
    const tick = () => {
      window.requestAnimationFrame(() => {
        if (!this.isTooltipVisible || !this.options.track) {
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
        target: {
          selector: '.target',
        },
        html: content,
        animation: {
          duration: 200,
        },
        container: {
          selector: '#container',
        },
        tooltip: {
          margin: 20,
        },
        arrow: {
          size: 12,
          marginCorner: 6,
        },
        track: false,
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