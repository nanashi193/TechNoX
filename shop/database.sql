-- Xoá database nếu đã tồn tại
USE MASTER
IF DB_ID(N'TEStore') IS NOT NULL
    BEGIN
        ALTER DATABASE TEStore SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE TEStore;
    END
GO

-- Tạo database mới
CREATE DATABASE TEStore;
GO

USE TEStore;
GO

-- Xoá các bảng nếu đã tồn tại (theo thứ tự phụ thuộc)
IF OBJECT_ID('dbo.Review', 'U') IS NOT NULL DROP TABLE dbo.Review;
IF OBJECT_ID('dbo.RelatedProduct', 'U') IS NOT NULL DROP TABLE dbo.RelatedProduct;
IF OBJECT_ID('dbo.RecentView', 'U') IS NOT NULL DROP TABLE dbo.RecentView;
IF OBJECT_ID('dbo.CartItem', 'U') IS NOT NULL DROP TABLE dbo.CartItem;
IF OBJECT_ID('dbo.Cart', 'U') IS NOT NULL DROP TABLE dbo.Cart;
IF OBJECT_ID('dbo.BillDetail', 'U') IS NOT NULL DROP TABLE dbo.BillDetail;
IF OBJECT_ID('dbo.Bill', 'U') IS NOT NULL DROP TABLE dbo.Bill;
IF OBJECT_ID('dbo.ProductPromotion', 'U') IS NOT NULL DROP TABLE dbo.ProductPromotion;
IF OBJECT_ID('dbo.Promotion', 'U') IS NOT NULL DROP TABLE dbo.Promotion;
IF OBJECT_ID('dbo.ProductVariant', 'U') IS NOT NULL DROP TABLE dbo.ProductVariant;
IF OBJECT_ID('dbo.Product', 'U') IS NOT NULL DROP TABLE dbo.Product;
IF OBJECT_ID('dbo.Category', 'U') IS NOT NULL DROP TABLE dbo.Category;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

--Roles
CREATE TABLE dbo.Roles (
                           Id INT IDENTITY(1,1) PRIMARY KEY,
                           Name NVARCHAR(30) NOT NULL UNIQUE
);
GO
INSERT INTO dbo.Roles (Name)
VALUES (N'Admin'), (N'Staff'), (N'Customer'), (N'Owner');
GO
/***************************************
 * Bảng Users
 ***************************************/
CREATE TABLE dbo.Users (
                           UserId BIGINT IDENTITY(1,1) PRIMARY KEY,
                           FullName NVARCHAR(200) NOT NULL,
                           Email NVARCHAR(255) NOT NULL UNIQUE,
                           PasswordHash NVARCHAR(255) NOT NULL,
                           Gender BIT DEFAULT 0,                          -- 0/1 or NULL
                           PhoneNumber NVARCHAR(50) NULL,
                           RoleId INT NOT NULL
                               CONSTRAINT DF_Users_RoleId DEFAULT 3,
                           FacebookAccountId VARCHAR(100) DEFAULT '',
                           GoogleAccountId VARCHAR(100) DEFAULT '',
                           IsActive BIT NOT NULL DEFAULT 1,
                           CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                           CONSTRAINT FK_Users_Role FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id)
);
GO
EXEC sp_rename 'Users.PasswordHash', 'Password', 'COLUMN';
/***************************************
 * Bảng Tokens
 ***************************************/
GO
CREATE TABLE dbo.Tokens
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Token VARCHAR(255) UNIQUE NOT NULL,
    TokenType VARCHAR(50) NOT NULL,
    ExpirationDate DATETIME,
    Revoked BIT NOT NULL,
    Expire BIT NOT NULL,
    UserId BIGINT,
    FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
)
GO
CREATE TABLE PasswordResetToken (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    Token NVARCHAR(255) NOT NULL,
    UserId BIGINT NOT NULL,
    ExpireDate DATETIME NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO
--Hỗ trợ đăng nhập từ Facebook hoặc Google
CREATE TABLE SocialAccount
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Provider VARCHAR(20) NOT NULL, --TEN NHA SOCIAL
    ProviderId varchar(50) NOT NULL,
    Email VARCHAR(150) NOT NULL, --Email tai khoan
    Name VARCHAR(100) NOT NULL, --Ten nguoi dung
    UserId BIGINT,
    FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
)
GO
/***************************************
 * Bảng Category
 ***************************************/
