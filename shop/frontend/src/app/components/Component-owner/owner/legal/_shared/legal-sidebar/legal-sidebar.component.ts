import { Component } from '@angular/core';
import {RouterLink, RouterLinkActive} from "@angular/router";

@Component({
  selector: 'app-legal-sidebar',
    imports: [
        RouterLinkActive,
        RouterLink
    ],
  templateUrl: './legal-sidebar.component.html',
  styleUrl: './legal-sidebar.component.css'
})
export class LegalSidebarComponent {

}
