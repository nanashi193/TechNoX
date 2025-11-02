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
    active = 'today';
    showCustom = false;

    range: DateRange = this.today();
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
            today: this.today.bind(this),
            yesterday: this.yesterday.bind(this),
            last7: () => this.lastNDays(7),
            last30: () => this.lastNDays(30),
            thisMonth: this.thisMonth.bind(this),
            lastMonth: this.lastMonth.bind(this)
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

    private today(): DateRange {
        const t = this.atStart(new Date());
        return {start: t, end: this.atEnd(t)};
    }

    private yesterday(): DateRange {
        const y = this.atStart(new Date(Date.now() - 86400000));
        return {start: y, end: this.atEnd(y)};
    }

    private lastNDays(n: number): DateRange {
        const end = this.atEnd(new Date());
        const start = this.atStart(new Date(end.getTime() - (n - 1) * 86400000));
        return {start, end};
    }

    private thisMonth(): DateRange {
        const now = new Date();
        const start = this.atStart(new Date(now.getFullYear(), now.getMonth(), 1));
        return {start, end: this.atEnd(new Date())};
    }

    private lastMonth(): DateRange {
        const now = new Date();
        const start = this.atStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        const end = this.atEnd(new Date(now.getFullYear(), now.getMonth(), 0));
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