CREATE TABLE dbo.Category
(
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(150) NOT NULL,
    Description NVARCHAR(1000) NULL
);
GO
/***************************************
 * Bảng Product
 ***************************************/
CREATE TABLE dbo.Product
(
    ProductId BIGINT IDENTITY(1,1) PRIMARY KEY,
    CategoryId INT NULL,
    Name NVARCHAR(255) NOT NULL,
    Price DECIMAL(18,2) NOT NULL DEFAULT(0),
    Description NVARCHAR(MAX) NULL,
    Thumbnail NVARCHAR(300) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Product_Category FOREIGN KEY (CategoryId) REFERENCES dbo.Category(CategoryId)
);
CREATE INDEX IX_Product_CategoryId ON dbo.Product(CategoryId);
GO
/***************************************
 * Bảng ProductVariant
 * (mỗi variant là 1 màu/size của product)
 ***************************************/
CREATE TABLE ProductImages(
                              id INT IDENTITY(1,1) PRIMARY KEY,
                              ProductId BIGINT,
                              FOREIGN KEY (ProductId) REFERENCES Product(ProductId),
                              CONSTRAINT fk_ProductImages_ProductId
                                  FOREIGN KEY (ProductId) REFERENCES Product(ProductId) ON DELETE CASCADE
);
GO
/***************************************
 * Bảng ProductVariant
 * (mỗi variant là 1 màu/size của product)
 ***************************************/
CREATE TABLE dbo.ProductVariant
(
    VariantId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ProductId BIGINT NOT NULL,
    Color NVARCHAR(100) NULL,
    Size NVARCHAR(50) NULL,
    Quantity INT NOT NULL DEFAULT 0,
    Price DECIMAL(18,2) NULL, -- nếu NULL: dùng Product.Price
    SKU NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ProductVariant_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId)
);
CREATE INDEX IX_ProductVariant_ProductId ON dbo.ProductVariant(ProductId);
GO

/***************************************
 * Bảng Promotion
 ***************************************/
CREATE TABLE dbo.Promotion
(
    PromotionId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    DiscountPercent DECIMAL(5,2) NULL CHECK (DiscountPercent >= 0 AND DiscountPercent <= 100),
    DiscountAmount DECIMAL(18,2) NULL CHECK (DiscountAmount >= 0),
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT CHK_Promo_Date CHECK (StartDate <= EndDate)
);
GO

/***************************************
 * Bảng ProductPromotion (N-N)
 ***************************************/
CREATE TABLE dbo.ProductPromotion
(
    ProductId BIGINT NOT NULL,
    PromotionId INT NOT NULL,
    PRIMARY KEY (ProductId, PromotionId),
    CONSTRAINT FK_ProductPromotion_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId),
    CONSTRAINT FK_ProductPromotion_Promotion FOREIGN KEY (PromotionId) REFERENCES dbo.Promotion(PromotionId)
);
CREATE INDEX IX_ProductPromotion_ProductId ON dbo.ProductPromotion(ProductId);
CREATE INDEX IX_ProductPromotion_PromotionId ON dbo.ProductPromotion(PromotionId);
GO

/***************************************
 * Bảng Bill (Order / Invoice)
 ***************************************/
CREATE TABLE dbo.Bill
(
    BillId BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL,
    FullName NVARCHAR(100) DEFAULT '',
    Email VARCHAR(100) DEFAULT '',
    Total DECIMAL(18,2) NOT NULL DEFAULT 0,
    PaymentMethod NVARCHAR(250) NULL,
    OrderDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ShippingAddress NVARCHAR(MAX) NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    Status VARCHAR(30) NOT NULL DEFAULT 'Processing',
    CONSTRAINT CK_Bill_Status CHECK (Status IN ('Processing','Confirmed','Delivering','Succeed','Cancelled')),
    CONSTRAINT FK_Bill_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);

CREATE INDEX IX_Bill_UserId ON dbo.Bill(UserId);
GO

/***************************************
 * Bảng BillDetail (Chi tiết đơn hàng)
 * Lưu thông tin snapshot (price, model, color) để đảm bảo lịch sử
 ***************************************/
