
/* 2. TẠO BẢNG (STRUCTURE) */

IF OBJECT_ID('dbo.Addresses', 'U') IS NULL
CREATE TABLE dbo.Addresses (
                               AddressID int IDENTITY(1,1) NOT NULL,
                               Line1 nvarchar(255) NOT NULL,
                               Line2 nvarchar(255) NULL,
                               District nvarchar(100) NULL,
                               City nvarchar(100) NULL,
                               Province nvarchar(100) NULL,
                               ZipCode nvarchar(20) NULL,
                               CONSTRAINT PK_Addresses PRIMARY KEY (AddressID)
);

IF OBJECT_ID('dbo.Category', 'U') IS NULL
CREATE TABLE dbo.Category (
                              CategoryId int IDENTITY(1,1) NOT NULL,
                              Name nvarchar(150) NOT NULL,
                              CONSTRAINT PK_Category PRIMARY KEY (CategoryId)
);

IF OBJECT_ID('dbo.PayTransaction', 'U') IS NULL
CREATE TABLE dbo.PayTransaction (
                                    Id bigint IDENTITY(1,1) NOT NULL,
                                    OrderCode bigint NOT NULL,
                                    BillId bigint NOT NULL,
                                    Amount decimal(18,2) NOT NULL,
                                    Status varchar(20) NOT NULL,
                                    PayCode varchar(10) NULL,
                                    RawWebhook nvarchar(MAX) NULL,
                                    CreatedAt datetime2 DEFAULT sysdatetime() NOT NULL,
                                    UpdatedAt datetime2 DEFAULT sysdatetime() NOT NULL,
                                    CONSTRAINT PK_PayTransaction PRIMARY KEY (Id),
                                    CONSTRAINT UQ_PayTransaction_OrderCode UNIQUE (OrderCode)
);

IF OBJECT_ID('dbo.Promotion', 'U') IS NULL
CREATE TABLE dbo.Promotion (
                               PromotionId int IDENTITY(1,1) NOT NULL,
                               Name nvarchar(255) NOT NULL,
                               DiscountPercent decimal(5,2) NULL,
                               DiscountAmount decimal(18,2) NULL,
                               StartDate date NOT NULL,
                               EndDate date NOT NULL,
                               IsActive bit DEFAULT 1 NOT NULL,
                               CONSTRAINT PK_Promotion PRIMARY KEY (PromotionId),
                               CONSTRAINT CK_Promotion_DiscountPercent CHECK (([DiscountPercent]>=(0) AND [DiscountPercent]<=(100))),
                               CONSTRAINT CK_Promotion_DiscountAmount CHECK (([DiscountAmount]>=(0))),
                               CONSTRAINT CK_Promotion_Date CHECK (([StartDate]<=[EndDate]))
);

IF OBJECT_ID('dbo.Roles', 'U') IS NULL
CREATE TABLE dbo.Roles (
                           Id int IDENTITY(1,1) NOT NULL,
                           Name nvarchar(30) NOT NULL,
                           CONSTRAINT PK_Roles PRIMARY KEY (Id),
                           CONSTRAINT UQ_Roles_Name UNIQUE (Name)
);

IF OBJECT_ID('dbo.Product', 'U') IS NULL
CREATE TABLE dbo.Product (
                             ProductId bigint IDENTITY(1,1) NOT NULL,
                             CategoryId int NULL,
                             Name nvarchar(255) NOT NULL,
                             Price decimal(18,2) DEFAULT 0 NOT NULL,
                             Description nvarchar(MAX) NULL,
                             Thumbnail nvarchar(500) NULL,
                             CreatedAt datetime2 DEFAULT sysutcdatetime() NOT NULL,
                             status bit DEFAULT 1 NOT NULL,
                             CONSTRAINT PK_Product PRIMARY KEY (ProductId),
                             CONSTRAINT FK_Product_Category FOREIGN KEY (CategoryId) REFERENCES dbo.Category(CategoryId)
);

