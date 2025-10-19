import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

interface Address {
    line1: string;
    line2?: string;
    city: string;
    district?: string;
    province: string;
    zip?: string;
}
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-detail-user',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, DatePipe, CurrencyPipe],
    templateUrl: './detail.user.html',
    styleUrls: ['./detail.user.css']
})
export class DetailUserComponent implements OnInit {
    user?: User;
    edit = false;
    private originalUser?: User;

    constructor(
        private route: ActivatedRoute,
        private userService: UserService
    ) {}

    ngOnInit(): void {
        const idFromRoute = this.route.snapshot.paramMap.get('id');
        if (idFromRoute) {
            // TRƯỜNG HỢP 1: CÓ ID (Admin xem người khác)
            this.userService.getUserById(idFromRoute).subscribe({
                next: (userData) => this.handleUserResponse(userData),
                error: (err) => console.error('Lỗi khi tải dữ liệu người dùng bằng ID:', err)
            });
        } else {
            // TRƯỜNG HỢP 2: KHÔNG CÓ ID (User xem chính mình qua /profile)
            this.userService.getMe().subscribe({
                next: (userData) => this.handleUserResponse(userData),
                error: (err) => console.error('Lỗi khi tải dữ liệu cá nhân (getMe):', err)
            });
        }
    }
    private handleUserResponse(userData: User) {
        this.user = userData;
        this.originalUser = JSON.parse(JSON.stringify(userData));
    }

    get initials(): string {
        return this.user?.FullName?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'U';
    }

    toggleEdit() {
        this.edit = !this.edit;
        // Nếu người dùng chưa có địa chỉ, hãy khởi tạo một object rỗng
        // để [(ngModel)] có thể hoạt động mà không bị lỗi
        if (this.edit && !this.user?.address) {
            this.user!.address = {
                addressID: 0,
                line1: '',
                city: '',
                district: '',
                province: ''
            };
        }
    }
    save() {
        if (!this.user) return;
        this.userService.updateMe(this.user).subscribe({
            next: (updatedUser: User) => {
                this.user = updatedUser;
                this.originalUser = JSON.parse(JSON.stringify(updatedUser));
                this.edit = false;

                console.log('Cập nhật thông tin thành công!', updatedUser);
            },
            error: (err) => {
                // Đã xóa alert() theo yêu cầu của bạn
                console.error('Có lỗi xảy ra khi cập nhật:', err);
            }
        });
    }
    cancel() {
        // Phục hồi từ bản sao gốc
        if (this.originalUser) {
            this.user = JSON.parse(JSON.stringify(this.originalUser));
        }
        this.edit = false;
    }
    copy(text: string | undefined) { // Thêm `| undefined` cho an toàn
        if (text) {
            navigator.clipboard?.writeText(text);
        }
    }
}
