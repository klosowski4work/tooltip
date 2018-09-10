import { Component, Input } from '@angular/core';
import { TooltipService } from './services/tooltip.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @Input() public isTooltipEnabled: boolean;

  constructor(private tooltipService: TooltipService) {
    this.isTooltipEnabled = false;
  }
  title = 'app';

  toggleTooltip() {
    this.isTooltipEnabled = !this.isTooltipEnabled;
    if (this.isTooltipEnabled) {
      this.tooltipService.show();
    } else {
      this.tooltipService.hide();
    }
  }
}