IF OBJECT_ID('dbo.ProductImages', 'U') IS NULL
CREATE TABLE dbo.ProductImages (
                                   id int IDENTITY(1,1) NOT NULL,
                                   ProductId bigint NULL,
                                   ImageUrl nvarchar(500) NULL,
                                   PublicId nvarchar(255) DEFAULT N'' NOT NULL,
                                   CONSTRAINT PK_ProductImages PRIMARY KEY (id),
                                   CONSTRAINT FK_ProductImages_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId) ON DELETE CASCADE
);

IF OBJECT_ID('dbo.ProductPromotion', 'U') IS NULL
CREATE TABLE dbo.ProductPromotion (
                                      ProductId bigint NOT NULL,
                                      PromotionId int NOT NULL,
                                      CONSTRAINT PK_ProductPromotion PRIMARY KEY (ProductId,PromotionId),
                                      CONSTRAINT FK_ProductPromotion_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId),
                                      CONSTRAINT FK_ProductPromotion_Promotion FOREIGN KEY (PromotionId) REFERENCES dbo.Promotion(PromotionId)
);

IF OBJECT_ID('dbo.ProductVariant', 'U') IS NULL
CREATE TABLE dbo.ProductVariant (
                                    VariantId bigint IDENTITY(1,1) NOT NULL,
                                    ProductId bigint NOT NULL,
                                    Color nvarchar(100) NULL,
    [Size] nvarchar(50) NULL,
    Quantity int DEFAULT 0 NOT NULL,
    Price decimal(18,2) NULL,
    SKU nvarchar(100) NULL,
    CreatedAt datetime2 DEFAULT sysutcdatetime() NOT NULL,
    CONSTRAINT PK_ProductVariant PRIMARY KEY (VariantId),
    CONSTRAINT FK_ProductVariant_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId)
    );

IF OBJECT_ID('dbo.RelatedProduct', 'U') IS NULL
CREATE TABLE dbo.RelatedProduct (
                                    ProductId bigint NOT NULL,
                                    RelatedProductId bigint NOT NULL,
                                    CONSTRAINT PK_RelatedProduct PRIMARY KEY (ProductId,RelatedProductId),
                                    CONSTRAINT FK_RelatedProduct_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId),
                                    CONSTRAINT FK_RelatedProduct_Related FOREIGN KEY (RelatedProductId) REFERENCES dbo.Product(ProductId)
);

IF OBJECT_ID('dbo.Users', 'U') IS NULL
CREATE TABLE dbo.Users (
                           UserId bigint IDENTITY(1,1) NOT NULL,
                           FullName nvarchar(200) NOT NULL,
                           Email nvarchar(255) NOT NULL,
                           Password nvarchar(255) NOT NULL,
                           Gender bit DEFAULT 0 NULL,
                           PhoneNumber nvarchar(50) NULL,
                           RoleId int DEFAULT 3 NOT NULL,
                           FacebookAccountId varchar(100) DEFAULT '' NULL,
                           GoogleAccountId varchar(100) DEFAULT '' NULL,
                           IsActive bit DEFAULT 1 NOT NULL,
                           CreatedAt datetime2 DEFAULT sysutcdatetime() NOT NULL,
                           EmailVerified bit DEFAULT 0 NOT NULL,
                           AddressId int NULL,
                           CONSTRAINT PK_Users PRIMARY KEY (UserId),
                           CONSTRAINT UQ_Users_Email UNIQUE (Email),
                           CONSTRAINT FK_Users_Addresses FOREIGN KEY (AddressId) REFERENCES dbo.Addresses(AddressID),
                           CONSTRAINT FK_Users_Role FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id)
);

