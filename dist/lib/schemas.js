"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateReviewSchema = exports.ReviewSchema = exports.CitySchema = exports.CategorySchema = exports.CreateBusinessSchema = exports.BusinessSchema = void 0;
const zod_1 = require("zod");
// Business Schema for validation
exports.BusinessSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Business name is required").max(100, "Name too long"),
    slug: zod_1.z.string().min(1, "Slug is required").max(140, "Slug too long"),
    category: zod_1.z.string().min(1, "Category is required"),
    subCategory: zod_1.z.string().optional().transform(val => val === "" ? undefined : val),
    province: zod_1.z.string().min(1, "Province is required"),
    city: zod_1.z.string().min(1, "City is required"),
    postalCode: zod_1.z.string().min(3).max(12).optional().transform(val => val === "" ? undefined : val),
    address: zod_1.z.string().min(1, "Address is required").max(500, "Address too long"),
    phone: zod_1.z.string().min(1, "Phone number is required").max(20, "Phone number too long"),
    contactPerson: zod_1.z.string().optional().transform(val => val === "" ? undefined : val),
    whatsapp: zod_1.z.string().optional().transform(val => val === "" ? undefined : val),
    email: zod_1.z.string().email("Invalid email format"),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
    websiteUrl: zod_1.z.string().url().optional().transform(val => (val === "" ? undefined : val)),
    facebookUrl: zod_1.z.string().url().optional().transform(val => (val === "" ? undefined : val)),
    gmbUrl: zod_1.z.string().url().optional().transform(val => (val === "" ? undefined : val)),
    youtubeUrl: zod_1.z.string().url().optional().transform(val => (val === "" ? undefined : val)),
    profileUsername: zod_1.z.string().optional().transform(val => (val === "" ? undefined : val)),
    // Bank-specific optional fields
    swiftCode: zod_1.z.string().optional().transform(val => (val === "" ? undefined : val)),
    branchCode: zod_1.z.string().optional().transform(val => (val === "" ? undefined : val)),
    cityDialingCode: zod_1.z.string().optional().transform(val => (val === "" ? undefined : val)),
    iban: zod_1.z.string().optional().transform(val => (val === "" ? undefined : val)),
    logoUrl: zod_1.z.string().url().optional().transform(val => (val === "" ? undefined : val)),
    logoPublicId: zod_1.z.string().optional(),
    status: zod_1.z.enum(["pending", "approved", "rejected"]).default("pending"),
    ratingAvg: zod_1.z.number().optional(),
    ratingCount: zod_1.z.number().optional(),
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().optional(),
});
// Schema for business creation (without auto-generated fields)
exports.CreateBusinessSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Business name is required").max(100, "Name too long"),
    category: zod_1.z.string().min(1, "Category is required"),
    subCategory: zod_1.z.string().optional().transform(val => val === "" ? undefined : val),
    province: zod_1.z.string().min(1, "Province is required"),
    city: zod_1.z.string().min(1, "City is required"),
    postalCode: zod_1.z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), zod_1.z.string().min(3).max(12).optional()),
    address: zod_1.z.string().min(1, "Address is required").max(500, "Address too long"),
    phone: zod_1.z.string().min(1, "Phone number is required").max(20, "Phone number too long"),
    contactPerson: zod_1.z.string().optional().transform(val => val === "" ? undefined : val),
    whatsapp: zod_1.z.string().optional().transform(val => val === "" ? undefined : val),
    email: zod_1.z.string().email("Invalid email format"),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
    websiteUrl: zod_1.z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), zod_1.z.string().url().optional()),
    facebookUrl: zod_1.z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), zod_1.z.string().url().optional()),
    gmbUrl: zod_1.z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), zod_1.z.string().url().optional()),
    youtubeUrl: zod_1.z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), zod_1.z.string().url().optional()),
    profileUsername: zod_1.z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), zod_1.z.string().optional()),
    // Bank-specific optional fields
    swiftCode: zod_1.z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), zod_1.z.string().optional()),
    branchCode: zod_1.z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), zod_1.z.string().optional()),
    cityDialingCode: zod_1.z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), zod_1.z.string().optional()),
    iban: zod_1.z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), zod_1.z.string().optional()),
});
// Category Schema
exports.CategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Category name is required"),
    slug: zod_1.z.string().min(1, "Category slug is required"),
    icon: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    imagePublicId: zod_1.z.string().optional(),
    count: zod_1.z.number().default(0),
    isActive: zod_1.z.boolean().default(true),
    subcategories: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        slug: zod_1.z.string().min(1),
    }))
        .optional()
        .default([]),
    createdAt: zod_1.z.date().default(() => new Date()),
});
// City Schema
exports.CitySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "City name is required"),
    slug: zod_1.z.string().min(1, "City slug is required"),
    province: zod_1.z.string().optional(),
    country: zod_1.z.string().default("Pakistan"),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date().default(() => new Date()),
});
// Review Schema
exports.ReviewSchema = zod_1.z.object({
    businessId: zod_1.z.string().min(1, "businessId is required"),
    name: zod_1.z.string().min(1, "Name is required").max(100, "Name too long"),
    rating: zod_1.z.number().min(1).max(5),
    comment: zod_1.z.string().min(3, "Please add a bit more detail").max(1000, "Comment too long"),
    createdAt: zod_1.z.date().default(() => new Date()),
});
// Review creation (no createdAt)
exports.CreateReviewSchema = zod_1.z.object({
    businessId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1).max(100),
    rating: zod_1.z.number().min(1).max(5),
    comment: zod_1.z.string().min(3).max(1000),
});
