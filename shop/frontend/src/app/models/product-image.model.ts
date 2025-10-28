export interface ProductImageBE {
    id?: number;
    imageId?: number;
    imageUrl?: string;
    url?: string;
    publicId?: string;
}

// type chuẩn dùng trong FE
export interface ProductImage {
    id: number;
    url: string;
    publicId: string;
}