IF OBJECT_ID('dbo.Bill', 'U') IS NULL
CREATE TABLE dbo.Bill (
                          BillId bigint IDENTITY(1,1) NOT NULL,
                          UserId bigint NOT NULL,
                          FullName nvarchar(100) DEFAULT '' NULL,
                          Email varchar(100) DEFAULT '' NULL,
                          Total decimal(18,2) DEFAULT 0 NOT NULL,
                          PaymentMethod nvarchar(250) NULL,
                          OrderDate datetime2 DEFAULT sysutcdatetime() NOT NULL,
                          ShippingAddress nvarchar(MAX) NOT NULL,
                          Phone varchar(20) NOT NULL,
                          IsActive bit DEFAULT 1 NOT NULL,
                          Status varchar(30) DEFAULT 'Processing' NOT NULL,
                          StaffId bigint NULL,
                          CONSTRAINT PK_Bill PRIMARY KEY (BillId),
                          CONSTRAINT FK_Bill_Staff FOREIGN KEY (StaffId) REFERENCES dbo.Users(UserId),
                          CONSTRAINT FK_Bill_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
                          CONSTRAINT CK_Bill_Status CHECK (([Status]='Cancelled' OR [Status]='Succeed' OR [Status]='Delivering' OR [Status]='Confirmed' OR [Status]='Processing'))
);

IF OBJECT_ID('dbo.BillDetail', 'U') IS NULL
CREATE TABLE dbo.BillDetail (
                                BillDetailId bigint IDENTITY(1,1) NOT NULL,
                                BillId bigint NOT NULL,
                                ProductId bigint NOT NULL,
                                VariantId bigint NULL,
                                Quantity int NOT NULL,
                                UnitPrice decimal(18,2) NOT NULL,
                                Model nvarchar(250) DEFAULT '' NULL,
                                Color nvarchar(100) DEFAULT '' NULL,
                                CONSTRAINT PK_BillDetail PRIMARY KEY (BillDetailId),
                                CONSTRAINT FK_BillDetail_Bill FOREIGN KEY (BillId) REFERENCES dbo.Bill(BillId),
                                CONSTRAINT FK_BillDetail_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId),
                                CONSTRAINT FK_BillDetail_Variant FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariant(VariantId),
                                CONSTRAINT CK_BillDetail_Quantity CHECK (([Quantity]>(0)))
);

IF OBJECT_ID('dbo.Cart', 'U') IS NULL
CREATE TABLE dbo.Cart (
                          CartId bigint IDENTITY(1,1) NOT NULL,
                          UserId bigint NOT NULL,
                          CreatedAt datetime2 DEFAULT sysutcdatetime() NOT NULL,
                          CONSTRAINT PK_Cart PRIMARY KEY (CartId),
                          CONSTRAINT UQ_Cart_User UNIQUE (UserId),
                          CONSTRAINT FK_Cart_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);

IF OBJECT_ID('dbo.CartItem', 'U') IS NULL
CREATE TABLE dbo.CartItem (
                              CartItemId bigint IDENTITY(1,1) NOT NULL,
                              CartId bigint NOT NULL,
                              VariantId bigint NULL,
                              ProductId bigint NOT NULL,
                              Quantity int NOT NULL,
                              AddedAt datetime2 DEFAULT sysutcdatetime() NOT NULL,
                              CONSTRAINT PK_CartItem PRIMARY KEY (CartItemId),
                              CONSTRAINT FK_CartItem_Cart FOREIGN KEY (CartId) REFERENCES dbo.Cart(CartId) ON DELETE CASCADE,
                              CONSTRAINT FK_CartItem_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId),
                              CONSTRAINT FK_CartItem_Variant FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariant(VariantId),
                              CONSTRAINT CK_CartItem_Quantity CHECK (([Quantity]>(0)))
);

IF OBJECT_ID('dbo.PasswordResetToken', 'U') IS NULL
CREATE TABLE dbo.PasswordResetToken (
                                        Id bigint IDENTITY(1,1) NOT NULL,
                                        Token nvarchar(255) NOT NULL,
                                        UserId bigint NOT NULL,
                                        ExpireDate datetime NOT NULL,
                                        CONSTRAINT PK_PasswordResetToken PRIMARY KEY (Id),
                                        CONSTRAINT FK_PasswordResetToken_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);

