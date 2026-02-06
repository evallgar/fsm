/**
 * Firebase Storage service for handling image uploads and management.
 * @module
 */
import storage, { putFile } from "@react-native-firebase/storage";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getStorage,
  uploadString,
} from "firebase/storage";
import { ImagePickerAsset } from "expo-image-picker";
import { Platform } from "react-native";
import { storageBucket } from "@/lib/firebase-config";
import * as FileSystem from 'expo-file-system';

/**
 * Converts a Blob or File to an ArrayBuffer
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<ArrayBuffer>} - The array buffer
 */
const blobToArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
};

/**
 * Converts a base64 string to a Blob
 * @param {string} base64 - The base64 string
 * @param {string} mimeType - The mime type of the data
 * @returns {Blob} - The blob
 */
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
};

/**
 * Uploads an image from a URI to Firebase Storage
 * @param {string} uri - The local URI of the image
 * @param {string} path - The storage path where the image should be stored
 * @param {string} fileName - Optional custom filename, if not provided will use the original filename or generate one
 * @returns {Promise<string>} - The download URL of the uploaded image
 */
const uploadImageFromUri = async (
  uri: string,
  path: string,
  fileName?: string
): Promise<string> => {
  try {
    // Fetch the image data
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate a filename if not provided
    const name = fileName || uri.split("/").pop() || `image_${Date.now()}`;
    const fullPath = `${path}/${name}`;

    // Create a reference to the storage location
    const storageRef = ref(storageBucket, fullPath);

    // Upload the image
    const snapshot = await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

/**
 * Uploads an image from an ImagePickerAsset to Firebase Storage
 * @param {ImagePickerAsset} asset - The image asset from ImagePicker
 * @param {string} path - The storage path where the image should be stored
 * @returns {Promise<string>} - The download URL of the uploaded image
 */
const uploadImagePickerAsset = async (
  asset: ImagePickerAsset,
  path: string
): Promise<string> => {
  try {
    // Use the asset URI to upload
    const fileName =
      asset.fileName || `image_${Date.now()}.${asset.uri.split(".").pop()}`;
    return await uploadImageFromUri(asset.uri, path, fileName);
  } catch (error) {
    console.error("Error uploading image asset:", error);
    throw error;
  }
};

/**
 * Uploads multiple images to Firebase Storage
 * @param {ImagePickerAsset[]} assets - Array of image assets
 * @param {string} path - The storage path where the images should be stored
 * @returns {Promise<string[]>} - Array of download URLs for the uploaded images
 */
const uploadMultipleImages = async (
  assets: ImagePickerAsset[],
  path: string
): Promise<string[]> => {
  try {
    const uploadPromises = assets.map((asset) =>
      uploadImagePickerAsset(asset, path)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw error;
  }
};

/**
 * Uploads a signature to Firebase Storage
 * @param {string} base64Signature - The base64 encoded signature
 * @param {string} path - The storage path where the signature should be stored
 * @param {string} fileName - The filename for the signature
 * @returns {Promise<string>} - The download URL of the uploaded signature
 */
const uploadSignatureToFirebase = async (
  base64Signature: any,
  path: string,
  fileName: string
): Promise<string> => {
  try {
    const storageRef = ref(storageBucket, `${path}/${fileName}`);

    // Convert base64 to blob if needed (Firebase Storage can handle base64 directly)
    const base64WithoutPrefix = base64Signature.replace(
      "data:image/png;base64,",
      ""
    );
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function () {
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", base64Signature, true);
      xhr.send(null);
    });

    var mimeString = base64Signature
      .split(",")[0]
      .split(":")[1]
      .split(";")[0];

    // Upload the file
    console.log("Uploading signature to Firebase Storage:", base64Signature);
    await uploadBytes(storageRef, blob as Blob, { contentType: mimeString });

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    console.log("Signature uploaded successfully:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading signature:", error);
    throw error;
  }
};

/**
 * Uploads a signature to Firebase Storage
 * @param {string} base64Signature - The base64 encoded signature
 * @param {string} path - The storage path where the signature should be stored
 * @param {string} fileName - The filename for the signature
 * @returns {Promise<string>} - The download URL of the uploaded signature
 */
const uploadSignatureToFirebase2 = async (
  base64Signature: string,
  path: string,
  fileName: string
): Promise<string> => {
  try {
    const storageRef = ref(storageBucket, `${path}/${fileName}`);

    // Extract mime type first
    const mimeString = base64Signature.split(',')[0].split(':')[1].split(';')[0];
    
    // Clean the base64 string if it has a prefix
    const base64Data = base64Signature.split(',')[1] || base64Signature;

    // Convert base64 to blob - Android compatible approach
    const response = await fetch(`data:${mimeString};base64,${base64Data}`);
    const blob = await response.blob();

    // Upload the file
    console.log("Uploading signature to Firebase Storage");
    await uploadBytes(storageRef, blob, { contentType: mimeString });

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log("Signature uploaded successfully:", downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading signature:", error);
    throw error;
  }
};

const uploadSignatureToFirebase3 = async (
  base64Signature: string,
  path: string,
  fileName: string
): Promise<string> => {
  try {
    const storageRef = ref(storageBucket, `${path}/${fileName}`);

    // Extract mime type (e.g., 'image/png')
    const mimeString = base64Signature.split(',')[0].split(':')[1].split(';')[0];
    
    // Get pure base64 data without prefix
    const base64Data = base64Signature.includes(',') 
      ? base64Signature.split(',')[1] 
      : base64Signature;

    // EXPO-SPECIFIC SOLUTION FOR ANDROID:
    // 1. Write the file to app's cache directory
    const localUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(localUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 2. Read it back as a blob
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (!fileInfo.exists) {
      throw new Error('File not created');
    }

    const response = await fetch(localUri);
    const blob = await response.blob();

    // 3. Upload to Firebase
    await uploadBytes(storageRef, blob, { contentType: mimeString });
    const downloadURL = await getDownloadURL(storageRef);

    // 4. Clean up (optional)
    await FileSystem.deleteAsync(localUri);

    return downloadURL;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Deletes an image from Firebase Storage by URL
 * @param {string} url - The download URL of the image to delete
 * @returns {Promise<void>}
 */
const deleteImageByUrl = async (url: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const decodedUrl = decodeURIComponent(url);
    const startIndex = decodedUrl.indexOf("/o/") + 3;
    const endIndex = decodedUrl.indexOf("?");
    const fullPath = decodedUrl.substring(startIndex, endIndex);

    // Create a reference to the file
    const fileRef = ref(storageBucket, fullPath);

    // Delete the file
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

/**
 * Lists all files in a specific storage path
 * @param {string} path - The storage path to list files from
 * @returns {Promise<string[]>} - Array of download URLs for the files
 */
const listFiles = async (path: string): Promise<string[]> => {
  try {
    const folderRef = ref(storageBucket, path);
    const fileList = await listAll(folderRef);

    const urlPromises = fileList.items.map((itemRef) =>
      getDownloadURL(itemRef)
    );
    return await Promise.all(urlPromises);
  } catch (error) {
    console.error("Error listing files:", error);
    throw error;
  }
};

// Export the storage service functions
export const storageService = {
  uploadImageFromUri,
  uploadImagePickerAsset,
  uploadMultipleImages,
  deleteImageByUrl,
  listFiles,
  uploadSignatureToFirebase,
  uploadSignatureToFirebase2,
  uploadSignatureToFirebase3
};

export type StorageService = typeof storageService;
