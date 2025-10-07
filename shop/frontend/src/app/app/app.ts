import {Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {SiteHeaderComponent} from "../components/site-header/site-header.component";
import {SiteFooterComponent} from "../components/site-footer/site-footer.component";

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
    template: `
          <app-site-header></app-site-header>
          <router-outlet></router-outlet>
          <app-site-footer></app-site-footer>
`,
    styleUrl: './app.css'
})
export class App {
    protected readonly title = signal('App');
}
