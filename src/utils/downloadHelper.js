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

    // Compute the final filename upfront so it can be used in all fallback paths
    let finalFileName = originalFileName || 'download';
    
    // Clean up Cloudinary workaround temp extensions
    if (fileUrl.toLowerCase().endsWith('.pdftemp') || finalFileName.toLowerCase().endsWith('.pdftemp')) {
        finalFileName = finalFileName.replace(/\.pdftemp$/i, '') + '.pdf';
    } else if (fileUrl.toLowerCase().endsWith('.ziptemp') || finalFileName.toLowerCase().endsWith('.ziptemp')) {
        finalFileName = finalFileName.replace(/\.ziptemp$/i, '') + '.zip';
    }

    // 1. Handle Cloudinary IMAGE URLs using fl_attachment for clean, CORS-free downloads
    // We SKIP this for raw files initially because Cloudinary image URLs use fl_attachment without a filename parameter natively.
    if (fileUrl.includes('res.cloudinary.com') && !fileUrl.includes('/raw/upload/')) {
        const parts = fileUrl.split('/upload/');
        if (parts.length === 2 && !parts[1].startsWith('fl_attachment')) {
            // Reconstruct URL with fl_attachment transformation
            const downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = finalFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return; // Successful Cloudinary download
        }
    }
    
    // 2. Fallback: Fetch as Blob for raw files, non-Cloudinary, or already transformed URLs
    try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const blob = await response.blob();
        
        // If the filename has no extension, try to infer it from the Content-Type
        if (!finalFileName.includes('.')) {
            const contentType = response.headers.get('content-type');
            if (contentType) {
                if (contentType.includes('application/pdf')) finalFileName += '.pdf';
                else if (contentType.includes('application/zip') || contentType.includes('application/x-zip-compressed')) finalFileName += '.zip';
                else if (contentType.includes('application/msword')) finalFileName += '.doc';
                else if (contentType.includes('wordprocessingml.document')) finalFileName += '.docx';
                else if (contentType.includes('image/jpeg')) finalFileName += '.jpg';
                else if (contentType.includes('image/png')) finalFileName += '.png';
                else if (contentType.includes('text/plain')) finalFileName += '.txt';
            }
        }
        
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = finalFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
        console.error('Download failed, falling back to opening in a new tab.', error);
        
        // Absolute fallback: Open in new tab
        let fallbackUrl = fileUrl;
        
        // For Cloudinary raw files that fail CORS, rewrite the URL to use fl_attachment:<filename>
        // This forces Cloudinary to attach the correct filename and extension during fallback download!
        if (fileUrl.includes('res.cloudinary.com') && fileUrl.includes('/raw/upload/')) {
            const parts = fileUrl.split('/upload/');
            if (parts.length === 2 && !parts[1].startsWith('fl_attachment')) {
                // Determine if we need to explicitly append the extension to the finalFileName
                // because fl_attachment relies on the specified filename having the right extension.
                if (!finalFileName.includes('.')) {
                    if (fileUrl.toLowerCase().endsWith('.pdf')) finalFileName += '.pdf';
                    if (fileUrl.toLowerCase().endsWith('.zip')) finalFileName += '.zip';
                }
                
                // Add fl_attachment:<filename> to the URL
                fallbackUrl = `${parts[0]}/upload/fl_attachment:${encodeURIComponent(finalFileName)}/${parts[1]}`;
            }
        }
        
        window.open(fallbackUrl, '_blank');
    }
};
