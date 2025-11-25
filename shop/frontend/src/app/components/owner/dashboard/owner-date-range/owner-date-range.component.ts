import {CommonModule} from '@angular/common';
import {Component, EventEmitter, HostListener, Output} from '@angular/core';
import {FormsModule} from "@angular/forms";

export type DateRange = { start: Date; end: Date };

@Component({
    selector: 'owner-date-range',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './owner-date-range.component.html',
    styleUrls: ['./owner-date-range.component.css']
})
export class OwnerDateRangeComponent {
    @Output() changed = new EventEmitter<DateRange>();

    open = false;
    active = 'last3';
    showCustom = false;

    range: DateRange = this.lastNDays(3);
    customStart = this.toInput(this.range.start);
    customEnd = this.toInput(this.range.end);

    @HostListener('document:click') close() {
        this.open = false;
    }

    isSameDay(a?: Date, b?: Date){
        if (!a || !b) return true;
        return a.getFullYear()===b.getFullYear()
            && a.getMonth()===b.getMonth()
            && a.getDate()===b.getDate();
    }

    toggle(e: MouseEvent) {
        e.stopPropagation();
        this.open = !this.open;
    }

    label() {
        const s = this.fmt(this.range.start), e = this.fmt(this.range.end);
        return s === e ? s : `${s} - ${e}`;
    }

    pick(id: string) {
        this.active = id;
        this.showCustom = id === 'custom';
        if (id === 'custom') return;

        const map: Record<string, () => DateRange> = {
            last3: () => this.lastNDays(3),
            last7: () => this.lastNDays(7),
            last30: () => this.lastNDays(30),
        };
        this.range = map[id]();
        this.syncInputs();
        this.emitClose();
    }

    apply() {
        const s = new Date(this.customStart), e = new Date(this.customEnd);
        if (isNaN(+s) || isNaN(+e) || s > e) return;
        this.range = {start: this.atStart(s), end: this.atEnd(e)};
        this.emitClose();
    }

    // helpers
    private emitClose() {
        console.log('Emitting range:', this.range);
        this.changed.emit(this.range);
        this.open = false;
    }

    private syncInputs() {
        this.customStart = this.toInput(this.range.start);
        this.customEnd = this.toInput(this.range.end);
    }

    private atStart(d: Date) {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
    }

    private atEnd(d: Date) {
        const x = new Date(d);
        x.setHours(23, 59, 59, 999);
        return x;
    }


     lastNDays(n: number): DateRange {
        const end = this.atEnd(new Date());
        const start = this.atStart(new Date(end.getTime() - (n - 1) * 86400000));
        return {start, end};
    }

    private toInput(d: Date) {
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }

    fmt(d?: unknown): string {
        if (!d) return '—';
        const x = d instanceof Date ? d : new Date(d as any);
        if (isNaN(+x)) return '—';
        return x.toLocaleDateString('vi-VN', { day:'2-digit', month:'short', year:'numeric' });
    }
}
