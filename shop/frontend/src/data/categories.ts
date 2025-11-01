export interface CategoryOpt { id: number; name: string; }

export const CATEGORIES: CategoryOpt[] = [
    { id: 1, name: 'Điện thoại' },
    { id: 2, name: 'Máy tính bảng' },
    { id: 3, name: 'Laptop' },
    { id: 4, name: 'Phụ kiện' },
    { id: 5, name: 'Nội địa trung' },
];

// tiện tra cứu tên từ id
export const CATEGORY_NAME_BY_ID = new Map<number, string>(
    CATEGORIES.map(c => [c.id, c.name])
);

export function categoryName(id?: number | null): string {
    return id != null ? (CATEGORY_NAME_BY_ID.get(id) ?? '') : '';
}
