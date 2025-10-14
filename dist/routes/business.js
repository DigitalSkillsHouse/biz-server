"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const models_1 = require("../lib/models");
const schemas_1 = require("../lib/schemas");
const cloudinary_1 = __importDefault(require("../lib/cloudinary")); // Assuming this exports configured cloudinary v2
const google_ping_1 = require("../lib/google-ping");
// Set up Multer for memory storage (buffers)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
// Helper to build a Cloudinary CDN URL from a public_id when logoUrl is missing
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const buildCdnUrl = (publicId) => {
    if (!publicId || !process.env.CLOUDINARY_CLOUD_NAME)
        return undefined;
    // If it's already a full URL, return as is
    if (publicId.startsWith('http'))
        return publicId;
    // Normalize possible full Cloudinary-style path to extract the public_id including folders
    let cleanId = publicId
        .replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v?\d+\//, '') // strip host + delivery + optional version
        .replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//, ''); // strip host + delivery (no version)
    // Remove file extension, Cloudinary works without it for transformation URLs
    cleanId = cleanId.replace(/\.[^/.]+$/, '');
    // Generate a resized, auto-format URL
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fit,w_200,h_200,q_auto,f_auto/${cleanId}`;
};
async function uploadToCloudinary(buffer) {
    try {
        return await new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.uploader.upload_stream({
                folder: "cition/business-logos",
                resource_type: "image",
                transformation: [{ quality: "auto", fetch_format: "auto", width: 200, height: 200, crop: "fit" }],
            }, (error, result) => {
                if (error || !result) {
                    console.error("Cloudinary upload_stream error:", error);
                    return reject(error);
                }
                resolve({ url: result.secure_url, public_id: result.public_id });
            });
            stream.end(buffer);
        });
    }
    catch (e) {
        console.error("uploadToCloudinary failed:", e);
        return null;
    }
}
const router = express_1.default.Router();
// GET /api/business/pending - List pending businesses (frontend submissions only)
router.get('/pending', async (req, res) => {
    try {
        const models = await (0, models_1.getModels)();
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        // Only show pending businesses that were submitted from frontend (not admin panel)
        const filter = {
            status: 'pending',
            $and: [
                { source: { $ne: 'admin' } },
                { createdBy: { $exists: false } }
            ]
        };
        const businesses = await models.businesses
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        const total = await models.businesses.countDocuments(filter);
        // Build CDN URLs for logos
        const enrichedBusinesses = businesses.map((business) => ({
            ...business,
            logoUrl: business.logoUrl || buildCdnUrl(business.logoPublicId)
        }));
        res.json({
            ok: true,
            businesses: enrichedBusinesses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (err) {
        console.error('Error fetching pending businesses:', err);
        res.status(500).json({ ok: false, error: err?.message || 'Failed to fetch pending businesses' });
    }
});
// GET /api/business - List businesses with pagination
router.get('/', async (req, res) => {
    try {
        const models = await (0, models_1.getModels)();
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const filter = { status: 'approved' };
        // Optional filters
        if (req.query.category) {
            const categoryQuery = req.query.category;
            // Handle both slug format (technology) and proper name (Technology)
            const categoryRegex = new RegExp(`^${categoryQuery}$`, 'i');
            filter.category = categoryRegex;
        }
        if (req.query.city) {
            const cityQuery = req.query.city;
            // Handle both slug format (karachi) and proper name (Karachi)
            const cityRegex = new RegExp(`^${cityQuery}$`, 'i');
            filter.city = cityRegex;
        }
        let businesses;
        let total;
        if (req.query.q) {
            const searchTerm = req.query.q;
            const searchRegex = new RegExp(searchTerm, 'i');
            // Build search filter
            const searchFilter = {
                ...filter,
                $or: [
                    { name: searchRegex },
                    { category: searchRegex },
                    { subcategory: searchRegex },
                    { description: searchRegex }
                ]
            };
            // Use aggregation for relevance scoring
            businesses = await models.businesses.aggregate([
                { $match: searchFilter },
                {
                    $addFields: {
                        searchScore: {
                            $add: [
                                // Category exact match (highest priority)
                                { $cond: [{ $regexMatch: { input: "$category", regex: `^${searchTerm}$`, options: "i" } }, 100, 0] },
                                // Category contains term
                                { $cond: [{ $regexMatch: { input: "$category", regex: searchTerm, options: "i" } }, 50, 0] },
                                // Subcategory contains term
                                { $cond: [{ $regexMatch: { input: "$subcategory", regex: searchTerm, options: "i" } }, 40, 0] },
                                // Name starts with term
                                { $cond: [{ $regexMatch: { input: "$name", regex: `^${searchTerm}`, options: "i" } }, 30, 0] },
                                // Name contains term
                                { $cond: [{ $regexMatch: { input: "$name", regex: searchTerm, options: "i" } }, 20, 0] },
                                // Description contains term (lowest priority)
                                { $cond: [{ $regexMatch: { input: "$description", regex: searchTerm, options: "i" } }, 5, 0] }
                            ]
                        }
                    }
                },
                { $sort: { searchScore: -1, createdAt: -1 } },
                { $skip: skip },
                { $limit: limit }
            ]).toArray();
            total = await models.businesses.countDocuments(searchFilter);
        }
        else {
            businesses = await models.businesses
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();
            total = await models.businesses.countDocuments(filter);
        }
        // Build CDN URLs for logos
        const enrichedBusinesses = businesses.map((business) => ({
            ...business,
            logoUrl: business.logoUrl || buildCdnUrl(business.logoPublicId)
        }));
        res.json({
            ok: true,
            businesses: enrichedBusinesses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (err) {
        console.error('Error fetching businesses:', err);
        res.status(500).json({ ok: false, error: err?.message || 'Failed to fetch businesses' });
    }
});
// Admin: approve or reject a business
// Auth: send header "x-admin-secret" or Bearer token matching process.env.ADMIN_SECRET
router.patch('/', async (req, res) => {
    try {
        const adminSecret = process.env.ADMIN_SECRET;
        if (!adminSecret) {
            return res.status(500).json({ ok: false, error: "Missing ADMIN_SECRET" });
        }
        const bearer = req.headers.authorization || "";
        const headerSecret = req.headers['x-admin-secret'] || (bearer.startsWith("Bearer ") ? bearer.slice(7) : "");
        if (headerSecret !== adminSecret) {
            return res.status(401).json({ ok: false, error: "Unauthorized" });
        }
        const body = req.body || { id: "", status: "" };
        const id = body.id?.trim();
        const nextStatus = body.status?.trim();
        if (!id || !nextStatus || !["approved", "pending", "rejected"].includes(nextStatus)) {
            return res.status(400).json({ ok: false, error: "id and valid status are required" });
        }
        const { ObjectId } = require("mongodb");
        const models = await (0, models_1.getModels)();
        const result = await models.businesses.updateOne({ _id: new ObjectId(id) }, { $set: { status: nextStatus, updatedAt: new Date() } });
        if (result.matchedCount === 0) {
            return res.status(404).json({ ok: false, error: "Business not found" });
        }
        // Ping Google when business is approved
        if (nextStatus === "approved" && result.modifiedCount > 0) {
            (0, google_ping_1.pingGoogleSitemap)().catch(console.error);
        }
        res.json({ ok: true, modifiedCount: result.modifiedCount });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err?.message || "Failed to update status" });
    }
});
// POST /api/business/check-duplicates - Check for duplicate phone or email
router.post('/check-duplicates', async (req, res) => {
    try {
        console.log('Checking duplicates endpoint called');
        const models = await (0, models_1.getModels)();
        console.log('Database models initialized');
        const { phone, email } = req.body || {};
        console.log('Received request body:', { phone, email });
        if (!phone && !email) {
            return res.status(400).json({
                ok: false,
                error: "Phone number or email is required"
            });
        }
        const duplicates = {
            hasDuplicates: false
        };
        // Check for duplicate phone
        if (phone) {
            try {
                // Remove all non-digit characters for comparison
                const cleanPhone = phone.replace(/[^0-9]/g, '');
                // Escape special regex characters
                const escapedPhone = cleanPhone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const phoneExists = await models.businesses.findOne({
                    phone: { $regex: new RegExp(escapedPhone, 'i') }
                });
                duplicates.phoneExists = !!phoneExists;
                if (phoneExists) {
                    duplicates.hasDuplicates = true;
                }
            }
            catch (phoneErr) {
                console.error("Error checking phone duplicates:", phoneErr);
            }
        }
        // Check for duplicate email
        if (email) {
            try {
                // Escape special regex characters in email for exact match
                const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const emailExists = await models.businesses.findOne({
                    email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
                });
                duplicates.emailExists = !!emailExists;
                if (emailExists) {
                    duplicates.hasDuplicates = true;
                }
            }
            catch (emailErr) {
                console.error("Error checking email duplicates:", emailErr);
            }
        }
        console.log('Sending response:', { duplicates, hasDuplicates: duplicates.hasDuplicates });
        res.json({
            ok: true,
            duplicates,
            hasDuplicates: duplicates.hasDuplicates
        });
    }
    catch (err) {
        console.error("Error checking duplicates:", err);
        res.status(500).json({
            ok: false,
            error: err?.message || "Internal server error"
        });
    }
});
// POST /api/business - Create business with optional logo upload
router.post('/', upload.single('logo'), async (req, res) => {
    try {
        const models = await (0, models_1.getModels)();
        // Text fields from req.body
        const formData = {
            name: String(req.body.name || "").trim(),
            category: String(req.body.category || "").trim(),
            subcategory: String(req.body.subcategory || "").trim(),
            province: String(req.body.province || "").trim(),
            city: String(req.body.city || "").trim(),
            area: String(req.body.area || "").trim(),
            postalCode: String(req.body.postalCode || "").trim(),
            address: String(req.body.address || "").trim(),
            phone: String(req.body.phone || "").trim(),
            contactPerson: String(req.body.contactPerson || "").trim() || "",
            whatsapp: String(req.body.whatsapp || "").trim() || "",
            email: String(req.body.email || "").trim(),
            description: String(req.body.description || "").trim(),
            websiteUrl: String(req.body.websiteUrl || "").trim(),
            facebookUrl: String(req.body.facebookUrl || "").trim(),
            gmbUrl: String(req.body.gmbUrl || "").trim(),
            youtubeUrl: String(req.body.youtubeUrl || "").trim(),
            profileUsername: String(req.body.profileUsername || "").trim(),
            // Bank fields
            swiftCode: String(req.body.swiftCode || "").trim(),
            branchCode: String(req.body.branchCode || "").trim(),
            cityDialingCode: String(req.body.cityDialingCode || "").trim(),
            iban: String(req.body.iban || "").trim(),
        };
        // Normalize URL fields: if provided without scheme, prepend https://
        const ensureUrl = (val) => {
            if (!val)
                return val;
            if (/^https?:\/\//i.test(val))
                return val;
            return `https://${val}`;
        };
        formData.websiteUrl = ensureUrl(formData.websiteUrl);
        formData.facebookUrl = ensureUrl(formData.facebookUrl);
        formData.gmbUrl = ensureUrl(formData.gmbUrl);
        formData.youtubeUrl = ensureUrl(formData.youtubeUrl);
        console.log("Raw form data received:", formData);
        console.log("Form data keys:", Object.keys(formData));
        console.log("Description field specifically:", JSON.stringify(formData.description));
        // Check if description contains error messages
        if (formData.description && formData.description.includes('Business Not Found')) {
            console.error('ERROR: Description contains error messages!');
            return res.status(400).json({
                ok: false,
                error: "Invalid description content detected",
                details: "Description field contains error messages"
            });
        }
        // Validate using Zod schema
        const validationResult = schemas_1.CreateBusinessSchema.safeParse(formData);
        if (!validationResult.success) {
            console.error("Validation failed:", validationResult.error.errors);
            console.error("Each validation error:");
            validationResult.error.errors.forEach((err, index) => {
                console.error(`Error ${index + 1}:`, {
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                });
            });
            return res.status(400).json({
                ok: false,
                error: "Validation failed",
                details: validationResult.error.errors,
                receivedData: formData
            });
        }
        const validatedData = validationResult.data;
        const logo = req.file; // From Multer
        let logoUrl;
        let logoPublicId;
        // Handle logo upload to Cloudinary
        if (logo && logo.size > 0) {
            const uploaded = await uploadToCloudinary(logo.buffer);
            if (uploaded) {
                logoUrl = uploaded.url;
                logoPublicId = uploaded.public_id;
            }
        }
        // Generate unique slug from name
        const baseSlug = String(validatedData.name)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 120);
        let uniqueSlug = baseSlug || `business-${Date.now()}`;
        let attempt = 0;
        while (await models.businesses.findOne({ slug: uniqueSlug })) {
            attempt += 1;
            uniqueSlug = `${baseSlug}-${attempt}`;
        }
        // Create business document with schema validation
        const businessDoc = schemas_1.BusinessSchema.parse({
            ...validatedData,
            slug: uniqueSlug,
            logoUrl: logoUrl || undefined,
            logoPublicId: logoPublicId || undefined,
            status: "pending",
            createdAt: new Date(),
        });
        // Insert into database
        const result = await models.businesses.insertOne(businessDoc);
        // Update category count
        await models.categories.updateOne({ slug: validatedData.category }, { $inc: { count: 1 } });
        res.status(201).json({
            ok: true,
            id: result.insertedId,
            business: { ...businessDoc, _id: result.insertedId }
        });
    }
    catch (err) {
        console.error("Business creation error:", err);
        res.status(500).json({
            ok: false,
            error: err?.message || "Internal server error"
        });
    }
});
// GET /api/business/:slug - Get individual business by slug (MUST be last)
router.get('/:slug', async (req, res) => {
    try {
        const models = await (0, models_1.getModels)();
        const slug = req.params.slug;
        if (!slug) {
            return res.status(400).json({ ok: false, error: 'Slug is required' });
        }
        const business = await models.businesses.findOne({ slug, status: 'approved' }, { projection: { _id: 0 } });
        if (!business) {
            return res.status(404).json({ ok: false, error: 'Business not found' });
        }
        // Build CDN URL for logo
        const enrichedBusiness = {
            ...business,
            logoUrl: business.logoUrl || buildCdnUrl(business.logoPublicId)
        };
        res.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.json({ ok: true, business: enrichedBusiness });
    }
    catch (err) {
        console.error('Error fetching business:', {
            error: err?.message || 'Unknown error',
            stack: err?.stack,
            slug: req.params.slug,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({
            ok: false,
            error: process.env.NODE_ENV === 'development' ? err?.message || 'Failed to fetch business' : 'Failed to fetch business. Please try again later.'
        });
    }
});
exports.default = router;
