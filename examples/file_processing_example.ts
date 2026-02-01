import { extractText, validateFile } from './file-processing';

/**
 * This example demonstrates how to use the file processing module to 
 * validate files and extract text from supported formats (PDF, DOCX, TXT, MD, Images).
 * 
 * Prerequisites:
 * - Node.js v20+ (which supports the global `File` object) or a browser environment.
 * - If running in an older Node environment, you must polyfill `File` and `Blob`.
 */

async function main() {
  console.log("=== File Processing Module Example ===\n");

  // ---------------------------------------------------------
  // Example 1: Processing a valid Markdown file
  // ---------------------------------------------------------
  console.log("--- 1. Processing a valid Markdown file ---");

  // Simulate a File object (e.g., typically obtained from FormData in a controller)
  const mdContent = "# Project Documentation\n\nThis is a sample file.\nIt contains text for indexing.";
  const mdFile = new File([mdContent], "readme.md", { type: "text/markdown" });

  // Step 1: Validate the file before processing
  const validation = validateFile(mdFile);

  if (!validation.valid) {
    console.error(`[Validation Failed] ${validation.error}`);
  } else {
    console.log(`[Validation Passed] File: ${mdFile.name}, Size: ${mdFile.size} bytes`);

    try {
      // Step 2: Extract text
      // This handles encoding, whitespace normalization, and format-specific parsing
      console.log("Extracting text...");
      const text = await extractText(mdFile);
      
      console.log("Extracted Output:");
      console.log("------------------------------------------------");
      console.log(text);
      console.log("------------------------------------------------\n");
    } catch (error) {
      console.error("Extraction failed:", error);
    }
  }

  // ---------------------------------------------------------
  // Example 2: Handling an invalid file type
  // ---------------------------------------------------------
  console.log("--- 2. Handling an invalid file type ---");

  // Create a file with an unsupported MIME type
  const invalidFile = new File(["binary data"], "script.exe", { type: "application/x-msdownload" });
  
  const invalidResult = validateFile(invalidFile);

  if (!invalidResult.valid) {
    console.log(`[Expected Error] ${invalidResult.error}\n`);
  } else {
    console.error("Unexpectedly passed validation!\n");
  }

  // ---------------------------------------------------------
  // Example 3: Handling a file that is too large (>10MB)
  // ---------------------------------------------------------
  console.log("--- 3. Handling a large file ---");

  // Create a dummy buffer slightly larger than 10MB
  const largeBuffer = new Uint8Array(10 * 1024 * 1024 + 100);
  const largeFile = new File([largeBuffer], "huge_log.txt", { type: "text/plain" });

  const sizeResult = validateFile(largeFile);

  if (!sizeResult.valid) {
    console.log(`[Expected Error] ${sizeResult.error}\n`);
  } else {
    console.error("Unexpectedly passed size validation!\n");
  }
}

// Execute the example
main().catch((err) => console.error("Fatal Error:", err));