IF OBJECT_ID('dbo.RecentView', 'U') IS NULL
CREATE TABLE dbo.RecentView (
                                RecentViewId bigint IDENTITY(1,1) NOT NULL,
                                ProductId bigint NOT NULL,
                                UserId bigint NULL,
                                ViewDate datetime2 DEFAULT sysutcdatetime() NOT NULL,
                                CONSTRAINT PK_RecentView PRIMARY KEY (RecentViewId),
                                CONSTRAINT FK_RecentView_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId),
                                CONSTRAINT FK_RecentView_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);

IF OBJECT_ID('dbo.Review', 'U') IS NULL
CREATE TABLE dbo.Review (
                            ReviewId bigint IDENTITY(1,1) NOT NULL,
                            ProductId bigint NOT NULL,
                            UserId bigint NOT NULL,
                            Rating tinyint NOT NULL,
                            Comment nvarchar(MAX) NULL,
                            ReviewDate datetime2 DEFAULT sysutcdatetime() NOT NULL,
                            CONSTRAINT PK_Review PRIMARY KEY (ReviewId),
                            CONSTRAINT FK_Review_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId),
                            CONSTRAINT FK_Review_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
                            CONSTRAINT CK_Review_Rating CHECK (([Rating]>=(1) AND [Rating]<=(5)))
);

IF OBJECT_ID('dbo.SocialAccount', 'U') IS NULL
CREATE TABLE dbo.SocialAccount (
                                   Id int IDENTITY(1,1) NOT NULL,
                                   Provider varchar(20) NOT NULL,
                                   ProviderId varchar(50) NOT NULL,
                                   Email varchar(150) NOT NULL,
                                   Name varchar(100) NOT NULL,
                                   UserId bigint NULL,
                                   CONSTRAINT PK_SocialAccount PRIMARY KEY (Id),
                                   CONSTRAINT FK_SocialAccount_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);

IF OBJECT_ID('dbo.Tokens', 'U') IS NULL
CREATE TABLE dbo.Tokens (
                            Id int IDENTITY(1,1) NOT NULL,
                            Token varchar(255) NOT NULL,
                            TokenType varchar(50) NOT NULL,
                            ExpirationDate datetime NULL,
                            Revoked bit NOT NULL,
                            Expire bit NOT NULL,
                            UserId bigint NULL,
                            CONSTRAINT PK_Tokens PRIMARY KEY (Id),
                            CONSTRAINT UQ_Tokens_Token UNIQUE (Token),
                            CONSTRAINT FK_Tokens_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);

/* 3. DỮ LIỆU MẪU (DATA SEEDING) */
-- Bước 1: Dữ liệu nền (Roles, Category, Address)
INSERT INTO dbo.Roles (Name) VALUES
(N'Admin'),(N'Customer'),(N'Owner'),(N'Shipping_Staff'),(N'Staff');

INSERT INTO dbo.Category (Name) VALUES
                                    (N'Điện thoại'),(N'Máy tính bảng'),(N'Laptop'),(N'Phụ kiện'),(N'Nội địa trung');

INSERT INTO dbo.Addresses (Line1,Line2,District,City,Province,ZipCode) VALUES
                                                                           (N'123 Lý Thường Kiệt',N'34 Trường Chinh',N'Tân Bình',N'TP. Hồ Chí Minh',N'Hồ Chí Minh',N'700000'),
                                                                           (N'45 Nguyễn Huệ',NULL,N'Quận 1',N'TP. Hồ Chí Minh',N'Hồ Chí Minh',N'700000'),
                                                                           (N'78 Hoàng Diệu',NULL,N'Hải Châu',N'Đà Nẵng',N'Đà Nẵng',N'550000'),
                                                                           (N'12 Trần Phú',NULL,N'Ba Đình',N'Hà Nội',N'Hà Nội',N'100000'),
                                                                           (N'89 Lê Lợi',N'Căn hộ A2',N'Hồng Bàng',N'Hải Phòng',N'Hải Phòng',N'180000');