CREATE TABLE dbo.BillDetail
(
    BillDetailId BIGINT IDENTITY(1,1) PRIMARY KEY,
    BillId BIGINT NOT NULL,
    ProductId BIGINT NOT NULL,
    VariantId BIGINT NULL,                 -- có thể NULL nếu order sản phẩm không có variant
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(18,2) NOT NULL,     -- snapshot price
    Model NVARCHAR(250) DEFAULT '',              -- snapshot thông tin mô tả (nếu cần)
    Color NVARCHAR(100) DEFAULT '',              -- snapshot
    CONSTRAINT FK_BillDetail_Bill FOREIGN KEY (BillId) REFERENCES dbo.Bill(BillId),
    CONSTRAINT FK_BillDetail_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId),
    CONSTRAINT FK_BillDetail_Variant FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariant(VariantId)
);
CREATE INDEX IX_BillDetail_BillId ON dbo.BillDetail(BillId);
GO

/***************************************
 * Bảng Cart + CartItem
 ***************************************/
CREATE TABLE dbo.Cart
(
    CartId BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId BIGINT NOT NULL UNIQUE,        -- mỗi user 1 cart chính
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Cart_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);
CREATE INDEX IX_Cart_UserId ON dbo.Cart(UserId);
GO

CREATE TABLE dbo.CartItem
(
    CartItemId BIGINT IDENTITY(1,1) PRIMARY KEY,
    CartId BIGINT NOT NULL,
    VariantId BIGINT NULL,                -- liên kết tới variant
    ProductId BIGINT NOT NULL,            -- để đảm bảo tham chiếu luôn có product (redundant nhưng tiện)
    Quantity INT NOT NULL CHECK (Quantity > 0),
    AddedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_CartItem_Cart FOREIGN KEY (CartId) REFERENCES dbo.Cart(CartId) ON DELETE CASCADE,
    CONSTRAINT FK_CartItem_Variant FOREIGN KEY (VariantId) REFERENCES dbo.ProductVariant(VariantId),
    CONSTRAINT FK_CartItem_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId)
);
CREATE INDEX IX_CartItem_CartId ON dbo.CartItem(CartId);
CREATE INDEX IX_CartItem_VariantId ON dbo.CartItem(VariantId);
GO

/***************************************
 * Bảng RecentView
 ***************************************/
CREATE TABLE dbo.RecentView
(
    RecentViewId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ProductId BIGINT NOT NULL,
    UserId BIGINT NULL,
    ViewDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_RecentView_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId),
    CONSTRAINT FK_RecentView_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);
CREATE INDEX IX_RecentView_ProductId ON dbo.RecentView(ProductId);
CREATE INDEX IX_RecentView_UserId ON dbo.RecentView(UserId);
GO

/***************************************
 * Bảng RelatedProduct
 * (một product có thể liên quan tới nhiều product khác)
 * composite primary key (ProductId, RelatedProductId)
 ***************************************/
CREATE TABLE dbo.RelatedProduct
(
    ProductId BIGINT NOT NULL,
    RelatedProductId BIGINT NOT NULL,
    PRIMARY KEY (ProductId, RelatedProductId),
    CONSTRAINT FK_RelatedProduct_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId),
    CONSTRAINT FK_RelatedProduct_RelatedProduct FOREIGN KEY (RelatedProductId) REFERENCES dbo.Product(ProductId)
);
GO

/***************************************
 * Bảng Review
 ***************************************/
CREATE TABLE dbo.Review
(
    ReviewId BIGINT IDENTITY(1,1) PRIMARY KEY,
    ProductId BIGINT NOT NULL,
    UserId BIGINT NOT NULL,
    Rating TINYINT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(MAX) NULL,
    ReviewDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Review_Product FOREIGN KEY (ProductId) REFERENCES dbo.Product(ProductId),
    CONSTRAINT FK_Review_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);
CREATE INDEX IX_Review_ProductId ON dbo.Review(ProductId);
CREATE INDEX IX_Review_UserId ON dbo.Review(UserId);
GO

