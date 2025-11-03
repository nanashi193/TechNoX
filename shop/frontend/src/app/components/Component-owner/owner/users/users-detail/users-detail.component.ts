import {Component, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, NonNullableFormBuilder, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {OwnerUsersService} from "../../../../../services/owner-users.service";
import {User, UserDetail} from '../../../../../models/user.model';
import {finalize} from "rxjs/operators";

@Component({
    standalone: true,
    selector: 'owner-user-detail',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './users-detail.component.html',
    styleUrls: ['./users-detail.component.css', '../../owner-shared.css']
})
export class UserDetailComponent implements OnInit {
    private fb = inject(NonNullableFormBuilder);
    private svc = inject(OwnerUsersService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private snapshot!: any;

    private patchFrom(u: UserDetail) {
        this.f.reset({
            name: u.FullName ?? '',
            email: u.email ?? '',
            phone: u.PhoneNumber ?? '',
            isActive: u.IsActive,
        } as any);
        this.snapshot = structuredClone(this.f.getRawValue());
        this.f.markAsPristine();
        this.f.markAsUntouched();
    }

    id!: number;
    loading = true;
    editMode = false;
    user?: UserDetail;

    f = this.fb.group({
        name: this.fb.control('', {validators: [Validators.required, Validators.maxLength(120)]}),
        email: this.fb.control({value: '', disabled: true}),
        phone: this.fb.control('', {validators: [Validators.pattern(/^0\d{9,10}$/)]}),
        isActive: this.fb.control(true),
    });

    ngOnInit(): void {
        const idStr = this.route.snapshot.paramMap.get('id');
        const id = Number(idStr);
        if (!idStr || Number.isNaN(id)) { this.router.navigate(['../'], { relativeTo: this.route }); return; }
        this.id = id;
        this.load();
    }


    load() {
        this.loading = true;
        this.svc.getDetail(this.id)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: u => { this.user = u; this.patchFrom(u); },
                error: _ => this.router.navigate(['../'], { relativeTo: this.route })
            });
    }


    toggleEdit() {
        this.editMode = !this.editMode;
        if (this.editMode && this.user) {
            this.patchFrom(this.user);
        } else if (!this.editMode) {
            this.f.reset(this.snapshot);
            this.f.markAsPristine();
            this.f.markAsUntouched();
        }
    }


    save() {
        if (this.f.invalid) {
            this.f.markAllAsTouched();
            return;
        }
        const v = this.f.getRawValue();
        const dto: Partial<User> = {
            FullName: v.name!.trim(),
            PhoneNumber: (v.phone ?? '').trim(),
            IsActive: v.isActive ?? true
        };
        this.svc.update(this.id, dto).subscribe(() => {
            Object.assign(this.user!, dto, { updatedAt: new Date().toISOString() });
            this.patchFrom(this.user!);
            this.editMode = false;
        });
    }

    toggleActive(e: Event) {
        const on = (e.target as HTMLInputElement).checked;
        if (!this.user) return;
        const prev = this.user.IsActive;
        this.user.IsActive = on; // optimistic
        this.svc.toggleActive(this.id, on).subscribe({error: () => this.user!.IsActive = prev});
    }

    delete() {
        if (!confirm('Bạn chắc chắn muốn xoá người dùng này?')) return;
        this.svc.delete(this.id).subscribe(() => this.router.navigate(['/owner/users']));
    }

    edit(section: 'contact' | 'shipping' | 'billing' | 'payment') { /* mở form/side panel sau cũng được */
    }

    initial(): string {
        return (this.user?.FullName?.[0] || '?').toUpperCase();
    }
}