-- Bước 2: Người dùng (Users) - Phụ thuộc vào Roles
SET IDENTITY_INSERT dbo.Users ON; -- Bật cho phép nhập ID thủ công để khớp với Cart
INSERT INTO dbo.Users (UserId, FullName,Email,Password,Gender,PhoneNumber,RoleId,FacebookAccountId,GoogleAccountId,IsActive,CreatedAt,EmailVerified,AddressId) VALUES
                                                                                                                                                                   (1, N'Châu Tuấn Kiệt',N'ctk9821@gmail.com',N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu',0,N'0907776523',1,N'',N'',1,'2025-11-08 09:23:01.0438067',0,NULL),
                                                                                                                                                                   (2, N'Trần Thanh Quân',N'quan111@estore.com',N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu',0,N'0909000001',4,N'',N'',1,'2025-11-08 09:23:01.0438067',0,NULL),
                                                                                                                                                                   (3, N'Nguyễn Quốc Huy',N'huynq2@estore.com',N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu',0,N'0909000002',1,N'',N'',1,'2025-11-08 09:23:01.0438067',0,NULL),
                                                                                                                                                                   (4, N'Châu Thanh Thanh',N'ctt321@estore.com',N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu',1,N'0909000003',1,N'',N'',1,'2025-11-08 09:23:01.0438067',0,NULL),
                                                                                                                                                                   (5, N'Phạm Thị Nhàn',N'npt3214@estore.com',N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu',1,N'0909000004',5,N'',N'',1,'2025-11-08 09:23:01.0438067',0,NULL),
                                                                                                                                                                   (6, N'QH',N'daoquanghung5192@gmail.com',N'$2a$10$2472URAx3u71gQFpdKArR.5JQimeog/zn5/vUwqzXtyU.cUAXIjF6',0,N'0987654321',3,N'0',N'0',1,'2025-11-20 12:03:43.6410840',1,NULL);
SET IDENTITY_INSERT dbo.Users OFF;

-- Bước 3: Sản phẩm (Products) - Phụ thuộc vào Category
SET IDENTITY_INSERT dbo.Product ON;
INSERT INTO dbo.Product (ProductId, CategoryId,Name,Price,Description,Thumbnail,CreatedAt,status) VALUES
                                                                                                      (36, 1,N'iPhone 16',21100000.00,N'iPhone 16 – flagship tiêu chuẩn 2024 của Apple, trang bị chip A18 mạnh mẽ.',N'https://res.cloudinary.com/dqegrlmu5/image/upload/v1762597526/techstore/products/36/idkwy6swuwoohu80f9ha.jpg','2025-11-08 17:25:25.0360955',1),
                                                                                                      (37, 1,N'iPhone 16 Plus',24690000.00,N'iPhone 16 Plus – phiên bản màn hình lớn trong dòng iPhone 2024 của Apple.',N'https://res.cloudinary.com/dqegrlmu5/image/upload/v1762598171/techstore/products/37/t0t0nbq4ymxhbzy2yf1l.jpg','2025-11-08 17:36:03.8127805',1),
                                                                                                      (38, 1,N'iPhone 16 Pro',25900000.00,N'iPhone 16 Pro – mẫu flagship “Pro” của Apple năm 2024.',N'https://res.cloudinary.com/dqegrlmu5/image/upload/v1762598648/techstore/products/38/vxjtb0kha392kij9vvrz.jpg','2025-11-08 17:44:00.9588014',1),
                                                                                                      (39, 1,N'iPhone 16 Pro Max',30390000.00,N'iPhone 16 Pro Max – flagship cao cấp nhất 2024 của Apple.',N'https://res.cloudinary.com/dqegrlmu5/image/upload/v1762599150/techstore/products/39/qpafiaxqlmlcbao8qfyf.jpg','2025-11-08 17:52:29.6711710',1),
                                                                                                      (40, 1,N'iPhone 17',24990000.00,N'iPhone 17 – mẫu iPhone tiêu chuẩn thế hệ 2025 của Apple.',N'https://res.cloudinary.com/dqegrlmu5/image/upload/v1762599481/techstore/products/40/rjnvmf4nlfviad1q3u9q.jpg','2025-11-08 17:58:01.2434430',1);
SET IDENTITY_INSERT dbo.Product OFF;

-- Bước 4: Ảnh và Biến thể (Variants) - Phụ thuộc vào Product
INSERT INTO dbo.ProductImages (ProductId,ImageUrl,PublicId) VALUES
                                                                (36,N'https://res.cloudinary.com/dqegrlmu5/image/upload/v1762597526/techstore/products/36/idkwy6swuwoohu80f9ha.jpg',N'techstore/products/36/idkwy6swuwoohu80f9ha'),
                                                                (36,N'https://res.cloudinary.com/dqegrlmu5/image/upload/v1762597528/techstore/products/36/b9jzxykokslo6faxfzwi.jpg',N'techstore/products/36/b9jzxykokslo6faxfzwi'),
                                                                (36,N'https://res.cloudinary.com/dqegrlmu5/image/upload/v1762597529/techstore/products/36/tvsawq65yt7zweeko3g2.jpg',N'techstore/products/36/tvsawq65yt7zweeko3g2'),
                                                                (36,N'https://res.cloudinary.com/dqegrlmu5/image/upload/v1762597531/techstore/products/36/vh4ajdzrp4wkq0zijymh.jpg',N'techstore/products/36/vh4ajdzrp4wkq0zijymh'),
                                                                (36,N'https://res.cloudinary.com/dqegrlmu5/image/upload/v1762597533/techstore/products/36/gtze2uy9aucodpun2iti.jpg',N'techstore/products/36/gtze2uy9aucodpun2iti');

SET IDENTITY_INSERT dbo.ProductVariant ON;
INSERT INTO dbo.ProductVariant (VariantId, ProductId,Color,[Size],Quantity,Price,SKU,CreatedAt) VALUES
                                                                                                    (1, 36,N'Hồng',N'6.1 inch / 128GB',10,21100000.00,N'IPHONE16-HỒNG-6.1INCH/128GB','2025-11-08 10:25:25.0753340'),
                                                                                                    (2, 36,N'Đen',N'6.1 inch / 128GB',10,21100000.00,N'IPHONE16-ĐEN-6.1INCH/128GB','2025-11-08 10:27:40.4747430'),
                                                                                                    (3, 36,N'Xanh Mòng Két',N'6.1 inch / 128GB',10,21100000.00,N'IPHONE16-XANHMÒNGKÉT-6.1INCH/128GB','2025-11-08 10:27:40.4747430'),
                                                                                                    (4, 36,N'Trắng',N'6.1 inch / 128GB',10,21100000.00,N'IPHONE16-TRẮNG-6.1INCH/128GB','2025-11-08 10:27:40.4747430'),
                                                                                                    (5, 36,N'Xanh Lưu Ly',N'6.1 inch / 128GB',10,21100000.00,N'IPHONE16-XANHLƯULY-6.1INCH/128GB','2025-11-08 10:27:40.4747430');
SET IDENTITY_INSERT dbo.ProductVariant OFF;

-- Bước 5: Cart và CartItem - Phụ thuộc vào Users và Variant
INSERT INTO dbo.Cart (UserId,CreatedAt) VALUES
                                            (1,'2025-11-08 09:23:01.2575637'),
                                            (2,'2025-11-08 09:23:01.2575637'),
                                            (3,'2025-11-08 09:23:01.2575637'),
                                            (4,'2025-11-08 09:23:01.2575637'),
                                            (5,'2025-11-08 09:23:01.2575637');

-- CHÚ Ý: Tôi đã sửa VariantId=10 thành VariantId=1 vì ở trên bạn chỉ tạo 5 variant (ID 1-5)
-- Nếu để 10 sẽ bị lỗi
INSERT INTO dbo.CartItem (CartId,VariantId,ProductId,Quantity,AddedAt) VALUES
    (2, 1, 36,1,'2025-11-20 13:15:39.7559255');

-- Bước 6: Tokens - Phụ thuộc Users
INSERT INTO dbo.Tokens (Token,TokenType,ExpirationDate,Revoked,Expire,UserId) VALUES
    (N'bfd65945-47a3-44fc-b033-9ca591513b0c',N'0','2025-11-20 12:33:43.68',0,0,6);