-- Một vài sample constraints/indexes bổ sung nếu cần
-- Ví dụ: index tìm kiếm theo tên sản phẩm
CREATE INDEX IX_Product_Name ON dbo.Product(Name);
GO
INSERT INTO [dbo].[category] (Name) VALUES
                                        (N'Điện thoại'),
                                        (N'Máy tính bảng'),
                                        (N'Laptop'),
                                        (N'Phụ kiện'),
                                        (N'Nội địa trung');
GO
INSERT INTO dbo.Product (CategoryId, Name, Price, Description, Thumbnail)
VALUES
    (5, N'Xiaomi Redmi Note 13', 4500000, N'Điện thoại nội địa Trung, pin 5000mAh, chip Helio G99', 'redmi_note13.jpg'),
    (5, N'Xiaomi Redmi 13C', 3500000, N'Màn 6.6 inch, RAM 6GB, nội địa Trung', 'redmi13c.jpg'),
    (5, N'Oppo A78', 5200000, N'Oppo A78 nội địa Trung, camera 50MP', 'oppo_a78.jpg'),
    (5, N'Oppo Reno 10', 8900000, N'Oppo Reno 10 nội địa Trung, sạc nhanh 80W', 'oppo_reno10.jpg'),
    (5, N'Vivo Y36', 4900000, N'Vivo Y36 nội địa Trung, màn 90Hz', 'vivo_y36.jpg'),
    (5, N'Vivo V29e', 7800000, N'Vivo V29e nội địa Trung, RAM 8GB', 'vivo_v29e.jpg'),
    (5, N'Realme 11 Pro', 7200000, N'Realme 11 Pro nội địa Trung, camera 100MP', 'realme11pro.jpg'),
    (5, N'Realme Narzo 60x', 5300000, N'Nội địa Trung, màn AMOLED', 'narzo60x.jpg'),
    (5, N'Huawei Nova 11i', 6100000, N'Huawei Nova 11i nội địa Trung, pin 5000mAh', 'nova11i.jpg'),
    (5, N'Huawei P60', 15900000, N'Huawei P60 nội địa Trung, camera Leica', 'huawei_p60.jpg'),
    (5, N'Honor X9a', 6900000, N'Honor X9a nội địa Trung, màn cong 120Hz', 'honor_x9a.jpg'),
    (5, N'Honor 90', 10500000, N'Honor 90 nội địa Trung, RAM 12GB', 'honor90.jpg'),
    (5, N'Realme GT Neo 5 5G', 8500000, N'Realme GT NEO 5 nội địa Trung, RAM 12GB', 'gtneo5.jpg'),
    (5, N'Realme GT5 Pro 5G (Snapdragon 8 Gen 3)', 12550000, N'Realme GT5 Pro nội địa Trung, RAM 16GB', 'gtneo5pro.jpg'),
    (5, N'Huawei Mate XTs (16GB | 256GB)', 66499000, N'Huawei Mate XTs nội địa Trung, RAM 16GB', 'huaweimatexts.jpg'),

-- Apple iPhone
    (1, N'iPhone 15', 23000000, N'iPhone 15 chính hãng, nhập từ bên thứ 3', 'iphone15.jpg'),
    (1, N'iPhone 15 Pro', 32000000, N'iPhone 15 Pro nhập từ bên thứ 3', 'iphone15pro.jpg'),
    (1, N'iPhone 14', 19000000, N'iPhone 14 nhập từ bên thứ 3', 'iphone14.jpg'),
    (1, N'iPhone 13', 15000000, N'iPhone 13 nhập từ bên thứ 3', 'iphone13.jpg'),

-- Apple iPad
    (2, N'iPad Gen 10', 10500000, N'iPad thế hệ 10, nhập từ bên thứ 3', 'ipad_gen10.jpg'),
    (2, N'iPad Air 5', 15500000, N'iPad Air 5 chip M1 nhập từ bên thứ 3', 'ipadair5.jpg'),
    (2, N'iPad Pro M2 11 inch', 25500000, N'iPad Pro M2 nhập từ bên thứ 3', 'ipadpro11.jpg'),
    (2, N'iPad Mini 6', 13500000, N'iPad Mini 6 nhập từ bên thứ 3', 'ipadmini6.jpg'),

