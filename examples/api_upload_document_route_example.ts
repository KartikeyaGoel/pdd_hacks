/**
 * Example: Client-side usage of the Document Upload API
 * 
 * This example demonstrates how a frontend component (e.g., a React component)
 * would interact with the POST handler defined in `app/api/upload-document/route.ts`.
 * 
 * Since the module provided is a Next.js Route Handler, it is consumed via HTTP requests,
 * not by importing the function directly into client code.
 */

// Example React function to handle form submission
async function handleDocumentUpload(file: File, name: string, category: string) {
  // 1. Create a FormData object to hold the multipart/form-data payload
  const formData = new FormData();
  
  // Append the required fields expected by the API
  formData.append("file", file);
  formData.append("name", name);
  formData.append("category", category);

  try {
    // 2. Send the POST request to the API route
    const response = await fetch("/api/upload-document", {
      method: "POST",
      // Note: Do NOT set 'Content-Type': 'multipart/form-data' manually.
      // The browser sets the correct boundary automatically when using FormData.
      body: formData,
    });

    const data = await response.json();

    // 3. Handle the response based on status codes
    if (!response.ok) {
      // Handle specific error cases (400, 401, 502, 500)
      console.error(`Upload failed (${response.status}):`, data.error);
      alert(`Error: ${data.error}`);
      return;
    }

    // 4. Success case
    console.log("Upload successful!", data);
    alert(`Document uploaded successfully! ID: ${data.document_id}`);
    
  } catch (error) {
    console.error("Network error:", error);
    alert("A network error occurred while uploading.");
  }
}

// --- Mock Usage Example ---

if (require.main === module) {
  // Simulating a file selection (in a real app, this comes from <input type="file" />)
  const mockFile = new File(["This is the content of the document."], "notes.txt", {
    type: "text/plain",
  });

  // Calling the function
  handleDocumentUpload(mockFile, "Meeting Notes", "work");
}

/**
 * Expected API Response (Success):
 * {
 *   "success": true,
 *   "document_id": "clq...",
 *   "status": "processed"
 * }
 * 
 * Expected API Response (Error):
 * {
 *   "error": "Missing required fields: file and name are required."
 * }
 */