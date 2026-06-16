/**
 * A utility function to force download a file instead of opening it in a new tab.
 * It handles Cloudinary URLs efficiently by injecting the 'fl_attachment' transformation.
 * For other URLs, it falls back to fetching the file as a Blob.
 *
 * @param {string} fileUrl - The URL of the file to download
 * @param {string} originalFileName - The desired name for the downloaded file
 */
export const forceDownload = async (fileUrl, originalFileName) => {
    if (!fileUrl) return;

    // 1. Handle Cloudinary URLs using fl_attachment for clean, CORS-free downloads
    if (fileUrl.includes('res.cloudinary.com')) {
        const parts = fileUrl.split('/upload/');
        if (parts.length === 2 && !parts[1].startsWith('fl_attachment')) {
            // Reconstruct URL with fl_attachment transformation
            const downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = originalFileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return; // Successful Cloudinary download
        }
    }
    
    // 2. Fallback: Fetch as Blob for non-Cloudinary or already transformed URLs
    try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = originalFileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download failed, falling back to opening in a new tab.', error);
        // Absolute fallback: Open in new tab
        window.open(fileUrl, '_blank');
    }
};