-- MacBook
    (3, N'MacBook Air M1', 19500000, N'MacBook Air M1 nhập từ bên thứ 3', 'macbookairm1.jpg'),
    (3, N'MacBook Air M2', 25500000, N'MacBook Air M2 nhập từ bên thứ 3', 'macbookairm2.jpg'),
    (3, N'MacBook Pro 14 M2', 41500000, N'MacBook Pro 14 inch M2 nhập từ bên thứ 3', 'macbookpro14.jpg'),
    (3, N'MacBook Pro 16 M2', 55500000, N'MacBook Pro 16 inch M2 nhập từ bên thứ 3', 'macbookpro16.jpg'),

-- AirPods & phụ kiện
    (4, N'AirPods 2', 3200000, N'AirPods 2 nhập từ bên thứ 3', 'airpods2.jpg'),
    (4, N'AirPods 3', 4500000, N'AirPods 3 nhập từ bên thứ 3', 'airpods3.jpg'),
    (4, N'AirPods Pro 2', 5900000, N'AirPods Pro 2 nhập từ bên thứ 3', 'airpodspro2.jpg'),
    (4, N'AirPods Max', 12500000, N'AirPods Max nhập từ bên thứ 3', 'airpodsmax.jpg'),
    (4, N'Apple Pencil 2', 2900000, N'Apple Pencil 2 nhập từ bên thứ 3', 'applepencil2.jpg'),
    (4, N'Magic Mouse 2', 2400000, N'Magic Mouse 2 nhập từ bên thứ 3', 'magicmouse2.jpg');
GO
INSERT INTO dbo.Users (FullName, Email, Password, Gender, PhoneNumber, RoleId, IsActive)
VALUES
    (N'Châu Tuấn Kiệt', 'ctk9821@gmail.com',
     '$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu',
     0, '0907776523',1, 1),

    (N'Trần Thanh Quân', 'quan111@estore.com',
     N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu',
     0, '0909000001', 4, 1),

    (N'Nguyễn Quốc Huy', 'huynq2@estore.com',
     N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu',
     0, '0909000002', 1, 1),

    (N'Châu Thanh Thanh', 'ctt321@estore.com',
     N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu',
     1, '0909000003', 1, 1),

    (N'Phạm Thị Nhàn', 'npt3214@estore.com',
     N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu',
     1, '0909000004', 2, 1),

    (N'Hoàng Văn Kiên', 'khv545213@estore.com',
     N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu',
     0, '0909000005', 2, 1),

    (N'Đỗ Thị Tâm', 'tdt9832@estore.com',
     N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu',
     1, '0909000006', 3, 1);
GO
ALTER TABLE Product
ADD status BIT NOT NULL CONSTRAINT DF_Product_Status DEFAULT 1;

---UPDATE----
GO
ALTER TABLE ProductImages ADD ImageUrl VARCHAR(MAX);
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'EmailVerified')
    BEGIN
        ALTER TABLE dbo.Users
            ADD EmailVerified BIT NOT NULL DEFAULT 0;
    END
GO
ALTER TABLE dbo.Category
    DROP COLUMN Description;
GO
INSERT INTO dbo.ProductVariant (ProductId, Color, Size, Quantity, Price, SKU)
VALUES
    (1, N'Đỏ', N'6.67 inch', 20, 7500000, N'RMN-13'),
    (2, N'Xanh', N'6.67 inch', 30, 9500000, N'RM-13C'),
    (3, N'Trắng', N'6.67 inch', 30, 8000000, N'OP-A78'),
    (4, N'Đen', N'6.7 inch', 25, 8000000, N'OPRN-10'),
    (5, N'Nâu', N'6.7 inch', 40, 4500000, N'VV-Y36'),
    (6, N'Đen', N'6.7 inch', 30, 7000000, N'VV-Y29E'),
    (7, N'Xanh', N'6.7 inch', 36, 4000000, N'REM-11PRO');
GO
INSERT INTO dbo.Cart (UserId)
VALUES (1), (2), (3), (4), (5);
GO
INSERT INTO dbo.CartItem (CartId, ProductId, VariantId, Quantity)
VALUES
    (1, 1, 1, 1),
    (1, 2, 2, 2),
    (1, 3, 3, 1),

    (2, 4, 4, 1),
    (2, 5, 5, 2),

    (3, 6, 6, 3),
    (3, 7, 7, 1),

    (4, 1, 1, 2),
    (4, 2, 2, 1),
    (4, 4, 4, 1),

    (5, 3, 3, 1),
    (5, 6, 6, 2);
