/*
 * Google Drive Resource Proxy Worker
 * 
 * New URL Format: /{id}/{encoded-mime-type}/{filename}
 * 
 * MIME Type Encoding: Forward slashes (/) are replaced with underscores (_)
 * Examples:
 * - /1234567890abcdef/image_jpeg/photo.jpg          → MIME: image/jpeg
 * - /9876543210fedcba/application_pdf/document.pdf  → MIME: application/pdf
 * - /abcdef1234567890/text_plain/readme.txt         → MIME: text/plain
 * - /fedcba0987654321/application_vnd.openxmlformats-officedocument.wordprocessingml.document/report.docx
 * 
 * Benefits:
 * - Accurate MIME type handling
 * - Clean URLs without query strings
 * - Better browser content rendering
 * - No need to guess file types from extensions
 * - URL-safe MIME type encoding
 */

// Helper function to encode MIME types for URLs
function encodeMimeType(mimeType) {
    return mimeType.replace(/\//g, '_');
}

// Helper function to decode MIME types from URLs
function decodeMimeType(encodedMimeType) {
    return encodedMimeType.replace(/_/g, '/');
}

async function handleStream(request) {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
    const id = pathParts[0]; // First part after domain is the ID
    const encodedMimeType = pathParts[1]; // Second part is the encoded MIME type
    const filename = pathParts[2]; // Third part is the filename
    
    // Validate that we have all required parts
    if (!id || !encodedMimeType || !filename) {
        return new Response('Invalid URL format. Expected: /{id}/{encoded-mime-type}/{filename}', {
            status: 400,
            statusText: 'Bad Request'
        });
    }
    
    // Validate that the encoded MIME type contains at least one underscore
    if (!encodedMimeType.includes('_')) {
        return new Response('Invalid encoded MIME type format. Expected format: type_subtype (e.g., image_jpeg)', {
            status: 400,
            statusText: 'Bad Request'
        });
    }
    
    // Decode the MIME type (replace underscores with forward slashes)
    const mimeType = decodeMimeType(encodedMimeType);
    
    // Validate the MIME type format
    if (!isValidMimeType(mimeType)) {
        return new Response('Invalid MIME type format. Expected format: type/subtype', {
            status: 400,
            statusText: 'Bad Request'
        });
    }
    
    apiurl = "https://docs.google.com/uc?export=open&id=" + id;
    
    let out = await fetch(apiurl, {
        redirect: 'follow',
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36',
            'accept': 'text/html',
            'accept-language': 'en-GB,en;q=0.9,nl-NL;q=0.8,nl-NL;q=0.7,en-US;q=0.6',
            'Content-Type': 'text/html; charset=utf-8'
        },
    });

    if (out.headers.get("set-cookie") != null && out.headers.get("set-cookie").includes("download_warning")) {
        let html = await out.text();
        html = html.split("confirm=")[1]
        html = html.split("&")[0]
        let authCookie = out.headers.get("set-cookie")
        let pu = "https://docs.google.com/u/0/uc?export=open&confirm=" + html + "&id=" + id;
        return proxyContent(pu, authCookie, filename, mimeType)
    } else {
        return proxyContent("https://docs.google.com/uc?export=open&id=" + id, "", filename, mimeType)
    }
}

// Function to validate MIME types
function isValidMimeType(mimeType) {
    // Common MIME type patterns
    const validPatterns = [
        /^text\/[a-zA-Z0-9\-_\+\.]+$/,
        /^image\/[a-zA-Z0-9\-_\+\.]+$/,
        /^audio\/[a-zA-Z0-9\-_\+\.]+$/,
        /^video\/[a-zA-Z0-9\-_\+\.]+$/,
        /^application\/[a-zA-Z0-9\-_\+\.]+$/,
        /^model\/[a-zA-Z0-9\-_\+\.]+$/,
        /^multipart\/[a-zA-Z0-9\-_\+\.]+$/
    ];
    
    return validPatterns.some(pattern => pattern.test(mimeType));
}

// Function to determine content-type based on file extension
function getContentType(filename) {
    if (!filename) return 'application/octet-stream';
    
    const extension = filename.toLowerCase().split('.').pop();
    
    // Document formats
    if (extension === 'pdf') return 'application/pdf';
    if (extension === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (extension === 'txt') return 'text/plain';
    
    // Image formats
    if (['jpg', 'jpeg'].includes(extension)) return 'image/jpeg';
    if (extension === 'png') return 'image/png';
    if (extension === 'webp') return 'image/webp';
    if (extension === 'gif') return 'image/gif';
    if (extension === 'svg') return 'image/svg+xml';
    
    // Web formats
    if (['html', 'htm'].includes(extension)) return 'text/html';
    if (extension === 'php') return 'application/x-httpd-php';
    if (extension === 'cgi') return 'text/plain';
    
    // E-book format
    if (extension === 'azw') return 'application/vnd.amazon.ebook';
    
    // For unusual file types (IPFS hashes, DOI identifiers, etc.)
    // Check if it's a very long hash-like string or unusual format
    if (extension.length > 20 || extension.includes('bafykbzace') || extension.includes('vgzm')) {
        return 'text/plain';
    }
    
    // Default fallback
    return 'application/octet-stream';
}

async function proxyContent(apiurl, cookies, filename, mimeType) {
  let response = await fetch(apiurl, {
    redirect: 'follow',
     method: 'GET', // *GET, POST, PUT, DELETE, etc.
     headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-GB,en;q=0.9,nl-NL;q=0.8,nl;q=0.7,en-US;q=0.6',
      'Cookie': cookies
    },
  });

    let { readable, writable } = new TransformStream();
    
    response.body.pipeTo(writable);
    let out = new Response(readable, response);
    
    // Copy all original response headers to preserve content-type, etc.
    for (let [key, value] of response.headers.entries()) {
        out.headers.set(key, value);
    }
    
    // Strip the content-disposition: attachment header
    out.headers.delete('content-disposition');

    // Use the passed MIME type instead of inferring from filename
    out.headers.set('content-type', mimeType);
    
    out.headers.set('Access-Control-Allow-Origin', '*')
    out.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS')
    out.headers.set('Access-Control-Allow-Headers','Content-Type')
    out.headers.append('Vary', 'Origin')
    out.headers.set('Groetjes', 'Mindgamesnl')
    return out;
}


function handleOptions(request) {
    return new Response(null, {
        headers: corsHeaders,
    });
}

addEventListener('fetch', event => {
    try {
        const request = event.request
        const url = new URL(request.url)
        let apiurl = null;

        if (request.method === 'OPTIONS') {
            // Handle CORS preflight requests
            event.respondWith(handleOptions(request))
            return;
        }

        if (
            request.method === 'GET' ||
            request.method === 'HEAD' ||
            request.method === 'POST'
        ) {
            event.respondWith(handleStream(request))
            return;
        }

        event.respondWith(async () => {
            return new Response(null, {
                status: 405,
                statusText: 'Method Not Allowed',
            })
        })
    } catch (e) {
        event.respondWith(rawHtmlResponse(e))
    }
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

async function rawHtmlResponse(html) {
    return new Response(html, {
        headers: {
            'content-type': 'text/html;charset=UTF-8',
        },
    })
}
