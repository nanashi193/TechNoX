import { Component } from '@angular/core';
import {LegalSidebarComponent} from "../_shared/legal-sidebar/legal-sidebar.component";
import {RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-legal-layout',
    imports: [
        LegalSidebarComponent,
        RouterOutlet
    ],
  templateUrl: './legal-layout.component.html',
  styleUrl: './legal-layout.component.css'
})
export class LegalLayoutComponent {

}