CREATE TABLE Addresses (
    AddressID INT IDENTITY(1,1) PRIMARY KEY,
    Line1 NVARCHAR(255) NOT NULL,
    Line2 NVARCHAR(255) NULL,
    District NVARCHAR(100) NULL,
    City NVARCHAR(100) NULL,
    Province NVARCHAR(100) NULL,
    ZipCode NVARCHAR(20) NULL
);
GO
ALTER TABLE Users
    ADD AddressId INT NULL;
GO
ALTER TABLE Users
    ADD CONSTRAINT FK_Users_Addresses
        FOREIGN KEY (AddressId) REFERENCES Addresses(AddressId);
GO
INSERT INTO Addresses (Line1, Line2, District, City, Province, ZipCode)
VALUES
    (N'123 Lý Thường Kiệt', N'34 Trường Chinh', N'Tân Bình', N'TP. Hồ Chí Minh', N'Hồ Chí Minh', N'700000'),
    (N'45 Nguyễn Huệ', NULL, N'Quận 1', N'TP. Hồ Chí Minh', N'Hồ Chí Minh', N'700000'),
    (N'78 Hoàng Diệu', NULL, N'Hải Châu', N'Đà Nẵng', N'Đà Nẵng', N'550000'),
    (N'12 Trần Phú', NULL, N'Ba Đình', N'Hà Nội', N'Hà Nội', N'100000'),
    (N'89 Lê Lợi', N'Căn hộ A2', N'Hồng Bàng', N'Hải Phòng', N'Hải Phòng', N'180000'),
    (N'55 Nguyễn Trãi', NULL, N'Thanh Xuân', N'Hà Nội', N'Hà Nội', N'100000'),
    (N'21 Phan Chu Trinh', N'Tầng 3', N'Hai Bà Trưng', N'Hà Nội', N'Hà Nội', N'100000'),
    (N'34 Trường Chinh', N'Ngõ 12', N'Đống Đa', N'Hà Nội', N'Hà Nội', N'100000'),
    (N'67 Pasteur', NULL, N'Quận 3', N'TP. Hồ Chí Minh', N'Hồ Chí Minh', N'700000'),
    (N'9 Nguyễn Văn Linh', NULL, N'Ninh Kiều', N'Cần Thơ', N'Cần Thơ', N'900000');
GO
INSERT INTO dbo.Users
(FullName, Email, Password, Gender, PhoneNumber, RoleId, IsActive, AddressId)
VALUES
    (N'Nguyễn Thành Trung', N'trung.nguyen@example.com', N'123456', 0, N'0912345678', 1, 1, 1),
    (N'Lê Thị Hoa', N'hoa.le@example.com', N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu', 1, N'0934567890', 2, 1, 2),
    (N'Phạm Minh Tuấn', N'tuan.pham@example.com', N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu', 0, N'0978123456', 2, 1, 3),
    (N'Trần Bảo Ngọc', N'ngoc.tran@example.com', N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu', 1, N'0901234567', 3, 1, 4),
    (N'Võ Văn Hùng', N'hung.vo@example.com', N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu', 0, N'0923344556', 2, 1, 5),
    (N'Đặng Thu Trang', N'trang.dang@example.com', N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu', 1, N'0967788990', 3, 1, 6),
    (N'Ngô Đức Duy', N'duy.ngo@example.com', N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu', 0, N'0911778899', 1, 1, 7),
    (N'Hoàng Mỹ Linh', N'linh.hoang@example.com', N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu', 1, N'0988997766', 2, 1, 8),
    (N'Phan Quốc Bảo', N'bao.phan@example.com', N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu', 0, N'0909988776', 3, 1, 9),
    (N'Tạ Thị Hương', N'huong.ta@example.com', N'$2a$10$ykF9xhomFn0uj.s1NeQS4u5xSXqKnR8mu71mrqs0k9Po17FPyjjcu', 1, N'0933445566', 2, 1, 10);
GO



