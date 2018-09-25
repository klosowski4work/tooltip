import { Component, Input } from '@angular/core';
import { TooltipService } from './services/tooltip.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @Input() public isTooltipEnabled: boolean;
  @Input() public content: string;

  constructor(private tooltipService: TooltipService) {
    this.isTooltipEnabled = false;
    this.content = CONTENT;
  }
  title = 'app';

  toggleTooltip() {
    this.isTooltipEnabled = !this.isTooltipEnabled;
    if (this.isTooltipEnabled) {
      this.tooltipService.show(this.content);
    } else {
      this.tooltipService.hide();
    }
  }
}

const CONTENT = `
<table>
  <tbody>
  <tr>
    <td>Any</td><td>content</td><td>available</td>
  </tr>
  <tr>
    <td>qwe</td><td>qwe1</td><td>qwe2</td>
  </tr>
  <tr>
    <td>qwe</td><td>qwe1</td><td>qwe2</td>
  </tr>
  <tr>
    <td>qwe</td><td>qwe1</td><td>qwe2</td>
  </tr>
  </tbody>
</table>
`