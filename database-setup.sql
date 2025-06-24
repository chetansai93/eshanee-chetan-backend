-- Create Database (if not exists)
-- This should be run in Azure SQL Database

-- Users table
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(50) NOT NULL DEFAULT 'customer',
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Menu Items table
CREATE TABLE MenuItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(10,2) NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    ImageUrl NVARCHAR(500),
    IsVeg BIT DEFAULT 0,
    SpiceLevel INT DEFAULT 1 CHECK (SpiceLevel >= 1 AND SpiceLevel <= 5),
    Rating DECIMAL(3,2) DEFAULT 0.0,
    PrepTime NVARCHAR(50),
    IsAvailable BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Orders table
CREATE TABLE Orders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId INT NOT NULL,
    OrderNumber NVARCHAR(50) UNIQUE NOT NULL,
    TotalAmount DECIMAL(10,2) NOT NULL,
    Status NVARCHAR(50) DEFAULT 'pending',
    DeliveryAddress NVARCHAR(MAX),
    SpecialInstructions NVARCHAR(MAX),
    OrderDate DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (CustomerId) REFERENCES Users(Id)
);

-- Order Items table
CREATE TABLE OrderItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    MenuItemId INT NOT NULL,
    Quantity INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE,
    FOREIGN KEY (MenuItemId) REFERENCES MenuItems(Id)
);

-- Customer Feedback table
CREATE TABLE CustomerFeedback (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId INT NOT NULL,
    OrderId INT,
    Rating INT CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (CustomerId) REFERENCES Users(Id),
    FOREIGN KEY (OrderId) REFERENCES Orders(Id)
);

-- Insert sample data
INSERT INTO Users (Email, Password, FirstName, LastName, Role) VALUES
('admin@eshanee-chetan.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewEmL2Y7m9Q8tOdW', 'Admin', 'User', 'admin'),
('employee@eshanee-chetan.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewEmL2Y7m9Q8tOdW', 'Kitchen', 'Staff', 'employee'),
('customer@eshanee-chetan.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewEmL2Y7m9Q8tOdW', 'John', 'Doe', 'customer');

-- Note: The password hash above is for 'password123'

INSERT INTO MenuItems (Name, Description, Price, Category, IsVeg, SpiceLevel, PrepTime, Rating) VALUES
('Butter Chicken', 'Creamy tomato-based curry with tender chicken pieces', 16.99, 'Main Course', 0, 2, '20-25 min', 4.8),
('Paneer Tikka', 'Grilled cottage cheese with aromatic Indian spices', 14.99, 'Vegetarian', 1, 3, '15-20 min', 4.6),
('Biryani Special', 'Aromatic basmati rice with choice of chicken or lamb', 18.99, 'Rice Dishes', 0, 2, '30-35 min', 4.9),
('Masala Dosa', 'Crispy crepe filled with spiced potato mixture', 12.99, 'South Indian', 1, 2, '15-20 min', 4.7),
('Dal Makhani', 'Rich and creamy black lentil curry', 13.99, 'Vegetarian', 1, 1, '20-25 min', 4.5),
('Tandoori Chicken', 'Marinated chicken grilled in traditional clay oven', 19.99, 'Tandoor', 0, 3, '25-30 min', 4.8);

-- Create indexes for better performance
CREATE INDEX IX_Orders_CustomerId ON Orders(CustomerId);
CREATE INDEX IX_Orders_Status ON Orders(Status);
CREATE INDEX IX_Orders_OrderDate ON Orders(OrderDate);
CREATE INDEX IX_MenuItems_Category ON MenuItems(Category);
CREATE INDEX IX_MenuItems_IsAvailable ON MenuItems(IsAvailable);