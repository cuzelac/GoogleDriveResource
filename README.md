# GoogleDriveResource

A sophisticated CloudFlare Worker that acts as a proxy for Google Drive resources, enabling direct access to files while bypassing download warnings and providing accurate MIME type handling.

## Features

### 🚀 **Smart URL Format**
The worker uses a clean, structured URL format that eliminates query strings and provides accurate content type handling:

```
/{id}/{encoded-mime-type}/{filename}
```

**MIME Type Encoding**: Forward slashes (`/`) in MIME types are replaced with underscores (`_`) for URL safety.

### 📁 **Comprehensive File Support**
- **Images**: JPEG, PNG, WebP, GIF, SVG
- **Documents**: PDF, DOCX, TXT
- **Web Content**: HTML, PHP
- **E-books**: AZW format
- **Audio/Video**: All standard formats
- **Custom Formats**: Handles unusual file types and IPFS hashes

### 🔐 **Authentication Bypass**
- Automatically handles Google Drive's download warnings for large files (>200MB)
- Parses authentication tokens from HTML responses
- Maintains IP-based session validation
- Seamless proxy experience without user interaction

### 🌐 **CORS Support**
- Full CORS headers for cross-origin requests
- Support for GET, HEAD, POST, and OPTIONS methods
- Proper preflight request handling

### ⚡ **Performance Optimized**
- Stream-based content delivery for memory efficiency
- Execution time under 2ms even for large files
- Compatible with CloudFlare's free tier limits

## Usage

### Basic URL Structure
```
https://your-worker.your-subdomain.workers.dev/{google-drive-id}/{encoded-mime-type}/{filename}
```

### Examples

**Image Files:**
```
https://your-worker.workers.dev/1234567890abcdef/image_jpeg/photo.jpg
https://your-worker.workers.dev/9876543210fedcba/image_png/screenshot.png
https://your-worker.workers.dev/abcdef1234567890/image_webp/optimized.webp
```

**Documents:**
```
https://your-worker.workers.dev/1234567890abcdef/application_pdf/document.pdf
https://your-worker.workers.dev/9876543210fedcba/application_vnd.openxmlformats-officedocument.wordprocessingml.document/report.docx
https://your-worker.workers.dev/abcdef1234567890/text_plain/readme.txt
```

**Complex MIME Types:**
```
https://your-worker.workers.dev/fedcba0987654321/application_vnd.openxmlformats-officedocument.wordprocessingml.document/report.docx
```

### MIME Type Encoding Reference

| Original MIME Type | Encoded Format | Example |
|-------------------|----------------|---------|
| `image/jpeg` | `image_jpeg` | `image_jpeg/photo.jpg` |
| `application/pdf` | `application_pdf` | `application_pdf/document.pdf` |
| `text/plain` | `text_plain` | `text_plain/readme.txt` |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `application_vnd.openxmlformats-officedocument.wordprocessingml.document` | `application_vnd.openxmlformats-officedocument.wordprocessingml.document/report.docx` |

## How It Works

1. **URL Parsing**: Extracts Google Drive ID, encoded MIME type, and filename from the URL
2. **MIME Type Decoding**: Converts encoded MIME type back to standard format
3. **Google Drive Request**: Fetches content from Google Drive's export API
4. **Authentication Handling**: If a download warning is detected:
   - Parses the confirmation token from the HTML response
   - Makes a second request with the authentication token and cookies
5. **Content Streaming**: Streams the response back to the client with proper headers
6. **Header Management**: Sets accurate content-type, removes download headers, adds CORS support

## Benefits

- ✅ **Accurate MIME Types**: No more guessing file types from extensions
- ✅ **Clean URLs**: No query strings or complex parameters
- ✅ **Browser Compatibility**: Proper content rendering in browsers
- ✅ **Large File Support**: Handles files over 200MB without issues
- ✅ **CORS Ready**: Works with web applications and APIs
- ✅ **Performance**: Optimized for CloudFlare Workers free tier

## Deployment

This worker is designed to run on CloudFlare Workers. Simply deploy the `worker.js` file to your CloudFlare Worker and configure your custom domain.

## Error Handling

The worker provides clear error messages for:
- Invalid URL format
- Missing required URL components
- Invalid MIME type format
- Malformed encoded MIME types

All errors return appropriate HTTP status codes with descriptive messages.
