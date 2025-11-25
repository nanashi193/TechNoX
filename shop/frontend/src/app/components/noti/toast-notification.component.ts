import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-toast-notification',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div classclass="toast-container">
      <p>{{ message }}</p>
      <a [routerLink]="link" (click)="close.emit()">View</a>
      <button class="close-btn" (click)="close.emit()">×</button>
    </div>
  `,
    styleUrls: ['./toast-notification.component.css']
})
export class ToastNotificationComponent {
    @Input() message: string = '';
    @Input() link: string = '';
    @Output() close = new EventEmitter<void>();
}