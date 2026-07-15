/**
 * ZEKRA UPLOADER v4.4.1
 * Handles Cloudinary uploads with compression and video support.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    // ─── Compress Image to Blob ───────────────────────────────
    async function compressToBlob(file, maxW, qual) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > maxW) { h = (maxW / w) * h; w = maxW; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject("Blob creation failed");
                    }, 'image/jpeg', qual);
                };
                img.onerror = () => reject("Image load error");
            };
            reader.onerror = () => reject("File read error");
        });
    }

    // ─── Compress Image to Base64 ─────────────────────────────
    async function compressToBase64(file, maxW, qual) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > maxW) { h = (maxW / w) * h; w = maxW; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    const base64 = canvas.toDataURL('image/jpeg', qual);
                    if (!base64) return reject("Compression failed");
                    resolve(base64);
                };
                img.onerror = () => reject("Image load error");
            };
            reader.onerror = () => reject("File read error");
        });
    }

    // ─── Upload to Cloudinary ─────────────────────────────────
    async function uploadToCloudinary(file, path) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', ZEKRA.CLOUDINARY.UPLOAD_PRESET);

        const isVideo = file && file.type && file.type.startsWith('video/');
        const endpoint = isVideo
            ? ZEKRA.CLOUDINARY.VIDEO_ENDPOINT
            : ZEKRA.CLOUDINARY.IMAGE_ENDPOINT;

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Cloudinary Upload Failed");
        const data = await response.json();
        return data.secure_url;
    }

    // ─── Public API ───────────────────────────────────────────
    ZEKRA.Uploader = {
        compressToBlob,
        compressToBase64,
        uploadToCloudinary,

        /**
         * Upload a file (image or video) to Cloudinary with compression.
         * @param {File} file - The file to upload
         * @param {Object} [opts] - Options
         * @param {number} [opts.maxW=800] - Max width for image compression
         * @param {number} [opts.qual=0.7] - JPEG quality
         * @returns {Promise<string>} - The secure URL
         */
        async upload(file, opts = {}) {
            const maxW = opts.maxW || 800;
            const qual = opts.qual || 0.7;

            if (file.type.startsWith('video/')) {
                return await uploadToCloudinary(file, 'video');
            }

            const blob = await compressToBlob(file, maxW, qual);
            return await uploadToCloudinary(blob, 'image');
        },

        /**
         * Upload a file directly without compression (for videos).
         */
        async uploadRaw(file) {
            return await uploadToCloudinary(file, 'raw');
        }
    };

    console.log('✅ ZEKRA: Uploader loaded.');
})();