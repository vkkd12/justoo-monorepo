import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generate optimized image URL with transformations
export const getOptimizedImageUrl = (publicId, options = {}) => {
    if (!publicId) return null;

    const {
        width = 400,
        height = 400,
        quality = 'auto',
        format = 'auto',
        crop = 'fill'
    } = options;

    return cloudinary.url(publicId, {
        width,
        height,
        quality,
        format,
        crop,
        secure: true
    });
};

// Generate thumbnail URL
export const getThumbnailUrl = (publicId) => {
    return getOptimizedImageUrl(publicId, {
        width: 150,
        height: 150,
        crop: 'fill'
    });
};

// Generate medium size URL for product listings
export const getMediumImageUrl = (publicId) => {
    return getOptimizedImageUrl(publicId, {
        width: 400,
        height: 400,
        crop: 'fill'
    });
};

// Generate large size URL for product details
export const getLargeImageUrl = (publicId) => {
    return getOptimizedImageUrl(publicId, {
        width: 800,
        height: 800,
        crop: 'fill'
    });
};

// Process item image URLs for customer API responses
export const processItemImage = (item) => {
    if (!item) return item;

    const processedItem = { ...item };

    // Add optimized image URLs if image exists
    if (item.imagePublicId) {
        processedItem.images = {
            thumbnail: getThumbnailUrl(item.imagePublicId),
            medium: getMediumImageUrl(item.imagePublicId),
            large: getLargeImageUrl(item.imagePublicId),
            original: item.image
        };
    } else if (item.image) {
        // Fallback for items with image URL but no publicId
        processedItem.images = {
            original: item.image
        };
    }

    return processedItem;
};

// Process multiple items
export const processItemsImages = (items) => {
    if (!Array.isArray(items)) return items;
    return items.map(processItemImage);
};

export default cloudinary;